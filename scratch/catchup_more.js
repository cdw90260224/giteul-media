const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_KEY = getEnv('GEMINI_API_KEY');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function detectSector(text) {
  const SECTORS = {
    '농업': ['농식품', '스마트팜', '귀농', '축산', '농수산', '농촌'],
    '기술/IT': ['AI', '플랫폼', '클라우드', '딥테크', '빅데이터', '인공지능', '소프트웨어', 'SW', 'IT', '기술개발', '테크', '디지털'],
    '소상공인': ['자영업', '시장', '소상공인', '로컬', '전통시장', '골목상권', '상점', '상인']
  };
  for (const [sector, keywords] of Object.entries(SECTORS)) {
    if (keywords.some(kw => text.includes(kw))) return sector;
  }
  return '일반';
}

async function callGeminiSafe(prompt) {
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro']; // Correct models
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e) { console.error(`AI Fail ${modelName}:`, e.message); continue; }
    }
}

async function catchupMore() {
    console.log('--- Comprehensive Catchup: K-Startup Top 20 ---');
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const targets = [];
    
    $('a').each((_, el) => {
        const link = $(el);
        const attrVal = link.attr('onclick') || link.attr('href') || '';
        const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
        if (snMatch) {
            const fullLinkText = link.text().trim();
            let dateMatch = fullLinkText.match(/(\d{4})[./-](\d{2})[./-](\d{2})/);
            let rawDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;

            let title = link.find('p.tit, .tit, dt, strong').first().text().trim() || link.text().trim();
            title = title.replace(/새로운게시글|D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+/gi, '').trim();

            if (title.length > 5 && !targets.find(t => t.sn === snMatch[1])) {
                targets.push({ title, sn: snMatch[1], rawDate, url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}` });
            }
        }
    });

    console.log(`Potential targets: ${targets.length}`);
    const { data: existing } = await supabase.from('posts').select('notice_url');
    const existingUrls = new Set(existing.map(e => e.notice_url));

    const newTargets = targets.filter(t => !existingUrls.has(t.url)).slice(0, 15);
    console.log(`Processing ${newTargets.length} NEW announcements...`);

    for (let i = 0; i < newTargets.length; i++) {
        const item = newTargets[i];
        console.log(`[${i+1}/${newTargets.length}] Processing: ${item.title}`);
        
        const sector = detectSector(item.title);
        const prompt = `당신은 기업 지원사업 큐레이터입니다. 현재 2026년입니다.
            공고에서 핵심 혜택, 대상, 일정을 추출하세요.
            마감일 팩트: [${item.rawDate || '알수없음'}]
            
            JSON: { "title", "summary", "content", "deadline", "image_keyword" }
            텍스트: ${item.title}`;

        const aiRes = await callGeminiSafe(prompt);
        try {
            const jsonStr = aiRes.match(/\{[\s\S]*\}/)[0];
            const raw = JSON.parse(jsonStr);
            const deadline = (raw.deadline && /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline)) ? raw.deadline : (item.rawDate || null);

            await supabase.from('posts').insert({
                title: raw.title,
                summary: `[${sector}] ` + raw.summary,
                category: '정부지원공고',
                content: raw.content,
                notice_url: item.url,
                deadline_date: deadline,
                image_url: `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${item.sn}&business`
            });
            console.log('  Success!');
        } catch (e) {
            console.error('  Parse Failed for:', item.title);
        }
        await sleep(3000); // Small delay to avoid AI limits
    }
}

catchupMore();
