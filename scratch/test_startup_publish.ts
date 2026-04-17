
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// 1. Env Loader
function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env: any = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    });
    return env;
}

async function run() {
    console.log('--- [STARTUP NEWS] Manual Generation Test ---');
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    // Mock Startup Source
    const item = {
        title: "에너지 테크 스타트업 '그린웨이브', 50억 규모 Pre-A 투자 유치... 대기업 협업 시동",
        description: "그린웨이브는 독자적인 탄소 배출 추적 알고리즘을 보유한 스타트업으로, 이번 투자를 통해 국내 주요 제조 대기업과의 ESG 협업 플랫폼을 고도화할 계획입니다. 중소기업 규제 샌드박스를 통과한 이력도 보유하고 있습니다.",
        source: "테크데일리"
    };

    console.log('1. Detecting Category & Prompting Gemini...');
    
    // Logic from route.ts
    const startupKeywords = ['투자 유치', 'IR', '창업가 인터뷰', '스타트업 규제', '엑시트', 'Exit', '벤처캐피탈', 'VC', '엔젤투자', '스핀오프', 'M&A'];
    const isStartupNews = startupKeywords.some(kw => item.title.includes(kw) || item.description.includes(kw));
    
    console.log(`Is Startup News? ${isStartupNews}`);

    const prompt = `당신은 대한민국 최고의 스타트업 분석 기자이자 벤처캐피탈 리스트입니다. 아래 뉴스를 바탕으로 스타트업 대표와 예비 창업자들을 위한 전략 리포트를 작성하세요.
                 반드시 JSON { "title", "summary", "category": "창업 뉴스", "content", "notice_url", "sector": "기술/IT" } 구조로 응답하세요.
                 
                 내용(content)은 마크다운으로 작성하되, 마지막에 "### ✒️ 기자의 시선: 스타트업 인사이트" 섹션을 포함하고 다음 내용을 분석하세요:
                 1. [기회 포인트]: 이 뉴스가 스타트업 생태계나 개별 창업자에게 주는 기회
                 2. [위기 및 주의사항]: 비즈니스 모델이나 규제 측면에서 대비해야 할 리스크
                 3. [창업자 대응 전략]: 지금 즉시 준비하거나 실행해야 할 구체적인 조언
                 
                 원문 제목: ${item.title}\n내용: ${item.description}\n출처: ${item.source}`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        let jsonStr = result.response.text().trim();
        if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
        const raw = JSON.parse(jsonStr);

        console.log('2. Generating High-Res Image...');
        const seed = Math.floor(Math.random() * 1000);
        const imageUrl = `https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop&sig=${seed}&startup`;

        const postData = {
            title: raw.title,
            summary: `[기술/IT] ` + raw.summary,
            category: '창업 뉴스',
            content: raw.content,
            notice_url: 'https://example.com/startup-news-test',
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };

        console.log('3. Inserting into Supabase...');
        const { data, error } = await supabase.from('posts').insert([postData]).select();
        
        if (error) throw error;
        console.log('SUCCESS! Article Published.');
        console.log(`URL: http://localhost:3000/article/${data[0].id}`);
    } catch (e: any) {
        console.error('FAILED:', e.message);
    }
}

run();
