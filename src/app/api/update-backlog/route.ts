import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

async function generateStrategicContent(title: string, agency: string) {
    const prompt = `
# Role: 대한민국 창업 전략 전문가
# Task: 기존 공고 내용을 바탕으로 '사업계획서 실전 전략 리포트'로 재구성하라.

[대상 공고]
- 제목: ${title}
- 기관: ${agency}

[필수 구조 (Image 10)]
1. 제목: [전략] ${title} 합격을 위한 사업계획서 필승 공략
2. 본문 섹션:
   ## 1. 상세 리포트 및 시장 분석
   ## 2. 사업계획서 작성 전략 (필수)
      - [핵심 전략] 이 공고의 '합격 포인트' (배점 1줄 요약)
      - [실전 작성 가이드] 사업계획서 항목별(PSST) 공략
      - [치트키] 반드시 들어가야 할 '필수 키워드' (#태그 3~5개)
   ## 3. 팩트 체크

[포맷]: JSON {title, content, summary}. 마크다운 없이 순수 JSON만 응답하라.
`;

    let jsonText = '';
    if (ANTHROPIC_KEY) {
        const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
        const msg = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
        });
        jsonText = (msg.content[0] as any).text;
    } else if (GEMINI_KEY) {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        jsonText = result.response.text();
    }
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonText);
}

export async function GET(request: Request) {
  console.log(`[API TRIGGER] /api/update-backlog (GET) triggered at ${new Date().toISOString()}`);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  try {
    // 1. 소급 적용 대상 추출 (정부지원공고 카테고리 중 [전략] 타이틀이 없는 것들)
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id, title, category')
      .eq('category', '정부지원공고')
      .not('title', 'like', '[전략]%');

    if (error || !posts) return NextResponse.json({ message: 'No targets found' });

    console.log(`Migrating ${posts.length} articles...`);
    const results = [];

    for (const post of posts) {
        try {
            const upgraded = await generateStrategicContent(post.title, '주관기관');
            const { error: upError } = await supabaseAdmin
              .from('posts')
              .update({
                  title: upgraded.title,
                  content: upgraded.content,
                  summary: upgraded.summary
              })
              .eq('id', post.id);
            
            if (!upError) results.push(post.id);
        } catch (e) { console.error(`Failed ID ${post.id}:`, e); }
    }

    return NextResponse.json({ 
        message: 'Migration Complete', 
        processed: posts.length, 
        success_count: results.length 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
