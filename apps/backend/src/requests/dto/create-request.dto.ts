import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreateRequestDto {
    @IsString()
    @MinLength(1)
    artistName: string;

    @IsOptional()
    @IsUUID()
    artistMbid?: string;

    @IsOptional()
    @IsString()
    albumName?: string;

    @IsOptional()
    @IsUUID()
    albumMbid?: string;

    @IsOptional()
    @IsUUID()
    targetServerId?: string;
}
