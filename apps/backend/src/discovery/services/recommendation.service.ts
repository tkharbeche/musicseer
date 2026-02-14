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

        // --- Pre-calculate User Library Genre Distribution for Diversity Bonus ---
        const userGenres = new Map<string, number>();
        let totalUserGenres = 0;

        // We'll need MB data for library artists to get their genres
        // For now, we'll use whatever is in the ArtistCache for library artists
        const libraryArtistNamesList = userLibrary.map(item => item.artistName);
        const libraryArtistCache = await this.artistCacheRepository.find({
            where: { name: In(libraryArtistNamesList) }
        });

        libraryArtistCache.forEach(artist => {
            if (artist.genres) {
                artist.genres.forEach(genre => {
                    const normalized = genre.toLowerCase();
                    userGenres.set(normalized, (userGenres.get(normalized) || 0) + 1);
                    totalUserGenres++;
                });
            }
        });

        const scoredCandidates = Array.from(candidates.values()).map(candidate => {
            // 1. Normalize Similarity (30% weight)
            const avgSimilarity = Math.min(candidate.similarityScore / candidate.occurrences, 1);

            const artistData = (candidate.mbid && artistDataMap.get(candidate.mbid)) ||
                             artistDataMap.get(candidate.name.toLowerCase());

            // 2. Popularity Score (40% weight)
            let popularityScore = artistData?.popularityScore || 0;
            if (!artistData && !popularityScore) {
                // Fallback for new artists not in cache yet
                popularityScore = 0.1;
            }

            // 3. Genre Diversity Score (20% weight)
            // Bonus for genres underrepresented in user library
            let diversityScore = 0.5;
            if (artistData?.genres && totalUserGenres > 0) {
                let underrepresentedCount = 0;
                artistData.genres.forEach((genre: string) => {
                    const normalized = genre.toLowerCase();
                    const userCount = userGenres.get(normalized) || 0;
                    const userFrequency = userCount / totalUserGenres;

                    // If this genre represents less than 5% of their library, it's "diverse"
                    if (userFrequency < 0.05) {
                        underrepresentedCount++;
                    }
                });
                diversityScore = Math.min(underrepresentedCount / artistData.genres.length + 0.2, 1);
            }

            // 4. Freshness Score (10% weight)
            // Based on latest release date from MusicBrainz
            let freshnessScore = 0.5;
            if (artistData?.latestReleaseDate) {
                const releaseDate = new Date(artistData.latestReleaseDate);
                const now = new Date();
                const diffMonths = (now.getFullYear() - releaseDate.getFullYear()) * 12 + (now.getMonth() - releaseDate.getMonth());

                // Newest (0-6 months) = 1.0, Older (> 5 years) = 0.1
                freshnessScore = Math.max(1 - (diffMonths / 60), 0.1);
            } else {
                // Random small factor for variety if no date available
                freshnessScore = 0.3 + (Math.random() * 0.2);
            }

            // Final Weighted Score
            const finalScore =
                (popularityScore * this.WEIGHT_POPULARITY) +
                (avgSimilarity * this.WEIGHT_SIMILARITY) +
                (diversityScore * this.WEIGHT_DIVERSITY) +
                (freshnessScore * this.WEIGHT_FRESHNESS);

            let imageUrl = artistData?.imageUrl || null;
            if (imageUrl && imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                imageUrl = null;
            }

            if (!imageUrl && candidate.image) {
                const lastfmImg = candidate.image.find((img: any) => img.size === 'large')?.['#text'];
                if (lastfmImg && !lastfmImg.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                    imageUrl = lastfmImg;
                }
            }

            return {
                ...candidate,
                score: finalScore,
                imageUrl,
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
