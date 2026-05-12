const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // 어제~오늘 등록된 기사 조회
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, category, deadline_date, created_at, summary')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  console.log(`=== 최근 등록 기사 ${data.length}건 ===\n`);
  
  let nullCount = 0;
  for (const p of data) {
    const deadlineStatus = p.deadline_date ? p.deadline_date : '❌ NULL (미정)';
    if (!p.deadline_date) nullCount++;
    console.log(`[${p.id}] ${p.title}`);
    console.log(`   카테고리: ${p.category} | 마감: ${deadlineStatus}`);
    console.log(`   등록일: ${p.created_at}`);
    console.log('');
  }
  
  console.log(`\n--- 요약 ---`);
  console.log(`전체: ${data.length}건 | 미정(NULL): ${nullCount}건 | 정상: ${data.length - nullCount}건`);
}

check();
