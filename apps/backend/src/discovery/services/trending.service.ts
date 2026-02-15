import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
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
                    const artistCache = await this.updateArtistCache(artist);

                    // Create trending cache entry
                    await this.trendingCacheRepository.save({
                        artistMbid: artist.mbid || undefined,
                        artistName: artist.name,
                        rank: i + 1,
                        chartType: 'global',
                        imageUrl: artistCache?.imageUrl,
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

                let imageUrl = t.imageUrl || artistData?.imageUrl || null;
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
     * Verify if an image URL is displayable
     */
    private async isImageDisplayable(url: string): Promise<boolean> {
        if (!url) return false;
        try {
            const response = await axios.head(url, { timeout: 3000 });
            const contentType = response.headers['content-type'];
            return response.status === 200 && contentType?.startsWith('image/');
        } catch (error) {
            return false;
        }
    }

    /**
     * Update artist cache with Last.fm, MusicBrainz, and Lidarr data
     * Strictly follows Step A-B-C pipeline from Enrichment Strategy
     */
    private async updateArtistCache(lastfmArtist: any): Promise<ArtistCache | null> {
        let artistCache = await this.artistCacheRepository.findOne({
            where: lastfmArtist.mbid ? { mbid: lastfmArtist.mbid } : { name: lastfmArtist.name },
        });

        if (!artistCache) {
            artistCache = this.artistCacheRepository.create({
                mbid: lastfmArtist.mbid || null,
                name: lastfmArtist.name,
            });
        }

        // --- STEP A: Initial Data (Last.fm) ---
        artistCache.lastfmPlaycount = parseInt(lastfmArtist.playcount || '0', 10);
        artistCache.lastfmListeners = parseInt(lastfmArtist.listeners || '0', 10);

        // Calculate Popularity Score (40% weight source)
        const listeners = artistCache.lastfmListeners;
        artistCache.popularityScore = Math.min(Math.log10(listeners + 1) / Math.log10(5000000), 1);

        // --- STEP B: Identity Validation & Metadata (MusicBrainz) ---
        let currentMbid = artistCache.mbid;

        if (!currentMbid) {
            try {
                const mbSearchResults = await this.musicbrainzService.searchArtist(lastfmArtist.name);
                if (mbSearchResults.length > 0) {
                    currentMbid = mbSearchResults[0].id;
                    artistCache.mbid = currentMbid;
                }
            } catch (err) {
                this.logger.warn(`MB search failed for ${lastfmArtist.name}`);
            }
        }

        if (currentMbid) {
            try {
                const mbData = await this.musicbrainzService.getArtistByMbid(currentMbid);
                if (mbData) {
                    artistCache.musicbrainzData = mbData;
                    if (mbData.tags) {
                        artistCache.genres = mbData.tags.map((tag: any) => tag.name);
                    }
                    const latestDate = this.musicbrainzService.getLatestReleaseDate(mbData);
                    if (latestDate) {
                        artistCache.latestReleaseDate = latestDate;
                    }
                }
            } catch (err) {
                this.logger.warn(`MB lookup failed for MBID ${currentMbid}`);
            }
        }

        // --- STEP C: Visual Content (Last.fm Info / Lidarr) ---
        let imageUrl: string | undefined = undefined;

        try {
            const info = await this.lastfmService.getArtistInfo(lastfmArtist.name, currentMbid || undefined);
            if (info && info.image && info.image.length > 0) {
                const bestLastfm = info.image.find((img: any) => img.size === 'extralarge') ||
                                 info.image.find((img: any) => img.size === 'large');
                const candidate = bestLastfm?.['#text'];
                if (candidate && !candidate.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                    imageUrl = candidate;
                }
            }
        } catch (err) {
            this.logger.warn(`Last.fm getInfo failed for ${lastfmArtist.name}`);
        }

        if (!imageUrl || imageUrl.includes('lastfm')) {
            try {
                const lidarrInstance = await this.instancesService.findAnyActiveByType('lidarr');
                if (lidarrInstance) {
                    const lookupTerm = currentMbid ? `lidarr:${currentMbid}` : lastfmArtist.name;
                    const lidarrArtists = await this.lidarrService.lookupArtist(lidarrInstance.baseUrl, lidarrInstance.apiKey, lookupTerm);
                    const lidarrMetadata = currentMbid
                        ? lidarrArtists.find((a: any) => a.foreignArtistId === currentMbid)
                        : lidarrArtists[0];

                    if (lidarrMetadata && lidarrMetadata.images && lidarrMetadata.images.length > 0) {
                        const bestImg = lidarrMetadata.images.find((img: any) => img.coverType === 'fanart') ||
                                        lidarrMetadata.images.find((img: any) => img.coverType === 'poster') ||
                                        lidarrMetadata.images[0];

                        if (bestImg && bestImg.url && bestImg.url.startsWith('http')) {
                            imageUrl = bestImg.url;
                        }
                    }
                }
            } catch (err) {}
        }

        // --- STEP D: MusicBrainz Release Image Fallback ---
        if (!imageUrl && currentMbid && artistCache.musicbrainzData?.releases) {
            try {
                const releases = artistCache.musicbrainzData.releases
                    .filter((r: any) => r.date)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                for (const release of releases.slice(0, 3)) {
                    const releaseImg = await this.musicbrainzService.getReleaseImageUrl(release.id);
                    if (releaseImg) {
                        imageUrl = releaseImg;
                        break;
                    }
                }
            } catch (err) {}
        }

        // Validate image
        if (imageUrl) {
            const isDisplayable = await this.isImageDisplayable(imageUrl);
            if (!isDisplayable) {
                imageUrl = undefined;
            }
        }

        artistCache.imageUrl = imageUrl || undefined;
        artistCache.lastSyncedAt = new Date();
        return await this.artistCacheRepository.save(artistCache);
    }
}
