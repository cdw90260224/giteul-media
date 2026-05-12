const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function regenerate(postId) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (!post) { console.error('Not found'); return; }

  console.log(`[${post.id}] ${post.title}`);
  console.log(`URL: ${post.notice_url}\n`);

  // 상세 페이지 딥 크롤링
  const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);
  const deepContext = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);
  
  console.log(`딥 크롤링: ${deepContext.length}자 추출\n`);

  // AI에게 딥 크롤링 본문과 함께 기사 재생성
  const prompt = `당신은 대한민국 기업 지원사업 전문 큐레이터입니다. 

[영구 지침]
1. 현재 연도는 2026년입니다.
2. 마감일: ${post.deadline_date || '알 수 없음'}
3. '상세 전략 리포트'나 '기자의 시선'을 절대 작성하지 마세요.
4. 카테고리: 정부지원공고
5. [금지사항] "알 수 없음", "정보 없음", "확인 필요", "예상됩니다", "추정됩니다" 같은 추측성/면피성 문구를 절대 사용하지 마세요. 원문에 있는 팩트만 쓰세요.

아래 딥 크롤링 데이터를 기반으로 기사 본문(content)을 작성하세요.
content는 마크다운으로 작성하되, 이미 별도로 지원대상/혜택/일정을 표시하므로 본문에서는 사업의 핵심 개요, 트랙별 세부사항, 신청방법, 유의사항 등 부가 정보를 중심으로 작성하세요.

JSON 구조: { 
  "title": "공고명을 깔끔하게 정제한 제목", 
  "summary": "3줄 이내의 간결한 핵심 요약",
  "content": "마크다운 기사 본문"
}

[상세 본문 데이터]
${deepContext}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  let jsonStr = result.response.text().trim();
  if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
  const raw = JSON.parse(jsonStr);

  console.log(`AI 생성 완료: ${raw.title}`);
  console.log(`content 길이: ${raw.content.length}자`);
  console.log(`\n=== content 미리보기 (첫 500자) ===`);
  console.log(raw.content.slice(0, 500));

  // DB 업데이트
  const { error } = await supabase.from('posts').update({
    title: raw.title || post.title,
    summary: post.summary.match(/^\[.*?\]/) ? post.summary.match(/^\[.*?\]/)[0] + ' ' + raw.summary : raw.summary,
    content: raw.content
  }).eq('id', postId);

  console.log(error ? `\n❌ 실패: ${error.message}` : '\n✅ 기사 재생성 및 업데이트 완료!');
}

regenerate(212);
