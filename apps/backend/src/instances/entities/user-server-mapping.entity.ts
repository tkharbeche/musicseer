import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ServerInstance } from './server-instance.entity';

@Entity('user_server_mappings')
export class UserServerMapping {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'server_id' })
    serverId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => ServerInstance, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'server_id' })
    server: ServerInstance;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
