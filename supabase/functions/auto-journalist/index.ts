import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Gemini API 설정
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. K-Startup 실시간 공고 리스트 수집 
    const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
    console.log(`[CRAWL] Scanning for new intelligence at: ${TARGET_URL}`);

    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.k-startup.go.kr/'
      }
    });

    if (!response.ok) throw new Error(`K-Startup 서버 응답 오류: ${response.status}`);
    const html = await response.text();

    // 2. 여러 공고 분석 (데이터 정밀 매칭)
    // <li> 또는 <div class="ann_top"> 구조 분석 
    const items: { title: string, pbancSn: string, deadline: string }[] = [];
    const titles = [...html.matchAll(/<p class="tit">([^<]+)<\/p>/g)];
    const sns = [...html.matchAll(/go_view\('(\d+)'\)/g)];
    const dates = [...html.matchAll(/마감일자\s*:\s*(\d{4}-\d{2}-\d{2})/g)];

    for (let i = 0; i < Math.min(titles.length, sns.length); i++) {
        items.push({
            title: titles[i][1].trim(),
            pbancSn: sns[i][1],
            deadline: dates[i] ? dates[i][1] : "상세페이지 확인 요망"
        });
    }

    if (items.length === 0) {
        throw new Error("FACT_SCRAPE_FAILED: 수집된 공고가 하나도 없습니다.");
    }

    // 3. 중복 체크 (DB와 대조하여 새로운 공고 선정)
    let selectedAnnouncement = null;
    for (const item of items) {
        const noticeUrl = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${item.pbancSn}`;
        const { data: existing } = await supabase
            .from('posts')
            .select('id')
            .eq('title', item.title) // 제목이나 URL 중 하나로 중복 체크 
            .maybeSingle();
            
        if (!existing) {
            selectedAnnouncement = { ...item, notice_url: noticeUrl };
            break; // 가장 최상단의 '새로운' 공고를 발견하면 중지 
        }
    }

    if (!selectedAnnouncement) {
        throw new Error("NO_NEW_INTELLIGENCE: 현재 모든 최신 공고가 이미 집필 완료된 상태입니다. 중복 발행을 방지합니다.");
    }

    const crawlData = selectedAnnouncement;
    console.log(`[TARGET_DISCOVERED] 새로운 팩트 발견: ${crawlData.title}`);

    // 4. Gemini API 호출 (팩트 준수 지침 강화)
    const prompt = `
      # Role: 대한민국 창업지원사업 팩트 전문 기자 (Hallucination Control Mode)
      # Requirement: 당신의 주관이나 추측은 완전히 배제하십시오. 오직 제공된 팩트 데이터에만 집중하십시오.

      # Factual Context (추출된 원본 데이터):
      - 공고명: ${crawlData.title}
      - 공고 주소: ${crawlData.notice_url}
      - 마감일: ${crawlData.deadline}

      # Strict Writing Rules:
      1. 위 데이터에 없는 지원 금액, 대상, 상세 혜택을 당신의 지식으로 보강하지 마십시오.
      2. 사실 관계가 불분명한 내용은 기치 않으며, 반드시 "공고문 상세 페이지를 통해 확인이 필요함"이라고 솔직하게 기술하십시오.
      3. 허위 정보 기재 시 당신의 기사는 폐기됩니다. 중복 없는 새로운 소식 위주로 작성하십시오.

      # Article Structure:
      - [AI 3줄 핵심 요약]: 데이터에 근거한 사실만 3줄 요약.
      - [공고문 바로가기]: <div style="text-align: center; margin-top: 50px;">
          <a href="${crawlData.notice_url}" style="display: inline-block; background-color: #002B5B; color: white; padding: 15px 40px; border-radius: 50px; font-weight: 900; text-decoration: none;">공고문 바로가기</a>
        </div>

      # Response Format: JSON
      {
        "title": "${crawlData.title}",
        "summary": "팩트 기반 핵심 요약 데이터",
        "category": "정부지원",
        "content": "데이터 기반의 정확한 HTML 본문",
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f"
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
