import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArtistCache } from '../entities/artist-cache.entity';
import { TrendingCache } from '../entities/trending-cache.entity';
import { LastfmService } from './lastfm.service';
import { MusicbrainzService } from './musicbrainz.service';
import { LidarrService } from '../../instances/services/lidarr.service';
import { InstancesService } from '../../instances/instances.service';

@Injectable()
export class TrendingService implements OnModuleInit {
    private readonly logger = new Logger(TrendingService.name);

    constructor(
        @InjectRepository(ArtistCache)
        private readonly artistCacheRepository: Repository<ArtistCache>,
        @InjectRepository(TrendingCache)
        private readonly trendingCacheRepository: Repository<TrendingCache>,
        private readonly lastfmService: LastfmService,
        private readonly musicbrainzService: MusicbrainzService,
        private readonly lidarrService: LidarrService,
        private readonly instancesService: InstancesService,
    ) { }

    async onModuleInit() {
        // Run sync on startup if cache is empty
        const count = await this.trendingCacheRepository.count();
        if (count === 0) {
            this.logger.log('Cache empty, triggering initial trending sync...');
            this.syncTrendingArtists().catch(err =>
                this.logger.error(`Initial trending sync failed: ${err.message}`)
            );
        }
    }

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

                let imageUrl = artistData?.imageUrl || null;
                if (imageUrl && imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                    imageUrl = null;
                }

                return {
                    rank: t.rank,
                    name: t.artistName,
                    mbid: t.artistMbid,
                    playcount: artistData?.lastfmPlaycount || 0,
                    listeners: artistData?.lastfmListeners || 0,
                    imageUrl,
                    genres: artistData?.genres || [],
                };
            }),
        );

        return enriched;
    }

    /**
     * Update artist cache with Last.fm, MusicBrainz, and Lidarr data
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

        // Extract initial image URL from Last.fm
        let imageUrl: string | undefined = undefined;
        if (lastfmArtist.image && lastfmArtist.image.length > 0) {
            const largeImage = lastfmArtist.image.find((img: any) => img.size === 'extralarge') ||
                lastfmArtist.image.find((img: any) => img.size === 'large') ||
                lastfmArtist.image[lastfmArtist.image.length - 1];
            imageUrl = largeImage['#text'] || undefined;

            // Filter out Last.fm default "no image" placeholder
            if (imageUrl && imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                imageUrl = undefined;
            }
        }

        // Enrichment via Lidarr (often has better images from Fanart.tv)
        try {
            const lidarrInstance = await this.instancesService.findAnyActiveByType('lidarr');
            if (lidarrInstance) {
                const lookupTerm = lastfmArtist.mbid ? `lidarr:${lastfmArtist.mbid}` : lastfmArtist.name;
                const lidarrArtists = await this.lidarrService.lookupArtist(lidarrInstance.baseUrl, lidarrInstance.apiKey, lookupTerm);
                const lidarrMetadata = lastfmArtist.mbid
                    ? lidarrArtists.find(a => a.foreignArtistId === lastfmArtist.mbid)
                    : lidarrArtists[0];

                if (lidarrMetadata && lidarrMetadata.images && lidarrMetadata.images.length > 0) {
                    // Prioritize 'fanart' or 'poster' types from Lidarr
                    const bestImg = lidarrMetadata.images.find((img: any) => img.coverType === 'fanart') ||
                                    lidarrMetadata.images.find((img: any) => img.coverType === 'poster') ||
                                    lidarrMetadata.images[0];

                    if (bestImg && bestImg.url && bestImg.url.startsWith('http')) {
                        imageUrl = bestImg.url;
                        this.logger.debug(`Enriched ${lastfmArtist.name} image from Lidarr/Fanart`);
                    }
                }
            }
        } catch (err) {
            this.logger.warn(`Failed to enrich ${lastfmArtist.name} from Lidarr: ${err.message}`);
        }

        // Final fallback: If still no image, try Last.fm Artist Info for more detailed metadata
        if (!imageUrl) {
            try {
                const artistInfo = await this.lastfmService.getArtistInfo(lastfmArtist.name, lastfmArtist.mbid);
                if (artistInfo && artistInfo.image && artistInfo.image.length > 0) {
                    const largeImage = artistInfo.image.find((img: any) => img.size === 'extralarge') ||
                        artistInfo.image.find((img: any) => img.size === 'large');
                    const infoImageUrl = largeImage?.['#text'];
                    if (infoImageUrl && !infoImageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                        imageUrl = infoImageUrl;
                    }
                }
            } catch (err) {
                this.logger.warn(`Failed to get detailed Last.fm info for ${lastfmArtist.name}`);
            }
        }

        artistCache.imageUrl = imageUrl || undefined;

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
