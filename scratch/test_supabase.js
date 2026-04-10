const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function test() {
    console.log('Testing Supabase Connection...');
    const { data, count, error } = await supabase.from('posts').select('id', { count: 'exact', head: true });
    if (error) {
        console.error('Supabase Error:', error);
    } else {
        console.log('Supabase Connection OK. Total Posts:', count);
    }
}

test();
