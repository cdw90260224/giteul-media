
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

async function check() {
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Fetching AI/Tech posts thumbails...');
    const { data, error } = await supabase.from('posts').select('id, title, category, image_url');
    if (error) {
        console.error(error);
        return;
    }
    
    // Only show ones with AI/Tech or those having "face" related images
    const target = data.filter(p => p.category === 'AI/테크 트렌드');
    console.log(`Found ${target.length} AI/Tech items.`);
    target.forEach(p => {
        console.log(`[${p.id}] ${p.title} -> ${p.image_url}`);
    });
}

check();
