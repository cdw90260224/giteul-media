import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(request: Request) {
  let postId: any;
  try {
    const body = await request.json();
    postId = body.postId;
  } catch {
    return NextResponse.json({ error: '요청 본문 분석 오류' }, { status: 400 });
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  if (!GEMINI_KEY) return NextResponse.json({ error: '제미나이 키 누락' }, { status: 500 });

  try {
    // 1. 기존 기사 데이터 확보 (재할당이 가능하도록 let으로 선언)
    let post: any = null;
    const { data: stringPost } = await supabaseAdmin.from('posts').select('*').eq('id', postId.toString()).maybeSingle();
    
    if (stringPost) {
        post = stringPost;
    } else {
        // [재시도] 숫자로도 시도
        const { data: numericPost } = await supabaseAdmin.from('posts').select('*').eq('id', postId).maybeSingle();
        if (!numericPost) return NextResponse.json({ error: `기사를 찾을 수 없습니다. (ID: ${postId})` }, { status: 404 });
        post = numericPost;
    }

    const truncatedContent = (post.content || '').substring(0, 5000);

    const prompt = `
# Role: 대한민국 창업 전략 전문가
# Task: 다음 공고를 '사업계획서 실전 전략 리포트'로 업그레이드하라.

[대상 정보]
- 제목: ${post.title}
- 요약: ${post.summary}
- 원본 본문: ${truncatedContent}

[미션]
1. 제목: [전략] ${post.title.replace(/\[전략\]|\[공고\]|\[뉴스\]/g, '').trim()} 합격을 위한 사업계획서 실전 공략
2. 본문: 기존 본문 유지 + 하단에 [## 4. 사업계획서 실전 전략 리포트 🚀] 섹션 추가 (핵심 전략/합격 포인트/PSST 가이드/치트키 필수)
3. 출력: { "title": "...", "content": "...", "summary": "..." } 순수 JSON만 응답하라.
`;

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    let jsonText = result.response.text();

    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 분석 실패 (JSON 미생성)');
    const upgraded = JSON.parse(match[0]);

    // 4. 업데이트
    const { error: upError } = await supabaseAdmin.from('posts').update({
        title: upgraded.title,
        content: upgraded.content,
        summary: upgraded.summary
    }).eq('id', post.id); // post.id가 확실한 타입입니다.

    if (upError) throw new Error(`업데이트 실패: ${upError.message}`);

    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
