const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => env.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();
const supabase = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// Project's actual HTML generation logic copied for exact match
function generateUnifiedNewsletterHtml(email, sections) {
  const contentHtml = sections.map(section => `
    <div style="margin-bottom: 50px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
        <div style="width: 6px; height: 24px; background-color: #1a202c; border-radius: 3px;"></div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #1a202c;">[${section.sector}] 브리핑</h2>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #718096; letter-spacing: 1px; margin-bottom: 15px;">Latest News & Insights</p>
        ${section.news.map((item, idx) => `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;">
             <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px; font-weight: 900;">${item.title}</h3>
             <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 13px; line-height: 1.6;">${item.summary.replace(/^\[.*?\]\s*/, '')}</p>
             <a href="https://giteul.media/article/${item.id}?utm_source=newsletter" style="color: #2d3748; font-size: 12px; text-decoration: none; font-weight: 800; border-bottom: 1px solid #e2e8f0;">분석 리포트 읽기 →</a>
          </div>
        `).join('') || '<p style="color: #a0aec0; font-size: 13px;">새로운 뉴스가 없습니다.</p>'}
      </div>

      <div>
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #FF5C00; letter-spacing: 1px; margin-bottom: 15px;">Government Support Programs</p>
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
          ${section.support.map(item => `
            <div style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #f0f0f0; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <h4 style="margin: 0 0 10px 0; color: #1a202c; font-size: 15px; font-weight: 900; line-height: 1.4;">${item.title}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 900; color: white; background: #FF5C00; padding: 4px 10px; border-radius: 6px;">${item.deadline_date ? `D-DAY ${item.deadline_date}` : '상시모집/확인'}</span>
                <a href="https://giteul.media/article/${item.id}?utm_source=newsletter" style="font-size: 12px; font-weight: 900; color: #1a202c; text-decoration: none;">상세보기</a>
              </div>
            </div>
          `).join('') || '<p style="color: #a0aec0; font-size: 13px;">새로운 지원사업이 없습니다.</p>'}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08);">
        <div style="background-color: #0f172a; padding: 60px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; font-style: italic;">GITEUL<span style="color: #FF5C00;">.</span></h1>
          <p style="color: #94a3b8; margin: 15px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Unified Business Intelligence</p>
        </div>
        <div style="padding: 50px 40px;">
          <p style="font-size: 15px; color: #64748b; margin-bottom: 40px; line-height: 1.6;">안녕하세요, <b>${email}</b>님.<br/>오늘의 맞춤형 비즈니스 인사이트 리포트가 도착했습니다.</p>
          ${contentHtml}
        </div>
        <div style="background-color: #f8fafc; padding: 40px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">© 2026 Giteul AI Media Portal</p>
          <p style="color: #cbd5e1; font-size: 10px; line-height: 1.5;">본 메일은 구독하신 관심 분야를 바탕으로 AI가 자동 큐레이션한 결과입니다.<br/>수신 거부 및 정보 수정은 사이트 내 설정에서 가능합니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendPremiumTestMail() {
    console.log('--- Sending Premium Real-Content Newsletter Test ---');
    const { data: latestPosts } = await supabase.from('posts').select('*').gt('created_at', new Date(Date.now() - 48*60*60*1000).toISOString()).order('created_at', {ascending:false});
    const { data: sub } = await supabase.from('subscribers').select('*').eq('email', 'cdw90260224@gmail.com').single();
    
    if (!sub || !latestPosts) {
        console.error('Missing data for test.');
        return;
    }

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
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: getEnv('EMAIL_USER'), pass: getEnv('EMAIL_PASS') }
        });

        const html = generateUnifiedNewsletterHtml(sub.email, sections);

        await transporter.sendMail({
            from: `"기틀 미디어" <${getEnv('EMAIL_USER')}>`,
            to: sub.email,
            subject: `[기틀] 오늘의 맞춤형 비즈니스 인텔리전스 리포트`,
            html: html
        });
        console.log('SUCCESS: Premium test email sent to ' + sub.email);
    } else {
        console.log('No matching content for interests:', sub.interests);
    }
}

sendPremiumTestMail();
