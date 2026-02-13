import { Controller, Get, UseGuards, Request, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Corrected path
import { RecommendationService } from './services/recommendation.service';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @Get('recommendations')
    async getRecommendations(
        @Request() req: any,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
    ) {
        return this.recommendationService.getRecommendations(req.user.userId, limit);
    }
}
