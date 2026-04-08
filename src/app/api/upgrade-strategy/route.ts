import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// [유틸리티] 지연 함수 (Retry용)
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(request: Request) {
  let postId;
  try {
    const body = await request.json();
    postId = body.postId;
  } catch {
    return NextResponse.json({ error: '요청 본문 분석 오류.' }, { status: 400 });
  }

  if (!GEMINI_KEY || !SUPABASE_URL || !SERVICE_ROLE) 
    return NextResponse.json({ error: '서버 환경 변수(API KEY/SUPABASE ENV) 설정이 미니멈 상태입니다.' }, { status: 500 });

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  
  try {
    const { data: post, error: fetchErr } = await supabaseAdmin.from('posts').select('*').eq('id', postId).single();
    if (fetchErr || !post) return NextResponse.json({ error: `대상 기사(ID: ${postId})를 찾을 수 없습니다.` }, { status: 404 });

    const prompt = `
# Role: 전략 리포트 마스터
# Task: 다음 기사를 [전략] 리포트([핵심 전략/PSST 가이드/치트키])로 업그레이드하라.
# Context: ${post.title} / ${post.summary} / ${post.content?.substring(0, 3000)}
# Rule: 순수 JSON { "title", "content", "summary" }만 응답하라.
`;

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // [지능형 Retry 로직: 429 에러 방어]
    let result;
    let retryCount = 0;
    while (retryCount < 2) {
        try {
            result = await model.generateContent(prompt);
            break; // 성공 시 루프 탈출
        } catch (err: any) {
            if (err.message?.includes('429') && retryCount < 1) {
                console.log('429 Detection: Retrying in 3 seconds...');
                await sleep(3000); // 3초 대기 후 재시도
                retryCount++;
                continue;
            }
            throw err; // 다른 에러나 재시도 횟수 초과 시 투척
        }
    }

    if (!result) throw new Error('AI 분석 결과 수집 실패');
    const jsonText = result.response.text();
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 응답 데이터 분석 오류 (JSON Missing)');
    
    const upgraded = JSON.parse(match[0]);

    const { error: upError } = await supabaseAdmin.from('posts').update({
        title: upgraded.title,
        content: upgraded.content || post.content,
        summary: upgraded.summary
    }).eq('id', postId);

    if (upError) throw new Error(`업데이트 중 데이터베이스 오류: ${upError.message}`);

    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    let errMsg = err.message || '알 수 없는 엔진 오류';
    if (errMsg.includes('429')) errMsg = '구글 서버 사용량 제한(429)에 걸렸습니다. 1분 뒤 다시 시도해 주세요.';
    return NextResponse.json({ error: `[엔진 고장] ${errMsg}` }, { status: 500 });
  }
}
