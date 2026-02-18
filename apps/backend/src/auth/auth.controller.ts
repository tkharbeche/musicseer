import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: any) {
        return req.user;
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findAll() {
        return this.authService.findAll();
    }

    @Patch('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async updateUser(@Param('id') id: string, @Body() updateDto: any) {
        return this.authService.updateUser(id, updateDto);
    }

    @Delete('users/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async deleteUser(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }
}
