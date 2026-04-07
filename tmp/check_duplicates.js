const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function testFetchAndCheck() {
  const supabase = createClient(
    'https://fvvmgrtkgblwmulowuki.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1ncnRrZ2Jsd211bG93dWtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAxMzIwMSwiZXhwIjoyMDkwNTg5MjAxfQ.hCxi-DxSoF_FA9Opccl9bz-fDvJO6FhMZyJVAZjKSUo'
  );

  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const notices = [];
  $('a').each((_, el) => {
    const attrVal = $(el).attr('href') || '';
    const snMatch = attrVal.match(/go_view\('?(\d+)'?\)/);
    if (snMatch) {
        const url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`;
        notices.push({ id: snMatch[1], url, title: $(el).text().trim() });
    }
  });

  console.log(`Found ${notices.length} notices on K-Startup.`);
  
  for(let i=0; i<Math.min(5, notices.length); i++) {
    const { data: dup } = await supabase.from('posts').select('id').eq('notice_url', notices[i].url).maybeSingle();
    console.log(`Checking [${notices[i].id}] ${notices[i].title.substring(0, 20)}... -> Duplicate: ${!!dup}`);
  }
}

testFetchAndCheck();
