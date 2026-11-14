// Waitlist sign-up: adds the email to Resend (Contacts → Waitlist segment), sends the welcome email and notifies the team.
// Repeat sign-ups get the "you're already on the list" email instead. Needs RESEND_API_KEY + RESEND_SEGMENT_ID.
import { NextResponse } from 'next/server';
import { welcomeEmail, alreadyEmail, notifyEmail, sendEmail } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API = 'https://api.resend.com';
const json = (body: object, status = 200) => NextResponse.json(body, { status });
const FAIL = { ok: false, error: 'Something went wrong. Please try again.' };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || '').trim().toLowerCase();
  if (body.company_site) return json({ ok: true }); // honeypot
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);

  const key = process.env.RESEND_API_KEY;
  const segment = process.env.RESEND_SEGMENT_ID;
  if (!key || !segment) return json({ ok: false, fallback: true }, 503);

  const auth = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const post = (path: string, payload?: object) => fetch(API + path, { method: 'POST', headers: auth, body: payload ? JSON.stringify(payload) : undefined });
  const sendAll = async (mails: object[]) => {
    const sent = await Promise.allSettled(mails.map((m) => sendEmail(key, m)));
    sent.filter((s) => s.status === 'rejected').forEach((s) => console.error('Email error', (s as PromiseRejectedResult).reason));
  };

  try {
    // Resend happily "creates" a contact that already exists, so look them up first.
    const lookup = await fetch(`${API}/contacts/${encodeURIComponent(email)}`, { headers: auth });
    if (lookup.status === 404) {
      const created = await post('/contacts', { email, unsubscribed: false, segments: [{ id: segment }] });
      if (!created.ok) { console.error('Resend create error', created.status, await created.text()); return json(FAIL, 502); }
      await sendAll([welcomeEmail(email), notifyEmail(email)]);
      return json({ ok: true });
    }
    if (!lookup.ok) { console.error('Resend lookup error', lookup.status, await lookup.text()); return json(FAIL, 502); }

    const contact = await lookup.json().catch(() => ({}));
    if (contact.unsubscribed) {
      await fetch(`${API}/contacts/${encodeURIComponent(email)}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ unsubscribed: false }) }).catch((e) => console.error('Resubscribe error', e));
    }
    const added = await post(`/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segment)}`);
    if (!added.ok) console.error('Resend segment note', added.status, await added.text());
    // Our own inbox also gets the welcome email again, so we can preview changes to both.
    const own = email === (process.env.NOTIFY_EMAIL || 'sales@spoty.club');
    await sendAll([alreadyEmail(email), ...(own ? [welcomeEmail(email)] : [])]);
    return json({ ok: true, existing: true });
  } catch (err) {
    console.error('Waitlist error', err);
    return json(FAIL, 500);
  }
}
