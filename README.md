# SPOTY website (spoty.club)

The public homepage for SPOTY, Sales Person of the Year, with an early-access waitlist.

## What's here

| Path | What it is |
|---|---|
| `index.html`, `styles.css`, `script.js` | The homepage (plain HTML/CSS/JS, no build step) |
| `privacy.html` | Short privacy notice for the waitlist |
| `api/waitlist.js` | Vercel serverless function that adds sign-ups to a Resend audience |
| `assets/` | Logo, favicon and social-share images used by the site |
| `brand/logo/` | The full SPOTY logo pack (SVG, PNG, favicon.ico) |
| `vercel.json` | Clean URLs and security headers |

## Deploying

Vercel deploys automatically from the `main` branch once the GitHub repository is imported into a Vercel project. No build command or output directory is needed.

## Waitlist set-up

Until these are set, the form shows a "email sales@spoty.club" message instead of failing silently.

In Vercel → Project → Settings → Environment Variables:

- `RESEND_API_KEY`: API key from resend.com
- `RESEND_SEGMENT_ID`: ID of the "Waitlist" segment in Resend (older accounts can use `RESEND_AUDIENCE_ID` instead)
