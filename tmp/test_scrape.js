const cheerio = require('cheerio');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function scrapeKStartup() {
  const TARGET_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
  try {
    const response = await fetch(TARGET_URL, { headers: FETCH_HEADERS });
    console.log('K-Startup Response OK:', response.ok);
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const notices = [];
    $('li, .card, .item').each((_, el) => {
      let title = $(el).find('.tit, p.tit, h4, strong').first().text().trim();
      if (!title || title.length < 5) return;
      const onClick = $(el).find('a').attr('onclick') || '';
      const snMatch = onClick.match(/go_view\('?(\d+)'?\)/);
      if (!snMatch) return;
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

async function scrapeTechNews() {
  try {
    const RSS_URL = 'https://techcrunch.com/feed/';
    const res = await fetch(RSS_URL, { headers: FETCH_HEADERS });
    console.log('TechCrunch Response OK:', res.ok);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    const news = [];
    for (const item of items) {
      const raw = item[1];
      const title = raw.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || raw.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = raw.match(/<link>(.*?)<\/link>/)?.[1] || '';
      news.push({ title: title.trim(), notice_url: link.trim(), source_type: 'AI/테크 트렌드' });
    }
    return news;
  } catch (e) { 
    console.error('TechCrunch error:', e);
    return []; 
  }
}

async function test() {
    const kData = await scrapeKStartup();
    console.log('K-Startup count:', kData.length);
    if(kData.length > 0) console.log('Sample:', kData[0].title);
    
    const tData = await scrapeTechNews();
    console.log('TechCrunch count:', tData.length);
    if(tData.length > 0) console.log('Sample:', tData[0].title);
}

test();
