import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { LidarrService } from '../instances/services/lidarr.service';
import { InstancesService } from '../instances/instances.service';
import { MusicbrainzService } from '../discovery/services/musicbrainz.service';

@Injectable()
export class RequestsService {
    private readonly logger = new Logger(RequestsService.name);

    constructor(
        @InjectRepository(Request)
        private readonly requestRepository: Repository<Request>,
        private readonly lidarrService: LidarrService,
        private readonly instancesService: InstancesService,
        private readonly musicbrainzService: MusicbrainzService,
    ) { }

    async create(userId: string, createRequestDto: CreateRequestDto): Promise<Request> {
        let { artistName, artistMbid, albumName, albumMbid, targetServerId } = createRequestDto;

        // If targetServerId is not provided, try to find a default Lidarr instance
        if (!targetServerId) {
            const anyLidarr = await this.instancesService.findAnyActiveByType('lidarr');
            if (anyLidarr) {
                targetServerId = anyLidarr.id;
            }
        }

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

        if (updateStatusDto.targetServerId) {
            request.targetServerId = updateStatusDto.targetServerId;
        }

        return this.requestRepository.save(request);
    }

    async submitToLidarr(requestId: string): Promise<Request> {
        const request = await this.requestRepository.findOne({ where: { id: requestId } });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.status !== 'approved') {
            throw new HttpException(`Request must be approved before submission. Current status: ${request.status}`, HttpStatus.BAD_REQUEST);
        }

        let targetServerId = request.targetServerId;

        // If targetServerId is missing, try to find any active Lidarr instance in the system
        if (!targetServerId) {
            const anyLidarr = await this.instancesService.findAnyActiveByType('lidarr');
            if (anyLidarr) {
                targetServerId = anyLidarr.id;
                request.targetServerId = targetServerId;
                await this.requestRepository.save(request);
            }
        }

        if (!targetServerId) {
            throw new HttpException('No target Lidarr server configured. Please configure a Lidarr instance in the Admin Dashboard.', HttpStatus.BAD_REQUEST);
        }

        // Try to find MBID if missing
        if (!request.artistMbid) {
            this.logger.log(`Artist MBID missing for ${request.artistName}, attempting to find it via MusicBrainz...`);
            try {
                const results = await this.musicbrainzService.searchArtist(request.artistName);
                if (results && results.length > 0) {
                    const bestMatch = results.find(a => a.name.toLowerCase() === request.artistName.toLowerCase()) || results[0];
                    request.artistMbid = bestMatch.id;
                    await this.requestRepository.save(request);
                    this.logger.log(`Automatically found MBID ${request.artistMbid} for ${request.artistName}`);
                }
            } catch (mbError) {
                this.logger.error(`Failed to auto-lookup MBID: ${mbError.message}`);
            }
        }

        if (!request.artistMbid) {
            throw new HttpException('Artist MBID required for Lidarr submission. We could not automatically find a MusicBrainz ID for this artist. Please ensure the artist has a MusicBrainz ID.', HttpStatus.BAD_REQUEST);
        }

        try {
            // Get Lidarr instance - using findById because it might be a global/admin server not mapped to the user
            const instance = await this.instancesService.findById(targetServerId!);

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
