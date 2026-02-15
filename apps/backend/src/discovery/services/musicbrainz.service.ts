import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

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
    private readonly baseUrl = 'https://musicbrainz.org/ws/2/';
    private readonly appName: string;
    private readonly appVersion: string;
    private readonly contact: string;
    private readonly username: string;
    private readonly password: string;

    constructor(private readonly configService: ConfigService) {
        this.appName = this.configService.get<string>('MUSICBRAINZ_APP_NAME') || 'MusicSeer';
        this.appVersion = this.configService.get<string>('MUSICBRAINZ_APP_VERSION') || '0.1.0';
        this.contact = this.configService.get<string>('MUSICBRAINZ_CONTACT') || '';
        this.username = this.configService.get<string>('MUSICBRAINZ_USERNAME') || '';
        this.password = this.configService.get<string>('MUSICBRAINZ_PASSWORD') || '';
    }

    /**
     * Get artist information from MusicBrainz by MBID
     */
    async getArtistByMbid(mbid: string): Promise<MusicBrainzArtist | null> {
        try {
            const response = await this.authenticatedRequest(`${this.baseUrl}artist/${mbid}`, {
                fmt: 'json',
                inc: 'tags+ratings+genres+releases+release-groups',
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
            const response = await this.authenticatedRequest(`${this.baseUrl}artist`, {
                query: `artist:"${artistName}"`,
                fmt: 'json',
                limit: 5,
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
     * Get cover art URL for a specific release
     */
    async getReleaseImageUrl(releaseMbid: string): Promise<string | null> {
        try {
            const response = await this.authenticatedRequest(`${this.baseUrl}release/${releaseMbid}`, {
                fmt: 'json',
                inc: 'cover-art-archive',
            });

            if (response.data?.['cover-art-archive']?.front) {
                return `https://coverartarchive.org/release/${releaseMbid}/front`;
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to fetch release image for ${releaseMbid}: ${error.message}`);
            return null;
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

    /**
     * Internal helper to handle authenticated requests with Digest Auth
     */
    private async authenticatedRequest(url: string, params: any = {}) {
        const headers = {
            'User-Agent': `${this.appName}/${this.appVersion} ( ${this.contact || 'admin@musicseer.local'} )`,
        };

        if (!this.username || !this.password) {
            return axios.get(url, { params, headers });
        }

        try {
            return await axios.get(url, { params, headers });
        } catch (error) {
            if (error.response?.status === 401 && error.response.headers['www-authenticate']) {
                const authHeader = error.response.headers['www-authenticate'];
                const digestParams = this.parseDigestHeader(authHeader);

                const urlObj = new URL(url);
                const searchParams = new URLSearchParams(params);
                const uri = `${urlObj.pathname}?${searchParams.toString()}`;

                const responseHeader = this.calculateDigestResponse('GET', uri, digestParams);

                return await axios.get(url, {
                    params,
                    headers: {
                        ...headers,
                        'Authorization': responseHeader,
                    },
                });
            }
            throw error;
        }
    }

    private parseDigestHeader(header: string) {
        const params: any = {};
        const regex = /(\w+)="?([^",]+)"?/g;
        let match;
        while ((match = regex.exec(header)) !== null) {
            params[match[1]] = match[2];
        }
        return params;
    }

    private calculateDigestResponse(method: string, uri: string, params: any) {
        const { realm, nonce, qop, opaque } = params;
        const nc = '00000001';
        const cnonce = crypto.randomBytes(8).toString('hex');

        const ha1 = crypto.createHash('md5').update(`${this.username}:${realm}:${this.password}`).digest('hex');
        const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');

        let response;
        if (qop === 'auth') {
            response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
        } else {
            response = crypto.createHash('md5').update(`${ha1}:${nonce}:${ha2}`).digest('hex');
        }

        let header = `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
        if (opaque) header += `, opaque="${opaque}"`;
        if (qop) header += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;

        return header;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
