const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const GEMINI_KEY = getEnv('GEMINI_API_KEY');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function fixBrokenDeadlines() {
    console.log('--- Fixing Broken Deadlines: Re-parsing K-Startup ---');
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // K-Startup list items are often in <li> inside .biz_list (as seen in browser agent)
    // We search all <li> or link containers
    const items = [];
    $('.biz_list li, li').each((_, li) => {
        const $li = $(li);
        const link = $li.find('a').first();
        const attrVal = link.attr('onclick') || '';
        const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
        
        if (snMatch) {
            const sn = snMatch[1];
            const url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${sn}`;
            
            // Search for "마감일자" in the entire li text
            const liText = $li.text().replace(/\s+/g, ' ');
            const dateMatch = liText.match(/마감일자\s*(\d{4})[./-](\d{2})[./-](\d{2})/);
            const deadline = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
            
            if (deadline) {
                items.push({ sn, url, deadline });
            }
        }
    });

    console.log(`Found ${items.length} items with deadlines on page 1.`);
    
    for (const item of items) {
        // Find existing post with this notice_url and null deadline
        const { data: post } = await supabase.from('posts').select('id, title').eq('notice_url', item.url).single();
        if (post) {
            console.log(`Updating ID ${post.id} (${post.title.slice(0, 30)}...) with deadline ${item.deadline}`);
            await supabase.from('posts').update({ deadline_date: item.deadline }).eq('id', post.id);
        }
    }
}

fixBrokenDeadlines();
