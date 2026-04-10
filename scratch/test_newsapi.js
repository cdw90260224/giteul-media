const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

process.env.NEWSDATA_API_KEY = getEnv('NEWSDATA_API_KEY');

async function test() {
    console.log('Testing NewsData API...');
    try {
        const res = await fetch(`https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&country=kr&category=technology`);
        const data = await res.json();
        console.log('Status:', data.status);
        console.log('Results:', data.results ? data.results.length : 0);
    } catch (e) {
        console.error('API Error:', e.message);
    }
}

test();
