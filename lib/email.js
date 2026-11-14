// Shared email helpers for the SPOTY website functions.
// Used by the waitlist and unsubscribe routes in app/api.

import crypto from 'crypto';

const SITE = 'https://www.spoty.club';
const FROM = 'SPOTY <hello@spoty.club>';
const NOTIFY_FROM = 'SPOTY Waitlist <notifications@spoty.club>';
const REPLY_TO = 'sales@spoty.club';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Signed unsubscribe link, so nobody can unsubscribe other people by guessing URLs.
function unsubToken(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_API_KEY || '';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}
function unsubUrl(email) {
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}
function validToken(email, token) {
  const a = Buffer.from(unsubToken(email));
  const b = Buffer.from(String(token || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- Welcome email (to the person who signed up) ----------
function welcomeEmail(email) {
  const unsub = unsubUrl(email);
  const subject = "Welcome to SPOTY. You're on the list for 2027";
  const preheader = 'The global awards for salespeople. Here is what happens next.';
  const navy = '#0F2742', gold = '#C9971C', goldLight = '#F4D58A', ink = '#1B1F24', muted = '#4A5563', line = '#E2E5E9';
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const step = (n, title, body) => `
<tr><td style="padding:0 0 18px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="top" style="width:36px;"><div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:${navy};color:${goldLight};font-family:${sans};font-size:14px;font-weight:700;text-align:center;">${n}</div></td>
    <td valign="top" style="font-family:${sans};font-size:15px;line-height:22px;color:${muted};"><b style="color:${ink};">${title}</b><br>${body}</td>
  </tr></table>
</td></tr>`;

  const award = (name, what, prize) => `
<tr><td style="padding:10px 0;border-top:1px solid ${line};font-family:${sans};font-size:14px;line-height:20px;color:${muted};">
  <span style="font-family:${serif};font-size:17px;font-weight:bold;color:${navy};">${name}</span><br>${what} <span style="color:#6B4E00;font-weight:600;">· ${prize}</span>
</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;">

  <tr><td style="background:${navy};border-top:4px solid ${gold};padding:32px 36px 36px 36px;">
    <img src="${SITE}/assets/email/spoty-logo.png" width="200" alt="SPOTY, Sales Person of the Year" style="display:block;width:200px;height:auto;border:0;">
    <p style="margin:30px 0 8px 0;font-family:${sans};font-size:12px;letter-spacing:2px;font-weight:700;color:${goldLight};text-transform:uppercase;">Welcome to SPOTY</p>
    <h1 style="margin:0;font-family:${sans};font-size:34px;line-height:40px;font-weight:800;color:#FFFFFF;">Sell me this <s style="color:#8FA0B8;text-decoration-color:${gold};">pen</s> <span style="color:${goldLight};">vote.</span></h1>
    <p style="margin:14px 0 0 0;font-family:${sans};font-size:16px;line-height:24px;color:#DCE4EF;">Thanks for joining SPOTY, the global awards for salespeople. You'll be one of the first in when we open.</p>
  </td></tr>

  <tr><td style="padding:32px 36px 8px 36px;">
    <h2 style="margin:0 0 18px 0;font-family:${serif};font-size:22px;font-weight:bold;color:${navy};">What happens next</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${step(1, 'We open the doors', "We'll email you the moment SPOTY launches, before anyone else.")}
      ${step(2, 'Create your free profile', 'It takes two minutes. At launch, every member gets the SPOTY member insignia and a personalised LinkedIn banner with their vote link.')}
      ${step(3, 'Get your votes in', 'Share your link with the people who have seen you sell. Climb the global, national and age leaderboards.')}
    </table>
  </td></tr>

  <tr><td style="padding:8px 36px 8px 36px;">
    <h2 style="margin:0 0 6px 0;font-family:${serif};font-size:22px;font-weight:bold;color:${navy};">What you could win</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${award('The Wolf', 'Most votes in the world.', 'Trophy and framed A4 certificate')}
      ${award('Youngest &amp; Oldest in the World', 'The youngest and oldest salesperson in SPOTY.', 'Trophy and framed A4 certificate')}
      ${award('President', 'Most votes in your country.', 'Digital certificate')}
      ${award('Prime Closer', 'Most votes for your age, worldwide.', 'Digital certificate')}
    </table>
    <p style="margin:14px 0 0 0;font-family:${sans};font-size:14px;line-height:20px;color:${muted};">Voting closes at midnight (UK time) on 31 December 2027. Winners are revealed at the SPOTY awards night in January 2028.</p>
  </td></tr>

  <tr><td style="padding:24px 36px 32px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF6E8;border:1px solid #EBD9A6;border-radius:10px;"><tr><td style="padding:20px 22px;font-family:${sans};font-size:15px;line-height:22px;color:${ink};">
      <h2 style="margin:0 0 6px 0;font-family:${serif};font-size:22px;font-weight:bold;color:${navy};">Tell your network you're in</h2>
      Let people know you're going for Sales Person of the Year. Here's a LinkedIn banner and a post image, ready to use.
      <a href="${SITE}/assets/share/spoty-post.png"><img src="${SITE}/assets/share/spoty-post.png" width="240" alt="I'm going for Sales Person of the Year 2027. Sell me this vote. spoty.club" style="display:block;width:240px;max-width:100%;height:auto;border:0;border-radius:6px;margin:16px 0 4px 0;"></a>
      <div style="margin-top:14px;">
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.spoty.club" style="display:inline-block;background:${gold};color:${navy};font-family:${sans};font-size:15px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;margin:0 8px 8px 0;">Share on LinkedIn</a>
        <a href="${SITE}/assets/share/spoty-linkedin-banner.png" style="display:inline-block;background:#FFFFFF;color:${navy};border:1px solid #D9C48A;font-family:${sans};font-size:15px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px;margin:0 8px 8px 0;">Get the banner</a>
        <a href="${SITE}/assets/share/spoty-post.png" style="display:inline-block;background:#FFFFFF;color:${navy};border:1px solid #D9C48A;font-family:${sans};font-size:15px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px;margin:0 0 8px 0;">Get the post image</a>
      </div>
      <p style="margin:10px 0 0 0;font-size:14px;line-height:20px;color:${muted};">When SPOTY launches, every member gets their own <b style="color:${ink};">personalised LinkedIn banner</b> with their name and vote link. Know a great salesperson? Send them to spoty.club so they can compete too.</p>
    </td></tr></table>
  </td></tr>

  <tr><td style="background:#F8F9FB;border-top:1px solid ${line};padding:22px 36px;font-family:${sans};font-size:12px;line-height:18px;color:#6B7280;">
    <img src="${SITE}/assets/email/spoty-mark.png" width="28" alt="" style="display:block;width:28px;height:auto;border:0;margin-bottom:10px;">
    You're receiving this because ${esc(email)} joined the SPOTY waitlist at spoty.club.<br>
    Questions? Just reply, or email <a href="mailto:sales@spoty.club" style="color:#6B7280;">sales@spoty.club</a>.<br>
    <a href="${unsub}" style="color:#6B7280;">Unsubscribe</a> · <a href="${SITE}/privacy" style="color:#6B7280;">Privacy</a>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = `Welcome to SPOTY. You're on the list for 2027

Sell me this pen vote.

Thanks for joining SPOTY, the global awards for salespeople. You'll be one of the first in when we open.

WHAT HAPPENS NEXT
1. We open the doors: we'll email you the moment SPOTY launches.
2. Create your free profile: it takes two minutes. At launch, every member gets the SPOTY member insignia and a personalised LinkedIn banner with their vote link.
3. Get your votes in: share your link with the people who have seen you sell.

WHAT YOU COULD WIN
- The Wolf: most votes in the world (trophy and framed A4 certificate)
- Youngest & Oldest in the World (trophy and framed A4 certificate)
- President: most votes in your country (digital certificate)
- Prime Closer: most votes for your age, worldwide (digital certificate)

Voting closes at midnight (UK time) on 31 December 2027. Winners are revealed in January 2028.

TELL YOUR NETWORK YOU'RE IN
LinkedIn banner: https://www.spoty.club/assets/share/spoty-linkedin-banner.png
Post image: https://www.spoty.club/assets/share/spoty-post.png
When SPOTY launches, every member gets their own personalised LinkedIn banner with their name and vote link.

Know a great salesperson? Send them to https://www.spoty.club so they can compete too.

Questions? Reply to this email or write to sales@spoty.club.
Unsubscribe: ${unsub}
`;

  return {
    from: FROM, to: [email], reply_to: REPLY_TO, subject, html, text,
    headers: { 'List-Unsubscribe': `<${unsub}>, <mailto:sales@spoty.club?subject=unsubscribe>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  };
}

// ---------- "You're already on the list" (someone signs up again with the same email) ----------
function alreadyEmail(email) {
  const unsub = unsubUrl(email);
  const subject = "You're already on the SPOTY list";
  const navy = '#0F2742', gold = '#C9971C', goldLight = '#F4D58A', ink = '#1B1F24', muted = '#4A5563', line = '#E2E5E9';
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Good news: your spot is saved. Nothing else to do.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
  <tr><td style="background:${navy};border-top:4px solid ${gold};padding:32px 36px 34px 36px;">
    <img src="${SITE}/assets/email/spoty-logo.png" width="200" alt="SPOTY, Sales Person of the Year" style="display:block;width:200px;height:auto;border:0;">
    <p style="margin:30px 0 8px 0;font-family:${sans};font-size:12px;letter-spacing:2px;font-weight:700;color:${goldLight};text-transform:uppercase;">Welcome back</p>
    <h1 style="margin:0;font-family:${sans};font-size:30px;line-height:36px;font-weight:800;color:#FFFFFF;">You're already on the list.</h1>
    <p style="margin:14px 0 0 0;font-family:${sans};font-size:16px;line-height:24px;color:#DCE4EF;">Someone (hopefully you) just tried to join SPOTY with ${esc(email)}. Your spot is already saved, so there's nothing else to do.</p>
  </td></tr>
  <tr><td style="padding:30px 36px 8px 36px;font-family:${sans};font-size:15px;line-height:22px;color:${muted};">
    <h2 style="margin:0 0 10px 0;font-family:${serif};font-size:22px;font-weight:bold;color:${navy};">What happens now</h2>
    We'll email you the moment SPOTY launches, before anyone else. You'll create your free profile, get your SPOTY member insignia and personalised LinkedIn banner, and start collecting votes.
    <p style="margin:12px 0 0 0;">Voting closes at midnight (UK time) on 31 December 2027.</p>
  </td></tr>
  <tr><td style="padding:22px 36px 32px 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF6E8;border:1px solid #EBD9A6;border-radius:10px;"><tr><td style="padding:20px 22px;font-family:${sans};font-size:15px;line-height:22px;color:${ink};">
      <b>While you wait:</b> tell your network you're going for Sales Person of the Year.
      <div style="margin-top:14px;">
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.spoty.club" style="display:inline-block;background:${gold};color:${navy};font-family:${sans};font-size:15px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;margin:0 8px 8px 0;">Share on LinkedIn</a>
        <a href="${SITE}/assets/share/spoty-linkedin-banner.png" style="display:inline-block;background:#FFFFFF;color:${navy};border:1px solid #D9C48A;font-family:${sans};font-size:15px;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px;margin:0 0 8px 0;">Get the banner</a>
      </div>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#F8F9FB;border-top:1px solid ${line};padding:22px 36px;font-family:${sans};font-size:12px;line-height:18px;color:#6B7280;">
    <img src="${SITE}/assets/email/spoty-mark.png" width="28" alt="" style="display:block;width:28px;height:auto;border:0;margin-bottom:10px;">
    Didn't try to sign up? You can ignore this email. Questions? Reply, or email <a href="mailto:sales@spoty.club" style="color:#6B7280;">sales@spoty.club</a>.<br>
    <a href="${unsub}" style="color:#6B7280;">Unsubscribe</a> · <a href="${SITE}/privacy" style="color:#6B7280;">Privacy</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
  const text = `You're already on the SPOTY list

Someone (hopefully you) just tried to join SPOTY with ${email}. Your spot is already saved, so there's nothing else to do.

We'll email you the moment SPOTY launches. You'll create your free profile, get your SPOTY member insignia and personalised LinkedIn banner, and start collecting votes. Voting closes at midnight (UK time) on 31 December 2027.

Tell your network: https://www.spoty.club
LinkedIn banner: https://www.spoty.club/assets/share/spoty-linkedin-banner.png

Didn't try to sign up? You can ignore this email.
Unsubscribe: ${unsub}
`;
  return {
    from: FROM, to: [email], reply_to: REPLY_TO, subject, html, text,
    headers: { 'List-Unsubscribe': `<${unsub}>, <mailto:sales@spoty.club?subject=unsubscribe>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
  };
}

// ---------- Notification (to you) ----------
function notifyEmail(email) {
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' });
  return {
    from: NOTIFY_FROM,
    to: [process.env.NOTIFY_EMAIL || 'sales@spoty.club'],
    reply_to: email,
    subject: `New SPOTY sign-up: ${email}`,
    text: `New waitlist sign-up\n\n${email}\n${when} (UK time)\n\nSee everyone in Resend: Contacts, then the Waitlist segment.\n`,
    html: `<div style="font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:22px;color:#1B1F24;"><p style="margin:0 0 6px 0;color:#6B4E00;font-weight:700;">New waitlist sign-up</p><p style="margin:0;font-size:18px;"><b>${esc(email)}</b></p><p style="margin:4px 0 0 0;color:#4A5563;">${esc(when)} (UK time)</p></div>`
  };
}

async function sendEmail(key, message) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  if (!r.ok) throw new Error(`Resend send failed ${r.status}: ${await r.text()}`);
  return r.json();
}

export { welcomeEmail, alreadyEmail, notifyEmail, sendEmail, unsubUrl, validToken, esc, SITE };
