const cheerio = require('cheerio');
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function debug() {
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Total links with go_view
    const links = [];
    $('a').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const onclick = $(el).attr('onclick') || '';
        if (onclick.includes('go_view')) {
            links.push({ i, text, onclick });
        }
    });
    
    console.log(`Found ${links.length} go_view links.`);
    links.slice(0, 5).forEach(l => console.log(l));
}
debug();
