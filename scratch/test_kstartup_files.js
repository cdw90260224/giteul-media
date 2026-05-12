const cheerio = require('cheerio');

async function testKStartupAttachments() {
    const testUrl = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=168931'; // 임의의 최신 공고 SN
    console.log(`Analyzing: ${testUrl}`);
    
    const res = await fetch(testUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const attachments = [];
    // K-Startup 첨부파일 일반적인 구조: .file_list 또는 a 태그 중 다운로드 관련
    $('.file_list li, .file-list li, .attach_file li').each((_, el) => {
        const link = $(el).find('a');
        const fileName = link.text().trim();
        const href = link.attr('onclick') || link.attr('href');
        if (fileName && href) {
            attachments.push({ fileName, href });
        }
    });

    if (attachments.length === 0) {
        // 다른 패턴 탐색
        $('a').each((_, el) => {
            const text = $(el).text().trim();
            const href = $(el).attr('href') || '';
            if (text.match(/\.(hwp|pdf|docx|zip|xlsx)$/i) || href.includes('fileDownload')) {
                attachments.push({ fileName: text, href });
            }
        });
    }

    console.log('--- Found Attachments ---');
    console.log(JSON.stringify(attachments, null, 2));
}

testKStartupAttachments();
