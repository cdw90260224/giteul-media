const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkTodayTasks() {
    const { data: posts } = await supabase.from('posts')
        .select('title, notice_url, created_at')
        .order('created_at', {ascending:false})
        .limit(20);
    
    console.log('--- Latest 20 Posts ---');
    posts.forEach(p => {
        console.log(`[${p.created_at}] ${p.title}`);
    });

    const targetUrl = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=177178';
    const { data: match } = await supabase.from('posts').select('id').eq('notice_url', targetUrl);
    console.log(`\nChecking for SN 177178: ${match?.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
}

checkTodayTasks();
