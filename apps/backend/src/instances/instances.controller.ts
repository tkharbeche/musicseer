import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('instances')
@UseGuards(JwtAuthGuard)
export class InstancesController {
    constructor(private readonly instancesService: InstancesService) { }

    @Post()
    create(@Request() req: any, @Body() createInstanceDto: CreateInstanceDto) {
        return this.instancesService.create(req.user.id, createInstanceDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.instancesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.instancesService.findOne(req.user.id, id);
    }

    @Put(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateInstanceDto: UpdateInstanceDto) {
        return this.instancesService.update(req.user.id, id, updateInstanceDto);
    }

    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        await this.instancesService.remove(req.user.id, id);
        return { message: 'Server instance removed successfully' };
    }

    @Post(':id/test')
    testConnection(@Request() req: any, @Param('id') id: string) {
        return this.instancesService.testConnection(req.user.id, id);
    }

    @Get('admin/mappings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    findAllMappings() {
        return this.instancesService.findAllMappings();
    }

    @Post('admin/mappings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    createMapping(@Body() body: { userId: string, serverId: string }) {
        return this.instancesService.createMapping(body.userId, body.serverId);
    }

    @Delete('admin/mappings/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    removeMapping(@Param('id') id: string) {
        return this.instancesService.removeMapping(id);
    }
}
