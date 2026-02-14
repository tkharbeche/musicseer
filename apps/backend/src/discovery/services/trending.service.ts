import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArtistCache } from '../entities/artist-cache.entity';
import { TrendingCache } from '../entities/trending-cache.entity';
import { LastfmService } from './lastfm.service';
import { MusicbrainzService } from './musicbrainz.service';

@Injectable()
export class TrendingService {
    private readonly logger = new Logger(TrendingService.name);

    constructor(
        @InjectRepository(ArtistCache)
        private readonly artistCacheRepository: Repository<ArtistCache>,
        @InjectRepository(TrendingCache)
        private readonly trendingCacheRepository: Repository<TrendingCache>,
        private readonly lastfmService: LastfmService,
        private readonly musicbrainzService: MusicbrainzService,
    ) { }

    /**
     * Cron job to sync trending artists every 6 hours
     */
    @Cron(CronExpression.EVERY_6_HOURS)
    async syncTrendingArtists(): Promise<void> {
        this.logger.log('Starting trending artists sync...');

        try {
            // Fetch top 100 artists from Last.fm
            const topArtists = await this.lastfmService.getTopArtists(100);

            if (topArtists.length === 0) {
                this.logger.warn('No artists fetched from Last.fm');
                return;
            }

            // Clear old trending cache
            await this.trendingCacheRepository.delete({ chartType: 'global' });

            // Process each artist
            for (let i = 0; i < topArtists.length; i++) {
                const artist = topArtists[i];

                try {
                    // Update or create artist cache
                    await this.updateArtistCache(artist);

                    // Create trending cache entry
                    await this.trendingCacheRepository.save({
                        artistMbid: artist.mbid || undefined,
                        artistName: artist.name,
                        rank: i + 1,
                        chartType: 'global',
                    });
                } catch (error) {
                    this.logger.error(`Failed to process artist ${artist.name}: ${error.message}`);
                }
            }

            this.logger.log(`Successfully synced ${topArtists.length} trending artists`);
        } catch (error) {
            this.logger.error(`Trending sync failed: ${error.message}`);
        }
    }

    /**
     * Get trending artists from cache
     */
    async getTrendingArtists(limit: number = 50): Promise<any[]> {
        const trending = await this.trendingCacheRepository.find({
            where: { chartType: 'global' },
            order: { rank: 'ASC' },
            take: limit,
        });

        // Enrich with artist cache data
        const enriched = await Promise.all(
            trending.map(async (t) => {
                let artistData = null;

                if (t.artistMbid) {
                    artistData = await this.artistCacheRepository.findOne({
                        where: { mbid: t.artistMbid },
                    });
                }

                if (!artistData) {
                    artistData = await this.artistCacheRepository.findOne({
                        where: { name: t.artistName },
                    });
                }

                return {
                    rank: t.rank,
                    name: t.artistName,
                    mbid: t.artistMbid,
                    playcount: artistData?.lastfmPlaycount || 0,
                    listeners: artistData?.lastfmListeners || 0,
                    imageUrl: artistData?.imageUrl || null,
                    genres: artistData?.genres || [],
                };
            }),
        );

        return enriched;
    }

    /**
     * Update artist cache with Last.fm and MusicBrainz data
     */
    private async updateArtistCache(lastfmArtist: any): Promise<void> {
        let artistCache = await this.artistCacheRepository.findOne({
            where: lastfmArtist.mbid ? { mbid: lastfmArtist.mbid } : { name: lastfmArtist.name },
        });

        if (!artistCache) {
            artistCache = this.artistCacheRepository.create({
                mbid: lastfmArtist.mbid || null,
                name: lastfmArtist.name,
            });
        }

        // Update Last.fm data
        artistCache.lastfmPlaycount = parseInt(lastfmArtist.playcount || '0', 10);
        artistCache.lastfmListeners = parseInt(lastfmArtist.listeners || '0', 10);

        // Extract image URL (largest available)
        if (lastfmArtist.image && lastfmArtist.image.length > 0) {
            const largeImage = lastfmArtist.image.find((img: any) => img.size === 'extralarge') ||
                lastfmArtist.image[lastfmArtist.image.length - 1];
            const imageUrl = largeImage['#text'] || undefined;

            // Filter out Last.fm default "no image" placeholder
            if (imageUrl && imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                artistCache.imageUrl = undefined;
            } else {
                artistCache.imageUrl = imageUrl;
            }
        }

        // Fetch MusicBrainz data if MBID exists
        if (lastfmArtist.mbid) {
            const mbData = await this.musicbrainzService.getArtistByMbid(lastfmArtist.mbid);

            if (mbData) {
                artistCache.musicbrainzData = mbData;

                // Extract genres from tags
                if (mbData.tags) {
                    artistCache.genres = mbData.tags.map((tag: any) => tag.name);
                }
            }
        }

        artistCache.lastSyncedAt = new Date();
        await this.artistCacheRepository.save(artistCache);
    }
}
