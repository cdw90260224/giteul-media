import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // --- SCRAPING LOGIC ---
    const potentialItems: any[] = [];

    // 1. K-Startup
    try {
        const ksRes = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
        const ksHtml = await ksRes.text();
        const $ks = cheerio.load(ksHtml);
        
        $ks('li, .card, .item, .box').each((_, el) => {
            const text = $ks(el).text().replace(/\s+/g, ' ');
            const html = $ks(el).html() || '';
            const title = $ks(el).find('.tit, p.tit, h4, strong').first().text().trim();
            const snMatch = html.match(/go_view\('?(\d+)'?\)/);
            if (title && snMatch) {
                potentialItems.push({
                    title,
                    agency: text.match(/(?:소관부처|주관기관|기관명)\s*([가-힣A-Za-z0-9]+원?)/)?.[1] ?? '창업진흥원',
                    notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`,
                    category: '정부지원공고'
                });
            }
        });

        if (potentialItems.filter(i => i.category === '정부지원공고').length === 0) {
            await supabase.from('posts').insert([{
                title: `[자동 수집 장애] K-Startup 공고 구조 변경 감지 (데이터 0건)`,
                category: '시스템알림',
                content: `<p>K-Startup에서 데이터를 가져오지 못했습니다. 크롤링/파싱 로직을 점검해주세요.</p>`,
                notice_url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
                created_at: new Date().toISOString(),
            }]);
        }
    } catch (scrapingErr: any) {
        await supabase.from('posts').insert([{
            title: `[자동 수집 오류] K-Startup 접속 실패`,
            category: '시스템알림',
            content: `<p>K-Startup 접속 중 통신 오류가 발생했습니다: ${scrapingErr.message}</p>`,
            notice_url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
            created_at: new Date().toISOString(),
        }]);
    }

    // 2. TechCrunch RSS
    const tcRes = await fetch('https://techcrunch.com/feed/', { headers: FETCH_HEADERS });
    const tcXml = await tcRes.text();
    const items = [...tcXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
    for (const item of items) {
        const raw = item[1];
        const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || raw.match(/<title>(.*?)<\/title>/)?.[1];
        const link = raw.match(/<link>(.*?)<\/link>/)?.[1];
        if (title && link) {
            potentialItems.push({ title: title.trim(), agency: 'TechCrunch', notice_url: link.trim(), category: 'AI/테크 트렌드' });
        }
    }

    // --- API QUOTA & PRIORITY RE-EVALUATION ---
    const now = new Date();
    const kstHour = (now.getUTCHours() + 9) % 24;
    
    let itemsToProcess = potentialItems;
    if (kstHour < 9) {
        const govItems = potentialItems.filter(item => item.category === '정부지원공고');
        const techItems = potentialItems.filter(item => item.category !== '정부지원공고');
        itemsToProcess = [...govItems, ...techItems];
    }

    // --- BATCH PROCESS ---
    const results = [];
    for (const item of itemsToProcess) {
        const { data: existing } = await supabase.from('posts').select('id').eq('notice_url', item.notice_url).maybeSingle();
        if (existing) continue;

        let deepContext = '';
        if (item.category === '정부지원공고') {
            try {
                const detail = await fetch(item.notice_url, { headers: FETCH_HEADERS });
                let detailText = await detail.text();
                const $d = cheerio.load(detailText);
                
                $d('script, style, nav, footer').remove();
                const rawContent = $d('.content, #container, main, .board_view').text().replace(/\s+/g, ' ').trim();
                
                const attachments: any[] = [];
                $d('a').each((_, el) => {
                    const fname = $d(el).text().trim();
                    const onclick = $d(el).attr('onclick') || '';
                    if (fname.toLowerCase().includes('.hwp') || fname.toLowerCase().includes('.pdf')) {
                        const synapMatch = onclick.match(/fn_synapView\('([^']+)'/);
                        const previewUrl = synapMatch ? `https://www.k-startup.go.kr/common/synap/preview.do?fileSn=${synapMatch[1]}` : null;
                        if (!attachments.find(x => x.name === fname)) attachments.push({ name: fname, previewUrl });
                    }
                });

                // 정확한 주관기관/소관부처 팩트체크용 오버라이드
                const agencyMatch = rawContent.match(/(?:소관부처|주관기관)\s*([가-힣A-Za-z0-9]+재단|[가-힣A-Za-z0-9]+센터|[가-힣A-Za-z0-9]+원|[가-힣A-Za-z0-9]+부|[가-힣A-Za-z0-9]+대학교)/);
                if (agencyMatch && agencyMatch[1]) {
                    item.agency = agencyMatch[1].trim();
                }

                deepContext = `[상세 본문]\n${rawContent.slice(0, 8000)}\n`;
                if (attachments.length > 0) {
                    deepContext += `\n[첨부파일 메타데이터]\n`;
                    attachments.forEach(a => deepContext += `- 파일명: ${a.name} (미리보기 연동: ${a.previewUrl ? 'O' : 'X'})\n`);
                }
            } catch(e) { console.error(e); }
        }

        const isKStartup = item.category === '정부지원공고';
        const keyword = isKStartup ? `${item.agency} 창업 2026` : `${item.agency} 최신 테크 뉴스`;
        
        const prompt = `
당신은 대한민국 최고 수준의 창업 정책 분석가 및 전문 기자입니다.
제공된 공고문 딥 크롤링 데이터(본문 및 첨부 메타데이터)를 분석하여 'SEO 최적화 규칙' 및 '추가 지시사항'을 완벽하게 준수하는 기사를 작성하십시오.

[SEO 최적화 및 기사 발행 필수 규칙]
1. 제목(title): 첫 줄은 반드시 <h1> 태그를 사용하고 핵심 키워드([${item.agency}] 등)를 전진 배치할 것.
2. 요약(summary): 도입부에 핵심 키워드를 포함해 150자 이내로 요약문 작성.
3. 목차: 본문 단락(H2)으로 연결되는 목차 리스트를 반드시 상단 요약문 바로 아래에 배치할 것.
4. 가독성 확보 (필수): 모든 단락 사이에는 반드시 두 번의 줄바꿈(\\n\\n)을 넣어 가독성을 확보할 것.
5. 데이터 시각화 (절대 규칙): 상세 데이터(일정, 배점, 커리큘럼 등)는 무조건 <table> 또는 마크다운 표 형식을 사용하여 기재할 것! (단순 텍스트 나열 무조건 금지)
6. HTML 병행 허용: 브라우저 렌더링 호환성을 위해 <h1>, <h2>, <h3>, <table>, <tr>, <td>, <p>, <blockquote> 등의 표준 HTML 태그를 적극적으로 섞어서 사용할 것.
7. 키워드 밀도: 자연스러운 문맥 안에서 핵심 키워드("${keyword}")를 본문 전체에 5~7회 반복 노출할 것.
8. 이미지 Alt Text: 기사 내 이미지는 반드시 [![${keyword}_관련설명](이미지주소)] 형태로 작성.
9. 내부 링크: 기사 하단에 '관련 뉴스' 섹션(H2)을 추가하여 가상의 추천 기사 2개 링크를 넣을 것.

[특별 추가 지시사항 - 배점 및 기자 코멘트 (필수)]
- 데이터 내에 '배점' 관련 표나 수치가 전혀 없다면, 배점 기준표 내부에 반드시 "배점 정보 미확인" 이라고 명시할 것.
- "배점 정보 미확인" 상태일 경우, 해당 표 바로 밑에 반드시 [H3] 섹션으로 '### 기자 코멘트' 를 추가하여, "배점표는 공개되지 않았으나, 사업 명칭에 '관광'이 명시된 만큼 특성에 맞는 요소가 합격의 변수가 될 것으로 보입니다." 와 같이 해당 공고의 제목과 성격에 맞는 구체적이고 전문적인 통찰력(인사이트)을 담아 평가 변수를 예측하는 한 줄 코멘트를 작성할 것.

[데이터 소스 (주관기관: ${item.agency})]:
${item.title}
${deepContext}

출력 포맷: 반드시 JSON {title, summary, category, content, notice_url} 형태로만 응답하라. 마크다운 백틱(\`\`\`) 금지. JSON 외 어떠한 텍스트도 출력하지 말 것. 작성한 기사 전체는 content 필드 내부에 HTML/Markdown 텍스트로 전부 포함할 것.
`;
        
        try {
            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!geminiRes.ok) {
                throw new Error(`API Error: ${geminiRes.status} ${await geminiRes.text()}`);
            }

            const resData = await geminiRes.json();
            if (!resData.candidates || resData.candidates.length === 0) {
                throw new Error("No candidates received from Gemini.");
            }

            let jsonText = resData.candidates[0].content.parts[0].text.trim();
            jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            
            // [2026-04-07 UPDATE] Ensure category strictly follows the predefined mapping
            const article = JSON.parse(jsonText);
            article.category = item.category; 
            article.created_at = new Date().toISOString();
            
            await supabase.from('posts').insert([article]);
            results.push(article.title);
        } catch (apiError: any) {
            console.error("Gemini Generation Error:", apiError.message);
            // 에러를 뱉고 멈추지 않고 임시 저장 상태로 남김
            await supabase.from('posts').insert([{
                title: `[발행 실패/임시저장] [${item.category === '정부지원공고' ? '공고' : '뉴스'}] ${item.title}`,
                category: item.category,
                content: `<p>본문 자동 생성 중 오류가 발생했습니다 (Gemini API 오류): ${apiError.message}</p>`,
                notice_url: item.notice_url,
                created_at: new Date().toISOString(),
            }]);
            results.push(`[ERROR] ${item.title}`);
        }
        
        if (results.length >= 5) break; // 아침 9시 이전 창업 뉴스 5건 최우선 발송을 위해 최대 5건으로 조정
    }

    return new Response(JSON.stringify({ 
        success: true, 
        count: results.length,
        items: results 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
