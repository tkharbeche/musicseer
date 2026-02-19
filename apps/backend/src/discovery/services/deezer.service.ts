import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DeezerService {
    private readonly logger = new Logger(DeezerService.name);
    private readonly baseUrl = 'https://api.deezer.com';

    /**
     * Search for artist on Deezer and return the first match with its images
     */
    async searchArtist(name: string): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/search/artist`, {
                params: { q: name, limit: 1 },
            });

            if (response.data?.data && response.data.data.length > 0) {
                return response.data.data[0];
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to fetch Deezer data for artist ${name}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract the best available artist image from Deezer data
     */
    extractImageUrl(deezerArtist: any): string | null {
        if (!deezerArtist) return null;

        // picture_xl is preferred (1000x1000)
        return (
            deezerArtist.picture_xl ||
            deezerArtist.picture_big ||
            deezerArtist.picture_medium ||
            null
        );
    }
}
