import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MusicBrainzArtist {
    id: string;
    name: string;
    'sort-name': string;
    type?: string;
    disambiguation?: string;
    tags?: { count: number; name: string }[];
    relations?: any[];
    'release-groups'?: any[];
}

@Injectable()
export class MusicbrainzService {
    private readonly logger = new Logger(MusicbrainzService.name);
    private readonly baseUrl = 'https://musicbrainz.org/ws/2';
    private readonly appName: string;
    private readonly appVersion: string;
    private readonly contact: string;

    constructor(private readonly configService: ConfigService) {
        this.appName = this.configService.get<string>('MUSICBRAINZ_APP_NAME') || 'MusicSeer';
        this.appVersion = this.configService.get<string>('MUSICBRAINZ_APP_VERSION') || '0.1.0';
        this.contact = this.configService.get<string>('MUSICBRAINZ_CONTACT') || '';
    }

    /**
     * Get artist information from MusicBrainz by MBID
     */
    async getArtistByMbid(mbid: string): Promise<MusicBrainzArtist | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/artist/${mbid}`, {
                params: {
                    fmt: 'json',
                    inc: 'tags+ratings+genres+release-groups',
                },
                headers: {
                    'User-Agent': `${this.appName}/${this.appVersion} ( ${this.contact || 'admin@musicseer.local'} )`,
                },
            });

            // Rate limiting: MusicBrainz requires 1 request per second
            await this.delay(1000);

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch MusicBrainz data for MBID ${mbid}: ${error.message}`);
            return null;
        }
    }

    /**
     * Search for artist by name
     */
    async searchArtist(artistName: string): Promise<MusicBrainzArtist[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/artist`, {
                params: {
                    query: `artist:"${artistName}"`,
                    fmt: 'json',
                    limit: 5,
                },
                headers: {
                    'User-Agent': `${this.appName}/${this.appVersion} ( ${this.contact} )`,
                },
            });

            // Rate limiting
            await this.delay(1000);

            return response.data?.artists || [];
        } catch (error) {
            this.logger.error(`Failed to search MusicBrainz for "${artistName}": ${error.message}`);
            return [];
        }
    }

    /**
     * Helper to find the latest release date from an artist's release groups
     */
    getLatestReleaseDate(artist: MusicBrainzArtist): Date | null {
        if (!artist['release-groups'] || artist['release-groups'].length === 0) {
            return null;
        }

        const dates = artist['release-groups']
            .map(rg => rg['first-release-date'])
            .filter(date => !!date)
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()));

        if (dates.length === 0) return null;

        return new Date(Math.max(...dates.map(d => d.getTime())));
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
