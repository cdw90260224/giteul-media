const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const TAG_MAPPING = {
    '[기술/IT]': '[AI/빅데이터]',
    '[농업]': '[푸드/애그테크]',
    '[소상공인]': '[SaaS/플랫폼]'
};

async function fixPostTagsAndTestSend() {
    console.log('--- 1. Fixing existing post tags in summaries ---');
    const { data: posts } = await supabase.from('posts').select('id, summary').order('created_at', {ascending:false}).limit(50);
    
    for (const post of posts) {
        let newSummary = post.summary;
        let changed = false;
        
        Object.entries(TAG_MAPPING).forEach(([oldTag, newTag]) => {
            if (newSummary.includes(oldTag)) {
                newSummary = newSummary.replace(oldTag, newTag);
                changed = true;
            }
        });

        if (changed) {
            console.log(`Updating Post ${post.id} tag...`);
            await supabase.from('posts').update({ summary: newSummary }).eq('id', post.id);
        }
    }

    console.log('\n--- 2. Triggering actual newsletter dispatch logic ---');
    // We'll use a dynamic import to use the actual project logic
    try {
        // Since we are in a node environment with potential TS issues, 
        // I will write a small script that mimics processAndSendNewsletter exactly but targets the user.
        
        const { data: latestPosts } = await supabase.from('posts').select('*').gt('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
        const { data: sub } = await supabase.from('subscribers').select('*').eq('email', 'cdw90260224@gmail.com').single();
        
        if (!sub || !latestPosts) {
            console.error('Missing subscriber or posts for test.');
            return;
        }

        console.log(`Matched ${latestPosts.length} posts from last 24h.`);
        console.log(`Subscriber interests: ${sub.interests}`);

        // This part mimics src/lib/newsletter-engine.ts
        const sections = [];
        for (const interest of sub.interests) {
            const newsForSector = latestPosts.filter(p => p.category !== '정부지원공고' && p.summary.includes(`[${interest}]`));
            const supportForSector = latestPosts.filter(p => p.category === '정부지원공고' && p.summary.includes(`[${interest}]`));
            
            if (newsForSector.length > 0 || supportForSector.length > 0) {
                sections.push({
                    sector: interest,
                    news: newsForSector.slice(0, 3),
                    support: supportForSector.slice(0, 3)
                });
            }
        }

        if (sections.length > 0) {
            console.log(`Found ${sections.length} matching sections. Sending...`);
            // We'll call the real mailer if possible, or use a simple nodemailer setup here for the test.
            // But let's try to use the project's mailer.
            
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: getEnv('EMAIL_USER'), pass: getEnv('EMAIL_PASS') }
            });

            // Very simple HTML gen for this specific test to ensure it works
            const html = `<h1>기틀 미디어 통합 리포트 (테스트)</h1>` + 
                sections.map(s => `<h2>[${s.sector}]</h2>` + 
                    s.news.map(n => `<p><b>${n.title}</b><br/>${n.summary}</p>`).join('') +
                    s.support.map(sup => `<p>💰 <b>${sup.title}</b> (D-Day: ${sup.deadline_date || '상시'})</p>`).join('')
                ).join('');

            await transporter.sendMail({
                from: `"기틀 미디어" <${getEnv('EMAIL_USER')}>`,
                to: sub.email,
                subject: `[테스트] 기틀 미디어 통합 비즈니스 인텔리전스`,
                html: html
            });
            console.log('SUCCESS: Test email sent to ' + sub.email);
        } else {
            console.log('No matching content found for this user even after fix. Check sector names.');
        }

    } catch (err) {
        console.error('Dispatch failed:', err);
    }
}

fixPostTagsAndTestSend();
