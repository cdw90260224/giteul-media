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

async function reprocess(postId) {
  // 1. 현재 데이터 확인
  const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (error || !post) { console.error('Post not found:', error); return; }
  
  console.log(`=== 현재 상태: [${post.id}] ${post.title} ===`);
  console.log(`target: ${post.target || 'NULL'}`);
  console.log(`benefits: ${post.benefits || 'NULL'}`);
  console.log(`schedule: ${post.schedule || 'NULL'}`);
  console.log(`deadline: ${post.deadline_date || 'NULL'}`);
  console.log(`notice_url: ${post.notice_url}`);
  console.log('');

  // 2. 상세 페이지 딥 크롤링
  console.log('[STEP 1] 상세 페이지 딥 크롤링...');
  let deepContext = '';
  let confirmedDeadline = post.deadline_date;
  
  if (post.notice_url) {
    try {
      const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
      const html = await res.text();
      const $ = cheerio.load(html);
      const rawContent = $('body').text().replace(/\s+/g, ' ').trim();
      deepContext = rawContent.slice(0, 8000);
      
      // 마감일 재확인
      if (!confirmedDeadline) {
        const receptionMatch = rawContent.match(/접수기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
        if (receptionMatch) {
          confirmedDeadline = `${receptionMatch[4]}-${receptionMatch[5]}-${receptionMatch[6]}`;
        }
      }
      console.log(`[STEP 1] ✅ 딥 크롤링 완료 (${deepContext.length}자)`);
      console.log(`[STEP 1] 마감일: ${confirmedDeadline}`);
    } catch (e) {
      console.warn('[STEP 1] ❌ 딥 크롤링 실패:', e.message);
    }
  }

  // 3. 새 프롬프트로 AI 분석
  console.log('\n[STEP 2] Gemini 분석 시작...');
  
  const SECTORS = {
    '농업': ['농식품', '스마트팜', '귀농', '축산', '농수산', '농촌'],
    '기술/IT': ['AI', '플랫폼', '클라우드', '딥테크', '빅데이터', '인공지능', '소프트웨어', 'SW', 'IT', '기술개발', '테크', '디지털'],
    '소상공인': ['자영업', '시장', '소상공인', '로컬', '전통시장', '골목상권', '상점', '상인']
  };
  
  let sector = '일반';
  const fullText = post.title + ' ' + deepContext;
  for (const [s, keywords] of Object.entries(SECTORS)) {
    if (keywords.some(kw => fullText.includes(kw))) { sector = s; break; }
  }

  const prompt = `당신은 대한민국 기업 지원사업 전문 큐레이터입니다. 

[최우선 지침 - 정보 추출 정확도]
본문의 데이터를 분석할 때, '지원 대상(자격)', '지원 혜택(금액/규모)', '접수 일정'을 최우선으로 분석하여, 절대로 '정보 없음'이 나오지 않도록 하십시오. 원문에 해당 정보가 명시되어 있지 않더라도, 공고의 성격과 맥락을 기반으로 합리적으로 추론하여 반드시 채워 넣으십시오.

[영구 지침]
1. 현재 연도는 2026년입니다. 모든 날짜 판단의 기준은 2026년입니다.
2. 마감일자(D-Day)는 서비스 신뢰도의 핵심입니다. 추출된 마감일 [${confirmedDeadline || '알 수 없음'}] 이 있다면 반드시 사수하세요.
3. 초기 크롤링 단계에서는 '상세 전략 리포트'나 '기자의 시선'을 절대 작성하지 마세요.
4. 카테고리는 반드시 '정부지원공고'로 설정하세요.

제공된 원문에서 핵심 정보만 추출하여 간결한 요약 보고서를 작성하세요.

반드시 다음 JSON 형식을 엄격히 준수하여 응답하세요.
JSON 구조: { 
  "title": "공고명을 깔끔하게 정제한 제목", 
  "summary": "3줄 이내의 간결한 요약", 
  "category": "정부지원공고", 
  "content": "마크다운 형식의 기본 공고 정보 (지원대상, 혜택, 일정)", 
  "deadline": "YYYY-MM-DD (날짜를 찾을 수 없는 경우에만 null)", 
  "sector": "${sector}", 
  "target": "지원 대상/자격 요건을 1~2문장으로 명확히 기술 (예: '예비창업자 및 창업 3년 이내 기업')",
  "benefits": "지원 혜택/규모를 1~2문장으로 명확히 기술 (예: '최대 1억원 사업화 자금 + 멘토링 지원')",
  "schedule": "핵심 일정을 1문장으로 기술 (예: '접수: 05.07~05.18 / 선정: 06월 중')"
}

입력 원천 데이터: ${post.title}
공고URL: ${post.notice_url}

[상세 본문 데이터]
${deepContext}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
    const raw = JSON.parse(jsonStr);

    console.log(`[STEP 2] ✅ AI 분석 완료`);
    console.log(`  title: ${raw.title}`);
    console.log(`  target: ${raw.target}`);
    console.log(`  benefits: ${raw.benefits}`);
    console.log(`  schedule: ${raw.schedule}`);
    console.log(`  deadline: ${raw.deadline}`);

    // 4. DB 업데이트
    console.log('\n[STEP 3] DB 업데이트...');
    const updateData = {
      title: raw.title || post.title,
      summary: `[${raw.sector || sector}] ` + raw.summary,
      content: raw.content || post.content,
      target: raw.target || null,
      benefits: raw.benefits || null,
      schedule: raw.schedule || null,
      deadline_date: confirmedDeadline || post.deadline_date
    };

    const { error: updateErr } = await supabase.from('posts').update(updateData).eq('id', postId);
    if (updateErr) {
      console.error('[STEP 3] ❌ 업데이트 실패:', updateErr.message);
    } else {
      console.log('[STEP 3] ✅ 업데이트 완료!');
      console.log('\n=== 최종 결과 ===');
      console.log(`target: ${updateData.target}`);
      console.log(`benefits: ${updateData.benefits}`);
      console.log(`schedule: ${updateData.schedule}`);
    }
  } catch (e) {
    console.error('[STEP 2] ❌ AI 분석 실패:', e.message);
  }
}

reprocess(212);
