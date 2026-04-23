
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 사용자 의견을 반영한 정교한 재배분 규칙
const RULES = [
  // 기술/IT가 가장 포괄적이므로, 구체적인 특화 분야가 아니면 이쪽으로 먼저 매칭
  { sector: '바이오/헬스케어', keywords: ['의료', '바이오', '제약', '헬스케어', '건강', '진단', '의료기기', '신약', '디지털헬스', '병원', '임상'] },
  { sector: '에너지/ESG', keywords: ['에너지', '탄소', '친환경', '신재생', '전기차', '폐기물', '배터리', '수소', '환경', 'ESG', '자원순환'] },
  { sector: '문화/콘텐츠', keywords: ['게임', '웹툰', '애니', '문화', '영상', '예술', '영화', '콘텐츠', '미디어', '관광', '디자인', '캐릭터', '음악'] },
  { sector: '기술/IT', keywords: ['스타트업', 'it', 'ai', '인공지능', '클라우드', '빅데이터', '소프트웨어', '플랫폼', '데이터', '앱', '웹', '보안', '알고리즘', '딥러닝'] },
  { sector: '제조/하드웨어', keywords: ['제조', '로봇', '스마트팩토리', '부품', '소재', '장비', '금형', '생산', '소부장', '드론', '반도체', '모빌리티'] },
  { sector: '커머스/서비스', keywords: ['유통', '물류', '커머스', '매칭', '전문서비스', '중개', '여행', '마켓'] },
  { sector: '글로벌/수출', keywords: ['수출', '글로벌', '해외', '바우처', '현지화', 'CES', '수출전문'] },
  { sector: '농업', keywords: ['농업', '스마트팜', '축산', '어업', '식품', '푸드테크', '농식품', '귀농'] },
  { sector: '소상공인', keywords: ['소상공인', '전통시장', '상점', '자영업', '시장 상인', '골목상권', '영세', '가게'] }
];

async function finalReclassify() {
  console.log('🚀 [스타트업 -> 기술/IT] 키워드 교정 및 전체 재분류 시작...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, category');

  if (error) return console.error('❌ DB 로드 에러:', error);

  let totalCount = 0;
  let changedCount = 0;

  for (const post of posts) {
    totalCount++;
    const fullText = (post.title + ' ' + (post.summary || '')).toLowerCase();
    let bestSector = null;

    // 규칙에 따라 가장 적합한 섹터 찾기
    for (const rule of RULES) {
      if (rule.keywords.some(kw => fullText.includes(kw))) {
        bestSector = rule.sector;
        break; 
      }
    }

    if (bestSector) {
      const currentTagMatch = post.summary?.match(/^\[(.*?)\]/);
      const currentTag = currentTagMatch ? currentTagMatch[1] : null;

      // 이미 올바른 태그가 달려있으면 스킵
      if (currentTag === bestSector) continue;

      let newSummary = post.summary || '';
      if (currentTag) {
        newSummary = newSummary.replace(/^\[.*?\]/, `[${bestSector}]`);
      } else {
        newSummary = `[${bestSector}] ${newSummary}`;
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ summary: newSummary })
        .eq('id', post.id);

      if (!updateError) {
        changedCount++;
        if (changedCount % 10 === 0) console.log(`🔄 ${changedCount}개 데이터 교정 중...`);
      }
    }
  }

  console.log(`🏁 완료! 총 ${totalCount}개 중 ${changedCount}개의 기사가 새로운 분류 체계에 맞춰 재배치되었습니다.`);
  console.log(`💡 특히 '스타트업' 관련 기사들은 이제 확실히 [기술/IT] 로 분류됩니다.`);
}

finalReclassify();
