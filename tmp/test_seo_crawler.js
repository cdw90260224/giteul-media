const cheerio = require('cheerio');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Accept': 'text/html',
};

async function testSeoPrompt() {
    console.log("▶ [STEP 1] Fetching details for SEO Sample...");
    // Just fetch one known ongoing biz pbanc for realistic data
    const listRes = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await listRes.text();
    const $ = cheerio.load(html);
    
    let url = null;
    let agencyName = '창업진흥원';
    $('li, .card, .item, .box').each((_, el) => {
        const title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
        const snMatch = ($(el).html() || '').match(/go_view\('?(\d+)'?\)/);
        if (title && snMatch && !url) {
            url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`;
            const text = $(el).text().replace(/\s+/g, ' ');
            agencyName = text.match(/(?:소관부처|주관기관|기관명)\s*([가-힣A-Za-z0-9]+원?)/)?.[1] ?? '창업진흥원';
        }
    });

    if(!url) return console.log("No data");

    const detail = await fetch(url, { headers: FETCH_HEADERS });
    const detailText = await detail.text();
    const $d = cheerio.load(detailText);
    
    $d('script, style, nav, footer').remove();
    const rawContent = $d('.content, #container, main, .board_view').text().replace(/\s+/g, ' ').trim();
    
    // Check attachments
    const attachments = [];
    $d('a').each((_, el) => {
        const fname = $d(el).text().trim();
        const onclick = $d(el).attr('onclick') || '';
        if (fname.toLowerCase().includes('.hwp') || fname.toLowerCase().includes('.pdf')) {
            const synapMatch = onclick.match(/fn_synapView\('([^']+)'/);
            const previewUrl = synapMatch ? `https://www.k-startup.go.kr/common/synap/preview.do?fileSn=${synapMatch[1]}` : null;
            if(!attachments.find(x => x.name===fname)) attachments.push({ name: fname, previewUrl });
        }
    });

    let deepContext = `[상세 본문]\n${rawContent.slice(0, 8000)}\n`;
    if (attachments.length > 0) {
        deepContext += `\n[첨부파일 메타데이터]\n`;
        attachments.forEach(a => deepContext += `- 파일명: ${a.name} (미리보기 연동: ${a.previewUrl ? 'O' : 'X'})\n`);
    }

    const keyword = `${agencyName} 창업 2026`;
    
    const prompt = `
당신은 대한민국 최고 수준의 창업 정책 분석가 및 전문 기자입니다.
제공된 공고문 딥 크롤링 데이터(본문 및 첨부 메타데이터)를 분석하여 'SEO 최적화 규칙'을 완벽하게 준수하는 기사를 작성하십시오.

[SEO 최적화 및 기사 발행 필수 규칙]
1. 제목: 첫 줄은 반드시 단 하나의 마크다운 H1 (# ) 태그를 사용하고 핵심 키워드(기관명+사업명+2026)를 전진 배치할 것.
2. 요약: 도입부에 핵심 키워드를 포함해 150자 이내로 요약문(Summary) 작성.
3. 목차: 본문 단락(H2)으로 연결되는 목차 리스트를 반드시 상단 요약문 바로 아래에 배치할 것.
4. H2/H3 섹션: 정보 위계를 위해 모든 대주제 소제목은 H2 태그(## )를 사용하고, 필요시 하위 정보는 H3(### )를 사용할 것.
5. 데이터 시각화 (강제사항): 수집된 '상세 데이터'(상세 일정, 배점 기준표, 커리큘럼, 지원 자격, 사업비, 선발 인원 등)는 단 한 줄도 누락시키지 말고 무조건 마크다운 표(Table) 형식으로 변환하여 기재할 것! (단순 텍스트 나열 절대 금지)
6. 키워드 밀도: 자연스러운 문맥 안에서 핵심 키워드("${keyword}")를 본문 전체에 5~7회 반복 노출할 것.
7. 이미지 Alt Text: 기사 내 이미지를 삽입할 경우 반드시 [![핵심키워드_관련설명](이미지주소)] 형태로 Alt Text를 꼼꼼히 작성할 것. (가상의 이미지 주소 https://example.com/image.png 사용 가능)
8. 내부 링크: 기사 하단에 본 카테고리(정부지원공고)와 관련된 가상의 관련 뉴스 2개 링크를 '관련 뉴스' 섹션(H2)으로 추가할 것.

[데이터 소스 (절대 누락 금지, 모두 표로 변환할 것)]:
${deepContext.slice(0, 10000)}

출력 포맷: 반드시 응답은 순수 Markdown 텍스트로만 해라. JSON 등 포장 금지. 시작과 끝에 백틱(\`\`\`) 금지.
`;

    console.log(`▶ [STEP 2] Gemini 2.5 SEO 최적화 기사 프롬프트 전송...`);
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const result = await geminiRes.json();
    let extracted = result.candidates?.[0]?.content?.parts?.[0]?.text || "API Error: " + JSON.stringify(result);

    console.log("\n================[SEO 최적화 기사 샘플 결과]================\n");
    console.log(extracted);
    console.log("\n===========================================================\n");
}

testSeoPrompt();
