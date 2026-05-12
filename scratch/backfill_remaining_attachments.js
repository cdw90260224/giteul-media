const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const cheerio = require('cheerio');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function backfillRemaining() {
    console.log('--- [Backfill] Processing Remaining Support Announcements ---');
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, notice_url, content, title')
        .eq('category', '정부지원공고')
        .not('content', 'ilike', '%첨부파일%'); // 첨부파일 섹션 없는 것 전부

    if (error || !posts) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} remaining posts to process.`);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (!post.notice_url || !post.notice_url.startsWith('http')) {
            console.log(`[${i+1}/${posts.length}] Skipping invalid URL: ${post.title}`);
            continue;
        }

        console.log(`[${i+1}/${posts.length}] Processing: ${post.title}`);

        try {
            const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
            const html = await res.text();
            const $ = cheerio.load(html);

            const attachments = [];
            // K-Startup & Generic patterns
            $('a.file_bg, .file_list a, .attach_file a, .file-list a').each((_, el) => {
                const link = $(el);
                const fileName = link.text().trim();
                let href = link.attr('href') || (link.attr('onclick') ? link.attr('onclick').match(/'(.*?)'/)?.[1] : null);
                
                if (fileName && href && (fileName.match(/\.(hwp|pdf|docx|zip|xlsx)$/i) || href.includes('fileDownload'))) {
                    if (!href.startsWith('http')) {
                        const baseUrl = new URL(post.notice_url).origin;
                        href = baseUrl + (href.startsWith('/') ? '' : '/') + href;
                    }
                    attachments.push({ name: fileName, url: href });
                }
            });

            if (attachments.length > 0) {
                const attachmentMd = "\n\n### 📎 첨부파일\n" + attachments.map(a => `- [${a.name}](${a.url})`).join('\n');
                const updatedContent = post.content + attachmentMd;

                await supabase.from('posts').update({ content: updatedContent }).eq('id', post.id);
                console.log(`✅ Added ${attachments.length} attachments.`);
            } else {
                console.log('No attachments found.');
            }
            await sleep(2000);
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
    console.log('--- Done ---');
}

backfillRemaining();
