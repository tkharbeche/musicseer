import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimilarityCache } from '../entities/similarity-cache.entity';
import { LastfmService } from './lastfm.service';

@Injectable()
export class SimilarityService {
    private readonly logger = new Logger(SimilarityService.name);
    private readonly CACHE_TTL_DAYS = 7; // Cache similarity for a week

    constructor(
        @InjectRepository(SimilarityCache)
        private readonly similarityCacheRepository: Repository<SimilarityCache>,
        private readonly lastfmService: LastfmService,
    ) { }

    /**
     * Get similar artists for a given artist (name or mbid)
     * Checks DB cache first, then calls Last.fm
     */
    async getSimilarArtists(artistName: string, mbid?: string, limit: number = 20): Promise<any[]> {
        // 1. Check Cache
        const cached = await this.similarityCacheRepository.findOne({
            where: { sourceArtistName: artistName },
        });

        if (cached) {
            // Check if cache is fresh
            const now = new Date();
            const cacheAge = now.getTime() - cached.cachedAt.getTime();
            const daysOld = cacheAge / (1000 * 60 * 60 * 24);

            if (daysOld < this.CACHE_TTL_DAYS) {
                // this.logger.debug(`Cache hit for similar artists: ${artistName}`);
                return cached.similarArtistData.slice(0, limit);
            } else {
                this.logger.debug(`Cache expired for similar artists: ${artistName}`);
            }
        }

        // 2. Fetch from Last.fm
        const similarArtists = await this.lastfmService.getSimilarArtists(artistName, mbid, 50); // Fetch more to cache

        if (!similarArtists || similarArtists.length === 0) {
            return [];
        }

        // 3. Save to Cache
        const formattedData = similarArtists.map((artist: any) => ({
            name: artist.name,
            mbid: artist.mbid,
            match: typeof artist.match === 'string' ? parseFloat(artist.match) : artist.match,
            url: artist.url,
            image: artist.image
        }));

        if (cached) {
            cached.similarArtistData = formattedData;
            cached.cachedAt = new Date(); // Update timestamp
            await this.similarityCacheRepository.save(cached);
        } else {
            const newCache = new SimilarityCache();
            newCache.sourceArtistName = artistName;
            newCache.sourceMbid = mbid || null;
            newCache.similarArtistData = formattedData;
            await this.similarityCacheRepository.save(newCache);
        }

        return formattedData.slice(0, limit);
    }
}
