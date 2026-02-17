import { IsEmail, IsString, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password: string;

    @IsString()
    @MaxLength(50)
    role?: string;

    @IsBoolean()
    canAutoApprove?: boolean;
}
