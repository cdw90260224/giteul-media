import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkSubscribersTable() {
    const { error } = await supabase.from('subscribers').select('email').limit(1);
    if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log('Table "subscribers" DOES NOT exist.');
        } else {
            console.error('Error checking table:', error);
        }
    } else {
        console.log('Table "subscribers" EXISTS.');
    }
}

checkSubscribersTable();
