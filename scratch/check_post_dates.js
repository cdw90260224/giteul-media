const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkPostDates() {
    console.log('--- Recent Posts and their Created At dates ---');
    const { data, error } = await supabase.from('posts').select('id, title, created_at, category').order('created_at', {ascending:false}).limit(10);
    if (error) {
        console.error(error);
        return;
    }
    data.forEach(p => {
        console.log(`[${p.created_at}] ID: ${p.id} | ${p.category} | ${p.title.slice(0, 50)}...`);
    });
}
checkPostDates();
