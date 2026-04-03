import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

type CategoryType = '정부지원공고' | 'AI/테크 트렌드' | '기업/마켓 뉴스' | '글로벌 뉴스';

// Scrapers from existing logic...
async function scrapeKStartup(): Promise<any[]> {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
  if (!response.ok) return [];
  const html = await response.text();
  const $ = cheerio.load(html);
  const notices: any[] = [];
  $('li, .card, .item, .box').each((_, el) => {
    const textContent = $(el).text().replace(/\s+/g, ' ').trim();
    const htmlContent = $(el).html() || '';
    let title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
    if (!title || title.length < 5) return;
    const snMatch = htmlContent.match(/go_view\('?(\d+)'?\)/) || $(el).find('a').attr('onclick')?.match(/go_view\('?(\d+)'?\)/);
    if (!snMatch) return;
    const dateRegex = /(?:마감일자|접수마감|마감)\s*[:\s]*(\d{4}[-./]\d{2}[-./]\d{2})/;
    const deadlineRaw = textContent.match(dateRegex)?.[1]?.replace(/[./]/g, '-') ?? null;
    notices.push({
      title,
      agency: textContent.match(/(?:소관부처|주관기관|기관명)\s*([가-힣A-Za-z0-9]+원?)/)?.[1] ?? '창업진흥원',
      deadline_date: deadlineRaw ? new Date(deadlineRaw).toISOString().split('T')[0] : null,
      notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`,
      source_type: '정부지원공고' as CategoryType,
    });
  });
  return notices;
}

async function scrapeTechNews(): Promise<any[]> {
  try {
    const RSS_URL = 'https://techcrunch.com/feed/';
    const res = await fetch(RSS_URL, { headers: { 'User-Agent': FETCH_HEADERS['User-Agent'] }, cache: 'no-store' });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15);
    const news: any[] = [];
    for (const item of items) {
      const raw = item[1];
      const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? raw.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
      const link = raw.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
      const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';
      if (!title || !link) continue;
      news.push({
        title: title.trim(),
        agency: 'TechCrunch',
        published_date: new Date(pubDate).toISOString().split('T')[0],
        notice_url: link.trim(),
        source_type: 'AI/테크 트렌드' as CategoryType,
      });
    }
    return news;
  } catch { return []; }
}

async function isDuplicate(url: string, title: string) {
    const { data: byUrl } = await supabase.from('posts').select('id').eq('notice_url', url).maybeSingle();
    if (byUrl) return true;
    const { data: byTitle } = await supabase.from('posts').select('id').eq('title', title).maybeSingle();
    return !!byTitle;
}

function buildPrompt(item: any): string {
  const isNotice = item.source_type === '정부지원공고';
  const catColor = isNotice ? '#1d4ed8' : '#7c3aed';
  return `
# Role: 대한민국 창업 생태계 및 글로벌 딥테크 전문 분석 기자
# Task: [원본 데이터]를 바탕으로 창업가를 위한 '전략 리포트' 리포트를 HTML 구조로 작성하라.

[원본 데이터]
- 제목: ${item.title}
- 발행/소관기관: ${item.agency}
- 카테고리: ${item.source_type}
${isNotice ? `- 마감일: ${item.deadline_date ?? '공고문 확인 요망'}` : `- 발행일: ${item.published_date ?? '최근'}`}
- 원문 링크: ${item.notice_url}

[구조]: 1. [AI INSIGHT RE-MAP] (요약박스), 2. 상세 리포트, 3. 창업가 맞춤 전략, 4. 팩트 체크, 5. 공식 출처 버튼.
[응답]: JSON 반환 (title, summary, category, content, notice_url, deadline_date, insight_summary, image_url). 백틱 없이.
`;
}

export async function POST(request: Request) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  try {
    // 1. Scrape all
    const [notices, news] = await Promise.all([scrapeKStartup(), scrapeTechNews()]);
    
    // 2. Plan Dispatch (E.g. 3 notices, 2 news per run)
    const targetNotices = [];
    for (const n of notices) {
        if (!(await isDuplicate(n.notice_url, n.title))) targetNotices.push(n);
        if (targetNotices.length >= 3) break;
    }
    
    const targetNews = [];
    for (const n of news) {
        if (!(await isDuplicate(n.notice_url, n.title))) targetNews.push(n);
        if (targetNews.length >= 2) break;
    }

    const targets = [...targetNotices, ...targetNews];
    if (targets.length === 0) return NextResponse.json({ message: 'No new content found' });

    const results = [];
    for (const item of targets) {
        try {
            const prompt = buildPrompt(item);
            const result = await model.generateContent(prompt);
            let jsonText = result.response.text().trim();
            jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const post = JSON.parse(jsonText);
            post.created_at = new Date().toISOString();
            if (!post.deadline_date) post.deadline_date = item.deadline_date ?? null;
            
            // Server-side Superuser Client (RLS 우회)
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data, error } = await supabaseAdmin.from('posts').insert([post]).select();
            if (!error) results.push(post.title);
        } catch (e) { console.error('Gen Error:', e); }
    }

    return NextResponse.json({ 
        message: `Batch Success: ${results.length} articles generated`,
        generated: results 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
