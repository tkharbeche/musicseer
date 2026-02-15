import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'sent', 'completed', 'failed'])
    status?: 'pending' | 'approved' | 'rejected' | 'sent' | 'completed' | 'failed';

    @IsOptional()
    @IsString()
    adminNotes?: string;

    @IsOptional()
    @IsString()
    targetServerId?: string;
}
