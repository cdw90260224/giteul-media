import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { getLogoByTitle } from '@/lib/logos';
import { fetchExternalNews } from '@/lib/news-api';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0' };

const getDeepContext = async (noticeUrl: string): Promise<string> => {
    try {
        const response = await fetch(noticeUrl, { headers: FETCH_HEADERS, cache: 'no-store' });
        const html = await response.text();
        const $ = cheerio.load(html);
        return $('div.prose, div.article, div.content, #content').text().trim().slice(0, 3000);
    } catch { return ""; }
};

const scrapeKStartup = async (): Promise<any[]> => {
  try {
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      cache: 'no-store' 
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const notices: any[] = [];
    
    $('a').each((_, el) => {
      const link = $(el);
      const attrVal = link.attr('onclick') || link.attr('href') || '';
      const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
      if (snMatch) {
        let title = link.find('p.tit, .tit, dt, strong').first().text().trim();
        if (!title) title = link.text().trim();
        
        // Clean title: remove D-Day, Dates, etc.
        title = title.replace(/D-\d+|마감일자\s*\d{4}-\d{2}-\d{2}|조회\s*[\d,]+/g, '').replace(/\s+/g, ' ').trim();
        
        if (title && title.length > 5 && !notices.find(n => n.sn === snMatch[1])) {
          notices.push({
            title,
            sn: snMatch[1],
            notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`,
          });
        }
      }
    });
    return notices;
  } catch (e) { console.error('Scrape Error:', e); return []; }
};

const generatePost = async (item: any, deepContext: string) => {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
  const prompt = `당신은 정책 전문 기자입니다. 아래 정보를 뉴스 형식으로 작성하세요. JSON {title, summary, category, content, notice_url, deadline} 형태로만 답하세요.\n제목: ${item.title}\n상세: ${deepContext}\n(발행일: 2026. 04. 10. 고정)`;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawJson = JSON.parse(jsonText);
  return {
    title: rawJson.title,
    summary: rawJson.summary,
    category: rawJson.category || '\uc815\ubd80\uc9c0\uc6d0\uacf5\uace0',
    content: rawJson.content,
    notice_url: item.notice_url,
    deadline_date: rawJson.deadline || null,
    image_url: '',
    created_at: new Date().toISOString()
  };
};

const generateStrategicPost = async (item: any, deepContext: string) => {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
  const prompt = `분석 리포트를 작성하세요. JSON {title, summary, category, content, notice_url} 형태로만 답하세요.\n제목: ${item.title}\n상세: ${deepContext}`;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawJson = JSON.parse(jsonText);
  const titleStr = rawJson.title.indexOf('[전략]') === 0 ? rawJson.title : `[\uc814\ub7b5] ${rawJson.title}`;
  return {
    title: titleStr,
    summary: rawJson.summary,
    category: '\uc815\ubd80\uc9c0\uc6d0\uacf5\uace0',
    content: rawJson.content,
    notice_url: item.notice_url,
    deadline_date: null,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    created_at: new Date().toISOString()
  };
};

const generateGeneralPost = async (article: any, targetCategory: string) => {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
  const prompt = `전문 기사를 작성하세요. JSON {title, summary, category, content, notice_url} 형태로만 답하세요.\n제목: ${article.title}\n요약: ${article.description}`;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const rawJson = JSON.parse(jsonText);
  return {
    title: rawJson.title,
    summary: rawJson.summary,
    category: targetCategory,
    content: rawJson.content,
    notice_url: article.url,
    deadline_date: null,
    image_url: article.image || '',
    created_at: new Date().toISOString()
  };
};

export async function POST(request: Request) {
  try {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }
    const targetCategory = (body as any).targetCategory || '\uc815\ubd80\uc9c0\uc6d0\uacf5\uace0';
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const results = [];

    if (targetCategory === '\uc815\ubd80\uc9c0\uc6d0\uacf5\uace0') {
      const targets = await scrapeKStartup();
      for (const item of targets) {
        if (results.length >= 2) break;
        const sUrl = item.notice_url + "&mode=strategy";
        const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', sUrl).maybeSingle();
        if (dup) continue;
        const dc = await getDeepContext(item.notice_url);
        const post = await generateStrategicPost(item, dc);
        post.notice_url = sUrl;
        const { error } = await supabaseAdmin.from('posts').insert([post]);
        if (!error) results.push(post.title);
      }
    } else if (targetCategory === '\uc804\uccb4') {
      const targets = await scrapeKStartup();
      for (const item of targets) {
        if (results.length >= 2) break;
        const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', item.notice_url).maybeSingle();
        if (dup) continue;
        const dc = await getDeepContext(item.notice_url);
        const post = await generatePost(item, dc);
        const logo = getLogoByTitle(item.title);
        post.image_url = logo || '';
        const { error } = await supabaseAdmin.from('posts').insert([post]);
        if (!error) results.push(post.title);
      }
    } else {
      const externalNews = await fetchExternalNews(targetCategory);
      for (const article of externalNews) {
        if (results.length >= 2) break;
        const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', article.url).maybeSingle();
        if (dup) continue;
        const post = await generateGeneralPost(article, targetCategory);
        const { error } = await supabaseAdmin.from('posts').insert([post]);
        if (!error) results.push(post.title);
      }
    }
    if (results.length === 0) {
      return NextResponse.json({ error: 'No new information found matching the criteria.' }, { status: 404 });
    }

    return NextResponse.json({ generated: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}