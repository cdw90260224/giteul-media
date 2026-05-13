const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateChecklist(post) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `당신은 대한민국 1등 경영 전략 컨설턴트입니다. 다음 정부지원공고 내용을 분석하여, 지원자가 본인의 적합성을 3초 만에 판단할 수 있는 [AI 자가진단 체크리스트]를 작성하세요.

공고 제목: ${post.title}
본문 요약: ${post.summary || ''}
상세 내용: ${post.content ? post.content.substring(0, 4000) : ''}

--- 작성 규칙 ---
1. 반드시 '### 📋 AI 자가진단 체크리스트'라는 대제목으로 시작하세요.
2. 그 아래에 지원 자격 및 탈락 요건을 기반으로 한 3가지 마크다운 체크리스트('- [ ] 질문?')를 작성하세요.
3. 질문은 반드시 두 가지 이상의 조건이 결합된 복합 질문("~이면서 ~입니까?") 형태여야 합니다.
4. 심사역 관점의 전문적인 비즈니스/법률 용어와 구체적인 수치를 포함하세요.
5. 오직 체크리스트 3줄만 출력하세요. 다른 설명이나 인사말은 절대 금지합니다.

예시:
### 📋 AI 자가진단 체크리스트
- [ ] 공고일 기준 법인설립등기일이 7년 이내이면서, 누적 투자 유치 금액이 10억 원 미만인 중소기업입니까?
- [ ] 주된 사업장 소재지가 서울특별시 내에 위치하고 있으면서, 최근 2년 연속 매출 성장률이 10% 이상입니까?
- [ ] 국세 및 지방세 체납 사실이 없으면서, 대표자 명의의 금융기관 채무불이행 이력이 존재하지 않습니까?`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`Error generating for post ${post.id}:`, error.message);
    return null;
  }
}

async function backfill() {
  console.log('Starting backfill for AI Eligibility Checker...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content, summary')
    .eq('category', '정부지원공고')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${posts.length} posts to check.`);

  for (const post of posts) {
    if (post.content && post.content.includes('AI 자가진단 체크리스트')) {
      console.log(`Skipping post ${post.id} (already has checklist)`);
      continue;
    }

    console.log(`Processing post ${post.id}: ${post.title}`);
    const checklist = await generateChecklist(post);
    
    if (checklist && checklist.includes('### 📋 AI 자가진단 체크리스트')) {
      const updatedContent = checklist + '\n\n' + post.content;
      const { error: updateError } = await supabase
        .from('posts')
        .update({ content: updatedContent })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
      } else {
        console.log(`Successfully patched post ${post.id}`);
      }
      
      // Rate limiting: wait 1 second between requests
      await new Promise(res => setTimeout(res, 1000));
    } else {
      console.warn(`Failed to get valid checklist for post ${post.id}`);
    }
  }

  console.log('Backfill completed!');
}

backfill();
