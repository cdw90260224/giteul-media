
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

async function fixCategories() {
    const env = getEnv();
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
        console.error('Missing Supabase URL or Service Role Key in .env.local');
        return;
    }

    const supabase = createClient(url, key);
    console.log('--- Database Category Migration ---');
    
    // 1. Unify 'AI/테크' synonyms to 'AI/테크 트렌드'
    const synonyms = ['AI/테크', 'Tech', 'AI', 'Technology', 'AI News'];
    for (const syn of synonyms) {
        const { data, error } = await supabase
            .from('posts')
            .update({ category: 'AI/테크 트렌드' })
            .eq('category', syn);
        
        if (error) console.error(`Error updating "${syn}":`, error);
        else console.log(`Processed synonym "${syn}".`);
    }

    console.log('Migration Complete.');
}

fixCategories();
