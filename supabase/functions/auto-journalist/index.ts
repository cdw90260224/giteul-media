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

        // Generate via Gemini
        const prompt = `Write a professional B2B news report in HTML for: ${item.title}. Source: ${item.agency}. Category: ${item.category}. URL: ${item.notice_url}. Return JSON (title, summary, category, content, notice_url, deadline_date, insight_summary, image_url).`;
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const resData = await geminiRes.json();
        let jsonText = resData.candidates[0].content.parts[0].text.trim();
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const article = JSON.parse(jsonText);
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
