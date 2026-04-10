const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkLatest() {
    const { data } = await supabase.from('posts').select('title, category, created_at').order('created_at', {ascending:false}).limit(10);
    console.log(JSON.stringify(data, null, 2));
}

checkLatest();
