// Unsubscribe link from SPOTY emails: /api/unsubscribe?e=<email>&t=<signed token>
// GET shows a confirmation page; POST is the one-click unsubscribe used by Gmail/Apple Mail.
import { validToken, esc, SITE } from '@/lib/email';

async function handle(req: Request, method: 'GET' | 'POST') {
  const url = new URL(req.url);
  const email = String(url.searchParams.get('e') || '').trim().toLowerCase();
  const token = url.searchParams.get('t') || '';
  if (!email || !validToken(email, token)) return page(400, 'This link is not valid', 'Please use the unsubscribe link from your most recent SPOTY email, or email sales@spoty.club and we will remove you.');
  try {
    const r = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true })
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  } catch (err) {
    console.error('Unsubscribe error', err);
    return page(500, 'Something went wrong', 'We could not update your preferences just now. Please try again, or email sales@spoty.club and we will remove you.');
  }
  if (method === 'POST') return Response.json({ ok: true });
  return page(200, "You're unsubscribed", `${esc(email)} will no longer receive SPOTY emails. Changed your mind? Join again at <a href="${SITE}">spoty.club</a>.`);
}

export const GET = (req: Request) => handle(req, 'GET');
export const POST = (req: Request) => handle(req, 'POST');

function page(status: number, title: string, body: string) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="only light"><title>SPOTY</title></head>
<body style="margin:0;background:#F3F4F6;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1B1F24;">
<div style="max-width:520px;margin:64px auto;padding:0 16px;"><div style="background:#fff;border-radius:12px;border-top:4px solid #C9971C;padding:32px;">
<img src="${SITE}/assets/email/spoty-mark.png" width="40" alt="SPOTY" style="display:block;margin-bottom:18px;">
<h1 style="margin:0 0 10px;font-size:24px;">${title}</h1><p style="margin:0;font-size:16px;line-height:24px;color:#4A5563;">${body}</p>
</div></div></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
}
