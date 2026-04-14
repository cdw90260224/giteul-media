export interface NewsArticle {
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: string;
}

export async function fetchExternalNews(category: string): Promise<NewsArticle[]> {
    const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
    const GNEWS_KEY = process.env.GNEWS_API_KEY;

    // Default to Mock if no keys found for demo/testing
    if (!NEWSDATA_KEY && !GNEWS_KEY) {
        console.warn('No News API keys found in .env.local. Returning mock data for testing.');
        return [
            {
                title: `[MOCK] ${category} 최신 트렌드 분석 - AI 시장의 변화`,
                description: '전 세계적으로 AI 기술이 급격히 발전함에 따라 스타트업들의 대응 전략도 변하고 있습니다.',
                content: '상세 내용은 생략되었습니다 (Mock Data).',
                url: 'https://newsdata.io',
                image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
                publishedAt: new Date().toISOString(),
                source: 'Giteul Mock News'
            }
        ];
    }

    // Attempt GNews as priority for Search keywords if specified
    if (GNEWS_KEY) {
        try {
            const query = (category === 'AI/테크 트렌드' || category === 'tech' || category === 'Tech') 
                ? '인공지능 테크 스타트업 AI' 
                : (category === '글로벌 뉴스' ? 'Global Venture Capital News' : '대한민국 기업 마켓 스타트업 뉴스');
            const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=ko&country=kr&max=5&apikey=${GNEWS_KEY}`);
            const data = await res.json();
            if (data.articles) {
                return data.articles.map((a: any) => ({
                    title: a.title,
                    description: a.description,
                    content: a.content || a.description,
                    url: a.url,
                    image: a.image,
                    publishedAt: a.publishedAt,
                    source: a.source.name
                }));
            }
        } catch (e) { console.error('GNews fetch error:', e); }
    }

    // Fallback to NewsData.io
    if (NEWSDATA_KEY) {
        try {
            const newsDataCat = (category === 'AI/테크 트렌드' || category === 'tech' || category === 'Tech') ? 'technology' : 'business';
            const res = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&country=kr&category=${newsDataCat}`);
            const data = await res.json();
            if (data.results) {
                return data.results.map((r: any) => ({
                    title: r.title,
                    description: r.description || '',
                    content: r.content || r.description || '',
                    url: r.link,
                    image: r.image_url || '',
                    publishedAt: r.pubDate,
                    source: r.source_id
                }));
            }
        } catch (e) { console.error('NewsData fetch error:', e); }
    }

    return [];
}
