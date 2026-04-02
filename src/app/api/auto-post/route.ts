import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!GEMINI_KEY) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // GEO Rules Prompt Integration
    const prompt = `
      너는 프리미엄 B2B 경제 미디어 '기틀(基틀)'의 시니어 리서치 에이전트이며, 구글의 최신 모델인 Gemini 2.5를 사용하고 있어.
      아래의 'GEO 집필 규칙'을 100% 준수하여 기사를 작성해줘.
      
      [주제] "2026년 상반기 IPO 대어 TOP 3 재무 분석" (또는 이와 유사한 고가치 B2B 주제)
      
      [GEO 집필 규칙]
      1. AI 요약 박스: 기사 시작 전, 핵심 내용을 반드시 3문장으로 요약하여 <div style='background-color: #f8fafc; border-left: 4px solid #002B5B; padding: 20px; margin-bottom: 30px;'> 박스 안에 넣어줘.
      2. 데이터 표(Table): 본문 중간에 수치 데이터(매출액, 투자금, Valuation 등)를 반드시 <table> 태그를 이용한 표 형태로 삽입해줘.
      3. 전문 용어: 일반적인 단어 대신 '시리즈 B 라운드', 'Post-money Value', 'ARR', 'Burn Rate' 등 전문 금융/비즈니스 용어를 사용해줘.
      
      결과물은 반드시 아래의 JSON 형식으로만 응답해줘:
      {
        "title": "기사 제목",
        "summary": "핵심 분석 요약",
        "category": "시장 분석 / IPO 리서치 / 스타트업 M&A 중 택 1",
        "content": "위 GEO 규칙이 적용된 HTML 코드 전체",
        "image_url": "Unsplash 비즈니스 관련 고품질 이미지 URL"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const generatedPost = JSON.parse(jsonStr);
    
    generatedPost.created_at = new Date().toISOString();

    // 2. Upload to Supabase (Database Direct Injection)
    const { data, error } = await supabase
        .from('posts')
        .insert([generatedPost])
        .select();

    if (error) throw error;

    return NextResponse.json({ 
        message: 'GEO 룰 기반 AI 기사 발행 성공!', 
        post: data 
    }, { status: 200 });

  } catch (error: any) {
    console.error('GEO Generation Error:', error);
    return NextResponse.json({ 
      error: `발행 실패: ${error.message}` 
    }, { status: 500 });
  }
}
