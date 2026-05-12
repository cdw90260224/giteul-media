require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixDeadlinesSmart() {
  const {data: posts} = await s.from('posts').select('id, title, summary, content').eq('category', '정부지원공고').order('created_at', {ascending: false}).limit(100);
  if (!posts) return;
  
  const rangePattern = /(\d{4}[.-]\d{1,2}[.-]\d{1,2})\s*~\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})|(\d{1,2}[.\/-]\d{1,2})\s*~\s*(\d{1,2}[.\/-]\d{1,2})|(\d{4}년\s*\d{1,2}월\s*\d{1,2}일).*?~\s*(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)|(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일/;
  
  for (const p of posts) {
    const combined = (p.title || '') + ' ' + (p.summary || '') + ' ' + (p.content || '');
    const rangeMatch = combined.match(rangePattern);
    let deadline = null;
    
    if (rangeMatch) {
      if (rangeMatch[2]) {
        deadline = rangeMatch[2].replace(/\./g, '-');
      } else if (rangeMatch[4]) {
        const parts = rangeMatch[4].split(/[.\/-]/);
        deadline = `2026-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      } else if (rangeMatch[6]) {
        const m = rangeMatch[6].match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (m) deadline = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      } else if (rangeMatch[10]) {
        deadline = `2026-${rangeMatch[9].padStart(2, '0')}-${rangeMatch[10].padStart(2, '0')}`;
      }
    }
    
    if (!deadline) {
      const allDates = combined.match(/(\d{4}[.-]\d{1,2}[.-]\d{1,2})|(\d{1,2}[.\/-]\d{1,2})|(\d{1,2})월\s*(\d{1,2})일/g);
      if (allDates && allDates.length > 0) {
        const lastDate = allDates[allDates.length - 1];
        if (lastDate.includes('2026')) {
          deadline = lastDate.replace(/\./g, '-');
        } else if (lastDate.includes('월')) {
          const m = lastDate.match(/(\d{1,2})월\s*(\d{1,2})일/);
          if (m) deadline = `2026-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
        } else {
          const parts = lastDate.split(/[.\/-]/);
          if (parts.length >= 2) {
            deadline = `2026-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
      }
    }

    if (deadline && deadline.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // [CRITICAL] Force 2026 as per user rules
      deadline = deadline.replace(/^\d{4}/, '2026');
      console.log(`ID: ${p.id} -> Deadline: ${deadline}`);
      await s.from('posts').update({deadline_date: deadline}).eq('id', p.id);
    }
  }
  console.log('Done.');
}

fixDeadlinesSmart();
