
const { createClient } = require('@supabase/supabase-js');
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

async function checkDups() {
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch one item from the RSS manually
    const RSS_URL = 'https://news.google.com/rss/search?q=%EA%B8%B0%EC%97%85+%EB%A7%88%EC%BC%93+%EC%A6%9D%EC%8B%9C+M%26A&hl=ko&gl=KR&ceid=KR:ko';
    const res = await fetch(RSS_URL);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    
    for (const item of items) {
        const url = item[1].match(/<link>(.*?)<\/link>/)?.[1];
        console.log(`Checking URL: ${url}`);
        const { data: dup, error } = await supabase.from('posts').select('id').eq('notice_url', url).maybeSingle();
        if (error) console.error(error);
        if (dup) console.log(`  DUPE FOUND: ID ${dup.id}`);
        else console.log(`  NOT IN DB`);
    }
}

checkDups();
