import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  let postId;
  try {
    const body = await request.json();
    postId = body.postId;
  } catch {
    return NextResponse.json({ error: '데이터 전송 규격 오류.' }, { status: 400 });
  }

  // [환경 변수 자가 진단]
  if (!GEMINI_KEY) return NextResponse.json({ error: '배포 서버에 GEMINI_API_KEY 설정이 누락되었습니다.' }, { status: 500 });
  if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Supabase 서버 연결 설정(ENV)이 누락되었습니다.' }, { status: 500 });

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
  
  try {
    const { data: post, error: fetchErr } = await supabaseAdmin.from('posts').select('*').eq('id', postId).single();
    if (fetchErr || !post) return NextResponse.json({ error: `기사(ID: ${postId})를 DB에서 찾을 수 없습니다.` }, { status: 404 });

    // [속도 최적화 프롬프트] Vercel 10초 컷을 위해 핵심만 요약 요청
    const prompt = `
# Role: 수석 창업 전략가
# Task: 기사를 분석하여 '필승 전략 패키지'를 하단에 추가하라. (최대한 압축해서 빠르게 응답!)

[공고]: ${post.title}
[요약]: ${post.summary}
[본문스크랩]: ${(post.content || '').substring(0, 3000)}

[필수 구조] 
- 제목: [전략] ${post.title.replace(/\[전략\]|\[공고\]|\[뉴스\]/g, '').trim()} 실전 공략
- 본문 덧붙임:
  ## 4. 실전 전략 리포트 (Strategic Upgrade) 🚀
  - [핵심 전략] 합격 포인트 1줄 요약
  - [실전 가이드] PSST 항목별 공략 (Problem/Solution/Team 위주)
  - [치트키] 필수 키워드 3~5개 (#태그)

[포맷]: 오직 { "title": "...", "content": "...", "summary": "..." } 순수 JSON만 응답하라. 서술어는 생략하고 핵심만 기술하여 속도를 높여라.
`;

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const jsonText = result.response.text();

    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 분석 결과가 올바르지 않습니다. (JSON 미생성)');
    const upgraded = JSON.parse(match[0]);

    const { error: upError } = await supabaseAdmin.from('posts').update({
        title: upgraded.title,
        content: upgraded.content || post.content + (upgraded.append_content || ''),
        summary: upgraded.summary
    }).eq('id', postId);

    if (upError) throw new Error(`업데이트 중 데이터베이스 오류: ${upError.message}`);

    return NextResponse.json({ message: 'Success' });
  } catch (err: any) {
    return NextResponse.json({ error: `[엔진 내부 오류] ${err.message}` }, { status: 500 });
  }
}
