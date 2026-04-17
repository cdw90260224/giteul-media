
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const GEMINI_KEY = env['GEMINI_API_KEY'] || '';

async function testGemini() {
    console.log('Testing Gemini API with gemini-2.0-flash...');
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const modelName = 'gemini-2.0-flash';
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, are you working? Respond with "Yes".');
        const text = result.response.text();
        console.log(`Gemini response: ${text.trim()}`);
    } catch (e: any) {
        console.error('Gemini API FAILED:', e.message);
    }
}

testGemini();
