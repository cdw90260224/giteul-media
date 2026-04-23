const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function fixPosts() {
    // 1. Remove obvious hallucinated deadlines from today's manual run
    const { error: err1 } = await supabase.from('posts').update({ 
        deadline_date: null,
        summary: "공고 모집이 활발히 진행 중입니다. 상세 내용은 아래 본문과 공고 URL을 확인해 주세요." 
    }).in('id', [213, 214]);
    
    if (err1) console.error('Error fixing 213, 214:', err1);
    else console.log('Successfully fixed IDs 213 and 214.');

    // 2. Check for other potential issues in ID 210, 211 if they mention "마감" in summary
    const { data: recent } = await supabase.from('posts').select('id, title, summary, content').gt('created_at', '2026-04-20');
    
    for (const p of recent) {
        if (p.summary.includes('마감 완료') || p.content.includes('마감 완료')) {
             console.log(`Fixing potential '마감 완료' hallucination in ID: ${p.id}`);
             await supabase.from('posts').update({ 
                 summary: p.summary.replace(/마감 완료|마감되었습니다/g, '모집 중'),
                 content: p.content.replace(/마감 완료|마감되었습니다/g, '모집 중') 
             }).eq('id', p.id);
        }
    }
}

fixPosts();
