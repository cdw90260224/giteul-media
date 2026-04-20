
import { supabase } from './supabase';

export interface NewsletterContent {
  news: any[];
  support: any[];
  sector: string;
}

export function generateNewsletterHtml(content: NewsletterContent) {
  const { news, support, sector } = content;

  const newsItems = news.map((item, idx) => `
    <div style="margin-bottom: 25px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px;">
      <div style="display: flex; gap: 15px;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #1a202c; font-size: 17px; font-weight: 900; line-height: 1.4;">${item.title}</h3>
          <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 14px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.summary.replace(/^\[.*?\]\s*/, '')}
          </p>
          <a href="https://giteul.media/article/${item.id}?utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(sector)}&utm_content=news_link_${idx}" 
             style="color: #3182ce; font-size: 13px; text-decoration: none; font-weight: 800; border-bottom: 2px solid #3182ce; padding-bottom: 2px;">
            기자의 시선: 전략 리포트 읽기 →
          </a>
        </div>
      </div>
    </div>
  `).join('');

  const supportItems = support.map((item, idx) => `
    <div style="background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <span style="background-color: #3182ce; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px;">
          ${item.deadline_date ? `D-DAY ${item.deadline_date}` : '상시모집'}
        </span>
        <span style="color: #a0aec0; font-size: 11px; font-weight: bold;">${item.category}</span>
      </div>
      <h4 style="margin: 0 0 8px 0; color: #1a202c; font-size: 16px; font-weight: 800; line-height: 1.4;">${item.title}</h4>
      <p style="margin: 0 0 15px 0; color: #718096; font-size: 13px; font-weight: 500;">${item.summary.replace(/^\[.*?\]\s*/, '')}</p>
      <a href="https://giteul.media/article/${item.id}?utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(sector)}&utm_content=support_cta_${idx}" 
         style="display: block; text-align: center; background-color: #1a202c; color: white; padding: 12px; border-radius: 10px; font-size: 13px; text-decoration: none; font-weight: 900; letter-spacing: -0.2px;">
        사업계획서 합격 치트키 확인하기 →
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Pretendard', -apple-system, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background-color: #1a202c; padding: 40px 30px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
            <span style="color: white; font-size: 32px; font-weight: 900; letter-spacing: -2px;">기틀</span>
            <div style="width: 8px; h-8px; border-radius: 50%; background-color: #3182ce;"></div>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; line-height: 1.3;">
            오늘의 <span style="color: #4299e1;">${sector}</span> 비즈니스 <br/>인텔리전스가 도착했습니다.
          </h1>
        </div>
        
        <div style="padding: 35px;">
          <div style="margin-bottom: 50px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
              <div style="width: 4px; height: 20px; background-color: #3182ce; border-radius: 2px;"></div>
              <h2 style="margin: 0; font-size: 19px; font-weight: 900; color: #1a202c;">실시간 주요 뉴스</h2>
            </div>
            ${newsItems || '<p style="color: #a0aec0; font-size: 14px;">현재 새로운 뉴스가 없습니다.</p>'}
          </div>

          <div style="margin-bottom: 20px;">
             <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
              <div style="width: 4px; height: 20px; background-color: #ed8936; border-radius: 2px;"></div>
              <h2 style="margin: 0; font-size: 19px; font-weight: 900; color: #1a202c;">놓칠 수 없는 지원사업</h2>
            </div>
            ${supportItems || '<p style="color: #a0aec0; font-size: 14px;">새로 등록된 지원사업이 없습니다.</p>'}
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 40px 30px; text-align: center;">
          <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; font-weight: 700; line-height: 1.6;">
            안티그래비티 기자가 분석한<br/> 전문적인 전략 리포트를 더 확인해보세요.
          </p>
          <a href="https://giteul.media/?utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(sector)}&utm_content=bottom_cta" 
             style="display: inline-block; padding: 15px 35px; background-color: #3182ce; color: white; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 15px; shadow: 0 10px 15px -3px rgba(49, 130, 206, 0.3);">
            기틀 미디어 전체 서비스 바로가기
          </a>
          <p style="margin: 30px 0 0 0; color: #a0aec0; font-size: 12px; font-weight: 500;">
            본 리포트는 구독하신 관심 키워드 <b>[${sector}]</b>를 기반으로 생성되었습니다.<br/>
            <a href="#" style="color: #cbd5e0; margin-top: 10px; display: inline-block;">수신거부</a> | <a href="#" style="color: #cbd5e0;">관심분야 수정</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function processAndSendNewsletter() {
  console.log('[Newsletter] Starting morning dispatch pipeline...');
  
  // 1. Fetch latest content (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .gt('created_at', yesterday.toISOString());
    
  if (error || !posts) {
    console.error('[Newsletter] Failed to fetch latest posts:', error);
    return;
  }

  // 2. Mock Subscribers (In real case, fetch from 'subscribers' table)
  // Example subscribers data structure: { email: 'user@example.com', interests: ['기술/IT', '농업'] }
  const { data: subscribers } = await supabase.from('subscribers').select('*');
  if (!subscribers || subscribers.length === 0) {
    console.log('[Newsletter] No subscribers found.');
    return;
  }

  const sectors = ['농업', '기술/IT', '소상공인'];
  
  for (const subscriber of subscribers) {
    console.log(`[Newsletter] Preparing email for: ${subscriber.email}`);
    
    // Aggregate content based on subscriber interests
    for (const interest of subscriber.interests) {
      const newsForSector = posts.filter(p => p.category !== '정부지원공고' && p.summary.includes(`[${interest}]`));
      const supportForSector = posts.filter(p => p.category === '정부지원공고' && p.summary.includes(`[${interest}]`));
      
      if (newsForSector.length > 0 || supportForSector.length > 0) {
        const html = generateNewsletterHtml({
          news: newsForSector.slice(0, 3),
          support: supportForSector.slice(0, 3),
          sector: interest
        });
        
        try {
          await import('./mailer').then(m => m.sendMail(subscriber.email, `기틀 [${interest}] 맞춤 브리핑`, html));
          console.log(`[Newsletter] Email successfully sent for ${interest} to ${subscriber.email}`);
        } catch (e) {
          console.error(`[Newsletter] Failed to send mail to ${subscriber.email}:`, e);
        }
      }
    }
  }
}
