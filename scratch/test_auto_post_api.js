async function run() {
    const res = await fetch('http://localhost:3000/api/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCategory: '정부지원공고' })
    });
    const text = await res.text();
    console.log(text);
}
run();
