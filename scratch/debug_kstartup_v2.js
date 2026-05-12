const cheerio = require('cheerio');
const FETCH_HEADERS = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function debug() {
    console.log('Fetching K-Startup...');
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    console.log('Status:', res.status);
    console.log('URL:', res.url);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('Title:', $('title').text());
    
    const targets = [];
    $('a').each((_, el) => {
      const link = $(el);
      const attrVal = link.attr('onclick') || link.attr('href') || '';
      const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
      if (snMatch) {
          targets.push({ sn: snMatch[1], text: link.text().trim() });
      }
    });
    
    console.log(`Found ${targets.length} targets.`);
    if (targets.length > 0) {
        console.table(targets.slice(0, 10));
    } else {
        console.log('HTML snippet (first 500 chars):');
        console.log(html.slice(0, 500));
    }
}
debug();
