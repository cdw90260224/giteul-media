const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function fixDeadlines() {
  // 마감일이 NULL인 정부지원공고만 가져오기
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, notice_url, deadline_date')
    .eq('category', '정부지원공고')
    .is('deadline_date', null);

  if (error) { console.error(error); return; }
  console.log(`=== 마감일 NULL인 공고 ${posts.length}건 수정 시작 ===\n`);

  let fixed = 0;
  let failed = 0;

  for (const post of posts) {
    if (!post.notice_url) {
      console.log(`[${post.id}] SKIP: notice_url 없음`);
      failed++;
      continue;
    }

    // K-Startup 목록 페이지에서 SN 추출
    const snMatch = post.notice_url.match(/pbancSn=(\d+)/);
    if (!snMatch) {
      console.log(`[${post.id}] SKIP: SN 추출 불가 - ${post.notice_url}`);
      failed++;
      continue;
    }

    try {
      console.log(`[${post.id}] Fetching: ${post.title.slice(0, 40)}...`);
      const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
      const html = await res.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text().replace(/\s+/g, ' ');

      let deadline = null;

      // 1. 접수기간에서 종료일 추출
      const receptionMatch = bodyText.match(/접수기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
      if (receptionMatch) {
        deadline = `${receptionMatch[4]}-${receptionMatch[5]}-${receptionMatch[6]}`;
      }

      // 2. 신청기간에서도 시도
      if (!deadline) {
        const applyMatch = bodyText.match(/신청기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
        if (applyMatch) {
          deadline = `${applyMatch[4]}-${applyMatch[5]}-${applyMatch[6]}`;
        }
      }

      // 3. 모집기간에서도 시도
      if (!deadline) {
        const recruitMatch = bodyText.match(/모집기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
        if (recruitMatch) {
          deadline = `${recruitMatch[4]}-${recruitMatch[5]}-${recruitMatch[6]}`;
        }
      }

      if (deadline) {
        const { error: updateErr } = await supabase
          .from('posts')
          .update({ deadline_date: deadline })
          .eq('id', post.id);

        if (updateErr) {
          console.log(`  ❌ DB 업데이트 실패: ${updateErr.message}`);
          failed++;
        } else {
          console.log(`  ✅ 마감일 수정: ${deadline}`);
          fixed++;
        }
      } else {
        console.log(`  ⚠️ 상세 페이지에서도 마감일 찾지 못함`);
        failed++;
      }

      await sleep(1500); // IP 차단 방지
    } catch (e) {
      console.log(`  ❌ 에러: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`수정: ${fixed}건 | 실패: ${failed}건 | 총: ${posts.length}건`);
}

fixDeadlines();
