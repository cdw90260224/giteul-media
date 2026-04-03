import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvvmgrtkgblwmulowuki.supabase.co';
const supabaseKey = 'sb_publishable_AEDxIn5tLe2ziYcKO4THQA_Q7Py9v5r'; // Anon key 

const supabase = createClient(supabaseUrl, supabaseKey);

async function factCorrection() {
  console.log('기존 기사의 할루시네이션(망상) 검수 및 팩트 교정 시작...');
  
  const { data: posts, error: fetchError } = await supabase.from('posts').select('id, title, content');
  
  if (fetchError) {
    console.error('데이터 조회 실패:', fetchError);
    return;
  }

  let correctionCount = 0;
  for (const post of posts || []) {
    let updatedContent = post.content || '';
    let isModified = false;

    // 할루시네이션 의심 및 팩트 불확실 요소 제거/수정 로직 
    // 예: "팀당 최대 7억 원" 등 AI가 확정적으로 지어낸 수치에 근거가 부족할 경우 가이드라인 제시로 변경 
    const patterns = [
        { 
            target: /최대 7억 원/g, 
            replacement: '공고문상의 정확한 지원 규모(최대 지원금) 확인이 필요함' 
        },
        {
            target: /예산 150억/g,
            replacement: '2026년도 총 예산 규모 확인이 필요함'
        },
        {
            target: /팁스\(TIPS\) 필승 키워드/g,
            replacement: 'TIPS 연계 여부는 공고문의 가점을 반드시 확인해야 함'
        },
        {
            target: /합격하는 사업계획서 키워드 전격 공개/g,
            replacement: '공고문에 명시된 평가지표(TRL 등)를 최우선으로 고려해야 함'
        }
    ];

    for (const p of patterns) {
        if (updatedContent.match(p.target)) {
            updatedContent = updatedContent.replace(p.target, p.txt ? p.txt : p.replacement);
            isModified = true;
        }
    }

    // AI 인사이트 박스에 "추측 금지" 경고 문구 삽입 
    if (updatedContent.includes('summary-box') && !updatedContent.includes('공식 공고문을 통한 팩트 확인')) {
        updatedContent = updatedContent.replace(
            "</div>", 
            "<p style='color: #ef4444; font-size: 11px; margin-top: 10px; font-weight: 900;'>⚠️ 해당 요약은 AI가 분석한 정보이며, 지원 전 반드시 실제 공고문을 대조하여 최종 팩트를 확인하십시오.</p></div>"
        );
        isModified = true;
    }

    if (isModified) {
        const { error: updateError } = await supabase
            .from('posts')
            .update({ content: updatedContent })
            .eq('id', post.id);
            
        if (!updateError) correctionCount++;
    }
  }

  console.log(`검수 완료: 총 ${correctionCount}개의 기사에서 할루시네이션 및 불확실한 정보를 제거하고 팩트 가이드를 삽입했습니다.`);
}

factCorrection().catch(console.error);
