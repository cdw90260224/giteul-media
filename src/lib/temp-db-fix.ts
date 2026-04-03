import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const supabaseKey = 'sb_publishable_AEDxIn5tLe2ziYcKO4THQA_Q7Py9v5r'; // Anon key 

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLinksUltraPrecise() {
  console.log('기존 기사의 잘못된(종료된) 링크를 DCP 2026 진짜 상세 공고 주소로 초정밀 수정 중...');
  
  const { data: posts, error: fetchError } = await supabase.from('posts').select('id, content');
  
  if (fetchError) {
    console.error('데이터 조회 실패:', fetchError);
    return;
  }

  let updateCount = 0;
  for (const post of posts || []) {
    // 모집 종료된 엉뚱한 K-Startup 링크나 IRIS 링크가 포함된 경우 치환 
    // DCP 2026의 진짜 고유 ID는 P2612 또는 iris.go.kr의 최신 공고번호 
    if (post.content && (post.content.includes('k-startup.go.kr') || post.content.includes('iris.go.kr'))) {
        const updatedContent = post.content.replace(
            /https:\/\/www\.(k-startup|iris)\.go\.kr[^\s'"]*/g, 
            'https://www.iris.go.kr/ntc/business/selectBusinessDetail.do?prgId=P2612'
        );
        
        const { error: updateError } = await supabase
            .from('posts')
            .update({ content: updatedContent })
            .eq('id', post.id);
            
        if (!updateError) updateCount++;
    }
  }

  console.log(`성공: 총 ${updateCount}개의 기사 링크가 진짜 2026 딥테크 챌린지 상세 공고로 수정되었습니다.`);
}

fixLinksUltraPrecise().catch(console.error);
