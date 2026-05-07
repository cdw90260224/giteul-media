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
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: 'application/json' }
            });
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
    1. [위계 엄수] 대제목은 반드시 '### '로 시작해야 합니다. '✦' 같은 이상한 특수문자나 이모지를 헤더 대신 사용하지 마세요. 
    2. 내용 전개는 본문 텍스트와 표준 불릿('- ')을 조합하여 단정하고 깔끔하게 구성하세요.
    3. 불필요한 **두꺼운 글씨(Bold)** 남용과 표(Table) 사용을 전면 금지합니다.
    4. K-Startup 크롤링 메타데이터 노이즈("모집공고 중복 기입" 등)는 무시하고 삭제하세요.
    5. 영문 텍스트(예: G Expert Opinion)를 불필요하게 섞어 쓰지 말고 자연스러운 한국어로 작성하세요.
    ---------------------------------

    내용(content)은 다음 4개의 대제목(###) 구조를 반드시 그대로 복사하여 그 아래에 내용을 채워 넣으세요:
    
    ### 🎯 핵심 내용: 지원 자격 및 혜택 요약
    (여기에 내용을 작성하세요)
    
    ### 🚀 중소기업/스타트업을 위한 단계별 실전 가이드
    (1단계~4단계 등의 구체적인 실행 가이드를 작성하세요)
    
    ### 📝 합격을 부르는 사업계획서 문구 제안
    (실제 사업계획서에 복붙할 수 있는 [문제 정의], [자원 활용 계획], [기대 효과] 등의 구체적인 템플릿 문구를 제공하세요)
    
    ### ✒️ 기자의 시선: 전략 마스터클래스
    > (이 사업이 가지는 진짜 의미와, 타사 대비 차별화할 수 있는 날카로운 컨설턴트의 핵심 조언을 마크다운 인용구 형태로 작성하세요)

    Context (원본 텍스트입니다): ${post.title} / ${post.content?.substring(0, 3000)}`;

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
