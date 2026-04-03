import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    if (!GEMINI_KEY) throw new Error('GEMINI API KEY MISSING');
    
    // 딥테크 챌린지 공고 배경 지식으로 정밀 집필 
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      # Role: 대한민국 창업지원사업 전문 분석가 및 기틀 미디어 기자 
      
      [분석 대상] 딥테크 챌린지 2026 (Deep-tech Challenge 2026) 예산 150억 규모 창업지원 공고
      
      [GEO 집필 규칙]
      1. [AI 3줄 핵심 요약]: <div class='summary-box'>
         - 핵심 수혜 대상: 초격차 10대 분야 딥테크 스타트업
         - 지원 규모: 팀당 최대 7억 원 (연구비 포함)
         - 마감 정보: 2026년 상반기 접수 마감 임박
         </div>
      2. [사업 분석 표]: 지원대상, 지원금액(최대 7억), 주요 혜택(오피스 지원, PoC 비용)
      3. [합격 전략 가이드]: 
         - 평가 지표: 기술 성숙도(TRL 5단계 이상) 및 시장 침투 전략 중점
         - 필수 키워드: '초격차', '스케일업', 'PoC 실증', '글로벌 유니콘'
      4. [공식 공고 확인]: 
         <div style='text-align: center; margin-top: 50px;'>
            <p style='color: #64748b; font-size: 14px; margin-bottom: 15px;'>K-Startup 공식 정보를 반드시 확인하세요.</p>
            <a href='https://www.k-startup.go.kr' style='display: inline-block; background-color: #002B5B; color: white; padding: 15px 40px; border-radius: 50px; font-weight: 900; text-decoration: none;'>공고문 바로가기</a>
         </div>

      반드시 아래 JSON 형식으로만 최종 응답해줘:
      {
        "title": "2026 딥테크 챌린지 150억 규모 합격 전략 가이드: 7억 원 수혜의 비결",
        "summary": "150억 규모 딥테크 스타트업을 위한 초강력 지원금 7억 원, 합격하는 사업계획서 키워드 전격 공개.",
        "category": "정부지원",
        "content": "위 GEO가 적용된 HTML 코드 전체",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000"
      }
    `;

    const result = await model.generateContent(prompt);
    const generatedPost = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
    generatedPost.created_at = new Date().toISOString();
    // notice_id 컬럼 부재로 인한 500 에러 방지를 위해 임시 제거 
    // generatedPost.notice_id = "DT-CH-2026-001"; 

    // DB에 꽂기 
    const { data, error } = await supabase.from('posts').insert([generatedPost]).select();
    if (error) throw error;

    return NextResponse.json({ message: '딥테크 챌린지 공식 리포트 발행 성공!', post: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
