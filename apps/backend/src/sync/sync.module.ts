import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LibrarySnapshot } from './entities/library-snapshot.entity';
import { SubsonicService } from './services/subsonic.service';
import { SyncController } from './sync.controller';
import { LibrarySyncService } from './services/library-sync.service';
import { ServerInstance } from '../instances/entities/server-instance.entity';
import { UserServerMapping } from '../instances/entities/user-server-mapping.entity';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([LibrarySnapshot, ServerInstance, UserServerMapping]),
        ScheduleModule.forRoot(),
        DiscoveryModule,
    ],
    controllers: [SyncController],
    providers: [
        SubsonicService,
        LibrarySyncService,
    ],
    exports: [
        LibrarySyncService,
    ],
})
export class SyncModule { }
