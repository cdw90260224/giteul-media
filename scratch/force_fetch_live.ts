import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

async function callGeminiSafe(prompt: string) {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function forceFetchNews(category: string) {
    console.log(`Force fetching: ${category}`);
    const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
    const newsDataCat = (category === 'AI/테크 트렌드') ? 'technology' : 'business';
    const res = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&country=kr&category=${newsDataCat}`);
    const data: any = await res.json();
    
    if (!data.results) return;

    for (const item of data.results.slice(0, 3)) {
        console.log(`Processing: ${item.title}`);
        const prompt = `당신은 비즈니스 분석가입니다. 아래 뉴스를 JSON { "title", "summary", "content" } 형식으로 요약하세요. 
        원문 제목: ${item.title}\n내용: ${item.description}`;
        
        try {
            const aiResponse = await callGeminiSafe(prompt);
            let jsonStr = aiResponse.trim();
            if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].replace(/^json/i, '').trim();
            const raw = JSON.parse(jsonStr);

            const postData = {
                title: raw.title,
                summary: `[${category}] ` + raw.summary,
                category: category,
                content: raw.content,
                notice_url: item.link,
                image_url: item.image_url || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
                created_at: new Date().toISOString()
            };

            await adminClient.from('posts').insert([postData]);
            console.log(`Inserted: ${raw.title}`);
        } catch (e) {
            console.error('Error processing item:', e);
        }
    }
}

async function run() {
    await forceFetchNews('AI/테크 트렌드');
    await forceFetchNews('글로벌 뉴스');
}

run();
