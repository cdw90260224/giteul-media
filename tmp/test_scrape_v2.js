const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function scrapeKStartup() {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  try {
    const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    console.log('HTML length:', html.length);
    // Find any list items
    const listItems = $('ul.list li, ul.biz_list li');
    console.log('Found list items count:', listItems.length);
    
    if (listItems.length === 0) {
        // Log some snippet of the body to see what's there
        console.log('Body snippet:', html.substring(0, 1000));
        return [];
    }

    const notices = [];
    listItems.each((_, el) => {
      let title = $(el).find('.tit, p.tit, p, h4, strong').first().text().trim();
      const link = $(el).find('a');
      const attrVal = link.attr('onclick') || link.attr('href') || '';
      const snMatch = attrVal.match(/go_view\('?(\d+)'?\)/);
      
      if (!snMatch || !title) return;
      
      notices.push({ 
        title, 
        notice_url: `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`, 
        source_type: '정부지원공고' 
      });
    });
    return notices;
  } catch (e) { 
    console.error('K-Startup error:', e);
    return []; 
  }
}

async function test() {
    const kData = await scrapeKStartup();
    console.log('K-Startup count:', kData.length);
    if(kData.length > 0) {
        console.log('Sample Title:', kData[0].title);
        console.log('Sample URL:', kData[0].notice_url);
    }
}

test();
