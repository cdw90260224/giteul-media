
const cheerio = require('cheerio');
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function testScrape() {
    console.log('Testing K-Startup scrape...');
    try {
        const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const targets = [];
        $('a').each((_, el) => {
            const link = $(el);
            const attrVal = link.attr('onclick') || link.attr('href') || '';
            const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
            if (snMatch) {
                let title = link.find('p.tit, .tit, dt, strong').first().text().trim();
                if (!title) title = link.text().trim();
                title = title.replace(/D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+|조회\s*[\d,]+/gi, '').replace(/\s+/g, ' ').trim();
                if (title && title.length > 5 && !targets.find(t => t.sn === snMatch[1])) {
                    targets.push({ title, sn: snMatch[1] });
                }
            }
        });
        console.log(`Found ${targets.length} targets.`);
        console.log(JSON.stringify(targets.slice(0, 5), null, 2));
    } catch (e) {
        console.error('Scrape failed:', e);
    }
}

testScrape();
