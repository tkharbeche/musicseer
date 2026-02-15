import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
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
        this.logger.log(`Generating recommendations for user ${userId} ${serverId ? `on server ${serverId}` : ''}`);

        // 1. Get User's Library Snapshot (Top 50 played)
        const where: any = { userId };
        if (serverId) {
            where.serverId = serverId;
        }

        const userLibrary = await this.librarySnapshotRepository.find({
            where,
            order: { playCount: 'DESC' },
            take: 50
        });

        if (userLibrary.length === 0) {
            this.logger.log(`User ${userId} has empty library, returning trending.`);
            return this.trendingService.getTrendingArtists(limit);
        }

        const libraryArtistNames = new Set(userLibrary.map(item => item.artistName.toLowerCase()));

        // Calculate user's favorite genres for diversity scoring
        const userGenres = await this.getUserTopGenres(userLibrary);

        // 2. Candidate Generation
        const candidates = new Map<string, any>();

        const seedArtists = userLibrary.slice(0, 10);
        this.logger.log(`Found ${seedArtists.length} seed artists: ${seedArtists.map(a => a.artistName).join(', ')}`);

        for (const seed of seedArtists) {
            const similar = await this.similarityService.getSimilarArtists(seed.artistName, seed.artistMbid, 20);

            for (const artist of similar) {
                if (libraryArtistNames.has(artist.name.toLowerCase())) {
                    continue;
                }

                if (!candidates.has(artist.name)) {
                    candidates.set(artist.name, {
                        name: artist.name,
                        mbid: artist.mbid,
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

        // 3. Scoring
        const scoredCandidates = [];
        for (const candidate of candidates.values()) {
            // Get cached artist data for enrichment
            const artistCache = await this.artistCacheRepository.findOne({
                where: candidate.mbid ? { mbid: candidate.mbid } : { name: candidate.name }
            });

            // A. Similarity Score (0-1)
            const avgSimilarity = candidate.similarityScore / candidate.occurrences;

            // B. Popularity Score (0-1)
            const popularityScore = artistCache?.popularityScore || 0.1;

            // C. Diversity Score (0-1)
            // Higher if artist has genres the user DOES NOT have much of in library
            let diversityScore = 0.5;
            if (artistCache?.genres && artistCache.genres.length > 0) {
                const overlap = artistCache.genres.filter(g => userGenres.has(g.toLowerCase())).length;
                diversityScore = 1 - (overlap / Math.max(artistCache.genres.length, 1));
            }

            // D. Freshness Score (0-1)
            // Higher if recently released an album
            let freshnessScore = 0.1;
            if (artistCache?.latestReleaseDate) {
                const monthsSince = (new Date().getTime() - new Date(artistCache.latestReleaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
                freshnessScore = Math.max(0, 1 - (monthsSince / 48)); // 0 after 4 years
            }

            // Final Weighted Score
            const finalScore =
                (popularityScore * this.WEIGHT_POPULARITY) +
                (avgSimilarity * this.WEIGHT_SIMILARITY) +
                (diversityScore * this.WEIGHT_DIVERSITY) +
                (freshnessScore * this.WEIGHT_FRESHNESS);

            scoredCandidates.push({
                ...candidate,
                score: finalScore,
                imageUrl: artistCache?.imageUrl || null,
                genres: artistCache?.genres || [],
                reason: `Similar to ${candidate.seedArtists.slice(0, 2).join(', ')}`
            });
        }

        // 4. Sort and Limit
        return scoredCandidates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    private async getUserTopGenres(library: LibrarySnapshot[]): Promise<Set<string>> {
        const genreCounts = new Map<string, number>();

        // Find artist caches for library artists to get genres
        const mbids = library.map(l => l.artistMbid).filter(Boolean);
        const names = library.map(l => l.artistName);

        const caches = await this.artistCacheRepository.find({
            where: [
                { mbid: In(mbids) },
                { name: In(names) }
            ]
        });

        for (const cache of caches) {
            if (cache.genres) {
                cache.genres.forEach(g => {
                    const normalized = g.toLowerCase();
                    genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1);
                });
            }
        }

        // Return genres that appear in > 10% of library artists
        const threshold = Math.max(1, Math.floor(library.length * 0.1));
        const topGenres = new Set<string>();
        for (const [genre, count] of genreCounts.entries()) {
            if (count >= threshold) {
                topGenres.add(genre);
            }
        }

        return topGenres;
    }
}
