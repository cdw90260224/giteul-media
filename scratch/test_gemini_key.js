const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API key found');
        return;
    }
    
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    try {
        console.log('Testing Gemini API...');
        const result = await model.generateContent('Hello, say "Automation Ready"');
        console.log('Response:', result.response.text());
    } catch (e) {
        console.error('Gemini Test Failed:', e.message);
    }
}

testGemini();
