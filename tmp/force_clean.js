const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function forceCleanAll() {
  const TODAY_STR = '2026-04-09';
  console.log('--- FORCE CLEANING START ---');
  
  const { data: posts, error } = await supabase.from('posts').select('*').order('id', {ascending: false});
  if (error) { console.error('DB Error:', error); return; }

  for (const post of posts) {
    let cleanTitle = post.title;
    let cleanDeadline = post.deadline_date;

    // 1. DATE EXTRACTION (Enhanced Regex)
    const textToSearch = (post.title + " " + post.summary + " " + post.content);
    const datePattern = /(\d{4})[-\.년\s]+(\d{1,2})[-\.월\s]+(\d{1,2})일?/g;
    let match;
    const foundDates = [];
    while ((match = datePattern.exec(textToSearch)) !== null) {
        const y = match[1];
        const m = match[2].padStart(2, '0');
        const d = match[3].padStart(2, '0');
        const f = `${y}-${m}-${d}`;
        if (f >= TODAY_STR) foundDates.push(f);
    }
    if (foundDates.length > 0) {
        cleanDeadline = foundDates.sort().reverse()[0]; // Max date
    }

    // 2. TITLE CLEANING (Super Aggressive)
    cleanTitle = cleanTitle.replace(/^#\s*/, '');
    cleanTitle = cleanTitle.replace(/\s*[\[\(]D-(?:Day|\d+)[\]\)]\s*/gi, ' '); // [D-12]
    cleanTitle = cleanTitle.replace(/\s*D-(?:Day|\d+)\s*/gi, ' ');             // D-12
    cleanTitle = cleanTitle.replace(/마감일자\s*\d{4}[-\.]\d{1,2}[-\.]\d{1,2}/gi, ' ');
    cleanTitle = cleanTitle.replace(/\d{4}년?\s?\d{1,2}월?\s?\d{1,2}일?/g, ' ');
    cleanTitle = cleanTitle.replace(/조회\s*[\d,]+/gi, ' ');
    cleanTitle = cleanTitle.replace(/\[지원공고\]|\[전략\]/gi, ' ');
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    // 3. FORCE UPDATE
    if (cleanTitle !== post.title || cleanDeadline !== post.deadline_date) {
        const { error: updError } = await supabase.from('posts').update({
            title: cleanTitle,
            deadline_date: cleanDeadline
        }).eq('id', post.id);
        
        if (!updError) {
          console.log(`[ID ${post.id}] Updated.`);
          console.log(`  Old Title: "${post.title}"`);
          console.log(`  New Title: "${cleanTitle}"`);
          console.log(`  Date: ${post.deadline_date} -> ${cleanDeadline}`);
        }
    }
  }
  console.log('--- FORCE CLEANING COMPLETED ---');
}

forceCleanAll();
