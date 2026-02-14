import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { Request } from './entities/request.entity';
import { InstancesModule } from '../instances/instances.module';
import { DiscoveryModule } from '../discovery/discovery.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Request]),
        InstancesModule, // Import to use LidarrService
        DiscoveryModule,
    ],
    controllers: [RequestsController],
    providers: [RequestsService],
})
export class RequestsModule { }
