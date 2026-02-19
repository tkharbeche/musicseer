import { Injectable, Logger } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import { AudioDbService } from './audio-db.service';

@Injectable()
export class ImageResolverService {
    private readonly logger = new Logger(ImageResolverService.name);

    constructor(
        private readonly deezerService: DeezerService,
        private readonly audioDbService: AudioDbService,
    ) { }

    /**
     * Resolve artist image from various sources in order of preference
     */
    async resolveArtistImage(name: string, mbid?: string): Promise<string | null> {
        // 1. Try Deezer (Best quality, high reliability)
        try {
            const deezerArtist = await this.deezerService.searchArtist(name);
            const deezerUrl = this.deezerService.extractImageUrl(deezerArtist);
            if (deezerUrl) {
                // this.logger.debug(`Resolved image for ${name} from Deezer`);
                return deezerUrl;
            }
        } catch (e) {
            this.logger.warn(`Deezer resolution failed for ${name}: ${e.message}`);
        }

        // 2. Try AudioDB (High quality, especially with MBID)
        try {
            let adbArtist = null;
            if (mbid) {
                adbArtist = await this.audioDbService.getArtistByMbid(mbid);
            }
            if (!adbArtist) {
                adbArtist = await this.audioDbService.getArtistByName(name);
            }

            const adbUrl = this.audioDbService.extractImageUrl(adbArtist);
            if (adbUrl) {
                // this.logger.debug(`Resolved image for ${name} from AudioDB`);
                return adbUrl;
            }
        } catch (e) {
            this.logger.warn(`AudioDB resolution failed for ${name}: ${e.message}`);
        }

        return null;
    }

    /**
     * Helper to determine if an image URL is from Last.fm (usually low quality or broken)
     */
    isLastFmUrl(url?: string): boolean {
        if (!url) return false;
        return url.includes('lastfm.freetls.fastly.net') || url.includes('last.fm');
    }
}
