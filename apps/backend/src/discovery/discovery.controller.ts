import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { TrendingService } from './services/trending.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
    constructor(private readonly trendingService: TrendingService) { }

    @Get('trending')
    async getTrending(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.trendingService.getTrendingArtists(parsedLimit);
    }

    @Post('sync-now')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async triggerSync() {
        await this.trendingService.syncTrendingArtists();
        return { message: 'Trending sync triggered successfully' };
    }
}
