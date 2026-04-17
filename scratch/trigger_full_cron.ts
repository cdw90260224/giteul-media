
async function triggerFullCron() {
    console.log('Triggering FULL cron job (GET request)...');
    try {
        const res = await fetch('http://localhost:3000/api/auto-post', {
            method: 'GET'
        });
        const data = await res.json();
        console.log('Cron Trigger Response:', JSON.stringify(data, null, 2));
        console.log('The background tasks are now running. Checking results in a few moments...');
    } catch (e: any) {
        console.error('Trigger failed:', e.message);
    }
}
triggerFullCron();
