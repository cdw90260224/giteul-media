const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim() || process.env[key] || '';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const geminiKey = getEnv('GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

// inline document parser
const pdfParse = require('pdf-parse');
const hwp = require('hwp.js');

if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

function extractHwpText(obj) {
  let text = '';
  if (typeof obj === 'string') return obj + ' ';
  if (Array.isArray(obj)) {
    for (const item of obj) text += extractHwpText(item);
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.text) {
      if (typeof obj.text === 'string') return obj.text + ' ';
      text += extractHwpText(obj.text);
    }
    if (obj.chars && Array.isArray(obj.chars)) {
        for (const char of obj.chars) {
            if (typeof char.text === 'string') text += char.text;
            else if (typeof char === 'string') text += char;
        }
        text += ' ';
    }
    for (const key of Object.keys(obj)) {
      if (key !== 'text' && key !== 'chars' && key !== 'header' && key !== 'docInfo' && key !== 'controls') {
        text += extractHwpText(obj[key]);
      }
    }
  }
  return text;
}

async function parseDocumentText(url, fileName) {
  try {
    const parsedUrl = new URL(url);
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0',
        'Referer': `${parsedUrl.protocol}//${parsedUrl.host}`
      } 
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') {
      try { return (await pdfParse(buffer)).text.replace(/\s+/g, ' ').trim(); } catch(e){}
    } else if (ext === 'hwp') {
      try {
        const doc = hwp.parse(buffer, { type: 'buffer' });
        return extractHwpText(doc.sections).replace(/\s+/g, ' ').trim();
      } catch(e){}
    }
    return null;
  } catch(e) { return null; }
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function callGeminiSafe(prompt) {
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    for (const modelName of models) {
        console.log(`[AI] Attempting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) return text;
        } catch (e) {
            console.error(`[AI] FAILED ${modelName}:`, e.message);
            if (e.message?.includes('429')) await sleep(2000);
        }
    }
    throw new Error('All Gemini models failed to respond.');
}

async function main() {
    console.log('Fetching active posts...');
    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, content, notice_url, summary')
        .eq('category', '정부지원공고')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch posts:', error.message);
        return;
    }

    console.log(`Found ${posts.length} recent posts. Filtering for attachments...`);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (!post.content.includes('### 📎 첨부파일')) {
            console.log(`[${i+1}/${posts.length}] SKIP: No attachments in "${post.title}"`);
            continue;
        }

        if (post.content.includes('최대 지원 금액') && post.content.includes('세부 지원 자격')) {
            console.log(`[${i+1}/${posts.length}] SKIP: Already seems parsed "${post.title}"`);
            continue;
        }

        console.log(`\n[${i+1}/${posts.length}] PROCESSING: "${post.title}"`);
        
        const linkRegex = /\[(.*?)\]\((https:\/\/www\.k-startup\.go\.kr.*?)\)/g;
        const attachments = [];
        let match;
        while ((match = linkRegex.exec(post.content)) !== null) {
            attachments.push({ name: match[1], url: match[2] });
        }

        let deepContext = '';
        const docFiles = attachments.filter(a => a.name.toLowerCase().endsWith('.pdf') || a.name.toLowerCase().endsWith('.hwp')).slice(0, 2);
        
        for (const docFile of docFiles) {
            console.log(`  -> Downloading: ${docFile.name}`);
            const text = await parseDocumentText(docFile.url, docFile.name);
            if (text && text.length > 50) {
                deepContext += `\n\n--- [첨부파일 내부 텍스트: ${docFile.name}] ---\n${text.slice(0, 8000)}`;
            }
        }

        if (!deepContext) {
            console.log(`  -> No valid text extracted. Will regenerate using existing body only.`);
        }

        const prompt = `당신은 대한민국 기업 지원사업 전문 큐레이터입니다.
이전에 작성된 아래 공고의 기존 본문과 첨부파일 내부 텍스트를 제공합니다.
이를 바탕으로 본문을 훨씬 더 자세하게 재생성하세요.

[content 작성 규칙]
지원대상, 지원혜택, 접수일정은 이미 별도 UI에 표시되므로 content 상단에서 반복하지 마세요.
마크다운(### H3 헤더)으로 다음 구조를 반드시 따르세요:
- 사업 개요 및 취지
- 트랙/유형별 세부 내용 (있는 경우)
- 선정절차 및 평가 방법
- 신청 방법 및 제출 서류
- 유의사항 및 제외 대상

[핵심 타겟 지시]
제공된 첨부파일 텍스트를 싹 다 읽고 다음 3가지를 무조건 뽑아서 기사 본문에 박아 넣으세요:
1) 최대 지원 금액 (명시되지 않은 경우 생략)
2) 세부 지원 자격 (업력, 나이, 지역 등 구체적인 요건)
3) 우대 사항 (가점 기준, 우대 대상 등)

[주의사항]
마지막에 기존 본문의 '### 📎 첨부파일' 섹션 및 내용(다운로드 링크)은 절대로 지우지 말고, 반드시 그대로 유지해서 포함시키세요!

반드시 다음 JSON 형식을 엄격히 준수하여 응답하세요.
JSON 구조: { "content": "새로 작성된 마크다운 기사 본문" }

입력 원천 데이터: ${post.title}
기존 요약: ${post.summary}
[기존 본문]
${post.content}

${deepContext}`;

        try {
            console.log(`  -> Generating AI content...`);
            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            if (raw.content) {
                const { error: updateError } = await supabase.from('posts').update({ content: raw.content }).eq('id', post.id);
                if (updateError) {
                    console.error(`  -> Failed to update DB:`, updateError.message);
                } else {
                    console.log(`  -> SUCCESS: DB Updated`);
                }
            }
        } catch (e) {
            console.error(`  -> ERROR:`, e.message);
        }
        await sleep(2000); // polite delay
    }
    console.log('Backfill finished.');
}

main();
