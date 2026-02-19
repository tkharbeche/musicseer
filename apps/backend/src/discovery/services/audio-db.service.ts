import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AudioDbService {
    private readonly logger = new Logger(AudioDbService.name);
    private readonly baseUrl = 'https://www.theaudiodb.com/api/v1/json/2';

    /**
     * Get artist information from TheAudioDB by MusicBrainz ID
     */
    async getArtistByMbid(mbid: string): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/artist-mbid.php`, {
                params: { i: mbid },
            });

            if (response.data?.artists && response.data.artists.length > 0) {
                return response.data.artists[0];
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to fetch AudioDB data for MBID ${mbid}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get artist information from TheAudioDB by Name
     */
    async getArtistByName(name: string): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/artist.php`, {
                params: { s: name },
            });

            if (response.data?.artists && response.data.artists.length > 0) {
                return response.data.artists[0];
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to fetch AudioDB data for artist ${name}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract the best available artist image from AudioDB data
     */
    extractImageUrl(audioDbArtist: any): string | null {
        if (!audioDbArtist) return null;

        // Priority: Fanart > Thumb > Banner
        return (
            audioDbArtist.strArtistFanart ||
            audioDbArtist.strArtistFanart2 ||
            audioDbArtist.strArtistFanart3 ||
            audioDbArtist.strArtistThumb ||
            audioDbArtist.strArtistWideThumb ||
            null
        );
    }
}
