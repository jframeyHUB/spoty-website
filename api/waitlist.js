// Vercel serverless function: adds a waitlist email to a Resend audience.
// Needs RESEND_API_KEY and RESEND_AUDIENCE_ID set in Vercel project settings.
// Until they're set, it answers with { fallback: true } so the page can show a mailto link.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) {
    return res.status(503).json({ ok: false, fallback: true });
  }

  try {
    const r = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false })
    });
    // Resend returns an error for an email already on the list; treat that as success.
    if (r.ok || r.status === 409 || r.status === 422) {
      return res.status(200).json({ ok: true });
    }
    console.error('Resend error', r.status, await r.text());
    return res.status(502).json({ ok: false, error: 'Something went wrong. Please try again.' });
  } catch (err) {
    console.error('Waitlist error', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
};

function safeParse(text) {
  try { return JSON.parse(text); } catch { return {}; }
}
