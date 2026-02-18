import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerInstance } from './entities/server-instance.entity';
import { UserServerMapping } from './entities/user-server-mapping.entity';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { NavidromeService } from './services/navidrome.service';
import { LidarrService } from './services/lidarr.service';

@Injectable()
export class InstancesService {
    constructor(
        @InjectRepository(ServerInstance)
        private readonly instanceRepository: Repository<ServerInstance>,
        @InjectRepository(UserServerMapping)
        private readonly mappingRepository: Repository<UserServerMapping>,
        private readonly navidromeService: NavidromeService,
        private readonly lidarrService: LidarrService,
    ) { }

    async create(userId: string, createInstanceDto: CreateInstanceDto): Promise<ServerInstance> {
        const { type, baseUrl, apiKey, username, name } = createInstanceDto;

        // Validate connection based on type
        if (type === 'navidrome' && username) {
            // For Navidrome, we need username and password (apiKey in this case)
            await this.navidromeService.validateCredentials(baseUrl, username, apiKey);
        } else if (type === 'lidarr') {
            await this.lidarrService.validateApiKey(baseUrl, apiKey);
        }

        // Create server instance
        const instance = this.instanceRepository.create(createInstanceDto);
        const savedInstance = await this.instanceRepository.save(instance);

        // Create user-server mapping
        const mapping = this.mappingRepository.create({
            userId,
            serverId: savedInstance.id,
        });
        await this.mappingRepository.save(mapping);

        return savedInstance;
    }

    async findAll(userId: string): Promise<ServerInstance[]> {
        const mappings = await this.mappingRepository.find({
            where: { userId },
            relations: ['server'],
        });

        return mappings.map((m) => m.server);
    }

    async findOne(userId: string, id: string): Promise<ServerInstance> {
        const mapping = await this.mappingRepository.findOne({
            where: { userId, serverId: id },
            relations: ['server'],
        });

        if (!mapping) {
            throw new NotFoundException('Server instance not found');
        }

        return mapping.server;
    }

    async update(userId: string, id: string, updateInstanceDto: UpdateInstanceDto): Promise<ServerInstance> {
        const instance = await this.findOne(userId, id);

        // If changing apiKey or baseUrl, revalidate connection
        if (updateInstanceDto.apiKey || updateInstanceDto.baseUrl) {
            const baseUrl = updateInstanceDto.baseUrl || instance.baseUrl;
            const apiKey = updateInstanceDto.apiKey || instance.apiKey;

            if (instance.type === 'navidrome' && (updateInstanceDto.username || instance.username)) {
                const username = updateInstanceDto.username || instance.username!;
                await this.navidromeService.validateCredentials(baseUrl, username, apiKey);
            } else if (instance.type === 'lidarr') {
                await this.lidarrService.validateApiKey(baseUrl, apiKey);
            }
        }

        Object.assign(instance, updateInstanceDto);
        return this.instanceRepository.save(instance);
    }

    async remove(userId: string, id: string): Promise<void> {
        const mapping = await this.mappingRepository.findOne({
            where: { userId, serverId: id },
        });

        if (!mapping) {
            throw new NotFoundException('Server instance not found');
        }

        await this.mappingRepository.remove(mapping);

        // Check if any other users are mapped to this server
        const otherMappings = await this.mappingRepository.count({
            where: { serverId: id },
        });

        // If no other users, delete the server instance
        if (otherMappings === 0) {
            await this.instanceRepository.delete(id);
        }
    }

    async testConnection(userId: string, id: string): Promise<{ success: boolean; message: string }> {
        const instance = await this.findOne(userId, id);

        try {
            if (instance.type === 'navidrome' && instance.username) {
                await this.navidromeService.testConnection(instance.baseUrl, instance.username, instance.apiKey);
            } else if (instance.type === 'lidarr') {
                await this.lidarrService.testConnection(instance.baseUrl, instance.apiKey);
            } else {
                throw new BadRequestException('Invalid server configuration');
            }

            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getAuthSource(): Promise<ServerInstance | null> {
        return this.instanceRepository.findOne({
            where: { type: 'navidrome', isAuthSource: true, isActive: true },
        });
    }

    async findFirstLidarrInstance(): Promise<ServerInstance | null> {
        return this.instanceRepository.findOne({
            where: { type: 'lidarr', isActive: true },
        });
    }
}
