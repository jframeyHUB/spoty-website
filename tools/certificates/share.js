// SPOTY share images: the website link preview (og.png) and the generic
// "I'm going for SPOTY 2027" LinkedIn banner and square post sent in the welcome email.
// Run: node share.js   (writes to assets/og.png and assets/share/)

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..', '..');
const FONTS = ['bodoni800.ttf', 'bodoni700.ttf', 'bodoni600italic.ttf', 'sora600.ttf'].map((f) => path.join(__dirname, 'fonts', f));
const MARK = fs.readFileSync(path.join(ROOT, 'assets', 'spoty-mark.svg'), 'utf8');
const SERIF = "'Bodoni Moda 48pt', 'Bodoni Moda', Didot, serif";
const NAVY = '#0F2742', GOLD = '#C9971C', GOLD_LIGHT = '#F4D58A', MUTED = '#8FA0B8', ON_NAVY = '#DCE4EF';
const opts = { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Sora' } };

let uid = 0;
function mark(x, y, h, colour = GOLD, opacity = 1) {
  const n = ++uid;
  let inner = MARK.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>.*?<\/title>/, '');
  inner = inner.replace(/id="(k\d+[a-z])"/g, `id="m${n}$1"`).replace(/url\(#(k\d+[a-z])\)/g, `url(#m${n}$1)`);
  inner = inner.split('#C9971C').join(colour);
  const s = h / 240;
  return `<g transform="translate(${x - 100 * s} ${y}) scale(${s})" opacity="${opacity}">${inner}</g>`;
}

// Measure a string's rendered width so the strike-through and "vote." land exactly.
function width(str, font, size, weight) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="400"><text x="0" y="300" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="#000" xml:space="preserve">${str}</text></svg>`;
  const box = new Resvg(svg, opts).getBBox();
  return box ? box.x + box.width : 0;
}

// "Sell me this ~~pen~~ vote." starting at x (left aligned) or centred on cx.
function headline({ x, cx, y, size }) {
  const font = 'Sora', weight = 600;
  const space = width('a a', font, size, weight) - width('aa', font, size, weight) + size * 0.08;
  const w1 = width('Sell me this', font, size, weight);
  const wPen = width('pen', font, size, weight);
  const wVote = width('vote.', font, size, weight);
  const total = w1 + space + wPen + space + wVote;
  const left = cx !== undefined ? cx - total / 2 : x;
  const xPen = left + w1 + space, xVote = xPen + wPen + space;
  const t = (tx, str, fill) => `<text x="${tx}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${str}</text>`;
  const sy = y - size * 0.3;
  return t(left, 'Sell me this', '#FFFFFF') + t(xPen, 'pen', MUTED) + t(xVote, 'vote.', GOLD_LIGHT) +
    `<rect x="${xPen - size * 0.06}" y="${sy - size * 0.045}" width="${wPen + size * 0.12}" height="${size * 0.09}" rx="${size * 0.03}" fill="${GOLD}" transform="rotate(-5 ${xPen + wPen / 2} ${sy})"/>`;
}

const text = (x, y, str, { font = 'Sora', size = 30, weight = 600, fill = '#FFFFFF', anchor = 'start', spacing = 0 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${spacing ? ` letter-spacing="${spacing}"` : ''}>${str}</text>`;
const bold = (inner, colour, w = 2) => `<g stroke="${colour}" stroke-width="${w}" stroke-linejoin="round">${inner}</g>`;

// ---------- Link preview, 1200 x 630 ----------
function og() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="${NAVY}"/>
${mark(930, -130, 900, GOLD, 0.07)}
<rect width="1200" height="8" fill="${GOLD}"/>
${mark(112, 70, 110)}
${text(176, 120, 'SPOTY', { font: SERIF, size: 52, weight: 800, fill: GOLD, spacing: 4 })}
${text(178, 152, 'SALES PERSON OF THE YEAR', { size: 15, fill: GOLD, spacing: 3 })}
${text(72, 290, 'SALES PERSON OF THE YEAR 2027', { size: 24, fill: GOLD_LIGHT, spacing: 5 })}
${headline({ x: 70, y: 400, size: 92 })}
${text(72, 480, 'The global awards for salespeople.', { size: 34, fill: ON_NAVY })}
${text(72, 560, 'spoty.club', { size: 30, fill: GOLD_LIGHT })}
</svg>`;
}

// ---------- Generic LinkedIn banner, 1584 x 396 (left 500px kept clear for the profile photo) ----------
function banner() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1584 396" width="1584" height="396">
<rect width="1584" height="396" fill="${NAVY}"/>
<rect width="1584" height="8" fill="${GOLD}"/>
${mark(1380, -120, 700, GOLD, 0.06)}
${mark(1420, 48, 300)}
${text(520, 148, 'SALES PERSON OF THE YEAR 2027', { size: 28, fill: GOLD_LIGHT, spacing: 6 })}
${bold(text(518, 240, "I'm going for SPOTY 2027", { font: SERIF, size: 54, weight: 800 }), '#FFFFFF', 2.4)}
${text(520, 306, 'Early access · spoty.club', { size: 32 })}
</svg>`;
}

// ---------- Square post, 1080 x 1080 ----------
function post() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
<rect width="1080" height="1080" fill="${NAVY}"/>
${mark(860, 420, 900, GOLD, 0.06)}
<rect x="36" y="36" width="1008" height="1008" fill="none" stroke="${GOLD}" stroke-width="6"/>
${mark(540, 110, 300)}
${text(540, 500, "I'M GOING FOR", { size: 30, fill: GOLD_LIGHT, anchor: 'middle', spacing: 8 })}
${bold(text(540, 590, 'Sales Person', { font: SERIF, size: 92, weight: 800, anchor: 'middle' }), '#FFFFFF', 2.4)}
${bold(text(540, 690, 'of the Year 2027', { font: SERIF, size: 92, weight: 800, anchor: 'middle' }), '#FFFFFF', 2.4)}
${headline({ cx: 540, y: 820, size: 64 })}
${text(540, 960, 'Early access · spoty.club', { size: 32, fill: ON_NAVY, anchor: 'middle' })}
</svg>`;
}

const png = (svg, w) => new Resvg(svg, { ...opts, fitTo: { mode: 'width', value: w } }).render().asPng();
fs.mkdirSync(path.join(ROOT, 'assets', 'share'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets', 'og.png'), png(og(), 1200));
fs.writeFileSync(path.join(ROOT, 'assets', 'share', 'spoty-linkedin-banner.png'), png(banner(), 1584));
fs.writeFileSync(path.join(ROOT, 'assets', 'share', 'spoty-post.png'), png(post(), 1080));
console.log('wrote assets/og.png, assets/share/spoty-linkedin-banner.png, assets/share/spoty-post.png');
