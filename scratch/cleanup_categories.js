const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function cleanupCategories() {
    console.log('--- Cleaning up "Strategy" category to "정부지원공고" ---');
    
    // Change category for all posts that are currently 'Strategy' or 'strategy'
    const { data: posts } = await supabase.from('posts').select('id, category').ilike('category', 'strategy');
    
    if (posts && posts.length > 0) {
        console.log(`Found ${posts.length} posts with Strategy category. Converting...`);
        for (const post of posts) {
            await supabase.from('posts').update({ category: '정부지원공고' }).eq('id', post.id);
        }
        console.log('Conversion complete.');
    } else {
        console.log('No strategy category posts found.');
    }
}

cleanupCategories();
