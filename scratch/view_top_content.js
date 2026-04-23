const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function viewTopContent() {
    const { data } = await supabase.from('posts').select('id, title, content, summary').order('created_at', {ascending:false}).limit(5);
    data.forEach(p => {
        console.log(`\n==================================================`);
        console.log(`ID: ${p.id} | TITLE: ${p.title}`);
        console.log(`SUMMARY: ${p.summary}`);
        console.log(`--------------------------------------------------`);
        console.log(p.content);
        console.log(`==================================================\n`);
    });
}

viewTopContent();
