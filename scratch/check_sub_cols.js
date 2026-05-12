const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function checkSubscribers() {
    console.log('--- Inspecting subscribers table ---');
    const { data, error } = await supabase.from('subscribers').select('*').limit(1);
    if (error) {
        console.error('Error fetching subscribers:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        console.log('Sample data:', data[0]);
    } else {
        console.log('No subscribers found, trying to get table definition via rpc if exists or just guessing...');
        // Try to insert a dummy to see error if it fails
    }
}
checkSubscribers();
