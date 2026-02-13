import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ServerInstance } from '../../instances/entities/server-instance.entity';

@Entity('library_snapshot')
@Index(['userId', 'serverId']) // Optimize lookups for specific user/server combinations
@Index(['artistMbid']) // Optimize lookups by MBID
export class LibrarySnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'server_id' })
    serverId: string;

    @ManyToOne(() => ServerInstance, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'server_id' })
    serverInstance: ServerInstance;

    @Column({ name: 'artist_name' })
    artistName: string;

    @Column({ name: 'artist_mbid', nullable: true })
    artistMbid: string;

    @Column({ name: 'play_count', default: 0 })
    playCount: number;

    @Column({ name: 'last_played', type: 'timestamp', nullable: true })
    lastPlayed: Date;

    @Column({ name: 'snapshot_at' })
    snapshotAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
