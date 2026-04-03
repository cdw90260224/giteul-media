import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Gemini API 설정
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // 1. K-Startup 공고 데이터 수집 (예시: 딥테크 챌린지 2026)
    // 실제 운영 시에는 여기서 axios/fetch를 통해 K-Startup을 크롤링합니다.
    const crawlData = {
      title: "2026 딥테크 챌린지 (Deep-tech Challenge)",
      budget: "150억 원",
      max_support: "7억 원",
      deadline: "2026-06-30",
      description: "초격차 10대 분야 기술력을 보유한 스타트업 대상 집중 육성 사업"
    };

    // 2. Gemini API 호출 (시스템 지침 적용)
    const prompt = `
      # Role: 대한민국 창업지원사업 전문 분석가 및 GEO 최적화 기자

      # Task: K-Startup 공고 데이터를 분석하여 창업가들에게 실질적인 '합격 전략' 리포트 작성.

      # Data: ${JSON.stringify(crawlData)}

      # Article Structure (GEO Rule):
      1. [AI 3줄 핵심 요약]: <div class="summary-box">이 사업의 핵심 수혜 대상, 지원 금액, 마감일 요약.</div>
      2. [사업 분석 표]: 지원대상, 지원규모(현금/현물), 주요 혜택을 Table 형태로 정리.
      3. [합격 전략 가이드]: 기술 성숙도(TRL) 및 사업계획서 필승 키워드 제시.
      4. [주의사항]: 할루시네이션(허위정보) 방지 및 실질적 조언.
      5. [공고문 바로가기]: <a href="https://www.k-startup.go.kr">공고문 바로가기</a> 링크 포함.

      # Response Format: 반드시 아래 JSON 형식으로만 응답할 것.
      {
        "title": "기사 제목",
        "summary": "1줄 요약",
        "category": "정부지원",
        "content": "위 GEO 규정이 적용된 HTML 본문",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000"
      }
    `;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const resData = await geminiRes.json();
    const text = resData.candidates[0].content.parts[0].text;
    const article = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

    // 3. Supabase DB 저장
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.from('posts').insert([{
      ...article,
      created_at: new Date().toISOString()
    }]);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      message: "기사 자동 발행 완료!",
      post: article.title 
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
})
