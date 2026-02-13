import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LibrarySyncService } from './services/library-sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
    constructor(private readonly librarySyncService: LibrarySyncService) { }

    @Post('now')
    @Roles('admin')
    async triggerSync() {
        // Trigger sync in background (or await if fast enough, but sync is slow)
        // We await it here for immediate feedback during testing
        await this.librarySyncService.syncAllLibraries();
        return { message: 'Library sync triggered successfully' };
    }
}
