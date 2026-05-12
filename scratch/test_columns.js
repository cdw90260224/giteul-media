const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumns() {
  // Supabase에서 직접 ALTER TABLE은 못하므로, 
  // 먼저 해당 컬럼이 있는지 확인하고 없으면 insert로 테스트
  const cols = ['target', 'benefits', 'schedule'];
  
  for (const col of cols) {
    // 컬럼 존재 여부 테스트 - update로 null 넣어보기
    const { error } = await supabase
      .from('posts')
      .update({ [col]: 'test' })
      .eq('id', 0);
    
    if (error && error.message.includes('column')) {
      console.log(`❌ Column "${col}" does NOT exist. Needs to be added via Supabase Dashboard.`);
      console.log(`   SQL: ALTER TABLE posts ADD COLUMN ${col} TEXT;`);
    } else {
      console.log(`✅ Column "${col}" exists or update succeeded.`);
    }
  }
}

addColumns();
