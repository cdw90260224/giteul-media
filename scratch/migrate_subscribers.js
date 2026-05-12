const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const MAPPING = {
    '기술/IT': ['AI/빅데이터', 'SaaS/플랫폼'],
    '농업': ['푸드/애그테크'],
    '소상공인': ['SaaS/플랫폼']
};

async function migrateSubscribers() {
    console.log('--- Migrating subscriber interests to new 9-sector system ---');
    const { data: subscribers, error } = await supabase.from('subscribers').select('*');
    
    if (error) {
        console.error('Error fetching subscribers:', error);
        return;
    }

    for (const sub of subscribers) {
        let newInterests = [...(sub.interests || [])];
        let changed = false;

        Object.keys(MAPPING).forEach(oldKey => {
            if (newInterests.includes(oldKey)) {
                // Remove old key
                newInterests = newInterests.filter(k => k !== oldKey);
                // Add new keys
                MAPPING[oldKey].forEach(newKey => {
                    if (!newInterests.includes(newKey)) {
                        newInterests.push(newKey);
                    }
                });
                changed = true;
            }
        });

        if (changed) {
            console.log(`Updating ${sub.email}: [${sub.interests}] -> [${newInterests}]`);
            const { error: updateError } = await supabase
                .from('subscribers')
                .update({ interests: newInterests })
                .eq('id', sub.id);
            
            if (updateError) console.error(`Failed to update ${sub.email}:`, updateError);
        }
    }
    console.log('Migration finished.');
}

migrateSubscribers();
