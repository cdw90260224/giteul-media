
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixTechSectors() {
  console.log('🔍 기술/IT 기사 복구 및 태깅 시작...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, category');

  if (error) return console.error(error);

  let fixCount = 0;

  for (const post of posts) {
    const isTechCategory = ['AI/Tech', 'ai/tech', 'tech', 'Tech', 'AI/테크 트렌드'].includes(post.category);
    const hasTechKeywords = ['소프트웨어', 'it', 'ai', '인공지능', '클라우드', '빅데이터', '보안', '앱', '웹', '플랫폼', '디지털', '딥러닝'].some(kw => 
      (post.title + ' ' + (post.summary || '')).toLowerCase().includes(kw)
    );

    // 이미 다른 분야 태그가 달려있으면 건너뜀 (이미 세부 분류 완료된 경우)
    if (post.summary?.match(/^\[(바이오|에너지|제조|문화|커머스|글로벌|농업|소상공인)\]/)) continue;

    if (isTechCategory || hasTechKeywords) {
      // 이미 [기술/IT] 태그가 있는지 확인
      if (post.summary?.startsWith('[기술/IT]')) continue;

      let newSummary = post.summary || '';
      // 다른 태그가 있다면(예: [일반]) 교체, 없으면 삽입
      if (newSummary.startsWith('[')) {
        newSummary = newSummary.replace(/^\[.*?\]/, '[기술/IT]');
      } else {
        newSummary = `[기술/IT] ${newSummary}`;
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ summary: newSummary })
        .eq('id', post.id);

      if (!updateError) fixCount++;
    }
  }

  console.log(`✅ 총 ${fixCount}개의 기사가 [기술/IT] 분야로 명확히 분류되었습니다.`);
}

fixTechSectors();
