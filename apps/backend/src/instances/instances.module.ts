import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstancesService } from './instances.service';
import { InstancesController } from './instances.controller';
import { ServerInstance } from './entities/server-instance.entity';
import { UserServerMapping } from './entities/user-server-mapping.entity';
import { NavidromeService } from './services/navidrome.service';
import { LidarrService } from './services/lidarr.service';

@Module({
    imports: [TypeOrmModule.forFeature([ServerInstance, UserServerMapping])],
    controllers: [InstancesController],
    providers: [InstancesService, NavidromeService, LidarrService],
    exports: [InstancesService, LidarrService, NavidromeService, TypeOrmModule],
})
export class InstancesModule { }
