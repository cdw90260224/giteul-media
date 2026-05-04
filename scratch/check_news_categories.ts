import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkNews() {
    const { data, error } = await supabase.from('posts').select('id, category, title').limit(20);
    if (error) {
        console.error(error);
        return;
    }
    console.log('Categories found:', [...new Set(data.map(i => i.category))]);
    console.log('Sample articles:', data.map(i => `[${i.category}] ${i.title}`));
}

checkNews();
