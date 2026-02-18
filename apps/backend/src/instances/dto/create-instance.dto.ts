import { IsString, IsEnum, IsUrl, IsOptional, MinLength, IsBoolean, IsObject } from 'class-validator';

export class CreateInstanceDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsEnum(['navidrome', 'lidarr', 'jellyfin'])
    type: 'navidrome' | 'lidarr' | 'jellyfin';

    @IsUrl({ require_protocol: true })
    baseUrl: string;

    @IsString()
    @MinLength(1)
    apiKey: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isAuthSource?: boolean;

    @IsOptional()
    @IsObject()
    settings?: Record<string, any>;
}
