import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkColumns() {
    const { data, error } = await supabase.from('subscribers').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log('Columns found:', Object.keys(data[0] || { message: 'Table is empty' }));
    }
}

checkColumns();
