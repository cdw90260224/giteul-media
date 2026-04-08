const cheerio = require('cheerio');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
};

async function runDeepCrawler() {
    console.log("▶ [STEP 1] K-Startup 공고 리스트 탐색...");
    const xs = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await xs.text();
    const $ = cheerio.load(html);
    
    let url = null;
    $('li, .card, .item, .box').each((_, el) => {
        const title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
        const snMatch = ($(el).html() || '').match(/go_view\('?(\d+)'?\)/);
        // Grab the first one
        if (title && snMatch && !url) {
            url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`;
        }
    });

    console.log(`▶ [STEP 2] 상세 페이지 딥 크롤링 진입 URL: ${url}`);
    
    // 1. Fetch Detail Page
    const detail = await fetch(url, { headers: FETCH_HEADERS });
    let detailText = await detail.text();
    const $d = cheerio.load(detailText);
    
    $d('script, style, nav, footer').remove();
    const rawContent = $d('.content, #container, main, .board_view').text().replace(/\s+/g, ' ').trim();
    
    // 2. Extract Attachments and Look for Preview Links (Synap Viewer)
    const attachments = [];
    let hasHWPorPDF = false;
    $d('a').each((_, el) => {
        const fname = $d(el).text().trim();
        const href = $d(el).attr('href') || '';
        const onclick = $d(el).attr('onclick') || '';
        
        if (fname.toLowerCase().includes('.hwp') || fname.toLowerCase().includes('.pdf')) {
            hasHWPorPDF = true;
            // Catch synap viewer or download endpoint
            const synapMatch = onclick.match(/fn_synapView\('([^']+)'/);
            const previewUrl = synapMatch ? `https://www.k-startup.go.kr/common/synap/preview.do?fileSn=${synapMatch[1]}` : null;
            attachments.push({ name: fname, previewUrl });
        }
    });

    console.log(`▶ [STEP 3] 첨부파일 스캔 결과: ${attachments.length > 0 ? attachments.map(a => a.name).join(', ') : '없음'}`);
    
    // 3. Assemble Deep Context Structure
    let deepContext = `[상세 본문]\n${rawContent.slice(0, 10000)}\n`;
    if (attachments.length > 0) {
        deepContext += `\n[첨부파일 메타데이터 (HWP/PDF 파싱 파이프라인 대기중)]\n`;
        attachments.forEach(a => {
            deepContext += `- 파일명: ${a.name} (미리보기 연동: ${a.previewUrl ? 'O' : 'X'})\n`;
        });
        deepContext += `(시스템 지시: 파일 내재 텍스트에서 배점/커리큘럼 정보를 우선 탐색할 것)\n`;
    }

    console.log(`▶ [STEP 4] Gemini 2.5 딥 추출 프롬프트 전송...`);
    
    const prompt = `
당신은 대한민국 최고 수준의 창업 정책 분석가입니다.
제공된 공고문 딥 크롤링 데이터(본문 및 첨부 메타데이터)를 분석하여 아래 요구된 수치와 표 데이터를 "반드시" 추출하십시오.

[요구 데이터]
1. [배점 기준표]: 평가 항목과 배점 수치 (서류/발표 등). 내용이 없다면 반드시 정확히 "배점 정보 미확인"이라고 작성할 것.
2. [상세 커리큘럼]: 교육/멘토링 프로그램의 회차별 상세 내용. 없다면 "미확인"
3. [수치 데이터 (숫자만 집중 추출)]:
   - 사업비/지원금 규모: (예: 5,000만원) (없으면 미확인)
   - 교육/멘토링 시간: (예: 50시간) (없으면 미확인)
   - 선발 규모(인원/팀): (예: 30명) (없으면 미확인)

데이터 소스:
${deepContext}
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const result = await geminiRes.json();
    let extracted = result.candidates?.[0]?.content?.parts?.[0]?.text || "API Error";

    console.log("\n================[최종 딥 크롤링 및 파싱 결과]================\n");
    console.log(extracted);
    console.log("\n===========================================================\n");
    
    // Verification checking
    if (extracted.includes("배점 정보 미확인")) {
        console.log("🚨 [SYSTEM LOG] 배점 정보 미확인 - 해당 공고는 첨부파일 내 배점표 심층 파싱(Synap Viewer 연동) 추가 확인 요망!");
    } else {
        console.log("✅ [SYSTEM LOG] 배점 및 수치 데이터 추출 성공!");
    }
}

runDeepCrawler();
