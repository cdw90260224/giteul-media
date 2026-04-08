const cheerio = require('cheerio');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
};

async function testPdfGemini() {
    console.log("1. Fetching K-Startup List...");
    const xs = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await xs.text();
    const $ = cheerio.load(html);
    
    let items = [];
    $('li, .card, .item, .box').each((_, el) => {
        const elHtml = $(el).html() || '';
        const snMatch = elHtml.match(/go_view\('?(\d+)'?\)/);
        if (snMatch) {
            items.push(`https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`);
        }
    });

    console.log(`Found ${items.length} announcements. Scanning for attachments...`);

    let targetUrl = null;
    let targetFile = null;
    let detailText = '';

    for (const url of items.slice(0, 5)) { // limit to 5
        const res = await fetch(url, { headers: FETCH_HEADERS });
        const text = await res.text();
        const $d = cheerio.load(text);
        
        $d('script, style, nav, header, footer').remove();
        detailText = $d('.content, #container, main').text().trim().replace(/\s+/g, ' ');

        let foundFile = null;
        $d('a').each((_, el) => {
             const fname = $d(el).text().trim();
             const href = $d(el).attr('href') || '';
             // check if pdf
             if (href.includes('downNoticeFile') || href.includes('download') || fname.toLowerCase().endsWith('.pdf') || fname.toLowerCase().endsWith('.hwp')) {
                if(!foundFile && fname.length > 3) foundFile = { name: fname, href };
             }
        });

        if (foundFile) {
            targetUrl = url;
            targetFile = foundFile;
            break;
        }
    }

    if (!targetFile) {
        console.log("No attachments found in the first 5 announcements. We will simulate extraction on the text itself.");
        // Just send the text to Gemini
    } else {
        console.log("Found attachment:", targetFile.name);
    }
    
    // We will extract Numerical data & Scores from the detail HTML using Gemini since downloading complex redirect PDFs in a simple script might fail
    const prompt = `
Extract detailed numerical data from the following K-Startup announcement text. 
Focus strictly on finding the following exact data points. If not found, explicitly state "미확인".

Format your response exactly like this:
[배점 기준표]: <extract evaluation scores, e.g. 서류 30, 발표 70 - if none found write "배점 정보 미확인">
[상세 커리큘럼]: <extract any curriculum or training steps if present, otherwise "미확인">
[숫자(수치) 데이터]:
- 사업비/지원금 규모: <number, e.g., 최대 1억원>
- 교육/멘토링 시간: <number, e.g., 총 40시간>
- 선발 규모(인원/팀): <number, e.g., 20팀>

Text:
${detailText.slice(0, 10000)}
`;
    console.log("Sending text to Gemini 2.5 Flash for Data Extraction...");
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const result = await geminiRes.json();
    if(result.candidates && result.candidates.length > 0) {
        let extracted = result.candidates[0].content.parts[0].text;
        console.log("\n=== [추출된 숫자 및 배점 데이터 파싱 결과] ===");
        console.log(extracted);
        console.log("==================================================");
    } else {
        console.log("Gemini extraction failed.", result);
    }
}

testPdfGemini();
