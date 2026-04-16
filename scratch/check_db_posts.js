const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPosts() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('posts').select('title, category, created_at').order('created_at', { ascending: false }).limit(5);
    
    if (error) {
        console.error('Error fetching posts:', error.message);
        return;
    }
    
    console.log('--- Latest 5 Posts in DB ---');
    data.forEach(p => {
        console.log(`[${p.category}] ${p.title} (${p.created_at})`);
    });
}

checkPosts();
