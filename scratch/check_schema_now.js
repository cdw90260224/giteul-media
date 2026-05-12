const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  if (error) { console.error(error); return; }
  if (data && data[0]) {
    console.log('=== 현재 posts 테이블 컬럼 ===');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n=== 샘플 데이터 ===');
    console.log(JSON.stringify(data[0], null, 2));
  }
}
check();
