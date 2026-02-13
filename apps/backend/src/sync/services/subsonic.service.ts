import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

export interface SubsonicArtist {
    id: string;
    name: string;
    mbId?: string;
    albumCount?: number;
    artistImageUrl?: string;
    starred?: string; // ISO date string
    userRating?: number;
    averageRating?: number;
}

@Injectable()
export class SubsonicService {
    private readonly logger = new Logger(SubsonicService.name);

    /**
     * Generate Subsonic auth parameters (token and salt)
     */
    private getAuthParams(password: string) {
        const salt = crypto.randomBytes(6).toString('hex');
        const token = crypto.createHash('md5').update(password + salt).digest('hex');
        return {
            u: '', // Username (passed separately in params usually, but here we just need token/salt)
            t: token,
            s: salt,
            v: '1.16.1', // API Version
            c: 'MusicSeer', // Client Name
            f: 'json' // Format
        };
    }

    /**
     * Test connection to a Subsonic server
     */
    async ping(baseUrl: string, username: string, apiKey: string): Promise<boolean> {
        try {
            const auth = this.getAuthParams(apiKey);
            const response = await axios.get(`${baseUrl}/rest/ping`, {
                params: {
                    ...auth,
                    u: username
                }
            });

            return response.data['subsonic-response']?.status === 'ok';
        } catch (error) {
            this.logger.error(`Ping failed for ${baseUrl}: ${error.message}`);
            return false;
        }
    }

    /**
     * Fetch all artists from a Subsonic server
     */
    async getArtists(baseUrl: string, username: string, apiKey: string): Promise<SubsonicArtist[]> {
        try {
            const auth = this.getAuthParams(apiKey);
            const response = await axios.get(`${baseUrl}/rest/getArtists`, {
                params: {
                    ...auth,
                    u: username
                }
            });

            if (response.data['subsonic-response']?.status !== 'ok') {
                throw new Error(response.data['subsonic-response']?.error?.message || 'Unknown Subsonic error');
            }

            const indexParams = response.data['subsonic-response']?.artists?.index;
            if (!indexParams) return [];

            // Flatten the index structure (Subsonic returns artists grouped by first letter)
            const allArtists: SubsonicArtist[] = [];

            if (Array.isArray(indexParams)) {
                indexParams.forEach((index: any) => {
                    if (Array.isArray(index.artist)) {
                        allArtists.push(...index.artist);
                    } else if (index.artist) {
                        allArtists.push(index.artist);
                    }
                });
            } else if (indexParams.artist) {
                if (Array.isArray(indexParams.artist)) {
                    allArtists.push(...indexParams.artist);
                } else {
                    allArtists.push(indexParams.artist);
                }
            }

            return allArtists;

        } catch (error) {
            this.logger.error(`Failed to fetch artists from ${baseUrl}: ${error.message}`);
            throw error;
        }
    }
}
