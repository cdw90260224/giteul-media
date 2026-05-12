
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC-8GVV3wRqHzhoQpMZ7BmQXvbCnhtXXo4';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fvvmgrtkgblwmulowuki.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

async function backfill() {
    console.log('--- BACKFILLING SUPPORT SCALE ---');
    const { data: posts } = await supabase
        .from('posts')
        .select('id, title, content, insight_summary')
        .eq('category', '정부지원공고')
        .is('insight_summary', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (!posts || posts.length === 0) {
        console.log('No posts to backfill.');
        return;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    for (const post of posts) {
        console.log(`Analyzing: ${post.title}`);
        const prompt = `다음 정부지원공고의 본문에서 '지원 금액' 또는 '지원 규모'를 찾아 짧게 한 줄로 요약하세요. (예: 최대 1억원, 팀당 5천만원 등). 만약 금액 정보가 전혀 없다면 '별도 문의'라고 답하세요. 반드시 결과만 한 줄로 출력하세요.\n\n제목: ${post.title}\n본문: ${post.content?.substring(0, 1000)}`;
        
        try {
            const result = await model.generateContent(prompt);
            const scale = result.response.text().trim();
            console.log(`-> Result: ${scale}`);

            await supabase.from('posts').update({ insight_summary: scale }).eq('id', post.id);
        } catch (e) {
            console.error(`Failed for ${post.id}:`, e.message);
        }
    }
    console.log('--- BACKFILL COMPLETE ---');
}

backfill();
