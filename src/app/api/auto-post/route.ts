import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { getLogoByTitle } from '@/lib/logos';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Scrapers
async function scrapeKStartup(): Promise<any[]> {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  try {
    const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const noticesMap = new Map<string, any>();
    
    // Group by ID to handle multiple links (category icon link vs text title link)
    $('a').each((_, el) => {
      const link = $(el);
      const attrVal = link.attr('onclick') || link.attr('href') || '';
      const snMatch = attrVal.match(/go_view\('?(\d+)'?\)/);
      if (!snMatch) return;

      const id = snMatch[1];
      const title = link.text().trim().replace(/\s+/g, ' ');
      
      if (!noticesMap.has(id)) {
          noticesMap.set(id, {
            title,
            notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${id}`,
            source_type: '정부지원공고'
          });
      } else {
          // If already exists, update title if current one is longer/better
          const existing = noticesMap.get(id);
          if (title.length > existing.title.length) {
              existing.title = title;
          }
      }
    });

    const notices = Array.from(noticesMap.values()).filter(n => n.title.length >= 5);
    console.log(`K-Startup Scraped: ${notices.length} items (Titles: ${notices.slice(0,2).map(n => n.title).join(', ')})`);
    return notices;
  } catch (err) { 
    console.error('K-Startup scrape error:', err);
    return []; 
  }
}

async function scrapeTechNews(): Promise<any[]> {
  try {
    const RSS_URL = 'https://techcrunch.com/feed/';
    const res = await fetch(RSS_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10); // Increase buffer
    const news: any[] = [];
    for (const item of items) {
      const raw = item[1];
      const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || raw.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = raw.match(/<link>(.*?)<\/link>/)?.[1] || '';
      if (!title || !link) continue;
      news.push({ title: title.trim(), notice_url: link.trim(), source_type: 'AI/테크 트렌드' });
    }
    return news;
  } catch { return []; }
}

async function scrapeMarketNews(): Promise<any[]> {
  try {
    const RSS_URL = 'https://news.google.com/rss/search?q=%EA%B8%B0%EC%97%85+%EB%A7%88%EC%BC%93+%EC%A6%9D%EC%8B%9C+M%26A&hl=ko&gl=KR&ceid=KR:ko';
    const res = await fetch(RSS_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
    return items.map(item => ({
      title: item[1].match(/<title>(.*?)<\/title>/)?.[1] || '',
      notice_url: item[1].match(/<link>(.*?)<\/link>/)?.[1] || '',
      source_type: '기업/마켓 뉴스'
    }));
  } catch { return []; }
}

async function scrapeGlobalNews(): Promise<any[]> {
  try {
    const RSS_URL = 'https://news.google.com/rss/search?q=%EA%B8%80%EB%A1%9C%EB%B2%8C+%EA%B2%BD%EC%A0%9C+%EA%B5%AD%EC%A0%9C+%EC%A0%95%EC%84%B8&hl=ko&gl=KR&ceid=KR:ko';
    const res = await fetch(RSS_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
    return items.map(item => ({
      title: item[1].match(/<title>(.*?)<\/title>/)?.[1] || '',
      notice_url: item[1].match(/<link>(.*?)<\/link>/)?.[1] || '',
      source_type: '글로벌 뉴스'
    }));
  } catch { return []; }
}

function buildPrompt(item: any): string {
  const isStrategy = item.source_type === '정부지원공고';
  const role = isStrategy ? '창업 합격 전략가' : '테크 경제 분석 기자';
  const titlePrefix = isStrategy ? '[전략]' : '[뉴스]';

  return `
# Role: 대한민국 창업 및 ${role}
# Task: '신한금융 스타일(Image 10)' 전문 리포트 작성.
# Headline: ${titlePrefix} ${item.title} ${isStrategy ? '합격을 위한 실전 공략' : ''}

[Categorization Guide]
Choose the most appropriate 'category' from this list:
- '정부지원공고' (For any government grants, IRIS/K-Startup notices)
- 'AI/테크 트렌드' (For AI, tech trends, product launches, startup ecosystem)
- '기업/마켓 뉴스' (For IPO, funding rounds, market shifts, corporate strategy)
- '글로벌 뉴스' (For macro-economic news, international relations, foreign policy)

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
5. 이미지: 본문 섹션만 집중하라. "image_url" 필드는 빈 값("")으로 비워둘 것. 로고는 시스템이 외부에서 연결한다.

[포맷]: JSON {title, summary, category, content, notice_url}. 마크다운 없이 순수 JSON만 응답하라.
`;
}

async function generatePost(prompt: string) {
    let jsonText = '';
    if (ANTHROPIC_KEY) {
        const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
        const msg = await anthropic.messages.create({ model: 'claude-3-5-sonnet-20240620', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });
        jsonText = (msg.content[0] as any).text;
    } else if (GEMINI_KEY) {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Updated to a valid version from listModels
        const result = await model.generateContent(prompt);
        jsonText = result.response.text();
    }
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonText);
}

export async function POST(request: Request) {
  console.log(`[API TRIGGER] /api/auto-post called at ${new Date().toISOString()} | Target: ${new URL(request.url).host}`);
  try {
    const { targetCategory } = await request.json(); 
    
    let targets: any[] = [];
    if (targetCategory === '정부지원공고') {
        targets = await scrapeKStartup(); 
    } else if (targetCategory === '기업/마켓 뉴스') {
        targets = await scrapeMarketNews();
    } else if (targetCategory === '글로벌 뉴스') {
        targets = await scrapeGlobalNews();
    } else if (targetCategory === 'AI/테크 트렌드') {
        targets = await scrapeTechNews();
    } else {
        const [notices, tech, market, global] = await Promise.all([
          scrapeKStartup(), 
          scrapeTechNews(),
          scrapeMarketNews(),
          scrapeGlobalNews()
        ]);
        targets = [...tech, ...market, ...global, ...notices]; 
    }

    const results = [];
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    for (const item of targets) {
        const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', item.notice_url).maybeSingle();
        // Increase limit to 15 for rich multi-category coverage
        if (dup || results.length >= 15) continue;

        try {
          // Rate limit protection
          if (results.length > 0) await new Promise(r => setTimeout(r, 1000));

          const prompt = buildPrompt(item);
          const post = await generatePost(prompt);
          
          // [로고 매칭 우선순위 로직] AI가 아닌 코드 내부 Mapping Table(Logos.ts)에서만 처리
          const matchedLogo = getLogoByTitle(item.title);
          
          // [Professional Thumbnail Logic] Avoid AI faces/characters, use high-authority tech stock
          const TECH_FALLBACKS = [
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa', // Data/Earth
            'https://images.unsplash.com/photo-1518770660439-4636190af475', // Hardware
            'https://images.unsplash.com/photo-1550751827-4bd67484d5af', // Cyber Matrix
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d', // Abstract Innovation
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f'  // Work Desk
          ];
          const randomTech = TECH_FALLBACKS[Math.floor(Math.random() * TECH_FALLBACKS.length)];

          if (matchedLogo) {
              console.log(`[API LOG] Logo Match Found: ${matchedLogo} for "${item.title}"`);
              post.image_url = matchedLogo;
          } else {
              post.image_url = item.source_type === '정부지원공고' 
                ? 'https://www.k-startup.go.kr/static/portal/img/logo_kstartup.png' 
                : randomTech;
              console.log(`[API LOG] No Logo Match. Using curated tech fallback: ${post.image_url}`);
          }

          post.created_at = new Date().toISOString();
          
          // [Validation] Ensure category falls into the allowed list, default to AI/Tech Trend for news
          const ALLOWED_CATS = ['정부지원공고', 'AI/테크 트렌드', '기업/마켓 뉴스', '글로벌 뉴스'];
          if (!ALLOWED_CATS.includes(post.category)) {
              post.category = item.source_type === '정부지원공고' ? '정부지원공고' : 'AI/테크 트렌드';
          }
          const { error: insError } = await supabaseAdmin.from('posts').insert([post]);
          if (insError) throw insError;

          results.push(post.title);
          console.log(`Successfully posted: ${post.title}`);
        } catch (postErr) {
          console.error(`Post generation failed for ${item.title}:`, postErr);
        }
    }
    return NextResponse.json({ generated: results, count: results.length });
  } catch (err: any) {
    console.error('Route handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

