const cheerio = require('cheerio');

fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=177178', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
})
.then(r => r.text())
.then(html => {
    const $ = cheerio.load(html);
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('fileDownload')) {
            console.log($(el).text().trim(), href);
        }
    });
});
