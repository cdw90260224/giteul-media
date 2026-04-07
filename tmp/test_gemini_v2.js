
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

async function test_v2() {
    const env = getEnv();
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
    for (const m of models) {
        console.log(`Testing ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent("Hi");
            console.log(`Success with ${m}: ${res.response.text()}`);
            break;
        } catch (e) {
            console.error(`Failed with ${m}: ${e.message}`);
        }
    }
}
test_v2();
