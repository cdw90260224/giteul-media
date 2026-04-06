import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

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
    const notices: any[] = [];
    $('li, .card, .item').each((_, el) => {
      let title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
      if (!title || title.length < 5) return;
      const onClick = $(el).find('a').attr('onclick') || '';
      const snMatch = onClick.match(/go_view\('?(\d+)'?\)/);
      if (!snMatch) return;
      notices.push({ 
        title, 
        notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`, 
        source_type: '정부지원공고' 
      });
    });
    return notices;
  } catch { return []; }
}

async function scrapeTechNews(): Promise<any[]> {
  try {
    const RSS_URL = 'https://techcrunch.com/feed/';
    const res = await fetch(RSS_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    const news: any[] = [];
    for (const item of items) {
      const raw = item[1];
      const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || raw.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = raw.match(/<link>(.*?)<\/link>/)?.[1] || '';
      news.push({ title: title.trim(), notice_url: link.trim(), source_type: 'AI/테크 트렌드' });
    }
    return news;
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
      - [실전 작성 가이드] PSST 항목별 공전략
      - [치트키] 필수 키워드 (#태그)
   ## 3. 팩트 체크
   ` : `
   ## 1. 상세 분석 리포트
   ## 2. 시장 파급 효과 및 창업 대응 방안
   ## 3. 핵심 팩트 체크
   `}
5. 이미지: "image_url" 필드는 ${isStrategy ? 'https://www.mss.go.kr/images/common/logo.png' : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'} 할당.

[포맷]: JSON {title, summary, category, content, notice_url, image_url}. 마크다운 없이 순수 JSON만 응답하라.
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        jsonText = result.response.text();
    }
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonText);
}

export async function POST(request: Request) {
  try {
    const { targetCategory } = await request.json(); // 프론트에서 보낸 타겟 카테고리
    
    // 1. 카테고리별 전략적 스크래핑 타겟 설정
    let targets: any[] = [];
    if (targetCategory === '정부지원공고') {
        targets = await scrapeKStartup(); // 공사 필승 전략에 집중
    } else {
        const [notices, news] = await Promise.all([scrapeKStartup(), scrapeTechNews()]);
        targets = [...news, ...notices]; // 메인 포털용 믹스
    }

    const results = [];
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    for (const item of targets) {
        const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', item.notice_url).maybeSingle();
        if (dup || results.length >= 2) continue;

        const prompt = buildPrompt(item);
        const post = await generatePost(prompt);
        post.created_at = new Date().toISOString();
        post.category = item.source_type;

        await supabaseAdmin.from('posts').insert([post]);
        results.push(post.title);
    }
    return NextResponse.json({ generated: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
