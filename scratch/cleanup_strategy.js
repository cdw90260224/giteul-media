const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function cleanUpToday() {
    const ids = [210, 211, 212, 213, 214];
    console.log(`Cleaning up ${ids.length} posts to remove pre-generated strategy...`);
    
    for (const id of ids) {
        const { data } = await supabase.from('posts').select('id, content, title').eq('id', id).single();
        if (data && data.content.includes('기자의 시선')) {
            // Remove everything from "### ✒️ 기자의 시선" or similar
            let newContent = data.content.split('### ✒️ 기자의 시선')[0].split('### 🎯 합격을 위한')[0].trim();
            
            // Further cleaning if needed
            newContent = newContent.replace(/합격을 부르는 인사이트/g, '').trim();

            await supabase.from('posts').update({
                content: newContent,
                title: data.title.replace(/\[전략\]\s*/g, '')
            }).eq('id', id);
            console.log(`Cleaned ID: ${id}`);
        }
    }
}

cleanUpToday();
