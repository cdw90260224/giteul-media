const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function findSpecificHallucination() {
    const { data } = await supabase.from('posts').select('id, title, summary, content, created_at')
        .or('content.ilike.%마감되었습니다%,content.ilike.%종료되었습니다%,content.ilike.%마감 완료%,content.ilike.%접수 종료%,content.ilike.%이미 마감%')
        .order('created_at', {ascending:false});
    
    console.log(`Found ${data.length} suspicious posts.`);
    data.forEach(p => {
        console.log(`\nID: ${p.id} [${p.created_at}]`);
        console.log(`TITLE: ${p.title}`);
        // Find the snippet
        const terms = ['마감되었습니다', '종료되었습니다', '마감 완료', '접수 종료', '이미 마감'];
        for (const term of terms) {
            const index = p.content.indexOf(term);
            if (index > -1) {
                console.log(`>>> CLIP (${term}): ...${p.content.slice(index - 50, index + 50)}...`);
            }
        }
    });
}

findSpecificHallucination();
