/**
 * Normalize a base URL by removing trailing slashes and common API suffixes
 */
export function normalizeBaseUrl(url: string, type: 'navidrome' | 'lidarr' | 'jellyfin'): string {
    if (!url) return '';

    // Remove trailing slashes
    let normalized = url.replace(/\/+$/, '');

    // Remove common suffixes that users might include by mistake
    if (type === 'navidrome') {
        normalized = normalized.replace(/\/rest$/, '');
    } else if (type === 'lidarr') {
        normalized = normalized.replace(/\/api\/v1$/, '');
        normalized = normalized.replace(/\/api$/, '');
    }

    return normalized;
}
