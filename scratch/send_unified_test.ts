import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabase } from '../src/lib/supabase';
import { generateUnifiedNewsletterHtml } from '../src/lib/newsletter-engine';
import { sendMail } from '../src/lib/mailer';

async function sendUnifiedTest() {
    const targetEmail = 'cdw90260224@gmail.com';
    const testSectors = ['기술/IT', '소상공인', '농업'];
    
    console.log(`[Test] Generating UNIFIED newsletter for ${targetEmail}...`);

    const { data: posts } = await supabase.from('posts').select('*').limit(30);
    if (!posts) return;

    const sections = testSectors.map(sector => {
        const news = posts.filter(p => p.category !== '정부지원공고' && p.summary.includes(`[${sector}]`)).slice(0, 2);
        const support = posts.filter(p => p.category === '정부지원공고' && p.summary.includes(`[${sector}]`)).slice(0, 2);
        return { sector, news, support };
    }).filter(s => s.news.length > 0 || s.support.length > 0);

    if (sections.length === 0) {
        console.log('No content found for test sectors. Using first few posts as mock.');
        sections.push({
            sector: '기술/IT',
            news: posts.slice(0, 2),
            support: posts.slice(2, 4)
        });
    }

    const html = generateUnifiedNewsletterHtml(targetEmail, sections);
    
    try {
        await sendMail(targetEmail, `[기틀 통합테스트] 한 통으로 끝내는 오늘의 비즈니스 리포트`, html);
        console.log('[Test] Successfully sent UNIFIED test email!');
    } catch (e) {
        console.error('[Test] Failed:', e);
    }
}

sendUnifiedTest();
