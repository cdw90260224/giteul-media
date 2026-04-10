const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const GEMINI_KEY = getEnv('GEMINI_API_KEY');
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function testPipeline() {
    console.log('--- STARTING PIPELINE DEBUG ---');
    
    // Step 1: Gemini 2.5-flash Check
    console.log('1. Testing Gemini 2.5-flash...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent("Hello, write a 1 sentence news title about AI.");
        console.log('   [SUCCESS] 2.5-flash Response:', result.response.text().slice(0, 50));
    } catch (e) {
        console.error('   [FAIL] 2.5-flash Error:', e.message);
        console.log('2. Attempting Fallback to gemini-1.5-flash...');
        try {
            const model15 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result15 = await model15.generateContent("Hello?");
            console.log('   [SUCCESS] 1.5-flash Response:', result15.response.text());
        } catch (e15) {
            console.error('   [FAIL] 1.5-flash also failed:', e15.message);
        }
    }

    // Step 2: Supabase Connection Check
    console.log('3. Testing Supabase Table Access...');
    const { count, error } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    if (error) console.error('   [FAIL] Supabase Error:', error);
    else console.log('   [SUCCESS] Supabase Connected. Total Posts:', count);

    console.log('--- DEBUG COMPLETE ---');
}

testPipeline();
