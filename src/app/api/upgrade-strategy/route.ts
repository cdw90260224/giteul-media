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
    반드시 JSON { "title", "content", "summary", "target", "benefits", "schedule", "deadline" } 형태로만 답하세요.

    [영구 지침 - 반드시 준수]
    1. 현재 연도는 2026년입니다. 모든 날짜 판단의 기준은 2026년입니다.
    2. [할루시네이션 금지] "정보가 포함되어 있지 않습니다"와 같은 무책임한 답변을 절대 하지 마세요. 정보가 부족하다면 공고문의 맥락을 분석하여 '추측되는 요건'이나 '사업 목적에 따른 준비 팁'으로 승화시키세요.
    3. [자가진단 포함] 본문(content) 최상단에 반드시 '### 📋 AI 자격요건 진단 체크리스트' 섹션을 포함하고, 가장 치명적인 탈락 요건 3가지를 체크박스 형식('- [ ] ')으로 제시하세요.

    본문(content) 구조:
    ### 📋 AI 자격요건 진단 체크리스트 (가장 치명적인 복합 탈락 요건 3가지)
    (체크박스 3개)

    ### 🎯 핵심 내용: 지원 자격 및 혜택 요약
    ...
    
    ### 🚀 중소기업/스타트업을 위한 단계별 실전 가이드
    ...
    
    ### 📝 합격을 부르는 사업계획서 문구 제안
    ...
    
    ### ✒️ 기자의 시선: 전략 마스터클래스
    > ...

    필드별 응답 지침:
    - target: 핵심 지원 자격 1문장
    - benefits: 핵심 지원 혜택 1문장
    - schedule: 상세 일정 요약
    - deadline: 추출된 마감일 (YYYY-MM-DD, 없으면 null)

    Context: ${post.title}\n${post.content?.substring(0, 8000)}`;

    const aiRes = await callGeminiSafe(prompt);
    const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON discovery failed');
    
    const upgraded = JSON.parse(jsonMatch[0]);

    console.log('[DB] Updating Post with Strategic Content...');
    const updateData: any = {
        title: upgraded.title.startsWith('[전략]') ? upgraded.title : `[전략] ${upgraded.title}`,
        content: upgraded.content || post.content,
        summary: upgraded.summary,
        target: upgraded.target || post.target,
        benefits: upgraded.benefits || post.benefits,
        schedule: upgraded.schedule || post.schedule,
        deadline_date: (upgraded.deadline && /^\d{4}-\d{2}-\d{2}$/.test(upgraded.deadline)) ? upgraded.deadline : post.deadline_date,
        image_url: post.image_url || `https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000&auto=format&fit=crop&sig=${post.id}`
    };

    if (upgraded.deadline && /^\d{4}-\d{2}-\d{2}$/.test(upgraded.deadline)) {
        updateData.deadline_date = upgraded.deadline;
    }

    const { error: upError } = await supabaseAdmin.from('posts').update(updateData).eq('id', postId);

    if (upError) throw upError;

    console.log('[SUCCESS] Strategy Upgraded!');
    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    console.error('[CRITICAL-UPGRADE ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
