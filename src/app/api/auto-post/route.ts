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

// [1순위 강제 매칭 로고 테이프]
const BRAND_LOGOS: Record<string, string> = {
  'KOREA_GOV': 'https://www.mss.go.kr/images/common/logo.png', // 대한민국 정부 공식 로고 (태극)
  'SAMSUNG': 'https://logo.clearbit.com/samsung.com',
  'NAVER': 'https://logo.clearbit.com/naver.com',
  'KAKAO': 'https://logo.clearbit.com/kakao.com',
  'HYUNDAI': 'https://logo.clearbit.com/hyundai.com',
  'OPENAI': 'https://logo.clearbit.com/openai.com',
  'MICROSOFT': 'https://logo.clearbit.com/microsoft.com',
  'GOOGLE': 'https://logo.clearbit.com/google.com',
  'TECHCRUNCH': 'https://logo.clearbit.com/techcrunch.com',
};

async function getBrandLogo(title: string, agency: string): Promise<string | null> {
  const combined = (title + ' ' + agency).toUpperCase();

  // Case 1: 대한민국 정부/공공기관 키워드 (정부 로고 강제)
  if (['중소벤처기업부', '창업진흥원', '정부', '공고', '지나원', '혁신경제', '기금', '시청', '구청'].some(k => combined.includes(k))) {
    return BRAND_LOGOS.KOREA_GOV;
  }

  // Case 2: 주요 브랜드 키워드 (하드코딩)
  if (['삼성', 'SAMSUNG', 'C-LAB'].some(k => combined.includes(k))) return BRAND_LOGOS.SAMSUNG;
  if (['네이버', 'NAVER'].some(k => combined.includes(k))) return BRAND_LOGOS.NAVER;
  if (['카카오', 'KAKAO'].some(k => combined.includes(k))) return BRAND_LOGOS.KAKAO;
  if (['OPENAI', 'GPT', 'CHATGPT'].some(k => combined.includes(k))) return BRAND_LOGOS.OPENAI;
  if (['MICROSOFT', 'MS '].some(k => combined.includes(k))) return BRAND_LOGOS.MICROSOFT;
  if (['GOOGLE', '구글'].some(k => combined.includes(k))) return BRAND_LOGOS.GOOGLE;
  
  // Case 3: 다이내믹 도메인 매칭 (Clearbit)
  const domainMatch = combined.match(/([A-Z0-9.-]+\.[A-Z]{2,})/i);
  if (domainMatch) return `https://logo.clearbit.com/${domainMatch[1]}?size=800`;

  return null;
}

// Scrapers
async function scrapeKStartup(): Promise<any[]> {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS, cache: 'no-store' });
  if (!response.ok) return [];
  const html = await response.text();
  const $ = cheerio.load(html);
  const notices: any[] = [];
  
  $('li, .card, .item, .box').each((_, el) => {
    let title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
    if (!title || title.length < 5) return;
    
    const onClick = $(el).find('a').attr('onclick') || '';
    const snMatch = onClick.match(/go_view\('?(\d+)'?\)/);
    if (!snMatch) return;

    const textContent = $(el).text();
    const dateRegex = /(?:마감일자|접수마감|마감)\s*[:\s]*(\d{4}[-./]\d{2}[-./]\d{2})/;
    const deadlineRaw = textContent.match(dateRegex)?.[1]?.replace(/[./]/g, '-') ?? null;
    const agency = textContent.match(/(?:소관부처|주관기관|기관명)\s*([가-힣A-Za-z0-9]+원?)/)?.[1] ?? '창업진흥원';
    
    notices.push({
      title,
      agency,
      deadline_date: deadlineRaw,
      notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`,
      source_type: '정부지원공고' as CategoryType
    });
  });
  return notices;
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
      const pubDate = raw.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      news.push({ title: title.trim(), agency: 'TechCrunch', notice_url: link.trim(), source_type: 'AI/테크 트렌드' as CategoryType });
    }
    return news;
  } catch { return []; }
}

async function isDuplicate(url: string, title: string) {
  const { data } = await supabase.from('posts').select('id').or(`notice_url.eq."${url}",title.eq."${title}"`).maybeSingle();
  return !!data;
}

function buildPrompt(item: any, brandLogoUrl: string | null): string {
  return `
# Role: 대한민국 창업 및 테크 수석 분석 기자 (기틀 미디어)
# Task: [원본 데이터]를 바탕으로 '전문 분석 리포트'를 집필하라.

[원본 데이터]
- 제목: ${item.title}
- 기관/회사: ${item.agency}
- 공식 로고/이미지: ${brandLogoUrl || '없음'}

[핵심 명령: 이미지 선정]
1. '공식 로고/이미지'가 있다면 무조건 이를 'image_url'로 사용하라.
2. 로고가 없을 때만 고해상도 Unsplash 이미지를 찾아 할당하라. 

[집필 구조 (10번 프레임리스 스타일)]
- 인용구(>) 형식의 짧은 요약 리드문.
- <div class="summary-box"> 섹션 (AI Insight).
- ## 1. 상세 리포트 / ## 2. 창업자 맞춤 전략 / ## 3. 팩트 체크.

[응답 포맷]: JSON (title, summary, category, content, notice_url, deadline_date, insight_summary, image_url). 백틱 없이.
`;
}

export async function POST(request: Request) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  try {
    const [notices, news] = await Promise.all([scrapeKStartup(), scrapeTechNews()]);
    const targets = [...notices, ...news];
    const results = [];

    for (const item of targets) {
        if (await isDuplicate(item.notice_url, item.title)) continue;
        if (results.length >= 2) break;

        try {
            const logoUrl = await getBrandLogo(item.title, item.agency);
            const prompt = buildPrompt(item, logoUrl);
            const result = await model.generateContent(prompt);
            let jsonText = result.response.text().trim();
            jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const post = JSON.parse(jsonText);
            
            post.created_at = new Date().toISOString();
            if (logoUrl) post.image_url = logoUrl; // 강제 집행

            const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            const { error } = await supabaseAdmin.from('posts').insert([post]);
            if (!error) results.push(post.title);
        } catch (e) { console.error('Gen Error:', e); }
    }

    return NextResponse.json({ message: `Success: ${results.length}`, generated: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
