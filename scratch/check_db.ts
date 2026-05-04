import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function checkColumns() {
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('Error or no data:', error);
  }
}

checkColumns();
