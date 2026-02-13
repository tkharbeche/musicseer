import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NavidromeService {
    /**
     * Test connection to a Navidrome server
     */
    async testConnection(baseUrl: string, username: string, password: string): Promise<boolean> {
        try {
            // Navidrome uses Subsonic API
            const url = `${baseUrl}/rest/ping`;
            const response = await axios.get(url, {
                params: {
                    u: username,
                    p: password,
                    v: '1.16.1',
                    c: 'MusicSeer',
                    f: 'json',
                },
                timeout: 5000,
            });

            return response.data?.['subsonic-response']?.status === 'ok';
        } catch (error) {
            throw new HttpException(
                `Failed to connect to Navidrome: ${error.message}`,
                HttpStatus.BAD_REQUEST,
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
                HttpStatus.UNAUTHORIZED,
            );
        }
    }
}
