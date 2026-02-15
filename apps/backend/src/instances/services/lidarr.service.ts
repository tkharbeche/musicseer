import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LidarrService {
    /**
     * Test connection to a Lidarr server
     */
    async testConnection(baseUrl: string, apiKey: string): Promise<boolean> {
        try {
            const url = `${baseUrl}/api/v1/system/status`;
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': apiKey,
                },
                timeout: 5000,
            });

            return response.status === 200 && response.data?.version;
        } catch (error) {
            throw new HttpException(
                `Failed to connect to Lidarr: ${error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Validate Lidarr API key
     */
    async validateApiKey(baseUrl: string, apiKey: string): Promise<void> {
        const isValid = await this.testConnection(baseUrl, apiKey);

        if (!isValid) {
            throw new HttpException(
                'Invalid Lidarr API key or server unavailable',
                HttpStatus.UNAUTHORIZED,
            );
        }
    }

    /**
     * Add artist to Lidarr
     */
    async addArtist(
        baseUrl: string,
        apiKey: string,
        artistData: {
            foreignArtistId: string; // MusicBrainz ID
            artistName: string;
            qualityProfileId?: number;
            metadataProfileId?: number;
            rootFolderPath?: string;
            monitored?: boolean;
        },
    ): Promise<any> {
        try {
            const url = `${baseUrl}/api/v1/artist`;
            const response = await axios.post(
                url,
                {
                    foreignArtistId: artistData.foreignArtistId,
                    artistName: artistData.artistName,
                    qualityProfileId: artistData.qualityProfileId || 1,
                    metadataProfileId: artistData.metadataProfileId || 1,
                    rootFolderPath: artistData.rootFolderPath || '/music',
                    monitored: artistData.monitored ?? true,
                    addOptions: {
                        searchForMissingAlbums: true,
                    },
                },
                {
                    headers: {
                        'X-Api-Key': apiKey,
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.includes('already exists')) {
                throw new HttpException('Artist already exists in Lidarr', HttpStatus.CONFLICT);
            }

            throw new HttpException(
                `Failed to add artist to Lidarr: ${error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Search for artists in Lidarr's catalog
     */
    async lookupArtist(baseUrl: string, apiKey: string, term: string): Promise<any[]> {
        try {
            const url = `${baseUrl}/api/v1/artist/lookup?term=${encodeURIComponent(term)}`;
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': apiKey,
                },
                timeout: 5000,
            });

            return response.data;
        } catch (error) {
            return [];
        }
    }
}
