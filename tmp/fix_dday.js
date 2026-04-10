const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function fixDDay() {
  const TODAY_STR = '2026-04-09';
  console.log('Fixing posts with incorrect D-DAY (deadline set to today)...');
  
  const { data: posts, error } = await supabase.from('posts').select('*').eq('deadline_date', TODAY_STR);
  if (error) { console.error(error); return; }

  console.log(`Found ${posts.length} suspect posts. Re-scraping for true deadline...`);

  for (const post of posts) {
    if (!post.notice_url) continue;
    try {
        const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const rawContent = $('.prose, .article, .content').text();
        
        // Find all dates and pick the LAST one (usually the deadline)
        const dateMatches = rawContent.match(/(\d{4})[-\.]\s*(\d{1,2})[-\.]\s*(\d{1,2})/g);
        if (dateMatches && dateMatches.length > 1) {
            const lastDateRaw = dateMatches[dateMatches.length - 1];
            const cleanDate = lastDateRaw.replace(/\./g, '-').replace(/\s/g, '');
            // Formatter check
            const parts = cleanDate.split('-');
            const finalDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            
            if (finalDate !== TODAY_STR) {
                await supabase.from('posts').update({ deadline_date: finalDate }).eq('id', post.id);
                console.log(`- Updated ${post.id}: ${TODAY_STR} -> ${finalDate}`);
            }
        }
    } catch (e) { console.error(`Failed to fix ${post.id}`, e); }
  }
  console.log('Fix completed.');
}

fixDDay();
