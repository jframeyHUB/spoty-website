// SPOTY certificate, badge and LinkedIn banner generator.
//
//   node generate.js samples              -> writes sample files to brand/certificates/
//   node generate.js <input.json> <outDir> -> one certificate set per entry in input.json
//
// Input entry: { "type": "gold" | "member", "kind": "wolf" | "rising" | "prime" | "veteran" | "president" | "mover" | "member",
//               "kindArg" (age band, country or "the UK in March 2027"), "name", "award", "details",
//               "number", "awarded", "verify", "slug" }

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..', '..');
const FONTS = ['bodoni800.ttf', 'bodoni700.ttf', 'bodoni600italic.ttf', 'sora600.ttf'].map((f) => path.join(__dirname, 'fonts', f));
const MARK = fs.readFileSync(path.join(ROOT, 'assets', 'spoty-mark.svg'), 'utf8');

const SERIF = "'Bodoni Moda 48pt', 'Bodoni Moda', Didot, serif";

const C = {
  navy: '#0F2742', ink: '#1B1F24', muted: '#4A5563', ivory: '#FFFDF6',
  gold: '#C9971C', goldDark: '#8A6410', goldLight: '#F4D58A', silverBlue: '#9FB0C8'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Plain-English explanation of each award, printed on the certificate under the title.
const EXPLAIN = {
  wolf: () => 'The highest honour in SPOTY: the salesperson with the most votes in the world.',
  rising: () => 'Awarded to the salesperson aged 18–24 with the most votes in the world.',
  prime: (band) => `Awarded to the salesperson aged ${band} with the most votes in the world.`,
  veteran: () => 'Awarded to the salesperson aged 55 or over with the most votes in the world.',
  president: (country) => `Awarded to the salesperson with the most votes in ${country}.`,
  mover: (scope) => `Awarded to the salesperson with the most votes in ${scope}.`,
  member: () => 'Members are ranked on global, national and age-band leaderboards throughout the year.'
};
const ABOUT = 'SPOTY is the global awards for salespeople, decided by votes from the people who have seen them sell.';

let uid = 0;
// The SPOTY rosette, recoloured and placed. Mask ids are renamed so several copies can share one SVG.
function mark(x, y, h, colour, opacity = 1) {
  const n = ++uid;
  let inner = MARK.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  inner = inner.replace(/id="(k\d+[a-z])"/g, `id="m${n}$1"`).replace(/url\(#(k\d+[a-z])\)/g, `url(#m${n}$1)`);
  inner = inner.split('#C9971C').join(colour);
  const s = h / 240;
  return `<g transform="translate(${x - 100 * s} ${y}) scale(${s})" opacity="${opacity}">${inner}</g>`;
}

// ---------- SPOTY insignia: premium shield badge (a sibling of the rosette logo) ----------
// Laurel leaves are lifted from the rosette so the family resemblance holds.
const LAUREL = ((MARK.match(/<g fill="#000"><path d="M84\.6[\s\S]*?<\/g>/) || [''])[0])
  .replace(/<path[^>]*\/>/, '').replace('<g fill="#000">', '').replace('</g>', '');
const SHIELD = 'M100 6 C128 18 156 24 184 24 C186 40 186 58 186 76 C186 136 152 174 100 196 C48 174 14 136 14 76 C14 58 14 40 16 24 C44 24 72 18 100 6 Z';
const INNER = 'M100 20 C124 30 148 35 172 36 C173 50 173 63 173 77 C173 128 145 160 100 180 C55 160 27 128 27 77 C27 63 27 50 28 36 C52 35 76 30 100 20 Z';
const ONE = 'M107 66 L107 120 L117 121.5 L117 126 L83 126 L83 121.5 L93 120 L93 76 L80 82 L79 79.5 Z';
const STAR = 'M100 34 L104 44.5 L115 45 L106.4 51.8 L109.4 62.5 L100 56.4 L90.6 62.5 L93.6 51.8 L85 45 L96 44.5 Z';
// Left laurel branch: a curved stem with paired leaves, drawn round (100,100). Mirrored for the right.
function laurel(fill) {
  const cx = 100, cy = 100, r = 46, a0 = 112, a1 = 236;
  const pt = (deg, rad) => [cx + rad * Math.cos(deg * Math.PI / 180), cy + rad * Math.sin(deg * Math.PI / 180)];
  const [sx, sy] = pt(a0, r), [ex, ey] = pt(a1, r);
  let out = `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${fill}" stroke-width="3.2" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) {
    const a = a0 + 10 + i * 20;
    const tang = a + 90; // direction of travel towards the tip
    const [ox, oy] = pt(a, r + 7.5), [ix, iy] = pt(a, r - 7.5);
    out += `<ellipse cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" rx="9.5" ry="4" transform="rotate(${(tang - 35).toFixed(0)} ${ox.toFixed(1)} ${oy.toFixed(1)})"/>`;
    out += `<ellipse cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" rx="8.5" ry="3.6" transform="rotate(${(tang + 35).toFixed(0)} ${ix.toFixed(1)} ${iy.toFixed(1)})"/>`;
  }
  const [tx, ty] = pt(a1 + 6, r);
  out += `<ellipse cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" rx="9" ry="3.8" transform="rotate(${a1 + 90} ${tx.toFixed(1)} ${ty.toFixed(1)})"/>`;
  return out;
}

function insignia(cx, cy, size, variant = 'gold') {
  const n = ++uid;
  const gold = variant === 'gold';
  const face = gold ? ['#F7DD95', '#D9A933', '#A87A0E'] : ['#24507F', '#163A60', '#0B2038'];
  const glyph = gold ? C.navy : '#E9C25C';
  const s = size / 200;
  const leaves = laurel(glyph);
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${s})">
<defs>
<linearGradient id="f${n}" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${face[0]}"/><stop offset="0.5" stop-color="${face[1]}"/><stop offset="1" stop-color="${face[2]}"/></linearGradient>
<linearGradient id="r${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4D58A"/><stop offset="0.45" stop-color="#C9971C"/><stop offset="1" stop-color="#7A570C"/></linearGradient>
</defs>
<path d="${SHIELD}" fill="url(#r${n})"/>
<path d="${INNER}" fill="url(#f${n})" stroke="${gold ? '#8A6410' : '#E9C25C'}" stroke-width="3"/>
<path d="M28 36 C52 35 76 30 100 20 C124 30 148 35 172 36 C173 48 173 58 173 66 C125 84 72 60 28 88 Z" fill="#FFFFFF" opacity="${gold ? 0.2 : 0.07}"/>
<g transform="translate(100 108) scale(0.82) translate(-100 -100)" fill="${glyph}">
<g>${leaves}</g><g transform="translate(200 0) scale(-1 1)">${leaves}</g>
<path d="${ONE}"/><path d="${STAR}"/>
</g>
</g>`;
}

const text = (x, y, str, { font = 'Sora', size = 40, weight = 600, style = 'normal', fill = C.ink, anchor = 'middle', spacing = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" font-style="${style}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ''}>${esc(str)}</text>`;

// Shrink long names so they always fit the certificate width.
const fitSize = (str, max, width, factor) => Math.min(max, Math.floor(width / (String(str).length * factor)));

// ---------- A4 landscape certificate (297 x 210 mm, 1 unit = 0.1 mm) ----------
function certificate(o) {
  const gold = o.type !== 'member';
  const accent = gold ? C.gold : C.navy;
  const accentText = gold ? C.goldDark : C.navy;
  const inner = gold ? C.goldDark : C.silverBlue;
  const W = 2970, H = 2100, cx = W / 2;
  const diamonds = [[100, 100], [W - 100, 100], [100, H - 100], [W - 100, H - 100]]
    .map(([x, y]) => `<rect x="${x - 22}" y="${y - 22}" width="44" height="44" transform="rotate(45 ${x} ${y})" fill="${accent}"/>`).join('');
  const nameSize = fitSize(o.name, 200, 2300, 0.56);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${C.ivory}"/>
${mark(cx, 470, 1300, accent, 0.045)}
<rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="none" stroke="${accent}" stroke-width="16"/>
<rect x="100" y="100" width="${W - 200}" height="${H - 200}" fill="none" stroke="${inner}" stroke-width="3"/>
<rect x="124" y="124" width="${W - 248}" height="${H - 248}" fill="none" stroke="${inner}" stroke-width="1.5" opacity="0.6"/>
${diamonds}
${mark(cx, 170, 300, accent)}
${text(cx, 560, 'SALES PERSON OF THE YEAR 2027', { size: 44, fill: C.navy, spacing: 14 })}
${text(cx, 690, o.heading || (gold ? 'Certificate of Achievement' : 'Certificate of Membership'), { font: SERIF, size: 96, style: 'italic', fill: accentText })}
${text(cx, 810, 'This certifies that', { size: 40, fill: C.muted })}
${text(cx, 1000, o.name, { font: SERIF, size: nameSize, weight: 800, fill: C.navy })}
<line x1="${cx - 520}" y1="1085" x2="${cx - 40}" y2="1085" stroke="${accent}" stroke-width="4"/>
<rect x="${cx - 14}" y="1071" width="28" height="28" transform="rotate(45 ${cx} 1085)" fill="${accent}"/>
<line x1="${cx + 40}" y1="1085" x2="${cx + 520}" y2="1085" stroke="${accent}" stroke-width="4"/>
${text(cx, 1170, o.lead || (gold ? 'has been named' : 'is a recognised member of'), { size: 40, fill: C.muted })}
${text(cx, 1310, String(o.award).toUpperCase(), { font: SERIF, size: fitSize(o.award, 140, 2050, 0.78), weight: 800, fill: accentText, spacing: 10 })}
${text(cx, 1392, o.explain || (o.kind ? EXPLAIN[o.kind](o.kindArg) : o.awardLine), { size: 40, fill: C.navy })}
${text(cx, 1452, o.about || ABOUT, { size: 32, fill: C.muted })}
${o.details ? text(cx, 1520, o.details, { size: 32, fill: C.muted }) : ''}
<line x1="300" y1="1800" x2="900" y2="1800" stroke="${C.navy}" stroke-width="3"/>
${text(600, 1770, o.signedBy || 'Jack Frame', { font: SERIF, size: 64, style: 'italic', fill: C.navy })}
${text(600, 1855, o.signedTitle || 'Founder, SPOTY', { size: 34, fill: C.muted })}
${mark(cx, 1615, 320, accent)}
${text(W - 600, 1760, o.awarded, { size: 38, fill: C.navy })}
${text(W - 600, 1822, 'Certificate No. ' + o.number, { size: 30, fill: C.muted })}
${text(W - 600, 1872, 'Verify at ' + o.verify, { size: 30, fill: C.muted })}
</svg>`;
}

// ---------- Square social badge (1080 x 1080) ----------
function badge(o) {
  const gold = o.type !== 'member';
  const bg = gold ? C.navy : C.ivory;
  const fg = gold ? '#FFFFFF' : C.navy;
  const accent = gold ? C.gold : C.navy;
  const sub = gold ? C.goldLight : C.goldDark;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
<rect width="1080" height="1080" fill="${bg}"/>
<rect x="36" y="36" width="1008" height="1008" fill="none" stroke="${accent}" stroke-width="6"/>
<rect x="58" y="58" width="964" height="964" fill="none" stroke="${accent}" stroke-width="3" opacity="0.6"/>
${insignia(540, 345, 440, gold ? 'gold' : 'navy')}
<g stroke="${fg}" stroke-width="2" stroke-linejoin="round">${text(540, 650, 'SPOTY 2027', { font: SERIF, size: 64, weight: 800, fill: fg, spacing: 8 })}</g>
<g stroke="${gold ? C.goldLight : C.navy}" stroke-width="2.6" stroke-linejoin="round">${text(540, 770, String(o.badgeTitle).toUpperCase(), { font: SERIF, size: fitSize(o.badgeTitle, 96, 900, 0.68), weight: 800, fill: gold ? C.goldLight : C.navy, spacing: 6 })}</g>
${text(540, 840, o.badgeLine, { size: 32, fill: sub, spacing: 4 })}
${o.name ? text(540, 930, o.name, { font: SERIF, size: 46, style: 'italic', fill: fg }) : ''}
${text(540, 995, 'spoty.club', { size: 28, fill: gold ? '#C3CCD8' : C.muted, spacing: 3 })}
</svg>`;
}

// ---------- LinkedIn banner (1584 x 396) ----------
function banner(o) {
  const gold = o.type !== 'member';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1584 396" width="1584" height="396">
<rect width="1584" height="396" fill="${C.navy}"/>
<rect y="0" width="1584" height="8" fill="${C.gold}"/>
${mark(1300, -150, 760, C.gold, 0.07)}
${insignia(1404, 202, 280, gold ? 'gold' : 'navy')}
${text(520, 148, 'SALES PERSON OF THE YEAR 2027', { size: 28, fill: C.goldLight, spacing: 6, anchor: 'start' })}
<g stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round">${text(518, 240, o.bannerTitle, { font: SERIF, size: fitSize(o.bannerTitle, 80, 760, 0.6), weight: 800, fill: '#FFFFFF', anchor: 'start' })}</g>
${text(520, 306, o.bannerLine, { size: 32, fill: '#FFFFFF', anchor: 'start' })}
</svg>`;
}

// ---------- Rendering ----------
function renderPng(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Sora' } }).render();
}

// Minimal single-page PDF with the rendered image (A4 landscape, 300 dpi).
function pdfFromImage(img, wPt, hPt) {
  const { width, height } = img;
  const rgba = img.pixels;
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) { rgb[j] = rgba[i]; rgb[j + 1] = rgba[i + 1]; rgb[j + 2] = rgba[i + 2]; }
  const data = zlib.deflateSync(rgb, { level: 9 });
  const content = Buffer.from(`q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`);
  const objs = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
    Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>\nstream\n`), data, Buffer.from('\nendstream')]),
    Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`), content, Buffer.from('\nendstream')])
  ];
  const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')];
  const offsets = [];
  let pos = parts[0].length;
  objs.forEach((o, i) => {
    const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), o, Buffer.from('\nendobj\n')]);
    offsets.push(pos); parts.push(chunk); pos += chunk.length;
  });
  const xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  parts.push(Buffer.from(xref + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`));
  return Buffer.concat(parts);
}

