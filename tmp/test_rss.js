
async function testRSS() {
    const urls = [
        'https://news.google.com/rss/search?q=%EA%B8%B0%EC%97%85+%EB%A7%88%EC%BC%93+%EC%A6%9D%EC%8B%9C+M%26A&hl=ko&gl=KR&ceid=KR:ko',
        'https://news.google.com/rss/search?q=%EA%B8%80%EB%A1%9C%EB%B2%8C+%EA%B2%BD%EC%A0%9C+%EA%B5%AD%EC%A0%9C+%EC%A0%95%EC%84%B8&hl=ko&gl=KR&ceid=KR:ko'
    ];
    for (const url of urls) {
        console.log(`--- Testing ${url} ---`);
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const xml = await res.text();
            console.log(`XML Length: ${xml.length}`);
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
            console.log(`Found items: ${items.length}`);
            if (items.length > 0) {
              const title = items[0][1].match(/<title>(.*?)<\/title>/)?.[1];
              console.log(`First Title: ${title}`);
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}

testRSS();
