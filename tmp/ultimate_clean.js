const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function ultimateClean() {
  const TODAY_STR = '2026-04-09';
  console.log('Starting Ultimate Cleaning & D-Day Correction...');
  
  const { data: posts, error } = await supabase.from('posts').select('*');
  if (error) { console.error(error); return; }

  for (const post of posts) {
    let currentTitle = post.title;
    let currentDeadline = post.deadline_date;

    // 1. IMPROVED DATE EXTRACTION (Handles 년 월 일)
    const allText = (post.title + " " + post.summary + " " + post.content);
    // Matches: 2026-04-21, 2026. 04. 21, 2026년 4월 21일
    const datePattern = /(\d{4})[-\.년\s]+(\d{1,2})[-\.월\s]+(\d{1,2})일?/g;
    let match;
    const validDates = [];
    while ((match = datePattern.exec(allText)) !== null) {
        const y = match[1];
        const m = match[2].padStart(2, '0');
        const d = match[3].padStart(2, '0');
        const formatted = `${y}-${m}-${d}`;
        if (formatted >= TODAY_STR) {
            validDates.push(formatted);
        }
    }
    
    // Pick the LATEST date found as the deadline
    if (validDates.length > 0) {
        currentDeadline = validDates.sort().reverse()[0];
    }

    // 2. AGGRESSIVE TITLE CLEANING
    // Remove Markdown #
    let cleanTitle = currentTitle.replace(/^#\s*/, '');
    // Remove D-XX patterns (D-12, D-Day, etc)
    cleanTitle = cleanTitle.replace(/\s*D-(?:Day|\d+)\s*/gi, ' ');
    // Remove Date patterns in title
    cleanTitle = cleanTitle.replace(/\d{4}년?\s?\d{1,2}월?\s?\d{1,2}일?/g, ' ');
    cleanTitle = cleanTitle.replace(/\d{4}[-\.]\s*\d{1,2}[-\.]\s*\d{1,2}/g, ' ');
    // Remove "마감일자", "조회 XXX"
    cleanTitle = cleanTitle.replace(/마감일자|조회\s*[\d,]+/gi, ' ');
    // Remove prefixes/suffixes
    cleanTitle = cleanTitle.replace(/\[지원공고\]|\[전략\]/gi, ' ');
    // Final trim and double space cleanup
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    if (cleanTitle !== post.title || currentDeadline !== post.deadline_date) {
        console.log(`- Updating Post ${post.id}:`);
        if (cleanTitle !== post.title) console.log(`  TITLE: "${post.title}" -> "${cleanTitle}"`);
        if (currentDeadline !== post.deadline_date) console.log(`  DATE: "${post.deadline_date}" -> "${currentDeadline}"`);
        
        await supabase.from('posts').update({ 
            title: cleanTitle, 
            deadline_date: currentDeadline 
        }).eq('id', post.id);
    }
  }
  console.log('Ultimate Cleaning Completed.');
}

ultimateClean();
