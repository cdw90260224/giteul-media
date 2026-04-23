const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function check() {
    const { data, error } = await supabase.from('posts').select('id, title, deadline_date, category').order('id', {ascending: false}).limit(15);
    if (error) console.error(error);
    else console.table(data);
}
check();
