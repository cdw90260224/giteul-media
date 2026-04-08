const cheerio = require('cheerio');
const fs = require('fs');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

async function testDeepScrape() {
    console.log("1. Fetching K-Startup List...");
    const xs = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await xs.text();
    const $ = cheerio.load(html);
    
    let items = [];
    $('li, .card, .item, .box').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ');
        const elHtml = $(el).html() || '';
        const title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
        const snMatch = elHtml.match(/go_view\('?(\d+)'?\)/);
        if (title && snMatch) {
            items.push({
                title,
                url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`
            });
        }
    });

    if (items.length === 0) {
        console.log("No items found. Check scraper list logic.");
        return;
    }

    const target = items[0];
    console.log(`\n2. Performing Deep Scrape on:\nTitle: ${target.title}\nURL: ${target.url}\n`);

    try {
        const res = await fetch(target.url, { headers: FETCH_HEADERS });
        const text = await res.text();
        const $d = cheerio.load(text);

        // K-startup usually stores the main body in classes like .post-content, .board-view, .detail-content, .editor-wrap
        const detailSelectors = ['.editor-wrap', '.board_view', '.post-content', '.detail-content', '.txt_area', '.biz-detail'];
        let detailText = '';
        for (const sel of detailSelectors) {
            const found = $d(sel).text().trim();
            if (found && found.length > detailText.length) {
                detailText = found;
            }
        }
        
        // If specific selector fails, just grab the whole body but strip nav/footer
        if(!detailText || detailText.length < 50) {
            $d('script, style, nav, header, footer').remove();
            detailText = $d('.content, #container, main').text().trim().replace(/\s+/g, ' ');
        }

        // Attachments
        const attachments = [];
        $d('.file_list a, .attached-file a, .file-list li a').each((_, el) => {
             const fname = $d(el).text().trim();
             if (fname) attachments.push(fname);
        });

        console.log("=== [Deep Text Snippet - First 1000 chars] ===");
        console.log(detailText.slice(0, 1000));
        console.log("==============================================");
        console.log("Attachments found:");
        console.log(attachments.length > 0 ? attachments : "None detected.");
        
    } catch (e) {
        console.error("Deep scrape failed:", e);
    }
}

testDeepScrape();
