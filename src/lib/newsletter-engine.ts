
import { supabase } from './supabase';

export interface NewsletterContent {
  news: any[];
  support: any[];
  sector: string;
}

export function generateUnifiedNewsletterHtml(email: string, sections: { sector: string, news: any[], support: any[] }[]) {
  const contentHtml = sections.map(section => `
    <div style="margin-bottom: 60px;">
      <!-- Section Header -->
      <div style="display: table; width: 100%; margin-bottom: 30px;">
        <div style="display: table-cell; vertical-align: middle; width: 6px; height: 28px; background-color: #0f172a; border-radius: 3px;"></div>
        <div style="display: table-cell; vertical-align: middle; padding-left: 12px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">[${section.sector}] 브리핑</h2>
        </div>
      </div>
      
      <!-- News Section -->
      <div style="margin-bottom: 40px;">
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 2px; margin-bottom: 20px;">LATEST NEWS & INSIGHTS</p>
        ${section.news.map((item) => `
          <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
             <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 17px; font-weight: 900; line-height: 1.4;">${item.title}</h3>
             <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; line-height: 1.6;">${item.summary.replace(/^\[.*?\]\s*/, '')}</p>
             <a href="https://giteul-media.vercel.app/article/${item.id}?utm_source=newsletter" style="color: #0f172a; font-size: 12px; text-decoration: none; font-weight: 800; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 2px;">분석 리포트 보기 →</a>
          </div>
        `).join('') || '<p style="color: #cbd5e1; font-size: 14px; font-weight: 600; padding: 20px; background: #f8fafc; border-radius: 12px;">현재 해당 분야의 최신 뉴스가 없습니다.</p>'}
      </div>

      <!-- Support Section -->
      <div>
        <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; color: #FF5C00; letter-spacing: 2px; margin-bottom: 20px;">SUPPORT PROGRAMS</p>
        <div style="display: block;">
          ${section.support.map(item => `
            <div style="background: #ffffff; padding: 24px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
              <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 900; line-height: 1.5;">${item.title}</h4>
              <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.6;">${item.summary.replace(/^\[.*?\]\s*/, '')}</p>
              ${item.content.includes('### 📎 첨부파일') ? `
                <div style="margin-bottom: 15px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; color: #94a3b8; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">📎 Attachments</div>
                  ${item.content.split('### 📎 첨부파일')[1].split('\n\n')[0].split('\n').filter(line => line.startsWith('- ')).map(line => {
                    const match = line.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                      return `<div style="margin-bottom: 5px;"><a href="${match[2]}" style="font-size: 12px; color: #1e293b; text-decoration: none; font-weight: 700;">• ${match[1]}</a></div>`;
                    }
                    return '';
                  }).join('')}
                </div>
              ` : ''}
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; vertical-align: middle;">
                  <span style="font-size: 10px; font-weight: 900; color: white; background: #FF5C00; padding: 5px 12px; border-radius: 8px; text-transform: uppercase;">${item.deadline_date ? `D-DAY ${item.deadline_date}` : '상시모집/확인'}</span>
                </div>
                <div style="display: table-cell; vertical-align: middle; text-align: right;">
                  <a href="https://giteul-media.vercel.app/article/${item.id}?utm_source=newsletter" style="font-size: 13px; font-weight: 900; color: #0f172a; text-decoration: none; border-bottom: 1px solid #e2e8f0;">리포트 보기</a>
                </div>
              </div>
            </div>
          `).join('') || '<p style="color: #cbd5e1; font-size: 14px; font-weight: 600; padding: 20px; background: #f8fafc; border-radius: 12px;">새로운 지원사업 공고가 없습니다.</p>'}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 60px 20px;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.12);">
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 70px 50px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1.5px; font-style: italic;">GITEUL<span style="color: #FF5C00;">.</span></h1>
          <p style="color: #475569; margin: 15px 0 0 0; font-size: 15px; font-weight: 700; letter-spacing: 1px;">통합 비즈니스 브리핑</p>
          <div style="margin-top: 20px; display: inline-block; padding: 4px 15px; border-radius: 100px; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 12px; font-weight: 600;">${email}</div>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 60px 50px;">
          ${contentHtml}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 50px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #0f172a; font-size: 12px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">Intelligence & Strategy</p>
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.8; margin-bottom: 0;">
            본 리포트는 귀하의 관심 산업 분야를 기반으로 AI가 분석한 맞춤형 정보입니다.<br/>
            © 2026 Giteul AI Media. All rights reserved.
          </p>
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
    
    const interests = subscriber.interests || [];
    if (interests.length === 0) continue;

    for (const interest of interests) {
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
