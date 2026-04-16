async function testTech() {
    console.log('Testing LIVE TECH API: https://giteul-media.vercel.app/api/auto-post');
    try {
        const res = await fetch('https://giteul-media.vercel.app/api/auto-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetCategory: 'tech' })
        }, { timeout: 60000 });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}
testTech();
