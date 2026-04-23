import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Load Env
function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env: any = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim().replace(/^"(.*)"$/, '$1');
    });
    return env;
}

const env = getEnv();
const GEMINI_KEY = env.GEMINI_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
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
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    for (const modelName of models) {
        process.stdout.write(`[AI] Attempting ${modelName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) {
                process.stdout.write(`SUCCESS\n`);
                return text;
            }
        } catch (e: any) {
            process.stdout.write(`FAILED: ${e.message}\n`);
            if (e.message?.includes('429')) await sleep(2000);
            continue;
        }
    }
    throw new Error('All Gemini models failed to respond.');
}

async function catchupGov() {
    console.log('--- STARTING CATCHUP: 정부지원공고 ---');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
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

    console.log(`Scraped ${targets.length} targets from K-Startup.`);
    if (targets.length === 0) return;

    const { data: existing } = await supabase.from('posts').select('id, title, notice_url');
    const targetsToProcess = targets.filter(t => {
        const isDup = existing?.some(e => e.notice_url === t.url || e.title.includes(t.title.slice(0, 20)));
        return !isDup;
    }).slice(0, 5); // Limit to 5 for now to be safe

    console.log(`${targetsToProcess.length} new items to process.`);

    for (let i = 0; i < targetsToProcess.length; i++) {
        const item = targetsToProcess[i];
        console.log(`\nProcessing [${i+1}/${targetsToProcess.length}]: ${item.title}`);
        
        try {
            const sector = detectSector(item.title);
            const prompt = `당신은 대한민국 최고 수준의 기업 분석 기자이자 정부지원사업 전략 컨설턴트입니다. 
            단순한 요약이 아니라, 기업들에게 실질적인 '돈이 되는 정보'와 '합격 전략'을 제공해야 합니다.
            반드시 다음 JSON 형식을 엄격히 준수하여 응답하세요. 
            JSON 구조: { "title": "...", "summary": "...", "category": "정부지원공고", "content": "...", "notice_url": "...", "deadline": "YYYY-MM-DD 또는 상시 접수", "sector": "${sector}", "image_keyword": "business" }
            
            원문 데이터: ${item.title}
            공고URL: ${item.url}`;

            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const seed = Math.floor(Math.random() * 1000);
            const imageUrl = `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${seed}&business`;

            const postData = {
              title: raw.title, 
              summary: `[${raw.sector || sector}] ` + raw.summary, 
              category: '정부지원공고', 
              content: raw.content, 
              notice_url: item.url, 
              image_url: imageUrl,
              deadline_date: (raw.deadline && /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline)) ? raw.deadline : null, 
              created_at: new Date().toISOString()
            };

            const { error: insErr } = await supabase.from('posts').insert([postData]);
            if (insErr) console.error('Insert Error:', insErr.message);
            else console.log('Successfully inserted.');

            // Delay to avoid IP block or rate limit
            await sleep(2000);
        } catch (err: any) {
            console.error('Error processing item:', err.message);
        }
    }
}

catchupGov();
