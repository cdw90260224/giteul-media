import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// [핵심] 3중 엔진 세이프 가드
async function callGeminiSafe(prompt: string) {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    for (const modelName of models) {
        console.log(`[AI] Attempting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) {
                console.log(`[AI] SUCCESS with ${modelName}`);
                return text;
            }
        } catch (e: any) {
            console.error(`[AI] FAILED ${modelName}:`, e.message);
            if (e.message?.includes('429')) await sleep(2000); // 429일 경우 약간 대기
            continue;
        }
    }
    throw new Error('All Gemini models failed to respond.');
}

export async function POST(request: Request) {
  console.log('--- AUTO-POST PIPELINE START ---');
  try {
    const { targetCategory } = await request.json();
    console.log(`[Target] ${targetCategory}`);

    if (targetCategory === '정부지원공고') {
      // (기존 정부지원공고 로직...)
      console.log('[Scraper] Accessing K-Startup...');
      const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS, cache: 'no-store' });
      const html = await res.text();
      const $ = cheerio.load(html);
      const targets: any[] = [];
      $('a').each((_, el) => {
        const link = $(el);
        const attrVal = link.attr('onclick') || link.attr('href') || '';
        const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
        if (snMatch) {
          let title = link.find('p.tit, .tit, dt, strong').first().text().trim();
          if (!title) title = link.text().trim();
          title = title.replace(/D-\d+|마감일자\s*\d{4}-\d{2}-\d{2}|조회\s*[\d,]+/g, '').replace(/\s+/g, ' ').trim();
          if (title && title.length > 5 && !targets.find(t => t.sn === snMatch[1])) {
            targets.push({ title, sn: snMatch[1], url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}` });
          }
        }
      });

      console.log(`[Scraper] Found ${targets.length} candidates.`);
      if (targets.length === 0) throw new Error('뉴스 소스를 찾을 수 없습니다.');

      const { data: existing } = await supabase.from('posts').select('title');
      const filtered = targets.filter(t => !existing?.some(e => e.title.includes(t.title.slice(0, 25)))).slice(0, 1);
      
      if (filtered.length === 0) return NextResponse.json({ message: '최신 공고가 모두 발행되었습니다.', code: 'ALREADY_PUBLISHED' });

      const item = filtered[0];
      const prompt = `당신은 최고 수준의 기업 분석 기자입니다. JSON {title, summary, category, content, notice_url, deadline} 형태로만 답하세요. 기사는 마크다운으로 작성하고, 마지막에 "### 기자의 시선"을 인용구(> )와 함께 추가하세요.\n제목: ${item.title}\n공고URL: ${item.url}\n(발행일: 2026. 04. 10. 고정)`;
      const aiResponse = await callGeminiSafe(prompt);
      const jsonStr = aiResponse.replace(/```json\s*|```/gi, '').trim();
      const raw = JSON.parse(jsonStr);

      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { error: insertErr } = await adminClient.from('posts').insert([{
        title: raw.title, summary: raw.summary, category: '정부지원공고', content: raw.content, notice_url: item.url, deadline_date: raw.deadline || null, created_at: new Date().toISOString()
      }]);
      if (insertErr) throw insertErr;
      return NextResponse.json({ message: 'Success' });
    } else {
      // [신규] 외부 뉴스 API (NewsData.io) 연동 로직
      console.log(`[NewsAPI] Fetching articles for: ${targetCategory}`);
      const { fetchExternalNews } = await import('@/lib/news-api');
      const articles = await fetchExternalNews(targetCategory);

      if (!articles || articles.length === 0) throw new Error('외부 뉴스 수집에 실패했습니다.');

      // 중복 체크
      const { data: existing } = await supabase.from('posts').select('title');
      const filtered = articles.filter(a => !existing?.some(e => e.title.includes(a.title.slice(0, 25)))).slice(0, 1);

      if (filtered.length === 0) return NextResponse.json({ message: '해당 카테고리의 최신 기사가 이미 발행되었습니다.', code: 'ALREADY_PUBLISHED' });

      const item = filtered[0];
      const prompt = `당신은 글로벌 비즈니스 전문 기자입니다. 아래 뉴스를 바탕으로 전문적인 한국어 리포트를 작성하세요. 
      JSON {title, summary, category, content, notice_url, deadline} 형태로만 답하세요. 
      기사 내용은 마크다운으로 작성하고, 마지막에 "### 기자의 시선" 평론을 인용구(> )와 함께 포함하세요.
      원문 제목: ${item.title}\n내용: ${item.description}\n출처: ${item.source}`;

      const aiResponse = await callGeminiSafe(prompt);
      const jsonStr = aiResponse.replace(/```json\s*|```/gi, '').trim();
      const raw = JSON.parse(jsonStr);

      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { error: insertErr } = await adminClient.from('posts').insert([{
        title: raw.title,
        summary: raw.summary,
        category: targetCategory,
        content: raw.content,
        notice_url: item.url,
        image_url: item.image,
        created_at: new Date().toISOString()
      }]);

      if (insertErr) throw insertErr;
      console.log(`[SUCCESS] ${targetCategory} Post Published!`);
      return NextResponse.json({ message: 'Success' });
    }


  } catch (err: any) {
    console.error('[CRITICAL ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}