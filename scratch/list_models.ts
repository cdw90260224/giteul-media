
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    });
    return env;
}

async function run() {
    const env = getEnv();
    console.log(`API Key prefix: ${env.GEMINI_API_KEY ? env.GEMINI_API_KEY.substring(0, 5) : 'MISSING'}`);
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    try {
        // Unfortunately, the current SDK might not have a simple listModels or it changed.
        // Let's just try several common names.
        const trialModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro'];
        for (const m of trialModels) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`Model ${m} is WORKING`);
            } catch (e) {
                console.log(`Model ${m} is NOT working: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
