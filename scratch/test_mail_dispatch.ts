
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env: any = {};
    content.split('\n').filter(l => l.includes('=')).forEach(line => {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
    });
    return env;
}

async function run() {
    console.log('--- [MAIL TEST] Forcing Newsletter Send ---');
    const env = getEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check Env
    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASS is missing in .env.local');
        return;
    }
    console.log(`Using Email: ${env.EMAIL_USER}`);

    const { data: subscribers, error } = await supabase.from('subscribers').select('*');
    if (error || !subscribers || subscribers.length === 0) {
        console.error('ERROR: No subscribers found to test.');
        return;
    }

    const { generateNewsletterHtml } = await import('../src/lib/newsletter-engine');
    const { sendMail } = await import('../src/lib/mailer');

    const dummyContent = {
        news: [{ 
            id: 'test', 
            title: '[기술/IT] 인공지능이 바꾸는 미래 뉴스레터 테스트', 
            summary: '[기술/IT] 이 메일은 정상적인 발송 테스트를 위해 전송되었습니다.',
            category: 'TECH'
        }],
        support: [{ 
            id: 'test-support', 
            title: '[중요] 2026년 스타트업 글로벌 진출 지원사업', 
            summary: '[기술/IT] 테스트용 지원사업 공고 내용입니다.',
            deadline_date: 'D-7',
            category: '정부지원공고'
        }],
        sector: '기술/IT'
    };

    const html = generateNewsletterHtml(dummyContent);

    for (const sub of subscribers) {
        console.log(`Sending to ${sub.email}...`);
        try {
            // Override process.env for the library
            process.env.EMAIL_USER = env.EMAIL_USER;
            process.env.EMAIL_PASS = env.EMAIL_PASS;
            
            await sendMail(sub.email, `기틀 미디어 테스트 메일 [${new Date().toLocaleTimeString()}]`, html);
            console.log(`SUCCESS: Sent to ${sub.email}`);
        } catch (e: any) {
            console.error(`FAILED: ${sub.email} - ${e.message}`);
        }
    }
}

run();
