import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { Request } from './entities/request.entity';
import { User } from '../auth/entities/user.entity';
import { InstancesModule } from '../instances/instances.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Request, User]),
        InstancesModule, // Import to use LidarrService
    ],
    controllers: [RequestsController],
    providers: [RequestsService],
})
export class RequestsModule { }
