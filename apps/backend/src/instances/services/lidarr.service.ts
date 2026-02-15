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
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get root folders from Lidarr
     */
    async getRootFolders(baseUrl: string, apiKey: string): Promise<any[]> {
        try {
            const response = await axios.get(`${baseUrl}/api/v1/rootfolder`, {
                headers: { 'X-Api-Key': apiKey }
            });
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Get quality profiles from Lidarr
     */
    async getQualityProfiles(baseUrl: string, apiKey: string): Promise<any[]> {
        try {
            const response = await axios.get(`${baseUrl}/api/v1/qualityprofile`, {
                headers: { 'X-Api-Key': apiKey }
            });
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Get metadata profiles from Lidarr
     */
    async getMetadataProfiles(baseUrl: string, apiKey: string): Promise<any[]> {
        try {
            const response = await axios.get(`${baseUrl}/api/v1/metadataprofile`, {
                headers: { 'X-Api-Key': apiKey }
            });
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Lookup artist in Lidarr by term (name or lidarr:mbid)
     */
    async lookupArtist(baseUrl: string, apiKey: string, term: string): Promise<any[]> {
        try {
            const response = await axios.get(`${baseUrl}/api/v1/artist/lookup`, {
                params: { term },
                headers: { 'X-Api-Key': apiKey }
            });
            return response.data || [];
        } catch (error) {
            return [];
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
            // 1. Lookup artist to get required metadata
            const lookupResults = await this.lookupArtist(baseUrl, apiKey, `lidarr:${artistData.foreignArtistId}`);
            const lidarrArtistMetadata = lookupResults.find(a => a.foreignArtistId === artistData.foreignArtistId) || lookupResults[0];

            if (!lidarrArtistMetadata) {
                throw new Error(`Could not find artist metadata in Lidarr for MBID: ${artistData.foreignArtistId}`);
            }

            // 2. Fetch defaults if not provided
            let { qualityProfileId, metadataProfileId, rootFolderPath } = artistData;

            if (!qualityProfileId) {
                const profiles = await this.getQualityProfiles(baseUrl, apiKey);
                qualityProfileId = profiles.length > 0 ? profiles[0].id : 1;
            }

            if (!metadataProfileId) {
                const profiles = await this.getMetadataProfiles(baseUrl, apiKey);
                metadataProfileId = profiles.length > 0 ? profiles[0].id : 1;
            }

            if (!rootFolderPath) {
                const folders = await this.getRootFolders(baseUrl, apiKey);
                rootFolderPath = folders.length > 0 ? folders[0].path : '/music';
            }

            // 3. Prepare payload using Lidarr's expected structure
            const payload = {
                ...lidarrArtistMetadata,
                qualityProfileId,
                metadataProfileId,
                rootFolderPath,
                monitored: artistData.monitored ?? true,
                addOptions: {
                    searchForMissingAlbums: true,
                    monitor: 'all'
                }
            };

            const url = `${baseUrl}/api/v1/artist`;
            const response = await axios.post(
                url,
                payload,
                {
                    headers: {
                        'X-Api-Key': apiKey,
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error) {
            const errorData = error.response?.data;
            const errorMessage = Array.isArray(errorData)
                ? errorData.map(e => e.errorMessage || e.message).join(', ')
                : (typeof errorData === 'string' ? errorData : error.message);

            if (error.response?.status === 400 && errorMessage.toLowerCase().includes('already exists')) {
                throw new HttpException('Artist already exists in Lidarr', HttpStatus.CONFLICT);
            }

            throw new HttpException(
                `Failed to add artist to Lidarr: ${errorMessage}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
