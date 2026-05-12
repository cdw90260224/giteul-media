const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function fixContent() {
  const { data } = await supabase.from('posts').select('id, content').like('content', '%제공된 원문에는 상세 일정 정보가 포함되어 있지 않습니다%');
  let count = 0;
  for (let i = 0; i < data.length; i++) {
     const id = data[i].id;
     const newContent = data[i].content.replace(/상세 접수 기간 및 선정 절차는 원문 공고를 통해 확인 바랍니다\.\n\s*\(제공된 원문에는 상세 일정 정보가 포함되어 있지 않습니다\.\)/g, '상세 접수 기한 및 일정은 상단의 D-Day(마감일)를 확인해 주시기 바랍니다.');
     await supabase.from('posts').update({ content: newContent }).eq('id', id);
     count++;
  }
  
  // Also check for other similar hallucinations
  const { data: data2 } = await supabase.from('posts').select('id, content').like('content', '%일정 정보가 포함되어 있지 않%');
  for (let i = 0; i < data2.length; i++) {
     if (!data.find(d => d.id === data2[i].id)) {
         const newContent = data2[i].content.replace(/.*일정 정보가 포함되어 있지 않.*/g, '* 상세 접수 기한 및 일정은 상단의 마감일을 확인 바랍니다.');
         await supabase.from('posts').update({ content: newContent }).eq('id', data2[i].id);
         count++;
     }
  }

  console.log('Fixed content for ' + count + ' articles.');
}
fixContent();
