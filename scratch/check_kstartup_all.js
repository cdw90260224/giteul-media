const cheerio = require('cheerio');
const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function checkTotalAnnouncements() {
    console.log('Checking K-Startup ongoing page for today...');
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
                let fullText = link.text().trim();
                
                // Get registration date or similar if visible
                // Typically K-Startup has a "등록일" or "게시일"
                targets.push({ title, sn: snMatch[1], fullText });
            }
        });
        
        console.log(`\nFound ${targets.length} links on the first page.`);
        targets.forEach((t, i) => {
            console.log(`[${i+1}] ${t.title.slice(0, 50)}...`);
        });
    } catch (e) {
        console.error('Failed:', e);
    }
}

checkTotalAnnouncements();
