const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const cheerio = require('cheerio');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function backfillAttachments() {
    console.log('--- [Backfill] Starting K-Startup Attachment Crawling ---');
    
    // 1. K-Startup 공고 중 첨부파일 섹션이 아직 없는 것들 가져오기
    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, notice_url, content, title')
        .eq('category', '정부지원공고')
        .like('notice_url', '%k-startup.go.kr%')
        .not('content', 'ilike', '%첨부파일%'); // 이미 있는 건 제외

    if (error || !posts) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} posts to process.`);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        console.log(`[${i+1}/${posts.length}] Processing: ${post.title}`);

        try {
            const res = await fetch(post.notice_url, { headers: FETCH_HEADERS });
            const html = await res.text();
            const $ = cheerio.load(html);

            const attachments = [];
            $('a.file_bg').each((_, el) => {
                const fileName = $(el).text().trim();
                const downloadBtn = $(el).parent().find('a.btn_down:not(.btn_downAll)');
                let href = downloadBtn.attr('href');
                if (fileName && href) {
                    if (!href.startsWith('http')) href = `https://www.k-startup.go.kr${href}`;
                    attachments.push({ name: fileName, url: href });
                }
            });

            if (attachments.length > 0) {
                const attachmentMd = "\n\n### 📎 첨부파일\n" + attachments.map(a => `- [${a.name}](${a.url})`).join('\n');
                const updatedContent = post.content + attachmentMd;

                const { error: updateError } = await supabase
                    .from('posts')
                    .update({ content: updatedContent })
                    .eq('id', post.id);

                if (updateError) {
                    console.error(`Failed to update post ${post.id}:`, updateError.message);
                } else {
                    console.log(`✅ Successfully added ${attachments.length} attachments.`);
                }
            } else {
                console.log('No attachments found for this post.');
            }

            // IP 차단 방지 (2~4초 대기)
            await sleep(2000 + Math.random() * 2000);

        } catch (err) {
            console.error(`Error processing post ${post.id}:`, err.message);
        }
    }
    console.log('--- [Backfill] Completed ---');
}

backfillAttachments();
