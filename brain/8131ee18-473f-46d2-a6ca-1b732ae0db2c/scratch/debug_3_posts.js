const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testPost(id) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single();
  if (!post) { console.log(`Post ${id} not found`); return; }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `당신은 대한민국 1등 경영 전략 컨설턴트입니다. 다음 정부지원공고 내용을 분석하여, 지원자가 본인의 적합성을 3초 만에 판단할 수 있는 [AI 자가진단 체크리스트]를 작성하세요.

공고 제목: ${post.title}
본문 요약: ${post.summary || ''}
상세 내용: ${post.content ? post.content.substring(0, 3000) : ''}

--- 작성 규칙 ---
1. 반드시 '### 📋 AI 자가진단 체크리스트'라는 대제목으로 시작하세요.
2. 그 아래에 지원 자격 및 탈락 요건을 기반으로 한 3가지 마크다운 체크리스트('- [ ] 질문?')를 작성하세요.
3. 질문은 반드시 두 가지 이상의 조건이 결합된 복합 질문("~이면서 ~입니까?") 형태여야 합니다.
4. 심사역 관점의 전문적인 비즈니스/법률 용어와 구체적인 수치를 포함하세요.
5. 오직 체크리스트 3줄만 출력하세요. 다른 설명이나 인사말은 절대 금지합니다.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`--- POST ${id} RESPONSE ---`);
    console.log(text);
    console.log('--- END ---');
  } catch (e) {
    console.error(`Error for ${id}:`, e.message);
  }
}

async function run() {
  await testPost(285);
  await testPost(268);
  await testPost(232);
}

run();
