
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 도메인 우선순위가 반영된 정밀 규칙
const DOMAIN_RULES = [
  // 1단계: 산업 특화 도메인 (가장 강력한 우선순위)
  { sector: '바이오/헬스케어', keywords: ['의료', '바이오', '제약', '헬스케어', '의료기기', '신약', '건강검진', '병원', '임상'] },
  { sector: '에너지/ESG', keywords: ['에너지', '탄소', '친환경', '신재생', '배터리', '수소', '환경', 'ESG', '자원순환', '태양광', '풍력'] },
  { sector: '문화/콘텐츠', keywords: ['게임', '웹툰', '애니', '영화', '영상', '예술', '음악', '방송', '미디어', '관광', '캐릭터', '디자인'] },
  { sector: '제조/하드웨어', keywords: ['제조', '로봇', '스마트팩토리', '부품', '소재', '장비', '금형', '생산', '소부장', '드론', '반도체', '모빌리티'] },
  { sector: '농업', keywords: ['농업', '스마트팜', '축산', '어업', '식품', '푸드테크', '농식품', '귀농', '작물'] },
  { sector: '글로벌/수출', keywords: ['수출', '글로벌', '해외', '바우처', '현지화', 'CES', '수출전문', '외국'] },
  { sector: '커머스/서비스', keywords: ['유통', '물류', '커머스', '플랫폼', '매칭', '중개', '마켓', '여행', '상권분석'] },
  
  // 2단계: 특정 대상 도메인
  { sector: '소상공인', keywords: ['전통시장', '상점', '자영업', '시장 상인', '골목상권', '영세', '가게', '점포'] },
  
  // 3단계: 범용 기술 및 스타트업 (위의 어떤 산업에도 속하지 않을 때의 Fallback)
  { sector: '기술/IT', keywords: ['스타트업', '벤처', 'it', 'ai', '인공지능', '클라우드', '빅데이터', '소프트웨어', '알고리즘', '딥러닝', '디지털 트랜스포메이션'] }
];

async function deepGranularReclassify() {
  console.log('🧪 [Deep Granularity] 도메인 우선순위 기반 정밀 재분류 시작...');
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, summary, category');

  if (error) return console.error('❌ DB 로드 에러:', error);

  let totalFixCount = 0;

  for (const post of posts) {
    const fullText = (post.title + ' ' + (post.summary || '')).toLowerCase();
    let selectedSector = '기술/IT'; // 기본값 (기존에 이미 기술로 분류되었을 수 있으므로)
    let found = false;

    // 계층적 매칭: 위에서부터 하나씩 검사해서 걸리면 바로 끝냄
    for (const rule of DOMAIN_RULES) {
      if (rule.keywords.some(kw => fullText.includes(kw))) {
        selectedSector = rule.sector;
        found = true;
        break; // 가장 우선순위 높은 도메인 확정
      }
    }

    // 만약 아무데도 안 걸린다면? (분류 불가)
    if (!found) continue;

    const currentTagMatch = post.summary?.match(/^\[(.*?)\]/);
    const currentTag = currentTagMatch ? currentTagMatch[1] : null;

    if (currentTag === selectedSector) continue;

    let newSummary = post.summary || '';
    if (newSummary.startsWith('[')) {
      newSummary = newSummary.replace(/^\[.*?\]/, `[${selectedSector}]`);
    } else {
      newSummary = `[${selectedSector}] ${newSummary}`;
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ summary: newSummary })
      .eq('id', post.id);

    if (!updateError) {
      totalFixCount++;
      if (totalFixCount % 10 === 0) console.log(`🧬 ${totalFixCount}개 기사 도메인 정밀 튜닝 중...`);
    }
  }

  console.log(`🏁 정밀 재분류 완료! 총 ${totalFixCount}개의 기사가 고유한 도메인 위계를 찾아 재분배되었습니다.`);
  console.log(`💡 이제 '바이오 스타트업' 기사는 [기술/IT]가 아닌 [바이오/헬스케어] 탭에서 우선적으로 보입니다.`);
}

deepGranularReclassify();
