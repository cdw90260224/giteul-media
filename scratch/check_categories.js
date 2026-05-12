const { createClient } = require('@supabase/supabase-client');
const fs = require('fs');

async function check() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
    const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
    const supabase = createClient(url, key);

    const { data, error } = await supabase.from('articles').select('category').limit(20);
    if (error) {
        console.error(error);
        return;
    }
    fs.writeFileSync('categories_debug.txt', JSON.stringify(data, null, 2));
}

check();
