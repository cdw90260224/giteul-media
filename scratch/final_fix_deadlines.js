const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function fix() {
    const res = await fetch('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do', { headers: FETCH_HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Find all list items
    // In K-startup, list items are usually inside a ul/li
    $('li').each(async (i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const dateMatch = text.match(/마감일자\s*(\d{4})[./-](\d{2})[./-](\d{2})/);
        
        if (dateMatch) {
            const deadline = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            // Find the link inside this li to get the ID
            const link = $(el).find('a').first();
            const attrVal = link.attr('onclick') || link.attr('href') || '';
            const snMatch = attrVal.match(/pbancSn=(\d+)/) || attrVal.match(/go_view\('?(\d+)'?\)/);
            
            if (snMatch) {
                const url = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${snMatch[1]}`;
                const { data } = await supabase.from('posts').select('id, title').eq('notice_url', url).single();
                if (data) {
                    console.log(`Fixing ID ${data.id}: ${deadline}`);
                    await supabase.from('posts').update({ deadline_date: deadline }).eq('id', data.id);
                }
            }
        }
    });
}
fix();
