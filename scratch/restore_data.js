const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple env loader
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const articles = [
  {
    title: '리벨리온, 2500억 규모 추가 투자 유치... K-엔비디아 행보 가속',
    summary: '국내 대표 AI 반도체 스타트업 리벨리온이 정부 및 민간으로부터 2500억 원 규모의 대규모 투자를 유치하며 글로벌 시장 공략에 속도를 냅니다.',
    category: 'AI/테크 트렌드',
    content: '## K-반도체의 자존심, 리벨리온의 비상\n\n대한민국의 AI 반도체 설계 전문(팹리스) 스타트업 리벨리온이 약 2500억 원 규모의 시리즈 C 투자를 성공적으로 마쳤습니다. 이번 투자는 정부의 반도체 전략 자금과 국내외 대형 VC들이 참여한 것으로 확인되었습니다.\n\n### 주요 투자 포인트\n- **투자 규모:** 약 2,500억 원 (누적 투자액 5,000억 상회)\n- **핵심 기술:** 차세대 AI 추론형 칩 아톰(ATOM) 및 후속 고사양 그래픽 처리 장치 개발\n- **정부 지원:** 과기부의 K-클라우드 프로젝트 연계 지원 대상 확정\n\n리벨리온은 이번 투자금을 바탕으로 엔비디아의 독주 체제에 대응할 수 있는 고효율·저전력 NPU 고도화에 집중할 계획입니다.',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    notice_url: 'https://www.rebellions.ai/news/rebellions-series-c',
    deadline_date: null,
    created_at: new Date().toISOString()
  },
  {
    title: 'LG 구광모 회장, 실리콘밸리서 피지컬 AI 및 로보틱스 협력 논의',
    summary: 'LG그룹 구광모 회장이 최근 미국 실리콘밸리를 방문해 스킬드 AI(Skild AI) 및 팔란티어 경영진을 만나 로보틱스와 AI의 결합을 논의했습니다.',
    category: 'AI/Tech',
    content: '## 제조 현장을 바꾸는 피지컬 AI의 시대\n\nLG그룹이 차세대 먹거리로 피지컬 AI(Physical AI)를 낙점했습니다. 피지컬 AI는 단순히 디지털 환경에서의 지능을 넘어, 로봇 및 기계 장치와 결합해 실제 물리 공간에서 작업을 수행하는 AI를 의미합니다.\n\n### 회동 주요 내용\n1. **Skild AI 협력:** 범용 로봇 파운데이션 모델 도입 및 가전 제조 공정 스마트화\n2. **Palantir 협업:** 공급망 관리(SCM) 및 품질 예측 시스템에 AI 엔진 통합\n\n구 회장은 미래 성장의 핵심은 AI가 현실 세계의 문제를 얼마나 정교하게 해결하느냐에 달려 있다고 강조했습니다.',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    notice_url: 'https://www.lg.co.kr/news/physical-ai-visit',
    deadline_date: null,
    created_at: new Date().toISOString()
  },
  {
    title: '2026년 1분기 글로벌 VC 투자 3000억 달러 돌파... AI가 80% 주도',
    summary: '글로벌 벤처 캐피털 시장이 AI 열풍에 힘입어 2026년 1분기 역대급 거래액을 기록했습니다. 전체 투자금의 80%가 AI 인프라 및 서비스 기업에 집중되었습니다.',
    category: '글로벌 뉴스',
    content: '## AI가 삼킨 글로벌 벤처 캐피털 시장\n\n크런치베이스와 주요 외신에 따르면, 2026년 1분기 전 세계 벤처 캐피털 투자액은 약 3,000억 달러(한화 약 450조 원)로 집계되었습니다. 이는 전년 동기 대비 약 40% 이상 성장한 수치입니다.\n\n### 주요 시장 지표\n- **AI 집중도:** 전체 투자액의 약 80%가 AI 관련 스타트업에 분배\n- **메가 라운드:** OpenAI, Anthropic, xAI 등 거대 모델 사가 투자 핵심\n\n특히 마이크로소프트와 아마존 등 빅테크 기업들의 전략적 투자가 시장 성장을 견인하고 있습니다.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    notice_url: 'https://www.crunchbase.com/report/q1-2026-global-vc',
    deadline_date: null,
    created_at: new Date().toISOString()
  }
];

async function insert() {
    const { data, error } = await supabase.from('posts').insert(articles);
    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Successfully restored articles for AI/Tech and Global categories.');
    }
}

insert();
