
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    });
    return env;
}

async function run() {
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('posts').select('id, title, category, created_at').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error(error);
        return;
    }
    console.log('--- Last 5 Posts ---');
    data.forEach(p => console.log(`[${p.created_at}] [${p.category}] ${p.title} (ID: ${p.id})`));
}
run();
