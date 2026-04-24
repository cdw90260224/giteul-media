const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function recrawlDeadlines() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, notice_url, deadline_date')
        .eq('category', '정부지원공고')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${posts.length} posts with missing deadlines. Starting recrawl...`);

    for (const post of posts) {
        if (!post.notice_url || !post.notice_url.includes('k-startup.go.kr')) continue;

        try {
            const res = await fetch(post.notice_url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const html = await res.text();
            const allText = html.replace(/<[^>]*>/g, ' '); // Strip HTML tags
            
            let deadline = null;
            
            // Look for "접수기간" or "신청기간" then extract the following date
            const keywordMatch = allText.match(/(?:접수기간|신청기간|마감일자|마감일)[\s\S]{0,150}/g);
            if (keywordMatch) {
                // Find all dates in the match area
                const lastKeywordMatch = keywordMatch[keywordMatch.length - 1];
                const dates = lastKeywordMatch.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/g);
                if (dates && dates.length > 0) {
                    // Pick the last date in the range which is usually the deadline
                    deadline = dates[dates.length - 1].replace(/\./g, '-');
                }
            }

            // Fallback: search anywhere for 2026 dates
            if (!deadline) {
                const dateMatch = allText.match(/2026[.-](\d{1,2})[.-](\d{1,2})/g);
                if (dateMatch) {
                    deadline = dateMatch[dateMatch.length - 1].replace(/\./g, '-');
                }
            }

            if (deadline && deadline !== post.deadline_date) {
                console.log(`[FIX] ID ${post.id}: ${post.title} -> ${deadline} (was ${post.deadline_date})`);
                const { error: upError } = await supabase
                    .from('posts')
                    .update({ deadline_date: deadline })
                    .eq('id', post.id);
                if (upError) console.error(`Update failed for ${post.id}:`, upError);
            } else if (deadline) {
                console.log(`[OK] ID ${post.id}: ${post.title} (Already ${deadline})`);
            } else {
                console.log(`[SKIP] ID ${post.id}: ${post.title} (Deadline not found)`);
            }
        } catch (e) {
            console.error(`Failed ID ${post.id}:`, e.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Recrawl complete.');
}

recrawlDeadlines();
