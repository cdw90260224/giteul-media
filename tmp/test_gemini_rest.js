
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

async function testREST() {
    const env = getEnv();
    const prompt = "Hello, respond with JSON {status: 'ok'}";
    const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
    for (const m of models) {
        console.log(`Testing REST ${m}...`);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            if (data.candidates) {
                console.log(`Success with ${m}:`, data.candidates[0].content.parts[0].text);
                break;
            } else {
                console.error(`Failed with ${m}:`, JSON.stringify(data));
            }
        } catch (e) {
            console.error(`Error with ${m}: ${e.message}`);
        }
    }
}
testREST();
