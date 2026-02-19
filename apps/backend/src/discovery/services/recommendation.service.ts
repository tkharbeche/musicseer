import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { LibrarySnapshot } from '../../sync/entities/library-snapshot.entity';
import { ArtistCache } from '../entities/artist-cache.entity';
import { SimilarityService } from './similarity.service';
import { TrendingService } from './trending.service';
import { LastfmService } from './lastfm.service';
import { ImageResolverService } from './image-resolver.service';

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
        private readonly imageResolver: ImageResolverService,
    ) { }

    /**
     * Generate recommendations for a user
     */
    async getRecommendations(userId: string, limit: number = 20): Promise<any[]> {
        this.logger.log(`Generating recommendations for user ${userId}`);

        // 1. Get User's Library Snapshot (Top 50 played)
        const userLibrary = await this.librarySnapshotRepository.find({
            where: { userId },
            order: { playCount: 'DESC' },
            take: 50
        });

        if (userLibrary.length === 0) {
            this.logger.log(`User ${userId} has empty library, returning trending.`);
            return this.trendingService.getTrendingArtists(limit);
        }

        const libraryArtistNames = new Set(userLibrary.map(item => item.artistName.toLowerCase()));

        // Get user genres for diversity scoring
        const userGenres = new Set<string>();
        const artistsWithGenres = await this.librarySnapshotRepository.manager.getRepository('ArtistCache').find({
            where: { name: In(userLibrary.map(a => a.artistName)) }
        });
        artistsWithGenres.forEach(a => (a as any).genres?.forEach((g: string) => userGenres.add(g.toLowerCase())));

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
        const scoredCandidates = await Promise.all(Array.from(candidates.values()).map(async (candidate) => {
            // Normalize Similarity (0-1) - Average based on occurrences
            const avgSimilarity = candidate.similarityScore / candidate.occurrences;

            // Fetch artist cache for more data
            let artistCache = await this.artistCacheRepository.findOne({
                where: candidate.mbid ? { mbid: candidate.mbid } : { name: candidate.name }
            });

            // CREATE-IF-MISSING Strategy
            if (!artistCache) {
                // Resolve high-quality image first
                const resolvedUrl = await this.imageResolver.resolveArtistImage(candidate.name, candidate.mbid);

                artistCache = this.artistCacheRepository.create({
                    name: candidate.name,
                    mbid: candidate.mbid || undefined, // Use undefined for TypeORM optional fields
                    imageUrl: resolvedUrl || undefined,
                    lastfmListeners: 0,
                    lastfmPlaycount: 0
                });

                try {
                    await this.artistCacheRepository.save(artistCache);
                    // this.logger.debug(`Created new ArtistCache for recommendation: ${candidate.name}`);
                } catch (e) {
                    this.logger.warn(`Failed to create ArtistCache for ${candidate.name}: ${e.message}`);
                }
            }

            // Global Popularity (0-1) - Based on listeners (normalized against a threshold of 5M)
            const listeners = artistCache?.lastfmListeners || 0;
            const popularityScore = Math.min(listeners / 5000000, 1);

            // Genre Diversity (0-1) - Bonus for underrepresented tags
            let diversityScore = 0.5;
            if (artistCache?.genres) {
                const newGenresCount = artistCache.genres.filter((g: string) => !userGenres.has(g.toLowerCase())).length;
                diversityScore = Math.min(newGenresCount / 3, 1); // 3+ new genres = max diversity
            }

            // Freshness (0-1)
            let freshnessScore = 0.5;
            if (artistCache?.lastSyncedAt) { // Changed to lastSyncedAt as proxy for activity if release date missing, or just keep 0.5
                // Keeping simple for now
            }

            // Final Weighted Score
            const finalScore =
                (popularityScore * this.WEIGHT_POPULARITY) +
                (avgSimilarity * this.WEIGHT_SIMILARITY) +
                (diversityScore * this.WEIGHT_DIVERSITY) +
                (freshnessScore * this.WEIGHT_FRESHNESS);

            // Use the cached/persisted image URL
            let imageUrl = artistCache?.imageUrl;

            // If existing cache has bad image, try to upgrade it (Catch-up logic)
            if (!imageUrl || this.imageResolver.isLastFmUrl(imageUrl)) {
                // Only try if we didn't just create it
                const resolvedUrl = await this.imageResolver.resolveArtistImage(candidate.name, candidate.mbid);
                if (resolvedUrl && resolvedUrl !== imageUrl) {
                    imageUrl = resolvedUrl;
                    // Async update
                    this.artistCacheRepository.update(artistCache.id, { imageUrl: resolvedUrl })
                        .catch(e => this.logger.warn(`Failed to upgrade image for ${candidate.name}: ${e.message}`));
                }
            }

            // Fallback to Last.fm image if available (and flatten it)
            if (!imageUrl && candidate.image && Array.isArray(candidate.image)) {
                const largeImg = candidate.image.find((img: any) => img.size === 'extralarge') ||
                    candidate.image[candidate.image.length - 1];
                imageUrl = largeImg?.['#text'];
            }

            return {
                ...candidate,
                imageUrl,
                score: finalScore,
                genres: artistCache?.genres || [],
                reason: `Similar to ${candidate.seedArtists.slice(0, 3).join(', ')}`
            };
        }));

        this.logger.debug(`Scored candidates count: ${scoredCandidates.length}. Limit: ${limit} (type: ${typeof limit})`);

        // 4. Sort and Limit
        const results = scoredCandidates
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        this.logger.debug(`Returning ${results.length} recommendations`);
        return results;
    }

    /**
     * Get "Hidden Gems" - Highly similar but low global popularity
     */
    async getHiddenGems(userId: string, limit: number = 20): Promise<any[]> {
        // We want high similarity but low listeners/playcount
        // Let's generate candidates but use a different scoring formula
        const recommendations = await this.getRecommendations(userId, limit * 5);

        const gems = recommendations
            .filter(r => r.score > 0.2) // Must be somewhat relevant
            .sort((a, b) => {
                // Heuristic: high score is good, but we penalize popularity heavily here
                // Note: 'score' already includes popularity (40%).
                // For hidden gems, we want to favor the similarity component.
                return b.similarityScore - a.similarityScore;
            })
            .slice(0, limit);

        return gems;
    }
}
