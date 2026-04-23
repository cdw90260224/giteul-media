const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkDeadlines() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('posts').select('id, title, deadline_date, category, created_at')
        .order('created_at', {ascending:false});
    
    console.log(`Checking deadlines for ${data.length} posts. Today is ${today}`);
    const expired = data.filter(p => p.deadline_date && p.deadline_date < today);
    
    expired.forEach(p => {
        console.log(`[EXPIRED] ID: ${p.id} | TITLE: ${p.title} | DEADLINE: ${p.deadline_date} | CAT: ${p.category}`);
    });
}

checkDeadlines();
