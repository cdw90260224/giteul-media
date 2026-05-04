import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;

async function testNewsData() {
    console.log('Testing NewsData.io with key:', NEWSDATA_KEY?.slice(0, 10) + '...');
    const newsDataCat = 'technology';
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&country=kr&category=${newsDataCat}`;
    console.log('URL:', url.replace(NEWSDATA_KEY || '', 'HIDDEN'));
    const res = await fetch(url);
    const data: any = await res.json();
    console.log('Response Status:', data.status);
    if (data.results) {
        console.log('Results found:', data.results.length);
        console.log('Sample titles:', data.results.slice(0, 3).map((r: any) => r.title));
    } else {
        console.log('No results or error:', data);
    }
}

testNewsData();
