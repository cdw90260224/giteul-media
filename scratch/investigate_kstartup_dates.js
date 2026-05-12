const cheerio = require('cheerio');

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function testDetailPage(sn) {
  const url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${sn}`;
  console.log(`\n=== Fetching detail page: sn=${sn} ===`);
  console.log(`URL: ${url}\n`);
  
  const res = await fetch(url, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  // 전체 텍스트에서 날짜 패턴 찾기
  const bodyText = $('body').text().replace(/\s+/g, ' ');
  
  // 접수기간, 마감, 신청기간 등 주변 날짜 찾기
  const datePatterns = [
    /접수기간[:\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/,
    /신청기간[:\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/,
    /모집기간[:\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})\s*[~\-]\s*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/,
    /마감[:\s]*(\d{4})[.\-/](\d{2})[.\-/](\d{2})/,
  ];
  
  for (const pat of datePatterns) {
    const m = bodyText.match(pat);
    if (m) {
      console.log(`[MATCH] Pattern found: ${m[0]}`);
    }
  }
  
  // 더 넓게: 모든 YYYY.MM.DD or YYYY-MM-DD 패턴
  const allDates = bodyText.match(/\d{4}[.\-/]\d{2}[.\-/]\d{2}/g);
  console.log(`\n[ALL DATES found in page]: ${JSON.stringify(allDates)}`);

  // 테이블/dl 구조 확인
  $('th, dt, .tit').each((_, el) => {
    const label = $(el).text().trim();
    if (label.includes('접수') || label.includes('마감') || label.includes('기간') || label.includes('신청') || label.includes('모집')) {
      const sibling = $(el).next().text().trim();
      console.log(`\n[TABLE] "${label}" => "${sibling}"`);
    }
  });
  
  // 목록 페이지의 li 구조에서 날짜 확인
  $('li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.includes('마감') && text.match(/\d{4}/)) {
      console.log(`\n[LI-DEADLINE] ${text.slice(0, 200)}`);
    }
  });
}

// 실제 할루시네이션된 공고 몇 개 테스트
async function main() {
  // 최근 올라온 공고 몇 개 SN 추출해서 테스트
  const listUrl = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  const res = await fetch(listUrl, { headers: FETCH_HEADERS });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const sns = [];
  $('a').each((_, el) => {
    const attr = $(el).attr('onclick') || $(el).attr('href') || '';
    const m = attr.match(/pbancSn=(\d+)/) || attr.match(/go_view\('?(\d+)'?\)/);
    if (m && !sns.includes(m[1])) sns.push(m[1]);
  });
  
  console.log(`Found ${sns.length} announcement SNs on list page`);
  console.log(`Testing first 3: ${sns.slice(0, 3).join(', ')}`);
  
  // 목록 페이지에서 날짜 추출 시도
  console.log('\n=== LIST PAGE DATE EXTRACTION ===');
  $('li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const dateMatch = text.match(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/g);
    if (dateMatch && text.length < 300 && text.length > 20) {
      console.log(`\n[LI] ${text.slice(0, 200)}`);
      console.log(`  Dates: ${dateMatch.join(', ')}`);
    }
  });
  
  // 상세 페이지도 테스트
  for (const sn of sns.slice(0, 2)) {
    await testDetailPage(sn);
  }
}

main().catch(console.error);
