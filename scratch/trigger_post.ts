
async function trigger() {
    console.log('Triggering manual post...');
    try {
        const res = await fetch('http://localhost:3000/api/auto-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetCategory: '정부지원공고' })
        });
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('Trigger failed:', e.message);
    }
}
trigger();
