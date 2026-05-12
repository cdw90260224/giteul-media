const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function inspectPage(url) {
  console.log(`Fetching: ${url}\n`);
  const res = await fetch(url, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);

  // th/td 쌍 전부 출력
  console.log('=== TH/TD pairs ===');
  $('th').each((_, el) => {
    const label = $(el).text().replace(/\s+/g, ' ').trim();
    const value = $(el).next('td').text().replace(/\s+/g, ' ').trim();
    if (label && value) {
      console.log(`[${label}] => ${value.slice(0, 300)}`);
    }
  });

  // dt/dd 쌍
  console.log('\n=== DT/DD pairs ===');
  $('dt').each((_, el) => {
    const label = $(el).text().replace(/\s+/g, ' ').trim();
    const value = $(el).next('dd').text().replace(/\s+/g, ' ').trim();
    if (label && value) {
      console.log(`[${label}] => ${value.slice(0, 300)}`);
    }
  });

  // 특정 키워드가 포함된 라벨+값 찾기
  console.log('\n=== Keyword-based extraction ===');
  const keywords = ['신청대상', '지원대상', '모집대상', '신청자격', '지원자격', 
                     '지원내용', '지원규모', '지원금액', '사업내용', '혜택',
                     '접수기간', '신청기간', '모집기간', '사업기간', '신청방법'];
  
  $('th, dt, .tit, label').each((_, el) => {
    const label = $(el).text().replace(/\s+/g, ' ').trim();
    for (const kw of keywords) {
      if (label.includes(kw)) {
        const value = $(el).next().text().replace(/\s+/g, ' ').trim();
        console.log(`\n🎯 [${label}] => ${value.slice(0, 500)}`);
      }
    }
  });

  // div.view 같은 상세 컨텐츠 영역 확인
  console.log('\n=== Content areas ===');
  const contentSelectors = ['.view_cont', '.detail_cont', '.cont_area', '.biz_detail', '.view-body'];
  for (const sel of contentSelectors) {
    const el = $(sel);
    if (el.length) {
      console.log(`Found: ${sel} (${el.text().length} chars)`);
    }
  }
}

// 212번 공고 URL
inspectPage('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176892');
