
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

async function list() {
    const env = getEnv();
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    try {
        // There's no listModels in the SDK for node? No, wait.
        console.log('Testing gemini-1.5-flash-latest...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const res = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-latest:", res.response.text());
    } catch (e) {
        console.error("Failed with gemini-1.5-flash-latest:", e.message);
    }
}
list();
