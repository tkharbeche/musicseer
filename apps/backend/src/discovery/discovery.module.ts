import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { ArtistCache } from './entities/artist-cache.entity';
import { TrendingCache } from './entities/trending-cache.entity';
import { SimilarityCache } from './entities/similarity-cache.entity';
import { LastfmService } from './services/lastfm.service';
import { MusicbrainzService } from './services/musicbrainz.service';
import { TrendingService } from './services/trending.service';
import { SimilarityService } from './services/similarity.service';

import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './services/recommendation.service';
import { LibrarySnapshot } from '../sync/entities/library-snapshot.entity';
// ...
@Module({
    imports: [TypeOrmModule.forFeature([ArtistCache, TrendingCache, SimilarityCache, LibrarySnapshot])],
    controllers: [DiscoveryController, RecommendationController],
    providers: [LastfmService, MusicbrainzService, TrendingService, SimilarityService, RecommendationService],
    exports: [TrendingService, LastfmService, SimilarityService, RecommendationService, MusicbrainzService],
})
export class DiscoveryModule { }
