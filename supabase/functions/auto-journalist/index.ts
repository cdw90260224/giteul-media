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
    // 1. K-Startup
    const ksRes = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const ksHtml = await ksRes.text();
    const $ks = cheerio.load(ksHtml);
    const potentialItems: any[] = [];
    
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

    // --- BATCH PROCESS (3~5 items) ---
    const results = [];
    for (const item of potentialItems) {
        const { data: existing } = await supabase.from('posts').select('id').eq('notice_url', item.notice_url).maybeSingle();
        if (existing) continue;

        // [Absolute Standard] Shinhan Financial Group Style (Image 10)
        const isStrategy = item.category === '정부지원공고';
        const role = isStrategy ? '창업 합격 전략가' : '테크 경제 분석 기자';
        const titlePrefix = isStrategy ? '[전략]' : '[뉴스]';
        
        const prompt = `
# Role: 대한민국 창업 및 ${role}
# Task: '신한금융 스타일(Image 10)' 전문 리포트 작성.
# Headline: ${titlePrefix} ${item.title} ${isStrategy ? '합격을 위한 실전 공략' : ''}

[Categorization Guide]
- Category: ${item.category} (Source: ${item.agency})

[집필 필수 구조]
1. 제목: ${titlePrefix} ${item.title}
2. 리드문: 3~4줄 인용구(>) 형식.
3. 인사이트 박스: 반드시 <div class="summary-box"> 태그 래핑.
   - 제목: [${isStrategy ? 'STRATEGIC UPGRADE' : 'MARKET INSIGHT'}] 🚀 ${item.title}
4. 본문 세분화: 
   ${isStrategy ? `
   ## 1. 상세 리포트
   ## 2. 사업계획서 작성 전략 (필수)
      - [핵심 전략] 합격 포인트 1줄 요약
      - [실전 작성 가이드] PSST 항목별 공략
      - [치트키] 필수 키워드 (#태그)
   ## 3. 팩트 체크
   ` : `
   ## 1. 상세 분석 리포트
   ## 2. 시장 파급 효과 및 창업 대응 방안
   ## 3. 핵심 팩트 체크
   `}
5. 이미지: "image_url" 필드는 빈 값("")으로 비워둘 것.

[포맷]: JSON {title, summary, category, content, notice_url}. 마크다운 없이 순수 JSON만 응답하라.
`;
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const resData = await geminiRes.json();
        let jsonText = resData.candidates[0].content.parts[0].text.trim();
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        // [2026-04-07 UPDATE] Ensure category strictly follows the predefined mapping
        const article = JSON.parse(jsonText);
        article.category = item.category; 
        article.created_at = new Date().toISOString();
        
        await supabase.from('posts').insert([article]);
        results.push(article.title);
        
        if (results.length >= 4) break; // Run 4 items per cycle
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
