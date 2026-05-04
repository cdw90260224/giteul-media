import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabase } from '../src/lib/supabase';
import { generateNewsletterHtml } from '../src/lib/newsletter-engine';
import { sendMail } from '../src/lib/mailer';

async function sendTestToUser() {
    const targetEmail = 'cdw90260224@gmail.com';
    const testSector = '기술/IT';
    
    console.log(`[Test] Generating newsletter for ${targetEmail} (Sector: ${testSector})...`);

    // 1. Fetch some content to show in the mail
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .limit(10);

    if (error || !posts) {
        console.error('Failed to fetch posts:', error);
        return;
    }

    const newsForSector = posts.filter(p => p.category !== '정부지원공고' && (p.summary.includes(`[${testSector}]`) || p.category.includes('트렌드'))).slice(0, 3);
    const supportForSector = posts.filter(p => p.category === '정부지원공고').slice(0, 3);

    const html = generateNewsletterHtml({
        news: newsForSector,
        support: supportForSector,
        sector: testSector
    });

    console.log('[Test] Sending email...');
    try {
        await sendMail(targetEmail, `[기틀 테스트] 오늘의 ${testSector} 비즈니스 인텔리전스`, html);
        console.log('[Test] Successfully sent test email to user!');
    } catch (e) {
        console.error('[Test] Failed to send email:', e);
    }
}

sendTestToUser();
