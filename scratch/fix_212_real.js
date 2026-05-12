const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function fixWithRealData(postId) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (!post) { console.error('Not found'); return; }

  console.log(`=== [${post.id}] ${post.title} ===`);
  console.log(`URL: ${post.notice_url}\n`);

  // 상세 페이지 직접 파싱
  const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);

  const extractField = (labels) => {
    let result = null;
    $('dt, th, .tit, label').each((_, el) => {
      const label = $(el).text().replace(/\s+/g, ' ').trim();
      for (const kw of labels) {
        if (label.includes(kw)) {
          const value = $(el).next().text().replace(/\s+/g, ' ').trim();
          if (value && value.length > 2 && (!result || value.length > result.length)) {
            result = value.slice(0, 500);
          }
        }
      }
    });
    return result;
  };

  const target = extractField(['신청대상', '지원대상', '모집대상', '신청자격', '지원자격', '참여대상', '참가자격']);
  const benefits = extractField(['지원내용', '지원규모', '지원금액', '사업내용', '혜택', '지원사항']);
  const schedule = extractField(['접수기간', '신청기간', '모집기간']);

  console.log(`[원본 데이터]`);
  console.log(`  신청대상: ${target || 'NULL'}`);
  console.log(`  지원내용: ${benefits || 'NULL'}`);
  console.log(`  접수기간: ${schedule || 'NULL'}`);

  // DB 업데이트
  const { error } = await supabase.from('posts').update({
    target,
    benefits,
    schedule
  }).eq('id', postId);

  if (error) {
    console.error('\n❌ 업데이트 실패:', error.message);
  } else {
    console.log('\n✅ 원본 데이터로 업데이트 완료!');
  }
}

fixWithRealData(212);
