import axios from 'axios';

export async function isImageDisplayable(url: string): Promise<boolean> {
    if (!url) return false;
    try {
        const response = await axios.head(url, { timeout: 3000 });
        const contentType = response.headers['content-type'];
        return response.status === 200 && contentType?.startsWith('image/');
    } catch (error) {
        return false;
    }
}
