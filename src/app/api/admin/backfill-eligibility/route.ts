import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  console.log('--- PRODUCTION BACKFILL START ---');
  
  if (!GEMINI_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json({ error: 'Environment variables missing on production' }, { status: 500 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    // 1. Fetch government support posts that don't have the checklist yet
    const { data: posts, error: fetchErr } = await supabaseAdmin
      .from('posts')
      .select('id, title, content, summary')
      .eq('category', '정부지원공고')
      .not('content', 'ilike', '%### 📋 AI 자가진단 체크리스트%')
      .order('created_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    let updatedCount = 0;
    const startTime = Date.now();

    for (const post of posts) {
      // Vercel timeout protection
      if (Date.now() - startTime > 50000) {
        console.log('[Timeout Protection] Stopping partial backfill.');
        return NextResponse.json({ 
          message: 'Timeout protection: Partial complete. Please refresh to continue.', 
          total_remaining: posts.length, 
          updated_this_run: updatedCount
        });
      }

      console.log(`[Backfill] Processing: ${post.title}`);

      const prompt = `당신은 대한민국 1등 경영 전략 컨설턴트입니다. 다음 정부지원공고 내용을 분석하여, 지원자가 본인의 적합성을 3초 만에 판단할 수 있는 [AI 자가진단 체크리스트]를 작성하세요.

공고 제목: ${post.title}
본문 요약: ${post.summary || ''}
상세 내용: ${post.content ? post.content.substring(0, 3000) : ''}

--- 작성 규칙 ---
1. 반드시 '### 📋 AI 자가진단 체크리스트'라는 대제목으로 시작하세요.
2. 그 아래에 지원 자격 및 탈락 요건을 기반으로 한 3가지 마크다운 체크리스트('- [ ] 질문?')를 작성하세요.
3. 질문은 반드시 두 가지 이상의 조건이 결합된 복합 질문("~이면서 ~입니까?") 형태여야 합니다.
4. 심사역 관점의 전문적인 비즈니스/법률 용어와 구체적인 수치를 포함하세요.
5. 오직 체크리스트 3줄만 출력하세요. 다른 설명이나 인사말은 절대 금지합니다.`;

      try {
        const result = await model.generateContent(prompt);
        const checklist = result.response.text().trim();
        
        if (checklist.includes('### 📋 AI 자가진단 체크리스트')) {
          const updatedContent = checklist + '\n\n' + post.content;
          const { error: upErr } = await supabaseAdmin
            .from('posts')
            .update({ content: updatedContent })
            .eq('id', post.id);
            
          if (!upErr) {
            updatedCount++;
            console.log(`[Backfill] Success: ${post.id}`);
          }
        }
      } catch (aiErr) {
        console.error(`[Backfill] AI Error for ${post.id}:`, aiErr);
      }
    }

    return NextResponse.json({ 
      message: 'All backfill completed successfully', 
      total_processed: posts.length, 
      updated: updatedCount
    });
  } catch (err: any) {
    console.error('[Backfill Critical Error]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
