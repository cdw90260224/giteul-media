const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function deleteTodaysPosts() {
    const todayKST = new Date();
    todayKST.setUTCHours(todayKST.getUTCHours() + 9);
    // Get start of today KST -> UTC
    const startOfTodayUTC = new Date(Date.UTC(todayKST.getUTCFullYear(), todayKST.getUTCMonth(), todayKST.getUTCDate() - 1, 15, 0, 0));
    
    console.log("Checking posts >= ", startOfTodayUTC.toISOString());
    const { data: posts, error: fetchErr } = await supabase
        .from('posts')
        .select('id, title, notice_url, created_at')
        .gte('created_at', startOfTodayUTC.toISOString());
        
    if (fetchErr) {
        console.error("Fetch error:", fetchErr);
        return;
    }
    
    console.log(`Found ${posts.length} posts created today.`);
    posts.forEach(p => console.log(` - ${p.title}\n   [URL: ${p.notice_url}]\n   (${p.created_at})`));

    if (posts.length > 0) {
        const ids = posts.map(p => p.id);
        const { error: delErr } = await supabase
            .from('posts')
            .delete()
            .in('id', ids);
            
        if (delErr) {
            console.error("Delete error:", delErr);
        } else {
            console.log("Deleted successfully.");
        }
    }
}

deleteTodaysPosts();
