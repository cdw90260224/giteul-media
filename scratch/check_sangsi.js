const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function check() {
  const { data } = await supabase.from('posts').select('id, title, deadline_date').eq('deadline_date', '상시/확인');
  console.log('Count:', data.length);
  if (data.length > 0) console.log(data[0]);
}
check();
