
import { supabase } from './supabase';

export interface NewsletterContent {
  news: any[];
  support: any[];
  sector: string;
}

export function generateUnifiedNewsletterHtml(email: string, sections: { sector: string, news: any[], support: any[] }[]) {
  const contentHtml = sections.map(section => `
    <div style="margin-bottom: 50px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
        <div style="width: 6px; height: 24px; background-color: #3182ce; border-radius: 3px;"></div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #1a202c;">[${section.sector}] 브리핑</h2>
      </div>
      
      <div style="margin-bottom: 30px;">
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #3182ce; letter-spacing: 1px; margin-bottom: 15px;">Latest News</p>
        ${section.news.map((item, idx) => `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;">
             <h3 style="margin: 0 0 5px 0; color: #1a202c; font-size: 16px; font-weight: 900;">${item.title}</h3>
             <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 13px; line-height: 1.5;">${item.summary.replace(/^\[.*?\]\s*/, '')}</p>
             <a href="https://giteul.media/article/${item.id}?utm_source=newsletter" style="color: #3182ce; font-size: 12px; text-decoration: none; font-weight: 800;">분석 리포트 보기 →</a>
          </div>
        `).join('') || '<p style="color: #a0aec0; font-size: 13px;">새로운 뉴스가 없습니다.</p>'}
      </div>

      <div>
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #ed8936; letter-spacing: 1px; margin-bottom: 15px;">Support Programs</p>
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
          ${section.support.map(item => `
            <div style="background: #f8faff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h4 style="margin: 0 0 5px 0; color: #1a202c; font-size: 14px; font-weight: 800;">${item.title}</h4>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 11px; font-weight: 900; color: #ed8936;">${item.deadline_date ? `D-DAY ${item.deadline_date}` : '상시모집'}</span>
                <a href="https://giteul.media/article/${item.id}?utm_source=newsletter" style="font-size: 11px; font-weight: 900; color: #3182ce; text-decoration: none;">상세보기</a>
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
    <body style="font-family: sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div style="background-color: #1a202c; padding: 40px 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900;">기틀 <span style="color: #4299e1;">통합 비즈니스 브리핑</span></h1>
          <p style="color: #a0aec0; margin: 10px 0 0 0; font-size: 14px;">${email}님을 위한 맞춤형 인텔리전스입니다.</p>
        </div>
        <div style="padding: 40px 30px;">
          ${contentHtml}
        </div>
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #a0aec0; font-size: 12px;">© 2026 Giteul Media. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function processAndSendNewsletter() {
  console.log('[Newsletter] Starting unified morning dispatch...');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .gt('created_at', yesterday.toISOString());
    
  if (!posts) return;

  const { data: subscribers } = await supabase.from('subscribers').select('*');
  if (!subscribers) return;

  for (const subscriber of subscribers) {
    const sections: any[] = [];
    
    for (const interest of subscriber.interests) {
      const newsForSector = posts.filter(p => p.category !== '정부지원공고' && p.summary.includes(`[${interest}]`));
      const supportForSector = posts.filter(p => p.category === '정부지원공고' && p.summary.includes(`[${interest}]`));
      
      if (newsForSector.length > 0 || supportForSector.length > 0) {
        sections.push({
          sector: interest,
          news: newsForSector.slice(0, 3),
          support: supportForSector.slice(0, 3)
        });
      }
    }

    if (sections.length > 0) {
      const html = generateUnifiedNewsletterHtml(subscriber.email, sections);
      try {
        const { sendMail } = await import('./mailer');
        await sendMail(subscriber.email, `기틀 미디어 통합 비즈니스 인텔리전스 리포트`, html);
        console.log(`[Newsletter] Unified email sent to ${subscriber.email}`);
      } catch (e) {
        console.error(`[Newsletter] Failed for ${subscriber.email}:`, e);
      }
    }
  }
}
