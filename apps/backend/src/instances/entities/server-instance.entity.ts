import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('server_instances')
export class ServerInstance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 50 })
    type: string; // 'navidrome' | 'lidarr' | 'jellyfin'

    @Column({ length: 500, name: 'base_url' })
    baseUrl: string;

    @Column({ length: 500, name: 'api_key' })
    apiKey: string;

    @Column({ length: 255, nullable: true })
    username?: string;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @Column({ default: false, name: 'is_auth_source' })
    isAuthSource: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
