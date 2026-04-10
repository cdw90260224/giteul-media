const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const genAI = new GoogleGenerativeAI(getEnv('GEMINI_API_KEY'));

async function test() {
    console.log('Testing Gemini API (gemini-1.5-flash)...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Hello, are you there?");
        console.log('Gemini Response:', result.response.text());
    } catch (e) {
        console.error('Gemini Error (1.5):', e.message);
        console.log('Trying gemini-2.5-flash...');
        try {
            const model2 = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result2 = await model2.generateContent("Hello?");
            console.log('Gemini 2.5 Response:', result2.response.text());
        } catch (e2) {
            console.error('Gemini Error (2.5):', e2.message);
        }
    }
}

test();
