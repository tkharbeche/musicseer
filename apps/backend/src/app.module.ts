import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { InstancesModule } from './instances/instances.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { RequestsModule } from './requests/requests.module';
import { SyncModule } from './sync/sync.module';

@Module({
    imports: [
        // Environment configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Database connection
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            username: process.env.POSTGRES_USER || 'musicseer',
            password: process.env.POSTGRES_PASSWORD || 'changeme',
            database: process.env.POSTGRES_DB || 'musicseer',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, // Auto-create tables in dev
            logging: process.env.NODE_ENV === 'development',
        }),

        // Cron scheduling for sync jobs
        ScheduleModule.forRoot(),

        // Feature modules
        AuthModule,
        InstancesModule,
        DiscoveryModule,
        RequestsModule,
        SyncModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
