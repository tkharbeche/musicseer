import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LibrarySnapshot } from '../../sync/entities/library-snapshot.entity';
import { SimilarityService } from './similarity.service';
import { TrendingService } from './trending.service';
import { LastfmService } from './lastfm.service';
import { ArtistCache } from '../entities/artist-cache.entity';

@Injectable()
export class RecommendationService {
    private readonly logger = new Logger(RecommendationService.name);

    // Scoring Weights
    private readonly WEIGHT_POPULARITY = 0.4;
    private readonly WEIGHT_SIMILARITY = 0.3;
    private readonly WEIGHT_DIVERSITY = 0.2;
    private readonly WEIGHT_FRESHNESS = 0.1;

    constructor(
        @InjectRepository(LibrarySnapshot)
        private readonly librarySnapshotRepository: Repository<LibrarySnapshot>,
        @InjectRepository(ArtistCache)
        private readonly artistCacheRepository: Repository<ArtistCache>,
        private readonly similarityService: SimilarityService,
        private readonly trendingService: TrendingService,
        private readonly lastfmService: LastfmService,
    ) { }

    /**
     * Generate recommendations for a user
     */
    async getRecommendations(userId: string, limit: number = 20, serverId?: string): Promise<any[]> {
        this.logger.log(`Generating recommendations for user ${userId}${serverId ? ` filtered by server ${serverId}` : ''}`);

        // 1. Get User's Library Snapshot (Top 50 played)
        const whereClause: any = { userId };
        if (serverId) {
            whereClause.serverId = serverId;
        }

        const userLibrary = await this.librarySnapshotRepository.find({
            where: whereClause,
            order: { playCount: 'DESC' },
            take: 50
        });

        if (userLibrary.length === 0) {
            this.logger.log(`User ${userId} has empty library, returning trending.`);
            return this.trendingService.getTrendingArtists(limit);
        }

        const libraryArtistNames = new Set(userLibrary.map(item => item.artistName.toLowerCase()));

        // 2. Candidate Generation
        // Fetch similar artists for top 10 library artists
        const candidates = new Map<string, any>(); // artistName -> { artist, score components }

        // Limit to top 10 to avoid excessive API calls/DB lookups
        const seedArtists = userLibrary.slice(0, 10);
        this.logger.log(`Found ${seedArtists.length} seed artists: ${seedArtists.map(a => a.artistName).join(', ')}`);

        for (const seed of seedArtists) {
            // Get similar artists (cached)
            this.logger.debug(`Fetching similar artists for: ${seed.artistName}`);
            const similar = await this.similarityService.getSimilarArtists(seed.artistName, seed.artistMbid, 20);
            this.logger.debug(`Found ${similar.length} similar artists for ${seed.artistName}`);

            for (const artist of similar) {
                // Filter out artists already in library
                if (libraryArtistNames.has(artist.name.toLowerCase())) {
                    // this.logger.debug(`Skipping ${artist.name} (already in library)`);
                    continue;
                }

                if (!candidates.has(artist.name)) {
                    candidates.set(artist.name, {
                        name: artist.name,
                        mbid: artist.mbid,
                        image: artist.image,
                        similarityScore: 0,
                        occurrences: 0,
                        seedArtists: []
                    });
                }

                const candidate = candidates.get(artist.name);
                candidate.occurrences++;
                candidate.similarityScore += parseFloat(artist.match) || 0;
                candidate.seedArtists.push(seed.artistName);
            }
        }

        this.logger.debug(`Total candidates found: ${candidates.size}`);

        // 3. Scoring
        const candidateNames = Array.from(candidates.keys());
        const candidateMbids = Array.from(candidates.values())
            .map(c => c.mbid)
            .filter(mbid => !!mbid);

        // Bulk fetch artist data to avoid N+1 query bottleneck
        const artistCacheData = await this.artistCacheRepository.find({
            where: [
                { mbid: In(candidateMbids) },
                { name: In(candidateNames) }
            ]
        });

        // Create a lookup map for faster access
        const artistDataMap = new Map<string, ArtistCache>();
        artistCacheData.forEach(data => {
            if (data.mbid) artistDataMap.set(data.mbid, data);
            artistDataMap.set(data.name.toLowerCase(), data);
        });

        const scoredCandidates = Array.from(candidates.values()).map(candidate => {
            // Normalize Similarity (0-1) - Average based on occurrences
            const avgSimilarity = Math.min(candidate.similarityScore / candidate.occurrences, 1);

            // Fetch artist data from our lookup map
            let popularityScore = 0.5;
            let diversityScore = 0.5;

            const artistData = (candidate.mbid && artistDataMap.get(candidate.mbid)) ||
                             artistDataMap.get(candidate.name.toLowerCase());

            if (artistData) {
                // Popularity Score: Normalized Last.fm listeners (0 to 1)
                // Using log scale for better distribution, assuming 5M listeners as "max" for normalization
                const listeners = Number(artistData.lastfmListeners) || 0;
                popularityScore = Math.min(Math.log10(listeners + 1) / Math.log10(5000000), 1);
            }

            // Freshness: Random small factor to vary results slightly
            const freshnessScore = Math.random();

            // Final Weighted Score
            const finalScore =
                (popularityScore * this.WEIGHT_POPULARITY) +
                (avgSimilarity * this.WEIGHT_SIMILARITY) +
                (diversityScore * this.WEIGHT_DIVERSITY) +
                (freshnessScore * this.WEIGHT_FRESHNESS);

            return {
                ...candidate,
                score: finalScore,
                imageUrl: artistData?.imageUrl || (candidate.image ? candidate.image.find((img: any) => img.size === 'large')?.['#text'] : null),
                reason: `Similar to ${candidate.seedArtists.slice(0, 3).join(', ')}`
            };
        });

        this.logger.debug(`Scored candidates count: ${scoredCandidates.length}. Limit: ${limit} (type: ${typeof limit})`);

        // 4. Sort and Limit
        const results = scoredCandidates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        this.logger.debug(`Returning ${results.length} recommendations`);
        return results;
    }
}