function write(outDir, entry) {
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, entry.slug);
  const cert = certificate(entry);
  fs.writeFileSync(base + '-certificate.svg', cert);
  const certImg = renderPng(cert, 3508);
  fs.writeFileSync(base + '-certificate.png', certImg.asPng());
  fs.writeFileSync(base + '-certificate.pdf', pdfFromImage(certImg, 842, 595));
  if (entry.badgeTitle) fs.writeFileSync(base + '-badge.png', renderPng(badge(entry), 1080).asPng());
  if (entry.bannerTitle) fs.writeFileSync(base + '-linkedin-banner.png', renderPng(banner(entry), 1584).asPng());
  console.log('wrote', entry.slug);
}

const SAMPLES = [
  {
    slug: 'sample-the-wolf', type: 'gold', name: 'Mei Tan', award: 'The Wolf',
    kind: 'wolf',
    details: '1,204 votes · Head of Sales, Fintech · Singapore',
    awarded: 'Awarded January 2028', number: 'SPOTY-2027-W-0001', verify: 'spoty.club/verify/W0001',
    badgeTitle: 'The Wolf', badgeLine: 'SALES PERSON OF THE YEAR', bannerTitle: 'The Wolf · SPOTY 2027', bannerLine: 'Mei Tan · Sales Person of the Year · spoty.club'
  },
  {
    slug: 'sample-president-uk', type: 'gold', name: 'Daniel Hughes', award: 'President · United Kingdom',
    kind: 'president', kindArg: 'the United Kingdom',
    details: '986 votes · Field Sales Manager · Manchester', heading: 'Digital Certificate of Achievement',
    awarded: 'Awarded January 2028', number: 'SPOTY-2027-P-GB-0001', verify: 'spoty.club/verify/PGB0001',
    badgeTitle: 'President', badgeLine: 'UNITED KINGDOM'
  },
  {
    slug: 'sample-member', type: 'member', name: 'Jordan Reyes', award: 'SPOTY 2027',
    kind: 'member', lead: 'is a recognised member of',
    details: 'Account Executive · Leeds, United Kingdom',
    awarded: 'Member since November 2026', number: 'SPOTY-2027-M-018431', verify: 'spoty.club/verify/M018431',
    badgeTitle: 'Member', badgeLine: 'SALES PERSON OF THE YEAR', bannerTitle: 'Vote for me in SPOTY 2027', bannerLine: 'Jordan Reyes · spoty.club/v/jordan-reyes'
  }
];

const [arg, out] = process.argv.slice(2);
if (arg === 'samples') {
  const dir = path.join(ROOT, 'brand', 'insignia');
  fs.mkdirSync(dir, { recursive: true });
  for (const v of ['gold', 'navy']) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${insignia(100, 100, 200, v)}</svg>`;
    fs.writeFileSync(path.join(dir, `spoty-insignia-${v}.svg`), svg);
    fs.writeFileSync(path.join(dir, `spoty-insignia-${v}.png`), renderPng(svg, 512).asPng());
  }
  SAMPLES.forEach((e) => write(path.join(ROOT, 'brand', 'certificates'), e));
} else if (arg) {
  JSON.parse(fs.readFileSync(arg, 'utf8')).forEach((e) => write(out || '.', e));
} else {
  console.log('Usage: node generate.js samples | node generate.js input.json outDir');
}
