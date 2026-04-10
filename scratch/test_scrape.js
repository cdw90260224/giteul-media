const cheerio = require('cheerio');

async function test() {
    console.log('Testing K-Startup Scrape...');
    try {
        const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            cache: 'no-store' 
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const notices = [];
        $('a').each((_, el) => {
            const link = $(el);
            const attrVal = link.attr('onclick') || '';
            const snMatch = attrVal.match(/go_view\('?(\d+)'?\)/);
            if (snMatch) {
                notices.push(link.text().trim());
            }
        });
        console.log('Scraped count:', notices.length);
        if (notices.length > 0) console.log('Sample:', notices[0]);
    } catch (e) {
        console.error('Scrape Error:', e.message);
    }
}

test();
