const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkToday() {
    console.log('--- Checking Today\'s Posts for Hallucinations ---');
    const { data } = await supabase.from('posts')
        .select('id, title, summary, content, notice_url, created_at')
        .gt('created_at', '2026-04-23')
        .order('created_at', {ascending:false});
    
    data.forEach(p => {
        console.log(`\nID: ${p.id}`);
        console.log(`TITLE: ${p.title}`);
        console.log(`SUMMARY: ${p.summary}`);
        const hasIssue = p.content.includes('마감') || p.summary.includes('마감') || p.content.includes('종료') || p.summary.includes('종료');
        if (hasIssue) {
            console.log('>>> POTENTIAL HALLUCINATION DETECTED <<<');
            // Extract the context around '마감'
            const index = p.content.indexOf('마감');
            if (index > -1) {
                console.log(`CONTENT CLIP: ...${p.content.slice(index - 50, index + 50)}...`);
            }
        }
    });
}

checkToday();
