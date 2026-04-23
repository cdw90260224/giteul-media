
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function rebalanceData() {
  console.log('🔄 소상공인 vs 기술/IT 데이터 재조정 시작...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, category');

  if (error) return console.error(error);

  let movedCount = 0;

  for (const post of posts) {
    const summary = post.summary || '';
    const title = post.title || '';
    const fullText = (title + ' ' + summary).toLowerCase();

    // 1. 현재 [소상공인] 태그가 달려있는 기사 중 AI/기술 성격이 있는 것들 추출
    if (summary.startsWith('[소상공인]')) {
      const techKeywords = ['ai', '인공지능', '데이터', '소프트웨어', 'it', '기술개발', '딥러닝', '클라우드', 'gpt', '자동화'];
      const isActuallyTech = techKeywords.some(kw => fullText.includes(kw));

      if (isActuallyTech) {
        // [기술/IT]로 변경
        const newSummary = summary.replace('[소상공인]', '[기술/IT]');
        const { error: updateError } = await supabase
          .from('posts')
          .update({ summary: newSummary })
          .eq('id', post.id);
        
        if (!updateError) movedCount++;
      }
    }
  }

  console.log(`✅ ${movedCount}개의 AI 기술 기사가 [소상공인]에서 [기술/IT]로 정상 이관되었습니다.`);
}

rebalanceData();
