import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NavidromeService {
    /**
     * Generate Subsonic auth parameters (token and salt)
     */
    private getAuthParams(username: string, password: string) {
        const salt = crypto.randomBytes(6).toString('hex');
        const token = crypto.createHash('md5').update(password + salt).digest('hex');
        return {
            u: username,
            t: token,
            s: salt,
            v: '1.16.1',
            c: 'MusicSeer',
            f: 'json'
        };
    }

    /**
     * Test connection to a Navidrome server
     */
    async testConnection(baseUrl: string, username: string, password: string): Promise<boolean> {
        try {
            // Navidrome uses Subsonic API
            const url = `${baseUrl}/rest/ping`;
            const auth = this.getAuthParams(username, password);

            const response = await axios.get(url, {
                params: auth,
                timeout: 5000,
            });

            return response.data?.['subsonic-response']?.status === 'ok';
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.['subsonic-response']?.error?.message || error.message;

            throw new HttpException(
                `Failed to connect to Navidrome: ${message}`,
                status === 401 ? HttpStatus.BAD_REQUEST : HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Validate Navidrome credentials
     */
    async validateCredentials(baseUrl: string, username: string, password: string): Promise<void> {
        const isValid = await this.testConnection(baseUrl, username, password);

        if (!isValid) {
            throw new HttpException(
                'Invalid Navidrome credentials or server unavailable',
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
