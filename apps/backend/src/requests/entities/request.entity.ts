import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('requests')
export class Request {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ type: 'uuid', nullable: true, name: 'artist_mbid' })
    artistMbid?: string;

    @Column({ length: 500, name: 'artist_name' })
    artistName: string;

    @Column({ type: 'uuid', nullable: true, name: 'album_mbid' })
    albumMbid?: string;

    @Column({ length: 500, nullable: true, name: 'album_name' })
    albumName?: string;

    @Column({ length: 50, default: 'pending' })
    status: string;

    @Column({ type: 'uuid', nullable: true, name: 'target_server_id' })
    targetServerId?: string;

    @Column({ type: 'int', nullable: true, name: 'lidarr_artist_id' })
    lidarrArtistId?: number;

    @Column({ type: 'text', nullable: true, name: 'admin_notes' })
    adminNotes?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
