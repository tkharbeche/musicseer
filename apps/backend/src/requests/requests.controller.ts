import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@Request() req: any, @Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(req.user.id, createRequestDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.requestsService.findAll(req.user.id, req.user.role);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.requestsService.findOne(req.user.id, id, req.user.role);
    }

    @Put(':id/status')
    @UseGuards(RolesGuard)
    @Roles('admin')
    updateStatus(
        @Request() req: any,
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusDto,
    ) {
        return this.requestsService.updateStatus(req.user.id, id, updateStatusDto);
    }

    @Post(':id/submit')
    @UseGuards(RolesGuard)
    @Roles('admin')
    submitToLidarr(@Param('id') id: string) {
        return this.requestsService.submitToLidarr(id);
    }
}
