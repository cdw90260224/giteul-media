
import * as cheerio from 'cheerio';

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function testCrawler() {
    console.log('Testing K-Startup crawler...');
    try {
        const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const targets: any[] = [];
        
        $('a').each((_, el) => {
          const link = $(el);
          const attrVal = link.attr('onclick') || link.attr('href') || '';
          const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
          if (snMatch) {
            let title = link.find('p.tit, .tit, dt, strong').first().text().trim();
            if (!title) title = link.text().trim();
            title = title.replace(/D-?\d+|D-DAY|마감일자\s*[\d-.]+|마감\s*[\d-.]+|조회\s*[\d,]+/gi, '').replace(/\s+/g, ' ').trim();
            if (title && title.length > 5 && !targets.find(t => t.sn === snMatch[1])) {
              targets.push({ title, sn: snMatch[1], url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}` });
            }
          }
        });

        console.log(`Found ${targets.length} targets.`);
        if (targets.length > 0) {
            console.log('Sample targets:');
            targets.slice(0, 3).forEach(t => console.log(`- ${t.title} (${t.url})`));
        } else {
            console.log('No targets found. The website structure might have changed.');
            // console.log(html.slice(0, 1000)); // Log some HTML to see what's there
        }
    } catch (e: any) {
        console.error('Error during crawling:', e.message);
    }
}

testCrawler();
