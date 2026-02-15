import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; access_token: string }> {
        const { username, email, password } = registerDto;

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

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = this.userRepository.create({
            username,
            email,
            passwordHash,
            role: 'user',
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

        // Find user
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
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

    async findAll(): Promise<Partial<User>[]> {
        const users = await this.userRepository.find({
            order: { username: 'ASC' }
        });

        return users.map(user => {
            const { passwordHash: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
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
