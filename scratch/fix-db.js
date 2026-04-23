const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(url, key);

const newContent = `
이 기사는 예비/초기 스타트업을 파격적으로 지원하는 통합 모집공고의 핵심 내용만을 완벽하게 요약한 리포트입니다.

- 지원 대상 및 자격 요건
  - 기술 기반 혁신 아이디어를 가진 예비창업자 및 3년 이내 초기창업기업
  - 최대 7년 이내의 특정 조건을 충족하는 성장기업
- 핵심 혜택 및 지원 규모
  - 기업당 최대 1억 5천만원의 막대한 사업화 지원금 제공
  - 전문가 연계 1:1 무상 멘토링 및 네트워킹/IR 피칭 지원
- 주요 일정 및 신청 방법
  - 접수 기한: 2026년 5월 15일 18:00까지
  - K-Startup 온라인 포털을 통한 온라인 사업계획서 제출

> ### ✒️ 기자의 시선: 전략 마스터클래스
> 
> **[왜 주목해야 하는가?]**
> 최대 1.5억 원이라는 압도적인 자금 지원과 풀 패키지 코칭이 결합된, 초기 스타트업을 위한 완벽한 동아줄입니다. 
> 
> **[당첨 확률을 높이는 핵심 포인트]**
> 단순한 아이디어 나열보다는, 확실한 수익 창출 구조(BM)와 단기간 성과 달성 계획을 사업계획서 첫 장에 배치해 차별화된 모습을 각인시키세요.
> 
> **[이런 업체는 무조건 지원하세요]**
> 프로토타입(MVP)을 이미 보유 중이거나, 당장 자재구입과 양산을 위한 자금이 절실한 제조/TECH 기반 팀에게는 스케일업의 폭발적인 기회가 될 것입니다.
`;

const newTitle = "[전략] 모두의 창업 프로젝트 사업화 지원전략";

s.from('posts').update({
  title: newTitle,
  content: newContent.trim(),
  notice_url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do'
}).eq('id', 133).then(r => console.log('Successfully Force Updated DB')).catch(e => console.log(e));
