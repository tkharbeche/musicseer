import { IsString, IsUrl, IsOptional, IsBoolean, MinLength, IsObject } from 'class-validator';

export class UpdateInstanceDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

    @IsOptional()
    @IsUrl({ require_protocol: true })
    baseUrl?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    apiKey?: string;

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
