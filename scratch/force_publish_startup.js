
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    });
    return env;
}

async function run() {
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const postData = {
        title: "[창업] 딥테크 스타트업 '뉴럴링크 플러스', 500억 시리즈 C 유치... 유니콘 등극 초읽기",
        summary: "[기술/IT] 독자적 뇌-컴퓨터 인터페이스(BCI) 기술을 보유한 국내 스타트업이 글로벌 VC들로부터 대규모 투자를 끌어내며 세계 시장 진출에 속도를 내고 있습니다.",
        category: "창업 뉴스",
        content: `
## 스타트업 '뉴럴링크 플러스'의 파격적 행보
국내 딥테크 기업인 뉴럴링크 플러스가 실리콘밸리 기반 벤처캐피탈로부터 500억 규모의 시리즈 C 투자를 유치했습니다. 이번 투자로 기업가지는 약 8,000억 원으로 평가받으며 국내 차세대 유니콘 기업으로의 등극을 눈앞에 두고 있습니다.

### 주요 투자 포인트
*   **기술적 우위**: 기존 방식보다 10배 빠른 데이터 전송 효율성 입증
*   **글로벌 네트워크**: 인텔, 엔비디아 출신 핵심 인력들의 글로벌 비즈니스 역량
*   **규제 샌드박스 활용**: 규제 완화 구역에서의 실증 데이터 확보

### ✒️ 기자의 시선: 스타트업 인사이트
> #### [기회 포인트]
> 이번 뉴스는 단순히 한 기업의 성공을 넘어, 한국의 딥테크 원천 기술이 글로벌 자본 시장에서 충분한 경쟁력을 가지고 있음을 증명했습니다. 특히 하드웨어와 소프트웨어가 결합된 BCI 시장은 아직 선점자가 없는 블루오션으로, 후발 스타트업들에게도 기술 특례 상장이나 글로벌 파트너십의 문구가 열리고 있음을 시사합니다.
> 
> #### [위기 및 주의사항]
> 하지만 대규모 투자 유치 이후의 '번레이트(Burn Rate)' 관리가 핵심이 될 것입니다. 특히 기술 개발 속도가 시장의 기대치에 미치지 못할 경우, 다음 라운드에서의 '다운 라운드' 리스크가 존재합니다. 또한 생체 데이터 보안과 관련된 국내외 법규 변화를 실시간으로 모니터링해야 하는 운영 부담이 큽니다.
> 
> #### [창업자 대응 전략]
> 초기 창업자라면 뉴럴링크 플러스처럼 '규제 샌드박스'를 적극 활용하여 제도적 안전장치를 먼저 확보하는 전략을 추천합니다. 또한 지금은 단순한 서비스보다 '원천 기술'에 대한 프리미엄이 붙는 시기이므로, 기술적 해자(Moat)를 사업계획서의 첫 번째 장에 배치하여 IR에 임하시기 바랍니다.
        `,
        notice_url: "https://example.com/startup-news-demo",
        image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop&sig=777&startup",
        created_at: new Date().toISOString()
    };

    console.log('Inserting into Supabase...');
    const { data, error } = await supabase.from('posts').insert([postData]).select();
    
    if (error) {
        console.error('FAILED:', error);
    } else {
        console.log('SUCCESS! Article Published.');
        console.log(`URL ID: ${data[0].id}`);
    }
}

run();
