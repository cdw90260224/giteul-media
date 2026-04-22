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

const SECTORS: Record<string, string[]> = {
  '농업': ['농식품', '스마트팜', '귀농', '축산', '농수산', '농촌'],
  '기술/IT': ['AI', '플랫폼', '클라우드', '딥테크', '빅데이터', '인공지능', '소프트웨어', 'SW', 'IT', '기술개발', '테크', '디지털'],
  '소상공인': ['자영업', '시장', '소상공인', '로컬', '전통시장', '골목상권', '상점', '상인']
};

function detectSector(text: string): string {
  for (const [sector, keywords] of Object.entries(SECTORS)) {
    if (keywords.some(kw => text.includes(kw))) return sector;
  }
  return '일반';
}

async function callGeminiSafe(prompt: string) {
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
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

    const { data: existing } = await supabase.from('posts').select('id, title, notice_url');
    const limitForGov = limit === -1 ? targets.length : limit;
    
    // 중복 방지: 제목이나 URL이 같은 경우 정보를 '업데이트'할 대상으로 분류
    const targetsToProcess = targets.map(t => {
      const existingMatch = existing?.find(e => e.notice_url === t.url || e.title.includes(t.title.slice(0, 20)));
      return { ...t, existingId: existingMatch?.id };
    }).slice(0, limitForGov);
    
    if (targetsToProcess.length === 0) return [{ success: false, message: '처리할 공고가 없습니다.', code: 'NO_TARGETS' }];

    for (let i = 0; i < targetsToProcess.length; i++) {
        const item = targetsToProcess[i];
        
        // IP 차단 방지를 위한 인간다운 속도(Time Sleep) 부여 - 첫 번째 항목 이후부터 대기
        if (i > 0) {
            const delayms = Math.floor(Math.random() * 15000) + 15000; // 15초 ~ 30초 사이 랜덤 딜레이
            console.log(`[Crawling] IP 차단 방지를 위해 ${delayms/1000}초간 대기합니다...`);
            await sleep(delayms);
        }

        try {
            const sector = detectSector(item.title);
            const prompt = `당신은 대한민국 최고 수준의 기업 분석 기자이자 정부지원사업 전략 컨설턴트입니다. 
            단순한 요약이 아니라, 기업들에게 실질적인 '돈이 되는 정보'와 '합격 전략'을 제공해야 합니다.

            반드시 다음 JSON 형식을 엄격히 준수하여 응답하세요. 
            JSON 구조: { "title": "...", "summary": "...", "category": "정부지원공고", "content": "...", "notice_url": "...", "deadline": "YYYY-MM-DD 또는 상시 접수", "sector": "${sector}", "image_keyword": "업무와 관련된 대표 영문 키워드 1개 (예: business, agriculture, technology, store)" }

            --- 마크다운 작성(content) 및 텍스트 규정 ---
            1. 입력 제목에 섞여있는 지저분한 메타데이터(예: "사업화", "접수중", 중복된 텍스트, 기관명 등)를 절대 그대로 노출하거나 제목/목차로 사용하지 마세요. 깔끔하게 정제하세요.
            2. 불필요한 **두꺼운 글씨(Bold)** 남용을 완전히 금지합니다.
            3. 본문은 장황한 마크다운 기호 남용 없이, 다음 3가지 핵심 주제로만 깔끔하게 리스트 형태로 전개하세요:
               - 지원 대상 및 자격 요건
               - 핵심 혜택 및 지원 규모
               - 주요 일정 및 신청 방법
            4. 절대 마크다운 표(Table, | | |)를 생성하지 마세요. 테이블 모양 대신 가독성 높은 텍스트 나열형 리스트(Bullet points)를 사용하세요.
            5. 마지막에는 "### ✒️ 기자의 시선: 전략적 분석" 섹션을 반드시 포함하고, 인용구(> ) 포맷 안에 다음 내용을 담으세요:
               - [왜 주목해야 하는가?]: 이 공고의 파격적인 혜택이나 전략적 가치 분석
               - [당첨 확률을 높이는 핵심 포인트]: 사업계획서/발표 시 강조해야 할 유정(Winning Edge)
               - [이런 업체는 무조건 지원하세요]: 가장 유리한 기업 프로필 제안
            
            이미지 키워드는 공고 성격에 따라 'startup', 'finance', 'factory', 'global' 중 하나를 선택하세요.
            입력 원천 데이터: ${item.title}
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
            
            // 키워드 기반의 고해상도 Unsplash 이미지 매칭 (랜덤성 부여)
            const seed = Math.floor(Math.random() * 1000);
            const imageUrl = `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${seed}&${raw.image_keyword || 'business'}`;

            // 기존 데이터가 있으면 Update(Upsert), 없으면 Insert
            const postData = {
              title: raw.title, 
              summary: `[${raw.sector || sector}] ` + raw.summary, 
              category: '정부지원공고', 
              content: raw.content, 
              notice_url: item.url, 
              image_url: imageUrl,
              deadline_date: validatedDeadline, 
              created_at: new Date().toISOString()
            };

            if (item.existingId) {
              console.log(`[Pipeline] Updating existing post: ${item.existingId}`);
              await adminClient.from('posts').update(postData).eq('id', item.existingId);
              results.push({ success: true, title: raw.title, action: 'updated' });
            } else {
              await adminClient.from('posts').insert([postData]);
              results.push({ success: true, title: raw.title, action: 'inserted' });
            }
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

    const { data: existing } = await supabase.from('posts').select('id, title, notice_url');
    const targetsToProcess = articles.map(a => {
      const existingMatch = existing?.find(e => e.notice_url === a.url || e.title.includes(a.title.slice(0, 20)));
      return { ...a, existingId: existingMatch?.id };
    }).slice(0, limit);

    console.log(`[API] ${targetsToProcess.length} targets to process for ${targetCategory}`);

    if (targetsToProcess.length === 0) return [{ success: false, message: '처리할 기사가 없습니다.', code: 'NO_TARGETS' }];

    for (const item of targetsToProcess) {
        try {
            const fullText = item.title + ' ' + (item.description || '');
            const sector = detectSector(fullText);
            
            // 창업 뉴스 필터링 로직
            const startupKeywords = ['투자 유치', 'IR', '창업가 인터뷰', '스타트업 규제', '엑시트', 'Exit', '벤처캐피탈', 'VC', '엔젤투자', '스핀오프', 'M&A'];
            const isStartupNews = startupKeywords.some(kw => fullText.includes(kw));
            const finalCategory = isStartupNews ? '창업 뉴스' : targetCategory;

            const prompt = isStartupNews 
              ? `당신은 대한민국 최고의 스타트업 분석 기자이자 벤처캐피탈 리스트입니다. 아래 뉴스를 바탕으로 스타트업 대표와 예비 창업자들을 위한 전략 리포트를 작성하세요.
                 반드시 JSON { "title", "summary", "category": "창업 뉴스", "content", "notice_url", "sector": "${sector}" } 구조로 응답하세요.
                 
                 내용(content)은 마크다운으로 작성하되, 마지막에 "### ✒️ 기자의 시선: 스타트업 인사이트" 섹션을 포함하고 다음 내용을 분석하세요:
                 1. [기회 포인트]: 이 뉴스가 스타트업 생태계나 개별 창업자에게 주는 기회
                 2. [위기 및 주의사항]: 비즈니스 모델이나 규제 측면에서 대비해야 할 리스크
                 3. [창업자 대응 전략]: 지금 즉시 준비하거나 실행해야 할 구체적인 조언
                 
                 원문 제목: ${item.title}\n내용: ${item.description}\n출처: ${item.source}`
              : `당신은 글로벌 비즈니스 전문 기자이자 경제 분석가입니다. 아래 뉴스를 바탕으로 단순 보도가 아닌, 시장의 흐름을 꿰뚫는 전문적인 리포트를 작성하세요. 
                 JSON 구조: { "title": "...", "summary": "...", "category": "${targetCategory}", "content": "...", "notice_url": "...", "deadline": "null", "sector": "${sector}" }
                 
                 내용(content)은 마크다운으로 작성하고, 마지막에 "### ✒️ 기자의 시선: 시장 통찰" 평론을 인용구(> )와 함께 포함하세요. 
                 단순 요약이 아니라 '이 뉴스가 비즈니스 생태계에 미칠 파장'과 '기업들이 준비해야 할 대응 전략'을 날카롭게 서술하세요.
                 
                 원문 제목: ${item.title}\n내용: ${item.description}\n출처: ${item.source}`;

            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
            
            const postData = {
              title: raw.title,
              summary: `[${raw.sector || sector}] ` + raw.summary,
              category: raw.category || targetCategory,
              content: raw.content,
              notice_url: item.url,
              image_url: item.image,
              created_at: new Date().toISOString()
            };

            if (item.existingId) {
              console.log(`[Pipeline] Updating existing news item: ${item.existingId}`);
              await adminClient.from('posts').update(postData).eq('id', item.existingId);
              results.push({ success: true, title: raw.title, action: 'updated' });
            } else {
              const { error: insertError } = await adminClient.from('posts').insert([postData]);
              if (insertError) throw insertError;
              results.push({ success: true, title: raw.title, action: 'inserted' });
            }
            console.log(`[Pipeline] Successfully published/updated: ${raw.title}`);
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
      
      console.log(`[Background Cron] Starting at ${new Date().toISOString()}`);

      // 1. 정부지원공고 K-Startup 당일 전체 수집 전용 가동 (-1)
      const { sendNotification, formatBatchResult } = await import('@/lib/notifier');
      
      const govResults = await publishByCategory('정부지원공고', -1);

      const allResults = [...govResults];
      const summary = formatBatchResult(allResults);
      await sendNotification(summary);

      // [Newsletter Trigger] 수집 및 가공 직후 구독자들에게 맞춤 메일 발송
      console.log('[Pipeline] Triggering Newsletter Dispatch...');
      const { processAndSendNewsletter } = await import('@/lib/newsletter-engine');
      await processAndSendNewsletter();

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
    const result: any = results[0];
    if (!result.success) {
       return NextResponse.json({ error: result.message || result.error, code: result.code }, { status: result.code === 'ALREADY_PUBLISHED' ? 200 : 400 });
    }
    return NextResponse.json({ message: 'Success', title: result.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}