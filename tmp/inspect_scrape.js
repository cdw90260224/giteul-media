const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function inspectKStartup() {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  try {
    const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find all <li> and log their first 10 classes
    console.log('--- LI Inspection ---');
    $('li').slice(0, 20).each((i, el) => {
        console.log(`LI ${i}: class="${$(el).attr('class') || ''}", text="${$(el).text().trim().substring(0, 30)}..."`);
    });
    
    // Find any titles
    console.log('--- Title Search ---');
    $('.tit, .title, p, h4, strong').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('모집') || text.includes('2026')) {
            console.log(`Potential Title: "${text}"`);
        }
        if (i > 200) return false;
    });

    // Check for a tags with go_view
    console.log('--- A tags Search ---');
    const links = $('a');
    console.log('Total A tags:', links.length);
    links.each((i, el) => {
        const h = $(el).attr('href') || '';
        const oc = $(el).attr('onclick') || '';
        if (h.includes('go_view') || oc.includes('go_view')) {
            console.log(`Found link: Href="${h}", Onclick="${oc}", Text="${$(el).text().trim().substring(0, 20)}"`);
        }
    });

  } catch (e) {
    console.error(e);
  }
}

inspectKStartup();
