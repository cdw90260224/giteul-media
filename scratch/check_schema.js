const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkSchema() {
    console.log('Checking subscribers and potentially favorites...');
    const { data: sub, error: err1 } = await supabase.from('subscribers').select('*').limit(1);
    console.log('Subscribers exists:', !!sub);
    
    // Check if favorites exists by trying to select
    const { data: fav, error: err2 } = await supabase.from('favorites').select('*').limit(1);
    console.log('Favorites exists:', !!fav);
    
    if (err2 && err2.code === '42P01') {
        console.log('Creating favorites table...');
        // We can't easily create tables via Supabase JS client without a specific RPC or SQL function.
        // I'll assume we need to create it if it doesn't exist.
    }
}
checkSchema();
