import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface LastFmArtist {
    name: string;
    mbid?: string;
    playcount?: number;
    listeners?: number;
    url: string;
    image?: { size: string; '#text': string }[];
}

export interface LastFmChartResponse {
    artists: {
        artist: LastFmArtist[];
    };
}

@Injectable()
export class LastfmService {
    private readonly logger = new Logger(LastfmService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('LASTFM_API_KEY') || '';

        if (!this.apiKey) {
            this.logger.warn('Last.fm API key not configured');
        }
    }

    /**
     * Get top artists from Last.fm global charts
     */
    async getTopArtists(limit: number = 100): Promise<LastFmArtist[]> {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    method: 'chart.gettopartists',
                    api_key: this.apiKey,
                    format: 'json',
                    limit,
                },
            });

            return response.data?.artists?.artist || [];
        } catch (error) {
            this.logger.error(`Failed to fetch Last.fm charts: ${error.message}`);
            return [];
        }
    }

    /**
     * Get artist info from Last.fm
     */
    async getArtistInfo(artistName: string, mbid?: string): Promise<any> {
        try {
            const params: any = {
                method: 'artist.getinfo',
                api_key: this.apiKey,
                format: 'json',
            };

            if (mbid) {
                params.mbid = mbid;
            } else {
                params.artist = artistName;
            }

            const response = await axios.get(this.baseUrl, { params });

            return response.data?.artist;
        } catch (error) {
            this.logger.error(`Failed to fetch artist info for ${artistName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get similar artists from Last.fm
     */
    async getSimilarArtists(artistName: string, mbid?: string, limit: number = 20): Promise<LastFmArtist[]> {
        try {
            const params: any = {
                method: 'artist.getsimilar',
                api_key: this.apiKey,
                format: 'json',
                limit,
            };

            if (mbid) {
                params.mbid = mbid;
            } else {
                params.artist = artistName;
            }

            const response = await axios.get(this.baseUrl, { params });

            return response.data?.similarartists?.artist || [];
        } catch (error) {
            this.logger.error(`Failed to fetch similar artists for ${artistName}: ${error.message}`);
            return [];
        }
    }
}
