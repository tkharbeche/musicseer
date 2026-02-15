import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LibrarySnapshot } from '../entities/library-snapshot.entity';
import { ServerInstance } from '../../instances/entities/server-instance.entity';
import { UserServerMapping } from '../../instances/entities/user-server-mapping.entity';
import { SubsonicService } from './subsonic.service';
import { TrendingService } from '../../discovery/services/trending.service'; // For metadata access if needed

@Injectable()
export class LibrarySyncService {
    private readonly logger = new Logger(LibrarySyncService.name);

    constructor(
        @InjectRepository(LibrarySnapshot)
        private readonly librarySnapshotRepository: Repository<LibrarySnapshot>,
        @InjectRepository(ServerInstance)
        private readonly serverInstanceRepository: Repository<ServerInstance>,
        @InjectRepository(UserServerMapping)
        private readonly userServerMappingRepository: Repository<UserServerMapping>,
        private readonly subsonicService: SubsonicService,
    ) { }

    /**
     * Cron job to sync libraries every 12 hours
     */
    @Cron(CronExpression.EVERY_12_HOURS)
    async syncAllLibraries() {
        this.logger.log('Starting library sync for all active instances...');

        const instances = await this.serverInstanceRepository.find({
            where: { isActive: true, type: 'navidrome' }
        });

        for (const instance of instances) {
            await this.syncInstance(instance);
        }

        this.logger.log('Library sync completed.');
    }

    /**
     * Sync a specific instance
     */
    async syncInstance(instance: ServerInstance) {
        this.logger.log(`Syncing instance: ${instance.name} (${instance.id})`);

        try {
            // Fetch artists from Subsonic API
            const artists = await this.subsonicService.getArtists(
                instance.baseUrl || '',
                instance.username || '', // Handle potentially undefined username
                instance.apiKey || '' // Handle undefined
            );

            this.logger.log(`Fetched ${artists.length} artists from ${instance.name}`);

            if (artists.length === 0) return;

            // Get all mapped users for this instance
            // We assume the library content is relevant for all users who have this server mapped
            const mappings = await this.userServerMappingRepository.find({
                where: { serverId: instance.id },
                relations: ['user']
            });

            if (mappings.length === 0) {
                this.logger.warn(`No users mapped to instance ${instance.name}, skipping snapshot save.`);
                return;
            }

            // Sync for each mapped user
            for (const mapping of mappings) {
                await this.updateUserSnapshot(mapping.userId, instance.id, artists);
            }

        } catch (error) {
            this.logger.error(`Failed to sync instance ${instance.name}: ${error.message}`);
        }
    }

    /**
     * Update snapshot for a specific user and server
     */
    private async updateUserSnapshot(userId: string, serverId: string, artists: any[]) {
        this.logger.log(`Updating snapshot for user ${userId} on server ${serverId}`);

        // Strategy: 
        // 1. Delete all existing entries for this user+server to ensure freshness
        // 2. Bulk insert new entries

        await this.librarySnapshotRepository.delete({ userId, serverId });

        const snapshots = artists.map(artist => {
            const snapshot = new LibrarySnapshot();
            snapshot.userId = userId;
            snapshot.serverId = serverId;
            snapshot.artistName = artist.name;
            snapshot.artistMbid = artist.mbId || null; // Subsonic uses mbId
            snapshot.playCount = artist.userRating || 0; // Fallback to 0 if playCount unavailable
            snapshot.snapshotAt = new Date();
            return snapshot;
        });

        // Save in chunks to avoid blowing up memory/DB packet size
        const chunkSize = 500;
        for (let i = 0; i < snapshots.length; i += chunkSize) {
            await this.librarySnapshotRepository.save(snapshots.slice(i, i + chunkSize));
        }

        this.logger.log(`Saved ${snapshots.length} artists for user ${userId}`);
    }
}
