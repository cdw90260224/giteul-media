
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
    console.log('Testing Gemini API...');
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const modelName = 'gemini-1.5-flash'; // Use a reliable one
    console.log(`Using model: ${modelName}`);
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, are you working? Respond with "Yes".');
        const text = result.response.text();
        console.log(`Gemini response: ${text.trim()}`);
        if (text.includes('Yes')) {
            console.log('Gemini API is working correctly.');
        } else {
            console.log('Gemini API returned unexpected response.');
        }
    } catch (e: any) {
        console.error('Gemini API FAILED:', e.message);
        if (e.message.includes('API_KEY_INVALID')) {
            console.error('CRITICAL: API Key is invalid.');
        }
    }
}

testGemini();
