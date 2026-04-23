const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function findHallucination() {
    console.log('--- Searching for "마감" or "종료" in all posts ---');
    const { data, error } = await supabase.from('posts')
        .select('id, title, summary, content, created_at')
        .or('title.ilike.%마감%,summary.ilike.%마감%,content.ilike.%마감%,title.ilike.%종료%,summary.ilike.%종료%,content.ilike.%종료%')
        .order('created_at', {ascending:false});
    
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} matches.`);
    data.forEach(p => {
        console.log(`[${p.id}] [${p.created_at}] TITLE: ${p.title}`);
        // console.log(`SUMMARY: ${p.summary.slice(0, 100)}...`);
        // Search where exactly the word is
        if (p.title.includes('마감') || p.title.includes('종료')) console.log(' -> Found in TITLE');
        if (p.summary.includes('마감') || p.summary.includes('종료')) console.log(' -> Found in SUMMARY');
        if (p.content.includes('마감') || p.content.includes('종료')) console.log(' -> Found in CONTENT');
        console.log('---');
    });
}

findHallucination();
