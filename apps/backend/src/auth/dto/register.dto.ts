import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password?: string;

    @IsOptional()
    @IsEnum(['admin', 'user'])
    role?: string;

    @IsOptional()
    @IsBoolean()
    canAutoApprove?: boolean;
}
