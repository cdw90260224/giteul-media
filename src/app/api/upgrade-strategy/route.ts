import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callGeminiSafe(prompt: string) {
    const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    for (const modelName of models) {
        console.log(`[AI-Upgrade] Attempting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) {
                console.log(`[AI-Upgrade] SUCCESS with ${modelName}`);
                return text;
            }
        } catch (e: any) {
            console.error(`[AI-Upgrade] FAILED ${modelName}:`, e.message);
            if (e.message?.includes('429')) await sleep(2000);
            continue;
        }
    }
    throw new Error('All Gemini models failed for upgrade.');
}

export async function POST(request: Request) {
  console.log('--- STRATEGY UPGRADE START ---');
  try {
    const { postId } = await request.json();
    if (!GEMINI_KEY || !SUPABASE_URL || !SERVICE_ROLE) throw new Error('Env vars missing');

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: post, error: fetchErr } = await supabaseAdmin.from('posts').select('*').eq('id', postId).single();
    if (fetchErr || !post) throw new Error('Post not found');

    console.log(`[Upgrade] Targeting: ${post.title}`);

    const prompt = `당신은 대한민국 1등 경영 전략 컨설턴트입니다. 다음 기사 내용을 기반으로, 기업들이 즉시 실행 가능한 [전략 리포트]를 작성하세요.
    반드시 JSON { "title", "content", "summary" } 형태로만 답하세요.

    --- 텍스트 정제 및 마크다운 작성 핵심 규칙 ---
    1. "사업화", "창업진흥원", "모집공고 중복 기입" 등 K-Startup 크롤링에서 딸려온 지저분한 메타데이터 문자열을 절대 그대로 노출하거나 목차 제목으로 사용하지 마세요. 의미없는 노이즈는 전부 삭제하고 깔끔하게 정제하세요.
    2. 눈을 피로하게 만드는 불필요한 **두꺼운 글씨(Bold)** 남용을 전면 금지합니다.
    3. 본문은 잡다한 마크다운 헤더로 도배하지 말고, 요약된 깔끔한 서술형 리스트(Bullet points) 중심으로 전개하세요.
    4. [매우 중요] 내용을 요약할 때 절대 마크다운 표(Table, | | | 형식)를 사용하지 마세요. 텍스트가 격자(그리드) 안에 갇히면 가독성이 떨어집니다.
    ---------------------------------

    내용(content)은 마크다운으로 작성하며 다음 요소를 포함하세요:
    - 이 기사/공고의 핵심 내용 (지원자격 및 혜택 요약)
    - 중소기업/스타트업을 위한 단계별 실전 실행 가이드
    - 합격을 부르는 사업계획서 문구 제안 작성법
    
    마지막엔 반드시 "### ✒️ 기자의 시선: 전략 마스터클래스" 섹션을 인용구(> )와 함께 추가하고, 컨설턴트급 통찰력을 담아 날카로운 조언을 작성하세요.
    Context (파편화된 원본 텍스트입니다. 예쁘게 다듬으세요): ${post.title} / ${post.content?.substring(0, 3000)}`;

    const aiRes = await callGeminiSafe(prompt);
    const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON discovery failed');
    
    const upgraded = JSON.parse(jsonMatch[0]);

    console.log('[DB] Updating Post with Strategic Content...');
    const { error: upError } = await supabaseAdmin.from('posts').update({
        title: upgraded.title.startsWith('[전략]') ? upgraded.title : `[전략] ${upgraded.title}`,
        content: upgraded.content || post.content,
        summary: upgraded.summary,
        image_url: post.image_url || `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${post.id}&business,strategy`
    }).eq('id', postId);

    if (upError) throw upError;

    console.log('[SUCCESS] Strategy Upgraded!');
    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    console.error('[CRITICAL-UPGRADE ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
