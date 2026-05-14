import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { after } from 'next/server';
import { parseDocumentText } from '@/lib/document-parser';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const SECTORS: Record<string, string[]> = {
  'AI/빅데이터': ['AI', '인공지능', '빅데이터', '데이터', '머신러닝', 'LLM', '딥러닝', '챗봇'],
  'SaaS/플랫폼': ['SaaS', '플랫폼', '클라우드', '소프트웨어', '앱', '웹', 'B2B', '솔루션'],
  '바이오/헬스케어': ['바이오', '헬스케어', '의료', '신약', '제약', '의료기기', '의생명', '건강'],
  '친환경/에너지': ['친환경', '에너지', 'ESG', '탄소', '그린', '배터리', '재생', '에코', '태양광'],
  '로봇/모빌리티': ['로봇', '모빌리티', '드론', '자율주행', '자동차', '항공', '이동체', '전동'],
  '소부장/제조': ['소부장', '제조', '소재', '부품', '장비', '하드웨어', '공장', '양산', '뿌리산업'],
  '핀테크/블록체인': ['핀테크', '블록체인', '금융', '코인', '결제', '토큰', '페이', '가상자산'],
  '콘텐츠/게임': ['콘텐츠', '게임', '웹툰', '애니', '미디어', '엔터', '크리에이터', '방송', '예술'],
  '푸드/애그테크': ['푸드', '애그', '농업', '스마트팜', '식품', '외식', '푸드테크', '농촌']
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

    // [핵심 수정] li 단위로 파싱하여 마감일자를 정확히 추출
    $('li').each((_, el) => {
      const li = $(el);
      const liText = li.text().replace(/\s+/g, ' ').trim();
      
      // li 내부에서 공고 SN 추출
      let sn: string | null = null;
      li.find('a').each((_, aEl) => {
        const attr = $(aEl).attr('onclick') || $(aEl).attr('href') || '';
        const m = attr.match(/pbancSn=(\d+)/) || attr.match(/go_view\('?(\d+)'?\)/);
        if (m) sn = m[1];
      });
      if (!sn) return;
      
      // 마감일자를 명시적으로 타겟 (등록일자, 시작일자와 혼동 방지)
      let extractedDate: string | null = null;
      const deadlineMatch = liText.match(/마감일자\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
      if (deadlineMatch) {
        extractedDate = `${deadlineMatch[1]}-${deadlineMatch[2]}-${deadlineMatch[3]}`;
      }
      
      // 제목 추출
      let title = li.find('p.tit, .tit, dt, strong').first().text().trim();
      if (!title) {
        const linkEl = li.find('a').first();
        title = linkEl.find('p.tit, .tit, dt, strong').first().text().trim() || linkEl.text().trim();
      }
      
      // 제목 정제 (원문의 메타데이터 제거)
      title = title.replace(/새로운게시글|D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+|조회\s*[\d,]+/gi, '').replace(/\s+/g, ' ').trim();
      
      if (title && title.length > 5 && !targets.find(t => t.sn === sn)) {
        targets.push({ 
          title, 
          sn, 
          url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${sn}`,
          rawDate: extractedDate 
        });
        if (extractedDate) {
          console.log(`[LIST] ✅ "${title}" → 마감: ${extractedDate}`);
        } else {
          console.log(`[LIST] ⚠️ "${title}" → 마감일 미발견 (상세 페이지에서 재시도 예정)`);
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
        
        // IP 차단 방지를 위한 인간다운 속도(Time Sleep) 부여
        if (i > 0) {
            const delayms = Math.floor(Math.random() * 5000) + 5000; // 지시대로 5~10초 대기 (테스트 효율을 위해 약간 단축)
            console.log(`[Crawling] IP 차단 방지를 위해 ${delayms/1000}초간 대기합니다...`);
            await sleep(delayms);
        }

        try {
            const sector = detectSector(item.title);

            // [핵심] 상세 페이지 항상 스크래핑 — 마감일 + 신청대상/지원내용/접수기간 직접 추출
            let confirmedDeadline = item.rawDate;
            let parsedTarget: string | null = null;
            let parsedBenefits: string | null = null;
            let parsedSchedule: string | null = null;
            let deepContext = '';

            try {
              console.log(`[Detail] 상세 페이지 딥 크롤링: ${item.sn}`);
              const detailRes = await fetch(item.url, { headers: FETCH_HEADERS, cache: 'no-store' });
              const detailHtml = await detailRes.text();
              const $d = cheerio.load(detailHtml);
              const detailText = $d('body').text().replace(/\s+/g, ' ');

              // JS/시스템 코드 제거 후 구조화된 라벨-값 쌍 추출
              $d('script, style, nav, header, footer, .gnb, .lnb').remove();
              const structuredPairs: string[] = [];
              $d('dt, th').each((_, el) => {
                const label = $d(el).text().replace(/\s+/g, ' ').trim();
                const value = $d(el).next().text().replace(/\s+/g, ' ').trim();
                if (label && value && value.length > 2) {
                  structuredPairs.push(`[${label}]: ${value.slice(0, 800)}`);
                }
              });
              deepContext = structuredPairs.length > 0 
                ? structuredPairs.join('\n\n')
                : $d('main, .content, .view, article, .detail').first().text().replace(/\s+/g, ' ').trim().slice(0, 6000);

              // 마감일 추출
              if (!confirmedDeadline) {
                const receptionMatch = detailText.match(/접수기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
                if (receptionMatch) {
                  confirmedDeadline = `${receptionMatch[4]}-${receptionMatch[5]}-${receptionMatch[6]}`;
                } else {
                  const applyMatch = detailText.match(/신청기간\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/);
                  if (applyMatch) confirmedDeadline = `${applyMatch[4]}-${applyMatch[5]}-${applyMatch[6]}`;
                }
              }

              // [직접 파싱] 신청대상 / 지원내용 / 접수기간 / 첨부파일 추출
              const extractField = (labels: string[]): string | null => {
                let result: string | null = null;
                $d('dt, th, .tit, label').each((_, el) => {
                  const label = $d(el).text().replace(/\s+/g, ' ').trim();
                  for (const kw of labels) {
                    if (label.includes(kw)) {
                      const value = $d(el).next().text().replace(/\s+/g, ' ').trim();
                      if (value && value.length > 2 && (!result || value.length > result.length)) {
                        result = value.slice(0, 500);
                      }
                    }
                  }
                });
                return result;
              };

              parsedTarget = extractField(['신청대상', '지원대상', '모집대상', '신청자격', '지원자격', '참여대상', '참가자격']);
              parsedBenefits = extractField(['지원내용', '지원규모', '지원금액', '사업내용', '혜택', '지원사항']);
              parsedSchedule = extractField(['접수기간', '신청기간', '모집기간']);

              // [첨부파일 추출]
              const attachments: {name: string, url: string}[] = [];
              $d('a.file_bg').each((_, el) => {
                const fileName = $d(el).text().trim();
                const downloadBtn = $d(el).parent().find('a.btn_down:not(.btn_downAll)');
                let href = downloadBtn.attr('href');
                if (fileName && href) {
                  if (!href.startsWith('http')) href = `https://www.k-startup.go.kr${href}`;
                  attachments.push({ name: fileName, url: href });
                }
              });

              if (attachments.length > 0) {
                const attachmentMd = "\n\n### 📎 첨부파일\n" + attachments.map(a => `- [${a.name}](${a.url})`).join('\n');
                deepContext += attachmentMd; // AI에게도 기본 링크 정보를 줌
                
                // 첨부파일 중 PDF와 HWP를 파싱 (최대 2개까지만)
                const docFiles = attachments.filter(a => a.name.toLowerCase().endsWith('.pdf') || a.name.toLowerCase().endsWith('.hwp')).slice(0, 2);
                for (const docFile of docFiles) {
                  console.log(`[Document] 첨부파일 텍스트 파싱 시도: ${docFile.name}`);
                  const docText = await parseDocumentText(docFile.url, docFile.name);
                  if (docText && docText.length > 50) {
                    const truncatedText = docText.slice(0, 8000); // 토큰 제한 방지
                    deepContext += `\n\n--- [첨부파일 내부 텍스트: ${docFile.name}] ---\n${truncatedText}`;
                    console.log(`[Document] 첨부파일 파싱 완료 (${docFile.name}) - ${truncatedText.length}자`);
                  } else {
                    console.log(`[Document] 파싱 실패 또는 내용이 너무 짧음 (${docFile.name})`);
                  }
                }
              }

              console.log(`[Detail] ✅ 크롤링 완료 | 대상: ${parsedTarget ? '✓' : '✗'} | 혜택: ${parsedBenefits ? '✓' : '✗'} | 파일: ${attachments.length}개`);
              await sleep(1000);
            } catch (detailErr: any) {
              console.warn(`[Detail] 상세 페이지 스크래핑 실패: ${detailErr.message}`);
            }

            const prompt = `당신은 대한민국 기업 지원사업 전문 큐레이터입니다. 

            [영구 지침 - 반드시 준수]
            1. 현재 연도는 2026년입니다. 모든 날짜 계산 및 판단의 기준은 2026년입니다.
            2. 마감일자(D-Day)는 서비스 신뢰도의 핵심입니다. 추출된 마감일 [${confirmedDeadline || '알 수 없음'}] 이 있다면 반드시 사수하세요. 귀찮아서 '상시 접수'라고 쓰는 것을 엄격히 금지합니다.
            3. 카테고리는 반드시 '정부지원공고'로 설정하세요.

            [할루시네이션 및 면피성 문구 절대 금지]
            - "정보가 포함되어 있지 않습니다", "알 수 없음", "확인 필요", "예상됩니다" 같은 문구를 절대 사용하지 마세요. 
            - 정보가 부족하다면 공고문의 맥락을 분석하여 '추측되는 요건'이나 '사업 목적에 따른 준비 팁'으로 승화시켜 작성하세요.

            [content 및 리치 데이터 작성 규칙]
            1. 반드시 본문 최상단에 '### 📋 AI 자가진단 체크리스트'라는 대제목을 만들고, 그 아래에 첨부파일을 딥리딩하여 도출한 '가장 치명적인 복합 탈락 요건' 3가지를 체크박스 형식('- [ ] ')으로 작성하세요.
            2. 지원 대상(target), 혜택(benefits), 일정(schedule)은 각각 1문장으로 핵심만 요약하세요.
            3. 본문 하단에 반드시 '### 📎 첨부파일' 섹션이 포함되도록 하세요.
            
            JSON 구조: { 
              "title", "summary", "category": "정부지원공고", "content", "deadline", "sector", "target", "benefits", "schedule" 
            }

            입력 원천 데이터: ${item.title}
            ${deepContext ? `\n[상세 본문]\n${deepContext}` : ''}`;

            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            // 우리가 파싱한 날짜가 무조건 최우선. AI 날짜는 최후의 수단.
            let finalDeadline = confirmedDeadline || ((raw.deadline && dateRegex.test(raw.deadline)) ? raw.deadline : null);

            if (finalDeadline) {
              const today = new Date('2026-05-14'); // [CRITICAL] 2026년 기준
              today.setHours(0, 0, 0, 0);
              const deadlineDate = new Date(finalDeadline);
              
              if (deadlineDate < today) {
                console.warn(`[Pipeline] Expired deadline: ${raw.title} (${finalDeadline}). Setting to null.`);
                finalDeadline = null;
              }
            }
            
            console.log(`[Pipeline] 최종: 마감=${finalDeadline || 'NULL'} | 대상=${parsedTarget || raw.target ? 'OK' : 'NULL'}`);

            const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
            
            const imageIds = [
              '1519389403731-ca2119f28eb1', '1497366216548-37526070297c', '1542744173-8e7e5141b2b1', '1460925895917-afdab827c52f', 
              '1454165833222-d29f404f3db2', '1556761175-b413da4baf72', '1522071823991-b96c0d3e174b', '1557804506-669a67965ba0', 
              '1551434678-e076c223a692', '1504384308090-c894fdcc538d', '1552664730-d307ca884978', '1531482615713-2afd69097998',
              '1559136555-9303baea8ebd', '1517048676732-d65bc937f952', '1516321318423-f06f85e504b3', '1521791136064-7986c2920216',
              '1517245326844-010dffc1096e', '1541746972996-4e0b0f43e02a', '1486406146926-c627a92ad1ab', '1450101496173-eb415183c382'
            ];
            const randomImgId = imageIds[Math.floor(Math.random() * imageIds.length)];
            const imageUrl = `https://images.unsplash.com/photo-${randomImgId}?q=80&w=1000&auto=format&fit=crop`;

            // [핵심] 스크래핑 데이터(parsedTarget 등)가 없을 경우 AI 추출 데이터(raw.target 등)를 폴백으로 사용
            const postData = {
              title: raw.title, 
              summary: raw.summary.startsWith('[') ? raw.summary : `[${raw.sector?.split(',')[0] || '일반'}] ` + raw.summary, 
              category: '정부지원공고', 
              content: raw.content, 
              notice_url: item.url, 
              image_url: imageUrl,
              deadline_date: finalDeadline, 
              target: parsedTarget || raw.target,
              benefits: parsedBenefits || raw.benefits,
              schedule: parsedSchedule || raw.schedule,
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

      // 1. 정부지원공고 K-Startup 당일 전체 수집 전용 가동 (-1) - 매일 수행
      const { sendNotification, formatBatchResult } = await import('@/lib/notifier');
      const govResults = await publishByCategory('정부지원공고', -1);

      // 2. 테크 및 글로벌 뉴스 수집 (사용자 요청에 따라 3일에 한 번 수행)
      let newsResults: any[] = [];
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      
      if (dayOfYear % 3 === 0) {
        console.log('[Background Cron] 3-day cycle matched. Fetching Tech and Global news...');
        const techResults = await publishByCategory('AI/테크 트렌드', 5);
        const globalResults = await publishByCategory('글로벌 뉴스', 3);
        newsResults = [...techResults, ...globalResults];
      } else {
        console.log('[Background Cron] Not a news fetch day (3-day cycle). Skipping Tech/Global news.');
      }

      const allResults = [...govResults, ...newsResults];
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