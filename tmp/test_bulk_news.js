
async function testNewCategories() {
    const categories = ['기업/마켓 뉴스', '글로벌 뉴스'];
    for (const cat of categories) {
        console.log(`--- Triggering ${cat} ---`);
        try {
            const res = await fetch('http://localhost:3000/api/auto-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetCategory: cat })
            });
            const data = await res.json();
            console.log(`Result for ${cat}:`, data);
        } catch (e) {
            console.error(`Failed for ${cat}:`, e.message);
        }
    }
}

testNewCategories();
