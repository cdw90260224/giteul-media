
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
    console.log('--- Deep Database Category Migration ---');
    
    // 1. Unify all variations
    const allowedStandard = 'AI/테크 트렌드';
    const variations = [
        'ai/tech', 'AI/Tech', 'ai/테크', 'AI/테크', 'Tech', 'AI', 'Technology', 
        'AI/Tech 트렌드', 'ai/tech 트렌드', 'AI/테크트렌드', 'ai/테크트렌드',
        'AI News', 'Tech Trends', 'AI Trends'
    ];

    for (const varName of variations) {
        console.log(`Checking for variations of "${varName}"...`);
        const { data, error } = await supabase
            .from('posts')
            .update({ category: allowedStandard })
            .eq('category', varName);
        
        if (error) console.error(`Error updating "${varName}":`, error);
        else console.log(`Finished processing "${varName}".`);
    }

    // [Crucial Check] Let's list all unique categories currently in DB to see what I missed
    const { data: categories, error: catError } = await supabase
        .from('posts')
        .select('category');
    
    if (catError) {
        console.error('Error fetching current categories:', catError);
    } else {
        const uniqueCats = [...new Set(categories.map(c => c.category))];
        console.log('Current Unique Categories in DB:', uniqueCats);
    }

    console.log('Migration Complete.');
}

fixCategories();
