
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 재배분 규칙 (키워드 기반)
const RULES = [
  { sector: '바이오/헬스케어', keywords: ['의료', '바이오', '제약', '헬스케어', '건강', '진단', '의료기기', '신약', '디지털헬스', '병원', '임상'] },
  { sector: '에너지/ESG', keywords: ['에너지', '탄소', '친환경', '신재생', '전기차', '폐기물', '배터리', '수소', '환경', 'ESG', '자원순환'] },
  { sector: '문화/콘텐츠', keywords: ['게임', '웹툰', '애니', '문화', '영상', '예술', '영화', '콘텐츠', '미디어', '관광', '디자인', '캐릭터', '음악'] },
  { sector: '제조/하드웨어', keywords: ['제조', '로봇', '스마트팩토리', '부품', '소재', '장비', '금형', '생산', '소부장', '드론', '반도체', '모빌리티'] },
  { sector: '커머스/서비스', keywords: ['유통', '물류', '커머스', '플랫폼', '매칭', '전문서비스', '중개', '여행', '마켓'] },
  { sector: '글로벌/수출', keywords: ['수출', '글로벌', '해외', '바우처', '현지화', 'CES', '수출전문'] },
  { sector: '농업', keywords: ['농업', '스마트팜', '축산', '어업', '식품', '푸드테크', '농식품', '귀농'] },
  { sector: '소상공인', keywords: ['소상공인', '전통시장', '상점', '스타트업', '지역', '자영업', '시장 상인'] }
];

async function reclassifySectors() {
  console.log('🚀 데이터 재분류 프로세스 시작...');
  
  // 1. 데이터 가져오기
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, category');

  if (error) {
    console.error('❌ 데이터 로드 실패:', error);
    return;
  }

  console.log(`📊 총 ${posts.length}개의 데이터를 분석 중...`);

  let updateCount = 0;

  for (const post of posts) {
    const fullText = (post.title + ' ' + (post.summary || '')).toLowerCase();
    let bestSector = null;

    // 키워드 매칭 (가장 많이 겹치는 분야 찾기 or 순서대로 매칭)
    for (const rule of RULES) {
      if (rule.keywords.some(kw => fullText.includes(kw))) {
        bestSector = rule.sector;
        break; // 첫 번째 일치하는 분야 선택
      }
    }

    if (bestSector) {
      // 이미 해당 섹터 태그가 있는지 확인
      const currentTag = post.summary?.match(/^\[(.*?)\]/);
      if (currentTag && currentTag[1] === bestSector) continue;

      // 요약문 업데이트 (기존 태그가 있다면 교체, 없으면 삽입)
      let newSummary = post.summary || '';
      if (currentTag) {
        newSummary = newSummary.replace(/^\[.*?\]/, `[${bestSector}]`);
      } else {
        newSummary = `[${bestSector}] ${newSummary}`;
      }

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('posts')
        .update({ summary: newSummary })
        .eq('id', post.id);

      if (!updateError) {
        updateCount++;
        if (updateCount % 10 === 0) console.log(`✅ ${updateCount}개 데이터 재분류 완료...`);
      }
    }
  }

  console.log(`🏁 재배분 완료! 총 ${updateCount}개의 기사가 새로운 분야로 이사했습니다.`);
}

reclassifySectors();
