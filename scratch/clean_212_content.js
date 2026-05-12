const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanContent(postId) {
  const { data: post } = await supabase.from('posts').select('content').eq('id', postId).single();
  if (!post) { console.error('Not found'); return; }

  console.log('=== 원본 content (마지막 500자) ===');
  console.log(post.content.slice(-500));
  
  // 쓰레기 문구 패턴 제거
  let cleaned = post.content;
  
  // "제공된 원문에는 공고의 상세 내용..." 류 문구 제거
  cleaned = cleaned.replace(/제공된 원문에는[^]*?(?=\n#{2,3}\s|\n---|\$)/g, '');
  // "지원대상: 알 수 없음 혜택: 알 수 없음 일정: 알 수 없음" 제거
  cleaned = cleaned.replace(/지원대상:\s*알 수 없음[^\n]*/g, '');
  // "상세 본문 데이터에 일정 정보 없음" 제거
  cleaned = cleaned.replace(/상세 본문[^\n]*없음[^\n]*/g, '');
  // "알 수 없음" 단독 라인 제거
  cleaned = cleaned.replace(/^\s*알 수 없음\s*$/gm, '');
  // 연속 빈 줄 정리
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  console.log('\n=== 정제된 content (마지막 500자) ===');
  console.log(cleaned.slice(-500));
  
  const { error } = await supabase.from('posts').update({ content: cleaned.trim() }).eq('id', postId);
  console.log(error ? `❌ 실패: ${error.message}` : '\n✅ content 정리 완료!');
}

cleanContent(212);
