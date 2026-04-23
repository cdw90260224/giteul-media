const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function findAll() {
    const { data } = await supabase.from('posts').select('id, title, summary, content').order('created_at', {ascending:false});
    console.log(`Checking ${data.length} posts...`);
    data.forEach(p => {
        const text = (p.title + p.summary + p.content).toLowerCase();
        if (text.includes('마감되었습니다') || text.includes('종료되었습니다') || text.includes('마감 완료') || text.includes('접수 종료') || text.includes('이미 마감')) {
            console.log(`\nMATCH FOUND in ID: ${p.id}`);
            console.log(`TITLE: ${p.title}`);
            // Find context
            const keywords = ['마감되었습니다', '종료되었습니다', '마감 완료', '접수 종료', '이미 마감'];
            keywords.forEach(kw => {
                if (text.includes(kw.toLowerCase())) {
                    console.log(`KEYWORD: ${kw}`);
                }
            });
        }
    });
}

findAll();
