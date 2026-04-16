async function proveAutomation() {
    console.log('--- [PROVE] Automation Trigger Test ---');
    console.log('Target: http://localhost:3000/api/auto-post (GET)');
    console.log('Timestamp:', new Date().toLocaleString());
    
    try {
        const res = await fetch('http://localhost:3000/api/auto-post');
        const data = await res.json();
        
        console.log('Response Status:', res.status);
        console.log('Response Data Received.');
        
        if (data.results) {
            console.log('\n--- Batch Job Results ---');
            data.results.forEach(r => {
                if (r.success) {
                    console.log(`✅ [${r.category}] 발행 성공: ${r.title}`);
                } else {
                    console.log(`💡 [${r.category}] SKIP/FAIL: ${r.message || r.error}`);
                }
            });
        } else {
            console.log('Error Data:', data);
        }
    } catch (e) {
        console.error('Test Failed (Connection Error):', e.message);
        console.log('Make sure "npm run dev" is running at port 3000.');
    }
}

proveAutomation();
