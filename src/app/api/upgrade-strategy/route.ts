import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callGeminiSafe(prompt: string) {
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
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

    const prompt = `당신은 전략 컨설턴트입니다. 다음 기사를 [전략] 리포트로 업그레이드하세요. 
    반드시 JSON { "title", "content", "summary" } 형태로만 답하세요.
    내용은 마크다운으로 작성하고, 전략적 분석과 PSST 가이드를 포함하세요.
    마지막엔 반드시 "### 기자의 시선"을 인용구(> )로 포함하세요.
    Context: ${post.title} / ${post.content?.substring(0, 3000)}`;

    const aiRes = await callGeminiSafe(prompt);
    const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON discovery failed');
    
    const upgraded = JSON.parse(jsonMatch[0]);

    console.log('[DB] Updating Post...');
    const { error: upError } = await supabaseAdmin.from('posts').update({
        title: upgraded.title.startsWith('[전략]') ? upgraded.title : `[전략] ${upgraded.title}`,
        content: upgraded.content || post.content,
        summary: upgraded.summary
    }).eq('id', postId);

    if (upError) throw upError;

    console.log('[SUCCESS] Strategy Upgraded!');
    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    console.error('[CRITICAL-UPGRADE ERROR]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
