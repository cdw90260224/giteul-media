const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function testScrape() {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  try {
    const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
    const html = await response.text();
    const $ = cheerio.load(html);
    const notices = [];
    
    $('a').each((_, el) => {
      const link = $(el);
      const attrVal = link.attr('onclick') || link.attr('href') || '';
      const snMatch = attrVal.match(/go_view\('?(\d+)'?\)/);
      if (snMatch) {
          const id = snMatch[1];
          const title = link.text().trim().replace(/\s+/g, ' ');
          if (title.length > 5) {
              notices.push({ id, title });
          }
      }
    });

    console.log(`Found ${notices.length} notices.`);
    console.log(JSON.stringify(notices.slice(0, 5), null, 2));
  } catch (err) {
    console.error(err);
  }
}

testScrape();
