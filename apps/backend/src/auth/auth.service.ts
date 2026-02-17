import { Injectable, ConflictException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NavidromeService } from '../instances/services/navidrome.service';
import { ServerInstance } from '../instances/entities/server-instance.entity';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ServerInstance)
        private readonly serverRepository: Repository<ServerInstance>,
        private readonly jwtService: JwtService,
        private readonly navidromeService: NavidromeService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; access_token: string }> {
        const { username, email, password, role, canAutoApprove } = registerDto;

        // Check if user exists
        const existingUser = await this.userRepository.findOne({
            where: [{ email }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictException('Email already registered');
            }
            if (existingUser.username === username) {
                throw new ConflictException('Username already taken');
            }
        }

        // Hash password if provided
        const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

        // Create user
        const user = this.userRepository.create({
            username,
            email,
            passwordHash,
            role: role || 'user',
            canAutoApprove: canAutoApprove || false,
        });

        const savedUser = await this.userRepository.save(user);

        // Generate JWT
        const access_token = this.generateToken(savedUser);

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = savedUser;

        return { user: userWithoutPassword, access_token };
    }

    async login(loginDto: LoginDto): Promise<{ user: Partial<User>; access_token: string }> {
        const { email, password } = loginDto;

        // Find user by email or username
        const user = await this.userRepository.findOne({
            where: [{ email }, { username: email }],
        });

        if (!user) {
            this.logger.warn(`Login attempt for non-existent user: ${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        let isAuthenticated = false;

        // 1. Try local password if it exists
        if (user.passwordHash) {
            isAuthenticated = await bcrypt.compare(password, user.passwordHash);
        }

        // 2. Try Navidrome auth if local fails or doesn't exist
        if (!isAuthenticated) {
            const authSource = await this.serverRepository.findOne({
                where: { type: 'navidrome', isAuthSource: true, isActive: true },
            });

            if (authSource) {
                try {
                    const isValid = await this.navidromeService.testConnection(
                        authSource.baseUrl,
                        user.username,
                        password,
                    );
                    if (isValid) {
                        isAuthenticated = true;
                        this.logger.log(`User ${user.username} authenticated via Navidrome`);
                    }
                } catch (error) {
                    this.logger.error(`Navidrome auth failed for ${user.username}: ${error.message}`);
                }
            }
        }

        if (!isAuthenticated) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const access_token = this.generateToken(user);

        // Return user without password
        const { passwordHash: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, access_token };
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            select: ['id', 'username', 'email', 'role', 'canAutoApprove', 'createdAt', 'updatedAt'],
        });
    }

    async updateUser(id: string, updateDto: any): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (updateDto.password) {
            updateDto.passwordHash = await bcrypt.hash(updateDto.password, 10);
            delete updateDto.password;
        }

        Object.assign(user, updateDto);
        return this.userRepository.save(user);
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepository.delete(id);
    }

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
}
