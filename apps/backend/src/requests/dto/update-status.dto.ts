import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
    @IsEnum(['pending', 'approved', 'rejected', 'sent', 'completed', 'failed'])
    status: 'pending' | 'approved' | 'rejected' | 'sent' | 'completed' | 'failed';

    @IsOptional()
    @IsString()
    adminNotes?: string;
}
