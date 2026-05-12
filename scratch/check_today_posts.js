const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkToday() {
    // Today is May 6th, 2026
    const start = '2026-05-06T00:00:00+09:00'; // KST
    
    const { data, count, error } = await supabase
        .from('posts')
        .select('id, category, title, created_at', { count: 'exact' })
        .gte('created_at', start);
        
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(`Total posts registered today (May 6th KST): ${count}`);
    if (data.length > 0) {
        console.table(data);
    } else {
        console.log('No posts registered today yet.');
    }
}

checkToday();
