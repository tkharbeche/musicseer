import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('trending_cache')
export class TrendingCache {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true, name: 'artist_mbid' })
    artistMbid?: string;

    @Column({ length: 500, name: 'artist_name' })
    artistName: string;

    @Column({ type: 'int' })
    rank: number;

    @Column({ length: 50, default: 'global', name: 'chart_type' })
    chartType: string;

    @Column({ length: 1000, nullable: true, name: 'image_url' })
    imageUrl?: string;

    @CreateDateColumn({ name: 'cached_at' })
    cachedAt: Date;
}
