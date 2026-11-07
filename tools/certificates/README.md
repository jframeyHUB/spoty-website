# SPOTY certificates, badges and LinkedIn banners

Generates the award artwork from templates, using the SPOTY rosette, Bodoni Moda and Sora.

## Outputs (per person)

| File | What it's for |
|---|---|
| `*-certificate.pdf` | A4 landscape, 300 dpi, ready to print and frame (trophy winners) or email (digital honours, members) |
| `*-certificate.png` | Same certificate as an image |
| `*-certificate.svg` | Editable master |
| `*-badge.png` | 1080 × 1080 square badge for LinkedIn/Instagram posts |
| `*-linkedin-banner.png` | 1584 × 396 LinkedIn profile banner (text kept clear of the profile photo) |

Styles: `"type": "gold"` for winners (The Wolf, Rising/Prime/Veteran Closer, President, Mover of the Month) and `"type": "member"` (navy) for every member.

## Use

```bash
cd tools/certificates
npm install
node generate.js samples                 # writes examples to brand/certificates/
node generate.js winners.json out/       # one set per entry
```

Entry fields: `slug`, `type`, `name`, `award`, `awardLine`, `details`, `awarded`, `number`, `verify`, optional `heading`, `lead`, `badgeTitle`, `badgeLine`, `bannerTitle`, `bannerLine`, `signedBy`, `signedTitle`. See `SAMPLES` in `generate.js`.

Fonts in `fonts/` are Bodoni Moda and Sora from Google Fonts (SIL Open Font License).
