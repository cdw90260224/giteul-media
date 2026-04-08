const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
};

async function testFetchHtml() {
    const xs = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await xs.text();
    const $ = cheerio.load(html);
    
    let url = null;
    $('li, .card, .item, .box').each((_, el) => {
        const title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
        const snMatch = ($(el).html() || '').match(/go_view\('?(\d+)'?\)/);
        if (title && snMatch && !url) {
            url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`;
        }
    });

    if(!url) { console.log("No url"); return; }
    
    console.log("Fetching exact detail page: " + url);
    const detail = await fetch(url, { headers: FETCH_HEADERS });
    const text = await detail.text();
    const $d = cheerio.load(text);
    
    // Check file attachments block
    const filesHtml = $d('.file_list, .attached-file, .file-list, .box_file').html();
    console.log("File HTML block:");
    console.log(filesHtml ? filesHtml.slice(0, 1500) : "No file block found");
}
testFetchHtml();
