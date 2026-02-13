
async function testSync() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:4000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Got token:', token ? 'YES' : 'NO');

        if (!token) return;

        // 2. Trigger Sync
        console.log('Triggering sync...');
        const syncRes = await fetch('http://localhost:4000/discovery/sync-now', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        const syncData = await syncRes.json();
        console.log('Sync response:', syncData);

        // 3. Check Trending
        console.log('Checking trending...');
        const trendingRes = await fetch('http://localhost:4000/discovery/trending?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const trendingData = await trendingRes.json();
        console.log('Trending artists:', trendingData.length);
        if (trendingData.length > 0) {
            console.log('Top artist:', trendingData[0].name);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testSync();
