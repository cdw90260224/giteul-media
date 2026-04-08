const fs = require('fs');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

async function inspect() {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  const res = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
  const html = await res.text();
  fs.writeFileSync('kstartup_html.txt', html);
  console.log('Saved to kstartup_html.txt! length:', html.length);
}

inspect();
