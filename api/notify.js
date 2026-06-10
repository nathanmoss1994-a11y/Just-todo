// Vercel serverless function: schedules / cancels OneSignal push notifications.
// Requires env vars in Vercel project settings:
//   ONESIGNAL_APP_ID   - your OneSignal App ID
//   ONESIGNAL_REST_KEY - your OneSignal REST API key (keep secret!)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const APP_ID = process.env.ONESIGNAL_APP_ID;
  const KEY = process.env.ONESIGNAL_REST_KEY;
  if (!APP_ID || !KEY) return res.status(500).json({ error: 'Push not configured' });

  const { action, id, title, body, sendAfter } = req.body || {};

  try {
    if (action === 'cancel' && id) {
      const r = await fetch(
        `https://api.onesignal.com/notifications/${encodeURIComponent(id)}?app_id=${APP_ID}`,
        { method: 'DELETE', headers: { Authorization: `Key ${KEY}` } }
      );
      return res.status(200).json(await r.json().catch(() => ({})));
    }

    if (action === 'schedule' && title && sendAfter) {
      const r = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${KEY}` },
        body: JSON.stringify({
          app_id: APP_ID,
          included_segments: ['Subscribed Users'],
          headings: { en: title },
          contents: { en: body || 'Task due now' },
          send_after: sendAfter,
        }),
      });
      const data = await r.json();
      return res.status(200).json({ id: data.id || null });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: 'OneSignal request failed' });
  }
}
