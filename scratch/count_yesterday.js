const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function countYesterday() {
    // Yesterday was May 5th, 2026
    const start = '2026-05-05T00:00:00Z';
    const end = '2026-05-05T23:59:59Z';
    
    const { data, count, error } = await supabase
        .from('posts')
        .select('id, category, title, created_at', { count: 'exact' })
        .gte('created_at', start)
        .lte('created_at', end);
        
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(`Total posts registered on May 5th (UTC): ${count}`);
    if (data.length > 0) {
        const categories = data.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
        console.log('Categories:', categories);
        console.log('Sample titles:');
        data.slice(0, 5).forEach(p => console.log(`- [${p.category}] ${p.title} (${p.created_at})`));
    }
}

countYesterday();
