async function testLive() {
    console.log('Testing LIVE API: https://giteul-media.vercel.app/api/auto-post');
    try {
        const res = await fetch('https://giteul-media.vercel.app/api/auto-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetCategory: '정부지원공고' })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

testLive();
