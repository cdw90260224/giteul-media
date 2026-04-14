import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { after } from 'next/server';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callGeminiSafe(prompt: string) {
    const models = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
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
            if (e.message?.includes('429')) await sleep(2000);
            continue;
        }
    }
    throw new Error('All Gemini models failed to respond.');
}

async function publishByCategory(targetCategory: string, limit: number = 1) {
  console.log(`[Pipeline] Processing category: ${targetCategory} (Limit: ${limit})`);
  const results = [];
  
  if (targetCategory === '정부지원공고') {
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
        title = title.replace(/D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+|조회\s*[\d,]+/gi, '').replace(/\s+/g, ' ').trim();
        if (title && title.length > 5 && !targets.find(t => t.sn === snMatch[1])) {
          targets.push({ title, sn: snMatch[1], url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}` });
        }
      }
    });

    if (targets.length === 0) return [{ success: false, message: '뉴스 소스를 찾을 수 없습니다.' }];

    const { data: existing } = await supabase.from('posts').select('title, notice_url');
    const filtered = targets.filter(t => {
      const urlDup = existing?.some(e => e.notice_url === t.url);
      const titleDup = existing?.some(e => e.title.includes(t.title.slice(0, 20)));
      return !urlDup && !titleDup;
    }).slice(0, limit);
    
    if (filtered.length === 0) return [{ success: false, message: '최신 공고가 이미 발행되었습니다.', code: 'ALREADY_PUBLISHED' }];

    for (const item of filtered) {
        try {
            const prompt = `당신은 최고 수준의 기업 분석 기자입니다. 
            반드시 다음 JSON 형식을 엄격히 준수하여 응답하세요. 
            JSON 구조: { "title": "...", "summary": "...", "category": "정부지원공고", "content": "...", "notice_url": "...", "deadline": "YYYY-MM-DD 또는 상시 접수" }

            주의: 제목(title)에는 절대로 '[전략]' 단어나 유사한 태그를 포함하지 마세요. 
            만약 공고의 마감일이 이미 지났거나 기한이 종료된 것이 확실하다면, "deadline" 필드에 정확한 과거 날짜를 기입하세요. 시스템이 자동으로 필터링합니다.
            기사는 마크다운으로 작성하고, 마지막에 "### 기자의 시선"을 인용구(> )와 함께 추가하세요.
            입력 제목: ${item.title}
            공고URL: ${item.url}`;

            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const validatedDeadline = (raw.deadline && dateRegex.test(raw.deadline)) ? raw.deadline : null;

            if (validatedDeadline) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const deadline = new Date(validatedDeadline);
              if (deadline < today) {
                console.log(`[Pipeline] Skipping expired notice: ${raw.title} (Deadline: ${validatedDeadline})`);
                results.push({ success: false, message: '마감된 공고이므로 집필을 중단합니다.', code: 'EXPIRED' });
                continue;
              }
            }

            const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
            await adminClient.from('posts').insert([{
              title: raw.title, 
              summary: raw.summary, 
              category: 'strategy', 
              content: raw.content, 
              notice_url: item.url, 
              deadline_date: validatedDeadline, 
              created_at: new Date().toISOString()
            }]);
            results.push({ success: true, title: raw.title });
        } catch (e: any) {
            results.push({ success: false, error: e.message });
        }
    }
    return results;
  } else {
    const { fetchExternalNews } = await import('@/lib/news-api');
    const articles = await fetchExternalNews(targetCategory);
    console.log(`[API] Fetched ${articles?.length || 0} articles for ${targetCategory}`);

    if (!articles || articles.length === 0) {
      console.warn(`[API] No articles found for ${targetCategory}`);
      return [{ success: false, message: '뉴스 API 응답이 없습니다. API 키를 확인해주세요.' }];
    }

    const { data: existing } = await supabase.from('posts').select('title, notice_url');
    const filtered = articles.filter(a => {
      const urlDup = existing?.some(e => e.notice_url === a.url);
      const titleDup = existing?.some(e => e.title.includes(a.title.slice(0, 20)));
      return !urlDup && !titleDup;
    }).slice(0, limit);

    console.log(`[API] ${filtered.length} new articles after deduplication`);

    if (filtered.length === 0) return [{ success: false, message: '이미 발행된 기사입니다.', code: 'ALREADY_PUBLISHED' }];

    for (const item of filtered) {
        try {
            console.log(`[AI] Generating content for: ${item.title}`);
            const prompt = `당신은 글로벌 비즈니스 전문 기자입니다. 아래 뉴스를 바탕으로 전문적인 한국어 리포트를 작성하세요. 
            JSON 구조: { "title": "...", "summary": "...", "category": "${targetCategory}", "content": "...", "notice_url": "...", "deadline": "null" }
            
            기사 내용은 마크다운으로 작성하고, 마지막에 "### 기자의 시선" 평론을 인용구(> )와 함께 포함하세요.
            원문 제목: ${item.title}\n내용: ${item.description}\n출처: ${item.source}`;

            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
            const { error: insertError } = await adminClient.from('posts').insert([{
              title: raw.title,
              summary: raw.summary,
              category: targetCategory,
              content: raw.content,
              notice_url: item.url,
              image_url: item.image,
              created_at: new Date().toISOString()
            }]);

            if (insertError) throw insertError;

            results.push({ success: true, title: raw.title });
            console.log(`[Pipeline] Successfully published: ${raw.title}`);
        } catch (e: any) {
            results.push({ success: false, error: e.message });
        }
    }
    return results;
  }
}

export async function GET(request: Request) {
  console.log('--- AUTO-CRON TRIGGERED ---');
  
  // Vercel 크론 및 백그라운드 작업을 위해 after() 사용 (타임아웃 방지)
  after(async () => {
    try {
      const today = new Date();
      const kstDay = new Date(today.getTime() + (9 * 60 * 60 * 1000)).getUTCDate();
      
      console.log(`[Background Cron] Starting at ${new Date().toISOString()}`);

      // 1. 정부지원공고 (4개 필지) & 2. 뉴스 (1개 필지) 병렬 시작
      const newsCategory = (kstDay % 2 === 0) ? 'tech' : '기업/마켓 뉴스';
      
      await Promise.all([
        publishByCategory('정부지원공고', 4),
        publishByCategory(newsCategory, 1)
      ]);

      console.log(`[Background Cron] Successfully finished all tasks.`);
    } catch (err: any) {
      console.error('[Background Cron] FATAL ERROR:', err.message);
    }
  });

  return NextResponse.json({ 
    success: true, 
    message: '뉴스 발행 파이프라인이 백그라운드에서 가동되었습니다. 약 1~2분 후 사이트에 반영됩니다.' 
  });
}

export async function POST(request: Request) {
  console.log('--- MANUAL POST REQUEST ---');
  try {
    const { targetCategory } = await request.json();
    const results = await publishByCategory(targetCategory, 1);
    const result = results[0];
    if (!result.success) {
       return NextResponse.json({ error: result.message, code: result.code }, { status: result.code === 'ALREADY_PUBLISHED' ? 200 : 400 });
    }
    return NextResponse.json({ message: 'Success', title: result.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}