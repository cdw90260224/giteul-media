import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Gemini API 설정
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    // 1. K-Startup 실시간 공고 데이터 수집 (Strict Fact-Check Mode)
    const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
    console.log(`[CRAWL] Fetching live data from: ${TARGET_URL}`);

    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.k-startup.go.kr/'
      }
    });

    if (!response.ok) throw new Error(`K-Startup 서버 응답 오류: ${response.status}`);
    const html = await response.text();

    // 2. 정밀 분석 (RegExp - 팩트 정밀 타격)
    const titleMatch = html.match(/<p class="tit">([^<]+)<\/p>/);
    const snMatch = html.match(/go_view\('(\d+)'\)/);
    const dateMatch = html.match(/마감일자\s*:\s*(\d{4}-\d{2}-\d{2})/);

    // 데이터가 없으면 '소설 방지'를 위해 즉시 중단
    if (!titleMatch || !snMatch) {
      console.error("[CRAWL_ERROR] 필수 데이터 추출 실패. 사이트 구조 변경 가능성.");
      throw new Error("DATA_MISSING_ERROR: 실시간 팩트 데이터를 수집하지 못했습니다. 할루시네이션 방지를 위해 작업을 중단합니다. (No Data, No Report)");
    }

    const crawlData = {
      title: titleMatch[1].trim(),
      notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`,
      deadline: dateMatch ? dateMatch[1] : "상세페이지 확인 요망"
    };

    console.log(`[FACT_FOUND] 분석 완료: ${crawlData.title}`);

    // 3. Gemini API 호출 (팩트 준수 지침 강화)
    const prompt = `
      # Role: 대한민국 창업지원사업 팩트 전문 기자 (Hallucination Control Mode)
      # Requirement: 당신의 주관이나 추측은 완전히 배제하십시오. 제공된 팩트 데이터에만 집중하십시오.

      # Factual Context (추출된 원본 데이터):
      - 사업명: ${crawlData.title}
      - 공고 주소: ${crawlData.notice_url}
      - 마감일: ${crawlData.deadline}

      # Strict Writing Rules:
      1. 위 데이터에 존재하지 않는 지원 금액(예: 예산 150억 등), 대상(초격차 10대 분야 등), 상세 혜택을 절대 지어내지 마십시오.
      2. 사실 관계가 없는 내용은 기재하지 않으며, 반드시 "공고문 상세 페이지를 통해 확인이 필요함"이라고 솔직하게 안내하십시오.
      3. 허위 정보 기재 시 당신의 기사는 폐기되며 시스템에 의해 신뢰도가 하락합니다.

      # Article Structure:
      - [AI 3줄 핵심 요약]: 데이터에 근거한 사실만 3줄 요약.
      - [공고문 바로가기]: <div style="text-align: center; margin-top: 50px;">
          <a href="${crawlData.notice_url}" style="display: inline-block; background-color: #002B5B; color: white; padding: 15px 40px; border-radius: 50px; font-weight: 900; text-decoration: none;">공고문 바로가기</a>
        </div>

      # Response Format: JSON
      {
        "title": "${crawlData.title}",
        "summary": "기틀 미디어 검증 핵심 팩트 요약",
        "category": "정부지원",
        "content": "데이터 기반의 정확한 HTML 본문",
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
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
