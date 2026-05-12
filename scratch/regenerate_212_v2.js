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

  // 상세 페이지 딥 크롤링 - 본문 영역만 정밀 추출
  const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // script, style, nav, header, footer 등 노이즈 제거
  $('script, style, nav, header, footer, .gnb, .lnb, .header, .footer').remove();
  
  // 라벨-값 쌍으로 구조화된 데이터 추출
  const structuredData = [];
  $('dt, th').each((_, el) => {
    const label = $(el).text().replace(/\s+/g, ' ').trim();
    const value = $(el).next().text().replace(/\s+/g, ' ').trim();
    if (label && value && value.length > 2) {
      structuredData.push(`[${label}]: ${value.slice(0, 800)}`);
    }
  });
  
  const deepContext = structuredData.length > 0 
    ? structuredData.join('\n\n')
    : $('main, .content, .view, article, .detail').first().text().replace(/\s+/g, ' ').trim().slice(0, 6000);

  console.log(`딥 크롤링: ${deepContext.length}자, 구조화 필드 ${structuredData.length}개\n`);
  console.log('=== 추출된 구조화 데이터 (첫 2000자) ===');
  console.log(deepContext.slice(0, 2000));

  // AI 기사 재생성 — 구조화된 원본 팩트 기반
  const prompt = `당신은 대한민국 기업 지원사업 전문 큐레이터입니다. 

[절대 금지사항]
- "알 수 없음", "정보 없음", "확인 필요", "예상됩니다", "추정됩니다", "추론", "것으로 보입니다" 같은 추측성/면피성 문구를 절대 사용하지 마세요.
- 원문에 있는 팩트만 쓰세요. 없는 정보는 아예 언급하지 마세요.
- 인증 시스템, 로그인 로직, 자바스크립트 코드 관련 내용은 절대 기사에 포함하지 마세요. 이것은 웹페이지 시스템 코드일 뿐, 공고 내용이 아닙니다.

[기사 작성 지침]
- 이미 별도로 지원대상/혜택/일정은 표시하므로, 본문에서는 사업의 핵심 개요, 트랙별 세부사항, 평가 기준, 신청방법, 유의사항 등을 중심으로 작성하세요.
- 마크다운의 H3(###)를 써서 섹션을 나누세요.
- 데이터에 있는 금액, 일정, 자격 등 수치 정보는 반드시 포함하세요.

JSON 구조: { 
  "title": "공고명을 깔끔하게 정제한 제목", 
  "summary": "3줄 이내의 간결한 핵심 요약",
  "content": "마크다운 기사 본문"
}

[K-Startup 공고 원본 데이터]
공고명: ${post.title}
${deepContext}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  let jsonStr = result.response.text().trim();
  if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
  const raw = JSON.parse(jsonStr);

  console.log(`\nAI 생성 완료: ${raw.title}`);
  console.log(`content 길이: ${raw.content.length}자`);
  console.log(`\n=== content 미리보기 ===`);
  console.log(raw.content.slice(0, 800));

  // DB 업데이트
  const summaryPrefix = post.summary?.match(/^\[.*?\]/)?.[0] || '[일반]';
  const { error } = await supabase.from('posts').update({
    title: raw.title || post.title,
    summary: summaryPrefix + ' ' + raw.summary,
    content: raw.content
  }).eq('id', postId);

  console.log(error ? `\n❌ 실패: ${error.message}` : '\n✅ 기사 재생성 완료!');
}

regenerate(212);
