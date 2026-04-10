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
      if (targets.length === 0) throw new Error('뉴스 소스를 찾을 수 없습니다 (크롤링 실패).');

      // 중복 체크 (기존 10자에서 25자로 완화하여 더 정밀하게 체크)
      const { data: existing } = await supabase.from('posts').select('title');
      const filtered = targets.filter(t => !existing?.some(e => e.title.includes(t.title.slice(0, 25)))).slice(0, 1);
      
      console.log(`[Filter] ${filtered.length} new items found.`);
      if (filtered.length === 0) {
        console.log('[System] All discovered items are already published.');
        return NextResponse.json({ message: '이미 모든 최신 기사가 발행된 상태입니다.', code: 'ALREADY_PUBLISHED' });
      }

      const item = filtered[0];
      console.log(`[AI] Generating: ${item.title}`);
      
      const prompt = `당신은 최고 수준의 기업 분석 기자입니다. JSON {title, summary, category, content, notice_url, deadline} 형태로만 답하세요. 
      기사는 마크다운으로 작성하고, 마지막에 "### 기자의 시선"을 인용구(> )와 함께 추가하세요.
      제목: ${item.title}\n공고URL: ${item.url}\n(발행일: 2026. 04. 10. 고정)`;

      const aiResponse = await callGeminiSafe(prompt);
      const jsonStr = aiResponse.replace(/```json\s*|```/gi, '').trim();
      const raw = JSON.parse(jsonStr);

      console.log('[DB] Inserting into Supabase...');
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { error: insertErr } = await adminClient.from('posts').insert([{
        title: raw.title,
        summary: raw.summary,
        category: '정부지원공고',
        content: raw.content,
        notice_url: item.url,
        deadline_date: raw.deadline || null,
        created_at: new Date().toISOString()
      }]);

      if (insertErr) throw insertErr;
      console.log('[SUCCESS] Post Published!');
      return NextResponse.json({ message: 'Success' });
    }

    return NextResponse.json({ message: '준비 중인 카테고리입니다.' });

  } catch (err: any) {
    console.error('[CRITICAL ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}