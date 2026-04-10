const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

const supabase = createClient(
  'https://fvvmgrtkgblwmulowuki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
);

async function vigorousFix() {
  const TODAY_STR = '2026-04-09';
  console.log('Starting Vigorous D-Day Fix...');
  
  // Get all posts that are currently showing D-DAY
  const { data: posts, error } = await supabase.from('posts').select('*').eq('deadline_date', TODAY_STR);
  if (error) { console.error(error); return; }

  console.log(`Analyzing ${posts.length} suspected D-DAY posts...`);

  for (const post of posts) {
    let rawText = post.content + (post.title || "");
    let bestDoc = rawText;

    // If notice_url is available, try to get even deeper context
    if (post.notice_url && post.notice_url.startsWith('http')) {
        try {
            const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
            bestDoc += await res.text();
        } catch {}
    }

    const dateMatches = bestDoc.match(/(\d{4})[-\.]\s*(\d{1,2})[-\.]\s*(\d{1,2})/g) || [];
    const validDates = dateMatches.map(d => {
        const clean = d.replace(/\./g, '-').replace(/\s/g, '');
        const p = clean.split('-');
        return `${p[0]}-${p[1].padStart(2, '0')}-${p[2].padStart(2, '0')}`;
    }).filter(d => d > TODAY_STR); // Only dates AFTER today

    if (validDates.length > 0) {
        const trueDeadline = validDates.sort().reverse()[0]; // Pick the latest one
        const { error: updErr } = await supabase.from('posts').update({ deadline_date: trueDeadline }).eq('id', post.id);
        if (!updErr) console.log(`[FIXED] Post ${post.id}: ${TODAY_STR} -> ${trueDeadline}`);
    } else {
        console.log(`[STAY] Post ${post.id}: No future date found, keeping D-DAY.`);
    }
  }
  console.log('Vigorous Fix Completed.');
}

vigorousFix();
