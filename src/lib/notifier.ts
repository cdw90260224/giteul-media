
export async function sendNotification(message: string) {
  const WEBHOOK_URL = process.env.NOTIFICATION_WEBHOOK_URL;
  
  if (!WEBHOOK_URL) {
    console.log('[Notifier] No Webhook URL found. Skipping notification.');
    console.log('[Message]:', message);
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message, // Discord format
        text: message    // Slack format
      }),
    });

    if (!response.ok) {
      console.error('[Notifier] Failed to send notification:', await response.text());
    } else {
      console.log('[Notifier] Notification sent successfully!');
    }
  } catch (err: any) {
    console.error('[Notifier] Error sending notification:', err.message);
  }
}

export function formatBatchResult(results: any[]) {
  const total = results.length;
  const inserted = results.filter(r => r.success && r.action === 'inserted').length;
  const updated = results.filter(r => r.success && r.action === 'updated').length;
  const failed = results.filter(r => !r.success && r.code !== 'EXPIRED' && r.code !== 'NO_TARGETS').length;
  const skipped = results.filter(r => r.code === 'EXPIRED' || r.code === 'NO_TARGETS').length;

  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  return `📢 **Giteul Media 자동 발행 보고 (${today})**
------------------------------------------
✅ **신규 발행**: ${inserted}건
🔄 **업데이트**: ${updated}건
⚠️ **실패**: ${failed}건
⏭️ **스킵(중복/마감)**: ${skipped}건
------------------------------------------
*Gemini 2.5 모델로 모든 작업이 완료되었습니다.*`;
}
