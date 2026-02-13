import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { LidarrService } from '../instances/services/lidarr.service';
import { InstancesService } from '../instances/instances.service';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(Request)
        private readonly requestRepository: Repository<Request>,
        private readonly lidarrService: LidarrService,
        private readonly instancesService: InstancesService,
    ) { }

    async create(userId: string, createRequestDto: CreateRequestDto): Promise<Request> {
        const { artistName, artistMbid, albumName, albumMbid, targetServerId } = createRequestDto;

        // Check for duplicate requests
        const existing = await this.requestRepository.findOne({
            where: {
                userId,
                artistName,
                status: 'pending',
            },
        });

        if (existing) {
            throw new ConflictException('You have already requested this artist');
        }

        // Create request
        const request = this.requestRepository.create({
            userId,
            artistName,
            artistMbid,
            albumName,
            albumMbid,
            targetServerId,
            status: 'pending',
        });

        return this.requestRepository.save(request);
    }

    async findAll(userId: string, userRole: string): Promise<Request[]> {
        // Admins see all requests, users see only their own
        if (userRole === 'admin') {
            return this.requestRepository.find({
                order: { createdAt: 'DESC' },
                relations: ['user'],
            });
        }

        return this.requestRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(userId: string, id: string, userRole: string): Promise<Request> {
        const request = await this.requestRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        // Users can only see their own requests
        if (userRole !== 'admin' && request.userId !== userId) {
            throw new NotFoundException('Request not found');
        }

        return request;
    }

    async updateStatus(
        userId: string,
        id: string,
        updateStatusDto: UpdateStatusDto,
    ): Promise<Request> {
        const request = await this.requestRepository.findOne({ where: { id } });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        request.status = updateStatusDto.status;

        if (updateStatusDto.adminNotes) {
            request.adminNotes = updateStatusDto.adminNotes;
        }

        return this.requestRepository.save(request);
    }

    async submitToLidarr(requestId: string): Promise<Request> {
        const request = await this.requestRepository.findOne({ where: { id: requestId } });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.status !== 'approved') {
            throw new HttpException('Request must be approved before submission', HttpStatus.BAD_REQUEST);
        }

        if (!request.targetServerId) {
            throw new HttpException('No target Lidarr server configured', HttpStatus.BAD_REQUEST);
        }

        if (!request.artistMbid) {
            throw new HttpException('Artist MBID required for Lidarr submission', HttpStatus.BAD_REQUEST);
        }

        try {
            // Get Lidarr instance
            const instance = await this.instancesService.findOne(request.userId, request.targetServerId);

            if (instance.type !== 'lidarr') {
                throw new HttpException('Target server is not a Lidarr instance', HttpStatus.BAD_REQUEST);
            }

            // Submit to Lidarr
            const lidarrArtist = await this.lidarrService.addArtist(
                instance.baseUrl,
                instance.apiKey,
                {
                    foreignArtistId: request.artistMbid,
                    artistName: request.artistName,
                },
            );

            // Update request
            request.status = 'completed';
            request.lidarrArtistId = lidarrArtist.id;

            return this.requestRepository.save(request);
        } catch (error) {
            // Update request status to failed
            request.status = 'failed';
            request.adminNotes = `Failed to submit to Lidarr: ${error.message}`;
            await this.requestRepository.save(request);

            throw error;
        }
    }
}
