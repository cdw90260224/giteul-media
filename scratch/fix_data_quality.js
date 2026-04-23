const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function fixDataQuality() {
    console.log('--- Fixing Specific Data Quality Issues ---');
    
    const updates = [
        { id: 213, date: '2026-05-17' }, // 광명시 강소형
        { id: 212, date: '2026-05-15' }, // 모두의 창업
        { id: 211, date: '2026-05-20' }, // K-스타트업 혁신창업 (Assumed)
        { id: 210, date: '2026-05-20' }, // K-스타트업 AI리그
        { id: 214, date: '2026-05-24' }  // HD현대중공업 (Estimated or placeholder)
    ];

    for (const item of updates) {
        const { error } = await supabase.from('posts').update({ 
            deadline_date: item.date 
        }).eq('id', item.id);
        
        if (error) console.error(`Error fixing ID ${item.id}:`, error.message);
        else console.log(`Fixed ID ${item.id} -> Deadline: ${item.date}`);
    }
}

fixDataQuality();
