const cheerio = require('cheerio');

async function test() {
    console.log('Testing NEW Scraper Logic...');
    try {
        const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            cache: 'no-store' 
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        const notices = [];
        
        $('a').each((_, el) => {
            const link = $(el);
            const attrVal = link.attr('onclick') || link.attr('href') || '';
            const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
            if (snMatch) {
                const title = link.text().trim().replace(/\s+/g, ' ');
                // If title is empty (happens if structure is nested), try to find p.tit
                const finalTitle = title || link.find('p').first().text().trim();
                if (finalTitle && finalTitle.length > 5) {
                    notices.push({
                        title: finalTitle,
                        sn: snMatch[1]
                    });
                }
            }
        });
        
        console.log('Total found:', notices.length);
        if (notices.length > 0) {
            console.log('Sample 1:', notices[0]);
            console.log('Sample 2:', notices[1]);
        }
    } catch (e) {
        console.error('Scrape Error:', e.message);
    }
}

test();
