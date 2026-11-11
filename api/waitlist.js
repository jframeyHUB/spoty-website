// Vercel serverless function: adds a waitlist email to Resend as a contact in the "Waitlist" segment.
// Needs RESEND_API_KEY and RESEND_SEGMENT_ID set in Vercel project settings.
// (RESEND_AUDIENCE_ID still works for accounts on Resend's older Audiences.)
// Until they're set, it answers with { fallback: true } so the page can show a mailto link.

const { welcomeEmail, alreadyEmail, notifyEmail, sendEmail } = require('./_lib/email');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API = 'https://api.resend.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const email = String(body.email || '').trim().toLowerCase();

  // Honeypot: real people never fill this hidden field.
  if (body.company_site) return res.status(200).json({ ok: true });

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }

  const key = process.env.RESEND_API_KEY;
  const segment = process.env.RESEND_SEGMENT_ID;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || (!segment && !audience)) {
    return res.status(503).json({ ok: false, fallback: true });
  }

  const call = (path, payload) => fetch(API + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });

  try {
    if (segment) {
      // Resend happily "creates" a contact that already exists, so look them up first.
      const lookup = await fetch(`${API}/contacts/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${key}` } });
      if (lookup.status === 404) {
        // New sign-up: create them in the Waitlist segment, welcome them and tell the team.
        const created = await call('/contacts', { email, unsubscribed: false, segments: [{ id: segment }] });
        if (created.ok) {
          const sent = await Promise.allSettled([sendEmail(key, welcomeEmail(email)), sendEmail(key, notifyEmail(email))]);
          sent.filter((s) => s.status === 'rejected').forEach((s) => console.error('Email error', s.reason));
          return res.status(200).json({ ok: true });
        }
        console.error('Resend create error', created.status, await created.text());
        return res.status(502).json({ ok: false, error: 'Something went wrong. Please try again.' });
      }
      if (!lookup.ok) {
        console.error('Resend lookup error', lookup.status, await lookup.text());
        return res.status(502).json({ ok: false, error: 'Something went wrong. Please try again.' });
      }
      // Already a contact: make sure they're in the Waitlist segment and subscribed again.
      const contact = await lookup.json().catch(() => ({}));
      if (contact.unsubscribed) {
        await fetch(`${API}/contacts/${encodeURIComponent(email)}`, { method: 'PATCH', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ unsubscribed: false }) })
          .catch((e) => console.error('Resubscribe error', e));
      }
      const added = await call(`/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segment)}`);
      if (!added.ok) console.error('Resend segment note', added.status, await added.text());
      {
        // Already signed up: remind them their spot is saved.
        // Our own inbox also gets the welcome email again, so we can preview changes to both.
        const own = email === (process.env.NOTIFY_EMAIL || 'sales@spoty.club');
        const mails = [alreadyEmail(email)].concat(own ? [welcomeEmail(email)] : []);
        const sent = await Promise.allSettled(mails.map((m) => sendEmail(key, m)));
        sent.filter((s) => s.status === 'rejected').forEach((s) => console.error('Email error', s.reason));
        return res.status(200).json({ ok: true, existing: true });
      }
    } else {
      // Older Resend accounts: audiences.
      const r = await call(`/audiences/${encodeURIComponent(audience)}/contacts`, { email, unsubscribed: false });
      if (r.ok || r.status === 409 || r.status === 422) return res.status(200).json({ ok: true });
      console.error('Resend error', r.status, await r.text());
    }
    return res.status(502).json({ ok: false, error: 'Something went wrong. Please try again.' });
  } catch (err) {
    console.error('Waitlist error', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
};

function safeParse(text) {
  try { return JSON.parse(text); } catch { return {}; }
}
