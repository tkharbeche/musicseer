import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 255 })
    username: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255, name: 'password_hash', nullable: true })
    passwordHash?: string;

    @Column({ length: 50, default: 'user' })
    role: string;

    @Column({ default: false, name: 'can_auto_approve' })
    canAutoApprove: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
