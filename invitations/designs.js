// ===== עיצובים מאוירים (SVG): כל עיצוב מצייר שכבת קישוט מאחורי הטקסט =====
// הציורים נוצרים בקוד – בלי תמונות – כך שהם חדים בכל גודל ומתאימים לכל טקסט.

let svgUid = 0;
const newId = (p) => `${p}${++svgUid}`;

// מספרים אקראיים קבועים, כדי שהציור ייראה זהה בכל פעם
function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const f1 = (n) => +n.toFixed(1);

// --- אבני בניין ---
const svg = (viewBox, inner, aspect = 'xMidYMid meet', cls = '') =>
  `<svg class="${cls}" viewBox="${viewBox}" preserveAspectRatio="${aspect}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// שכבה שנמתחת על כל הכרטיס (קווים נשארים דקים בזכות non-scaling-stroke)
const stretch = (inner, cls = '') => svg('0 0 100 100', inner, 'none', `dframe ${cls}`);

// חלק במיקום קבוע בכרטיס; גודל ב-em כדי שיתכווץ גם בתצוגת הדוגמה
const piece = (style, inner, cls = '') => `<div class="dp ${cls}" style="${style}">${inner}</div>`;

function goldGradient(id, size = 100) {
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${size}" y2="${size}">
    <stop offset="0" stop-color="#fff1b8"/><stop offset=".3" stop-color="#d9a945"/><stop offset=".5" stop-color="#8c6020"/>
    <stop offset=".72" stop-color="#f3d27a"/><stop offset="1" stop-color="#a87a2c"/></linearGradient>`;
}

const starPath = (cx, cy, r) => {
  const h = r * 0.866;
  return `M${cx} ${cy - r}L${f1(cx + h)} ${cy + r / 2}L${f1(cx - h)} ${cy + r / 2}Z M${cx} ${cy + r}L${f1(cx + h)} ${cy - r / 2}L${f1(cx - h)} ${cy - r / 2}Z`;
};

function starIcon() {
  const g = newId('st');
  return `<div class="card-star-wrap"><svg class="card-star" viewBox="0 0 100 100">${`<defs>${goldGradient(g)}</defs>`}
    <path d="${starPath(50, 52, 40)}" fill="none" stroke="url(#${g})" stroke-width="7" stroke-linejoin="round"/></svg></div>`;
}

// עלה: בסיס ב-(x,y), מצביע לכיוון angle (מעלות, 0 = למעלה)
function leaf(x, y, len, angle, w = 0.35, vein = true) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(angle)})"><path d="M0 0Q${f1(len * w)} ${f1(-len / 2)} 0 ${f1(-len)}Q${f1(-len * w)} ${f1(-len / 2)} 0 0Z"/>${vein ? `<path d="M0 0L0 ${f1(-len * 0.85)}" fill="none"/>` : ''}</g>`;
}

// ענף עם עלים לסירוגין
function branch(x, y, len, a, n, leafLen, opts = {}) {
  const rad = a * Math.PI / 180;
  const dx = Math.sin(rad), dy = -Math.cos(rad);
  const ex = x + dx * len, ey = y + dy * len;
  const bend = opts.bend || 0;
  const cx = (x + ex) / 2 - dy * bend, cy = (y + ey) / 2 + dx * bend;
  let s = `<path class="stem" fill="none" d="M${f1(x)} ${f1(y)}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}"/>`;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex;
    const py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey;
    const side = i % 2 ? 1 : -1;
    if (opts.round) s += `<ellipse cx="${f1(px + side * leafLen * 0.45)}" cy="${f1(py)}" rx="${f1(leafLen * 0.42)}" ry="${f1(leafLen * 0.38)}"/>`;
    else s += leaf(px, py, leafLen * (1 - t * 0.35), a + side * (opts.spread || 42), opts.w, opts.vein !== false);
  }
  if (!opts.round) s += leaf(ex, ey, leafLen * 0.7, a, opts.w, opts.vein !== false);
  return s;
}

// פרח בקו (5 עלי כותרת)
function flowerLine(cx, cy, r, n = 5, rot = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += `<path transform="rotate(${f1(rot + i * 360 / n)} ${cx} ${cy})" d="M${cx} ${cy}C${f1(cx - r * 0.6)} ${f1(cy - r * 0.45)} ${f1(cx - r * 0.5)} ${f1(cy - r * 1.05)} ${cx} ${f1(cy - r)}C${f1(cx + r * 0.5)} ${f1(cy - r * 1.05)} ${f1(cx + r * 0.6)} ${f1(cy - r * 0.45)} ${cx} ${cy}Z"/>` +
      `<path transform="rotate(${f1(rot + i * 360 / n)} ${cx} ${cy})" d="M${cx} ${f1(cy - r * 0.3)}L${cx} ${f1(cy - r * 0.72)}" fill="none"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.2)}"/>`;
}

// עלה כותרת שמצביע החוצה מהמרכז
function petalRing(cx, cy, n, r0, len, w, rot = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += `<path transform="rotate(${f1(rot + i * 360 / n)} ${cx} ${cy})" d="M${cx} ${f1(cy - r0)}C${f1(cx - w)} ${f1(cy - r0 - len * 0.4)} ${f1(cx - w * 0.6)} ${f1(cy - r0 - len * 0.9)} ${cx} ${f1(cy - r0 - len)}C${f1(cx + w * 0.6)} ${f1(cy - r0 - len * 0.9)} ${f1(cx + w)} ${f1(cy - r0 - len * 0.4)} ${cx} ${f1(cy - r0)}Z"/>`;
  }
  return s;
}

function mandala(cx, cy, r, base, petal, gold) {
  let dots = '';
  for (let i = 0; i < 28; i++) {
    const a = i * Math.PI * 2 / 28;
    dots += `<circle cx="${f1(cx + Math.cos(a) * r * 0.92)}" cy="${f1(cy + Math.sin(a) * r * 0.92)}" r="${f1(r * 0.025)}"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${base}" stroke="${gold}" stroke-width="${f1(r * 0.03)}"/>
    <g fill="${petal}" stroke="${gold}" stroke-width="${f1(r * 0.012)}">${petalRing(cx, cy, 16, r * 0.5, r * 0.36, r * 0.1)}</g>
    <g fill="none" stroke="${gold}" stroke-width="${f1(r * 0.012)}">${petalRing(cx, cy, 16, r * 0.5, r * 0.3, r * 0.06, 11.25)}<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.48)}"/><circle cx="${cx}" cy="${cy}" r="${f1(r * 0.86)}"/></g>
    <g fill="${gold}">${petalRing(cx, cy, 12, r * 0.18, r * 0.26, r * 0.07)}<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.13)}"/>${dots}</g>`;
}

// חומת אבנים (הכותל)
function stoneWall(rand, w, h, rowH, palette, joint, y0 = 0) {
  let s = `<rect y="${y0}" width="${w}" height="${h - y0}" fill="${joint}"/>`;
  for (let y = y0; y < h; y += rowH) {
    let x = -rand() * rowH * 2;
    while (x < w) {
      const sw = rowH * (1.4 + rand() * 1.7);
      s += `<rect x="${f1(x + 0.3)}" y="${f1(y + 0.3)}" width="${f1(sw - 0.6)}" height="${f1(rowH - 0.6)}" rx="${f1(rowH * 0.14)}" fill="${palette[Math.floor(rand() * palette.length)]}"/>`;
      if (rand() < 0.35) s += `<ellipse cx="${f1(x + sw * rand())}" cy="${f1(y + rowH * rand())}" rx="${f1(rowH * 0.4)}" ry="${f1(rowH * 0.2)}" fill="#000" opacity=".06"/>`;
      x += sw;
    }
  }
  return s;
}

function tuft(x, y, s, color) {
  let out = `<g fill="${color}">`;
  [-60, -30, 0, 30, 60].forEach((a) => { out += leaf(x, y, s * (1 - Math.abs(a) / 150), a, 0.32, false); });
  return out + '</g>';
}

function scatterDots(rand, n, regions, color, rMin, rMax) {
  let s = `<g fill="${color}">`;
  for (let i = 0; i < n; i++) {
    const roll = rand();
    let acc = 0;
    const reg = regions.find((r) => (acc += r.p) >= roll) || regions[regions.length - 1];
    s += `<circle cx="${f1(reg.x[0] + rand() * (reg.x[1] - reg.x[0]))}" cy="${f1(reg.y[0] + rand() * (reg.y[1] - reg.y[0]))}" r="${f1(rMin + rand() * (rMax - rMin))}" opacity="${f1(0.55 + rand() * 0.45)}"/>`;
  }
  return s + '</g>';
}

function butterfly(x, y, s, rot, grad, edge) {
  const wings = `<path d="M0 0C-10-30-55-44-48-12C-45 4-18 6 0 0Z"/><path d="M0 2C-8 10-38 20-31 40C-23 52-6 30 0 2Z"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <g fill="url(#${grad})" stroke="${edge}" stroke-width="1.2">${wings}<g transform="scale(-1 1)">${wings}</g></g>
    <g fill="#fff" opacity=".45"><circle cx="-30" cy="-16" r="5"/><circle cx="30" cy="-16" r="5"/><circle cx="-18" cy="26" r="3.5"/><circle cx="18" cy="26" r="3.5"/></g>
    <ellipse cy="4" rx="3" ry="15" fill="#6d4a6e"/>
    <path d="M-1-10Q-6-25-13-30M1-10Q6-25 13-30" stroke="#6d4a6e" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}

function balloon(x, y, r, grad, string = 40) {
  return `<path d="M${x} ${f1(y + r * 1.22)}q${f1(-r * 0.35)} ${f1(string * 0.35)} ${f1(r * 0.1)} ${f1(string * 0.6)}t${f1(-r * 0.25)} ${f1(string * 0.4)}" stroke="#ffffff99" stroke-width=".8" fill="none"/>
    <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 1.18)}" fill="url(#${grad})"/>
    <path d="M${f1(x - r * 0.13)} ${f1(y + r * 1.27)}L${x} ${f1(y + r * 1.14)}L${f1(x + r * 0.13)} ${f1(y + r * 1.27)}Z" fill="url(#${grad})"/>
    <ellipse cx="${f1(x - r * 0.38)}" cy="${f1(y - r * 0.45)}" rx="${f1(r * 0.17)}" ry="${f1(r * 0.32)}" fill="#fff" opacity=".45" transform="rotate(-25 ${f1(x - r * 0.38)} ${f1(y - r * 0.45)})"/>`;
}

function balloonGradient(id, light, base, dark) {
  return `<radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${light}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`;
}

function burst(cx, cy, r, n, color) {
  let s = `<g stroke="${color}" stroke-width="1.1" stroke-linecap="round" fill="${color}">`;
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n;
    s += `<path d="M${f1(cx + Math.cos(a) * r * 0.3)} ${f1(cy + Math.sin(a) * r * 0.3)}L${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r)}"/><circle cx="${f1(cx + Math.cos(a) * r * 1.1)}" cy="${f1(cy + Math.sin(a) * r * 1.1)}" r=".9" stroke="none"/>`;
  }
  return s + '</g>';
}

// קונפטי לאורך השוליים בלבד, כדי לא להסתיר את הטקסט
function confettiRibbons(rand, n, w, h, colors) {
  let s = '';
  for (let i = 0; i < n; i++) {
    let x, y;
    do { x = rand() * w; y = rand() * h; } while (x > w * 0.18 && x < w * 0.82 && y > h * 0.16 && y < h * 0.86);
    x = f1(x); y = f1(y);
    const c = colors[i % colors.length];
    s += rand() < 0.5
      ? `<rect x="${x}" y="${y}" width="3.2" height="1.4" fill="${c}" transform="rotate(${f1(rand() * 180)} ${x} ${y})"/>`
      : `<path d="M${x} ${y}q2-3 4 0t4 0" stroke="${c}" stroke-width="1.1" fill="none" transform="rotate(${f1(rand() * 180)} ${x} ${y})"/>`;
  }
  return s;
}

// מראה: אותו חלק בכל אחת מארבע הפינות
const corners = (size, inner, cls = '', offset = '0') => ['tl', 'tr', 'bl', 'br'].map((c) =>
  piece(`width:${size};height:${size};${c[0] === 't' ? 'top' : 'bottom'}:${offset};${c[1] === 'l' ? 'left' : 'right'}:${offset}`, inner, `corner-${c} ${cls}`)).join('');

// ---------- העיצובים ----------
const DESIGNS = {
  goldfloral: {
    name: 'פרחי זהב',
    tags: ['wedding'],
    icon: 'none',
    decor() {
      const flowers = svg('0 0 160 160', `<g fill="#fbf7ee" stroke="#b8913a" stroke-width="1.3" stroke-linejoin="round">
        ${branch(118, 40, 70, 250, 6, 14, { bend: 8 })}${branch(122, 52, 80, 200, 6, 13, { bend: -10 })}
        ${flowerLine(120, 42, 24, 5, 10)}${flowerLine(80, 24, 15, 5, 40)}${flowerLine(140, 92, 14, 5, -20)}
        ${leaf(100, 70, 22, 210)}${leaf(96, 30, 18, 280)}</g>`);
      return stretch(`<g fill="none" stroke="#b8913a"><rect x="5" y="4" width="90" height="92" stroke-width="1.6"/><rect x="7.5" y="6.2" width="85" height="87.6" stroke-width=".7"/></g>`) +
        piece('width:22em;height:22em;top:-2.4em;right:-2.4em', flowers) +
        piece('width:22em;height:22em;bottom:-2.4em;left:-2.4em;transform:rotate(180deg)', flowers);
    }
  },

  navydeco: {
    name: 'ארט דקו כחול',
    tags: ['mitzvah'],
    icon: 'star',
    decor() {
      const poly = [[13, 2.5], [87, 2.5], [96.5, 9], [96.5, 45], [99, 50], [96.5, 55], [96.5, 91], [87, 97.5], [13, 97.5], [3.5, 91], [3.5, 55], [1, 50], [3.5, 45], [3.5, 9]];
      const scaled = (s) => poly.map(([x, y]) => `${f1(50 + (x - 50) * s)},${f1(50 + (y - 50) * s)}`).join(' ');
      const g = newId('gd');
      const star = svg('0 0 100 100', `<defs>${goldGradient(g)}</defs><circle cx="50" cy="50" r="46" fill="#1b2d5c"/><path d="${starPath(50, 52, 34)}" fill="none" stroke="url(#${g})" stroke-width="7" stroke-linejoin="round"/>`);
      return stretch(`<g fill="none" stroke="#d9b45d"><polygon points="${scaled(1)}" stroke-width="1.8"/><polygon points="${scaled(0.965)}" stroke-width=".8"/><polygon points="${scaled(0.93)}" stroke-width=".8"/>
          <path d="M30 2.5L38 6.5H62L70 2.5M30 97.5L38 93.5H62L70 97.5" stroke-width="1"/></g>`) +
        piece('width:3.6em;height:3.6em;left:-.25em;top:50%;transform:translateY(-50%)', star) +
        piece('width:3.6em;height:3.6em;right:-.25em;top:50%;transform:translateY(-50%)', star) +
        piece('width:3.6em;height:3.6em;bottom:-.4em;left:50%;transform:translateX(-50%)', star);
    }
  },

  blackconfetti: {
    name: 'שחור וקונפטי זהב',
    tags: ['birthday', 'business'],
    icon: 'none',
    decor() {
      const rand = seeded(7);
      const corner = svg('0 0 100 100', `<g fill="none" stroke="#d6b05a"><path d="M10 100V10H100" stroke-width="2"/><path d="M18 100V18H100" stroke-width="1"/><path d="M10 58A48 48 0 0 1 58 10" stroke-width="1.2"/><path d="M18 46A28 28 0 0 1 46 18" stroke-width="1"/><path d="M4 100V4H100" stroke-width=".8"/></g>`);
      return svg('0 0 100 140', scatterDots(rand, 110, [
        { p: 0.5, x: [55, 98], y: [2, 38] }, { p: 0.35, x: [2, 45], y: [108, 138] }, { p: 0.15, x: [2, 98], y: [2, 14] }
      ], '#d9b35b', 0.25, 1.15), 'xMidYMid slice', 'dfull') +
        stretch('<g fill="none" stroke="#d6b05a"><rect x="3.5" y="2.6" width="93" height="94.8" stroke-width="1"/></g>') +
        corners('6em', corner, 'mirror');
    }
  },

  kotelarch: {
    name: 'הכותל וקשת כחולה',
    tags: ['mitzvah', 'jerusalem'],
    icon: 'none',
    decor() {
      const rand = seeded(11);
      const glow = newId('gl');
      let plants = '';
      for (let i = 0; i < 9; i++) plants += tuft(f1(rand() * 100), f1(8 + rand() * 128), 5 + rand() * 4, '#6f8d3e');
      return svg('0 0 100 140', `<defs><radialGradient id="${glow}" cx=".5" cy=".25" r=".8"><stop offset="0" stop-color="#fff4c9" stop-opacity=".55"/><stop offset="1" stop-color="#5a4527" stop-opacity=".35"/></radialGradient></defs>
          ${stoneWall(rand, 100, 140, 8.5, ['#d8c39b', '#cdb68b', '#e2cfa8', '#c4aa7c', '#d4bd92'], '#8e7853')}${plants}<rect width="100" height="140" fill="url(#${glow})"/>`, 'xMidYMid slice', 'dfull') +
        stretch(`<path d="M10 97V32C10 20 28 14 38 10C45 7 48 4.5 50 2C52 4.5 55 7 62 10C72 14 90 20 90 32V97Z" fill="#1c2a4f" stroke="#d9b45d" stroke-width="3"/>
          <path d="M12.5 94.6V32.6C12.5 22 29 16.5 38.8 12.4C45 9.8 48 7.6 50 5.4C52 7.6 55 9.8 61.2 12.4C71 16.5 87.5 22 87.5 32.6V94.6Z" fill="none" stroke="#d9b45d" stroke-width=".8" opacity=".7"/>`);
    }
  },

  chuppah: {
    name: 'חופה בירושלים',
    tags: ['wedding', 'jerusalem'],
    icon: 'none',
    decor() {
      const rand = seeded(5);
      const fade = newId('fd');
      const olive = (x, y, a) => `<g fill="#8c9a62" stroke="#6f7c48" stroke-width=".4">${branch(x, y, 58, a, 8, 11, { bend: 6, w: 0.22, vein: false })}</g>
        <g fill="#56612f">${[0.3, 0.55, 0.75].map((t) => `<ellipse cx="${f1(x + Math.sin(a * Math.PI / 180) * 58 * t + 3)}" cy="${f1(y - Math.cos(a * Math.PI / 180) * 58 * t + 3)}" rx="2.2" ry="3"/>`).join('')}</g>`;
      const art = svg('0 0 200 110', `<defs><linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#faf6ee" stop-opacity="0"/><stop offset="1" stop-color="#faf6ee"/></linearGradient></defs>
        <g opacity=".75">${stoneWall(rand, 200, 110, 10, ['#efe6d4', '#e8dcc4', '#f2eadb', '#e3d5ba'], '#d3c3a1', 18)}</g>
        <rect width="200" height="110" fill="url(#${fade})"/>
        <g fill="#f8f3ea" stroke="#d6c8ad" stroke-width=".7">
          <path d="M0 0H26C18 45 30 95 14 150H0Z"/><path d="M200 0H174C182 45 170 95 186 150H200Z"/>
          <path d="M0 0H200V12C162 48 122 44 100 30C78 44 38 48 0 12Z"/></g>
        <g fill="none" stroke="#e3d7c0" stroke-width=".7"><path d="M8 0C4 50 14 100 6 150M192 0C196 50 186 100 194 150M12 14C50 42 80 36 100 24M188 14C150 42 120 36 100 24"/></g>
        ${olive(2, 6, 118)}${olive(198, 6, 242)}`, 'xMidYMax slice');
      return piece('top:0;left:0;right:0;height:19em', art) +
        stretch('<g fill="none" stroke="#c4a25a"><rect x="3" y="2" width="94" height="96" stroke-width="1.2"/><rect x="4.6" y="3.2" width="90.8" height="93.6" stroke-width=".6"/></g>');
    }
  },

  kotelsunset: {
    name: 'הכותל בשקיעה',
    tags: ['mitzvah', 'jerusalem'],
    icon: 'none',
    decor() {
      const rand = seeded(23);
      const sky = newId('sk'), fade = newId('fd'), light = newId('lt');
      let notes = '', plants = '';
      for (let i = 0; i < 7; i++) {
        const x = f1(20 + rand() * 160), y = f1(52 + rand() * 45);
        notes += `<rect x="${x}" y="${y}" width="6" height="4" rx=".6" fill="#fbf4e4" stroke="#cdb894" stroke-width=".3" transform="rotate(${f1(rand() * 60 - 30)} ${x} ${y})"/>`;
      }
      for (let i = 0; i < 10; i++) plants += tuft(f1(rand() * 200), f1(48 + rand() * 60), 5 + rand() * 4, '#5d6b2e');
      const art = svg('0 0 200 125', `<defs>
          <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e59a4e"/><stop offset="1" stop-color="#fbe0a0"/></linearGradient>
          <linearGradient id="${light}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".35"/><stop offset="1" stop-color="#3a2410" stop-opacity=".35"/></linearGradient>
          <linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" stop-color="#7a4d29" stop-opacity="0"/><stop offset="1" stop-color="#7a4d29"/></linearGradient></defs>
        <rect width="200" height="50" fill="url(#${sky})"/><circle cx="150" cy="30" r="24" fill="#fff4cf" opacity=".35"/><circle cx="150" cy="30" r="11" fill="#fff6d8"/>
        ${stoneWall(rand, 200, 125, 9, ['#c99c5f', '#b98b50', '#d4a96c', '#b07f47', '#c2935a'], '#7a5530', 40)}
        ${plants}${notes}<rect y="40" width="200" height="85" fill="url(#${light})"/><rect width="200" height="125" fill="url(#${fade})"/>`, 'xMidYMax slice');
      return piece('top:0;left:0;right:0;height:22em', art);
    }
  },

  hennamandala: {
    name: 'חינה מרוקאית',
    tags: ['henna'],
    icon: 'none',
    decor() {
      const pat = newId('pt');
      const md = svg('0 0 100 100', mandala(50, 50, 48, '#7a1430', '#1f8f8a', '#e8b94e'));
      const small = svg('0 0 100 100', `<g fill="none" stroke="#e8b94e" stroke-width="2.5">${petalRing(50, 50, 8, 8, 30, 10)}<circle cx="50" cy="50" r="40"/></g><circle cx="50" cy="50" r="7" fill="#e8b94e"/>`);
      return svg('0 0 100 140', `<defs><pattern id="${pat}" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#1d8580"/>
          <path d="M8 2C13 2 14 8 10 10.5C7 12.5 4 10 5.5 7.5C6.5 6 8.5 6.5 8.2 8" fill="#8a1a3a" stroke="#e8b94e" stroke-width=".5"/>
          <path d="M0 14Q4 11 8 14T16 14" fill="none" stroke="#e8b94e" stroke-width=".4"/><circle cx="2" cy="4" r=".7" fill="#e8b94e"/><circle cx="14" cy="9" r=".6" fill="#e8b94e"/></pattern></defs>
          <rect width="100" height="140" fill="url(#${pat})"/>`, 'xMidYMid slice', 'dfull') +
        corners('11em', md, '', '-4em') +
        stretch(`<path d="M18 5.5Q29 5.5 31 1.8H69Q71 5.5 82 5.5Q86 11 93 13V87Q86 89 82 94.5Q71 94.5 69 98.2H31Q29 94.5 18 94.5Q14 89 7 87V13Q14 11 18 5.5Z" fill="#7a1430" stroke="#e8b94e" stroke-width="3"/>
          <path d="M19.5 7.6Q30 7.6 32.4 4.2H67.6Q70 7.6 80.5 7.6Q84 12.4 90.5 14.6V85.4Q84 87.6 80.5 92.4Q70 92.4 67.6 95.8H32.4Q30 92.4 19.5 92.4Q16 87.6 9.5 85.4V14.6Q16 12.4 19.5 7.6Z" fill="none" stroke="#e8b94e" stroke-width=".8"/>`) +
        piece('width:3.4em;height:3.4em;top:1.6em;left:50%;transform:translateX(-50%)', small) +
        piece('width:3.4em;height:3.4em;bottom:1.6em;left:50%;transform:translateX(-50%)', small);
    }
  },

  butterflies: {
    name: 'פרפרים ורודים',
    tags: ['mitzvah', 'birthday'],
    icon: 'none',
    decor() {
      const rand = seeded(3);
      const g1 = newId('bf'), g2 = newId('bf');
      const defs = `<defs><radialGradient id="${g1}" cx=".5" cy=".6" r=".8"><stop offset="0" stop-color="#fbe6f1"/><stop offset=".6" stop-color="#d9a6e0"/><stop offset="1" stop-color="#a77fc9"/></radialGradient>
        <radialGradient id="${g2}" cx=".5" cy=".6" r=".8"><stop offset="0" stop-color="#fff0f4"/><stop offset=".6" stop-color="#f3b3cb"/><stop offset="1" stop-color="#d27ca6"/></radialGradient></defs>`;
      const flower = (x, y, r, c) => `<g fill="${c}">${petalRing(x, y, 5, r * 0.15, r, r * 0.5)}</g><circle cx="${x}" cy="${y}" r="${f1(r * 0.3)}" fill="#f7d77e"/>`;
      return svg('0 0 100 140', `${defs}${scatterDots(rand, 70, [{ p: 0.5, x: [2, 98], y: [2, 40] }, { p: 0.5, x: [2, 98], y: [2, 138] }], '#d6b46a', 0.2, 0.7)}
          <path d="M50 9C42 1 33 3 36 9C39 14 47 11 50 9ZM50 9C58 1 67 3 64 9C61 14 53 11 50 9Z" fill="#e8a8c6" stroke="#c97ba3" stroke-width=".4"/><circle cx="50" cy="9.5" r="1.8" fill="#d48bb1"/>
          <path d="M49.5 10.5C45 15 37 15 30 20C24 24 18 25 12 27M50.5 10.5C55 15 63 15 70 20C76 24 82 25 88 27" fill="none" stroke="#e8b3cc" stroke-width="1.1" stroke-linecap="round"/>
          ${butterfly(16, 18, 0.2, -18, g1, '#9b72b8')}${butterfly(84, 22, 0.16, 20, g2, '#c4719d')}${butterfly(10, 70, 0.11, -30, g1, '#9b72b8')}${butterfly(90, 108, 0.12, 25, g1, '#9b72b8')}${butterfly(78, 50, 0.08, 10, g2, '#c4719d')}
          ${flower(8, 128, 4, '#c9a3e6')}${flower(16, 134, 3, '#e7a9c9')}${flower(90, 132, 3.6, '#c9a3e6')}${flower(96, 124, 2.6, '#e7a9c9')}`, 'xMidYMid slice', 'dfull');
    }
  },

  woodland: {
    name: 'חיות היער',
    tags: ['brit', 'birthday'],
    icon: 'none',
    decor() {
      const star5 = (x, y, r, c) => {
        let d = '';
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
          d += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * rr)} ${f1(y + Math.sin(a) * rr)}`;
        }
        return `<path d="${d}Z" fill="${c}"/>`;
      };
      const cloud = (x, y, s) => `<g fill="#cfe3f3" opacity=".9" transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="6"/><circle cx="7" cy="-3" r="7"/><circle cx="14" cy="0" r="5.5"/><rect x="0" y="0" width="14" height="5.5"/></g>`;
      const top = svg('0 0 100 140', `
          <g fill="#a9c49a" stroke="#88a67a" stroke-width=".3">${branch(0, 8, 32, 115, 7, 7, { bend: 4, vein: false })}${branch(100, 10, 30, 245, 7, 7, { bend: -4, vein: false })}${branch(0, 70, 22, 70, 5, 6, { vein: false })}${branch(100, 80, 22, 290, 5, 6, { vein: false })}</g>
          ${cloud(70, 16, 0.9)}${cloud(84, 52, 0.7)}${cloud(6, 40, 0.6)}
          ${star5(28, 14, 2.2, '#f4d36b')}${star5(62, 30, 1.6, '#a9cbe8')}${star5(90, 34, 1.8, '#f4d36b')}${star5(12, 58, 1.4, '#f4d36b')}${star5(94, 66, 1.4, '#a9cbe8')}`, 'xMidYMid slice', 'dfull');
      const animals = svg('0 0 300 140', `<ellipse cx="150" cy="170" rx="230" ry="55" fill="#dbe9c8"/>
        <g fill="#a9c49a">${tuft(30, 128, 14, '#a9c49a')}${tuft(285, 126, 16, '#a9c49a')}${tuft(180, 134, 10, '#a9c49a')}</g>
        <g transform="translate(38 0)">
          <g stroke="#8a5a34" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M92 46C88 34 92 26 86 18M90 36L82 30M89 42C96 32 100 28 106 22M98 32L104 34"/></g>
          <g fill="#c98b52"><path d="M80 88C78 70 84 58 92 50L98 54C94 62 92 74 92 88Z"/><ellipse cx="72" cy="96" rx="27" ry="15"/>
            <rect x="52" y="102" width="4.5" height="26" rx="2"/><rect x="60" y="104" width="4.5" height="25" rx="2"/><rect x="80" y="102" width="4.5" height="26" rx="2"/><rect x="88" y="100" width="4.5" height="27" rx="2"/>
            <ellipse cx="97" cy="50" rx="9" ry="7.5"/><ellipse cx="88" cy="44" rx="5" ry="2.6" transform="rotate(-30 88 44)"/><ellipse cx="106" cy="44" rx="5" ry="2.6" transform="rotate(30 106 44)"/></g>
          <ellipse cx="103" cy="53" rx="4" ry="3.2" fill="#e3b88d"/><circle cx="106" cy="52" r="1.4" fill="#4a3020"/><circle cx="96" cy="48" r="1.4" fill="#3a2414"/>
          <ellipse cx="70" cy="104" rx="18" ry="5" fill="#e7c39b"/><g fill="#f6e6d0"><circle cx="64" cy="92" r="1.8"/><circle cx="74" cy="88" r="1.6"/><circle cx="80" cy="95" r="1.5"/><circle cx="58" cy="97" r="1.4"/></g></g>
        <g transform="translate(150 0)" fill="#e2d4c2">
          <ellipse cx="0" cy="114" rx="13" ry="12"/><circle cx="0" cy="96" r="9"/><ellipse cx="-4" cy="80" rx="3.2" ry="11"/><ellipse cx="4" cy="80" rx="3.2" ry="11"/>
          <ellipse cx="-4" cy="81" rx="1.4" ry="7" fill="#f1c0c6"/><ellipse cx="4" cy="81" rx="1.4" ry="7" fill="#f1c0c6"/><circle cx="12" cy="118" r="4" fill="#f5eee6"/>
          <circle cx="-3" cy="95" r="1.2" fill="#3a2a20"/><circle cx="3" cy="95" r="1.2" fill="#3a2a20"/><ellipse cx="0" cy="99" rx="1.4" ry="1" fill="#d58a92"/></g>
        <g transform="translate(240 0)" fill="#a7744c">
          <circle cx="-15" cy="62" r="7"/><circle cx="15" cy="62" r="7"/><circle cx="-15" cy="62" r="3.5" fill="#d9a77b"/><circle cx="15" cy="62" r="3.5" fill="#d9a77b"/>
          <ellipse cx="0" cy="108" rx="24" ry="24"/><circle cx="0" cy="76" r="18"/><ellipse cx="0" cy="112" rx="13" ry="14" fill="#d9a77b"/>
          <ellipse cx="0" cy="82" rx="7.5" ry="5.5" fill="#d9a77b"/><ellipse cx="0" cy="79.5" rx="2.6" ry="1.8" fill="#3a2414"/>
          <circle cx="-6.5" cy="72" r="1.8" fill="#3a2414"/><circle cx="6.5" cy="72" r="1.8" fill="#3a2414"/><circle cx="-11" cy="79" r="2.5" fill="#e59a8e" opacity=".55"/><circle cx="11" cy="79" r="2.5" fill="#e59a8e" opacity=".55"/>
          <ellipse cx="-14" cy="128" rx="8" ry="5"/><ellipse cx="14" cy="128" rx="8" ry="5"/></g>`, 'xMidYMax meet');
      return top + piece('left:0;right:0;bottom:0;height:13em', animals);
    }
  },

  bohofloral: {
    name: 'בוהו פרחים מיובשים',
    tags: ['wedding'],
    icon: 'none',
    decor() {
      const fan = (x, y, a, s) => {
        let lines = '';
        for (let i = -6; i <= 6; i++) lines += `<path d="M0 0L${f1(Math.sin(i * 0.11) * 40)} ${f1(-Math.cos(i * 0.11) * 40)}"/>`;
        return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0L-26-31Q0-46 26-31Z" fill="#e3cfae" stroke="#c9ad85" stroke-width=".6"/><g stroke="#c9ad85" stroke-width=".5">${lines}</g></g>`;
      };
      const bloom = (x, y, r) => `<g fill="#fbf4ef" stroke="#e6cbbd" stroke-width=".5">${petalRing(x, y, 7, r * 0.15, r, r * 0.55)}</g><circle cx="${x}" cy="${y}" r="${f1(r * 0.28)}" fill="#c78f6d"/>`;
      const daisy = (x, y, r) => `<g fill="#d7a77f">${petalRing(x, y, 12, r * 0.2, r, r * 0.22)}</g><circle cx="${x}" cy="${y}" r="${f1(r * 0.3)}" fill="#8a5a3c"/>`;
      const cluster = svg('0 0 140 140', `${fan(30, 70, -40, 1.1)}${fan(62, 34, 20, 0.9)}
          <g fill="#9fb59a" stroke="#86a083" stroke-width=".4">${branch(40, 40, 70, 115, 9, 7, { round: true, bend: 6 })}${branch(30, 30, 55, 160, 7, 6, { round: true })}</g>
          <g fill="#b8a07a" stroke="#a78b62" stroke-width=".4">${branch(20, 20, 60, 140, 8, 9, { w: 0.18, vein: false })}</g>
          ${bloom(40, 34, 12)}${bloom(72, 56, 8)}${daisy(18, 58, 7)}<g fill="#c99b7a">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${84 + i * 5}" cy="${20 + i * 3}" r="1.6"/>`).join('')}</g>`);
      const leaves = svg('0 0 140 140', `<g fill="#9aaa86" stroke="#7f9070" stroke-width=".5">${branch(10, 135, 70, 40, 8, 13, { bend: -8 })}${branch(4, 120, 50, 15, 6, 11)}</g><g fill="none" stroke="#c8a85c" stroke-width=".7">${branch(20, 138, 60, 60, 6, 10, { bend: 6 })}</g>`);
      return piece('width:21em;height:21em;top:-1.5em;left:-1.5em;transform:scaleX(-1)', cluster) +
        piece('width:17em;height:17em;top:-1.5em;right:-1.5em', cluster) +
        piece('width:13em;height:13em;bottom:-.5em;right:-.5em;transform:scaleX(-1)', leaves) +
        piece('width:11em;height:11em;bottom:-.5em;left:-.5em', leaves);
    }
  },

  balloonsnavy: {
    name: 'בלונים וזיקוקים',
    tags: ['birthday', 'mitzvah'],
    icon: 'none',
    decor() {
      const rand = seeded(17);
      const gold = newId('bg'), blue = newId('bb'), teal = newId('bt');
      return svg('0 0 100 140', `<defs>${balloonGradient(gold, '#fff1b8', '#e6b84e', '#a8792a')}${balloonGradient(blue, '#a9c8ff', '#3a74e0', '#163f9e')}${balloonGradient(teal, '#c6fbff', '#3fcbd3', '#178a96')}</defs>
          ${burst(30, 10, 9, 18, '#e6c26a')}${burst(74, 8, 7, 16, '#4fd6dc')}${burst(56, 20, 4, 12, '#e6c26a')}
          ${confettiRibbons(rand, 40, 100, 140, ['#4fd6dc', '#e6c26a', '#7aa6ff'])}
          ${balloon(6, 12, 8, gold, 30)}${balloon(18, 4, 7, blue, 30)}${balloon(4, 34, 6.5, teal, 25)}
          ${balloon(94, 10, 8, blue, 30)}${balloon(83, 2, 6.5, gold, 28)}${balloon(97, 32, 6.5, teal, 25)}${balloon(88, 26, 5.5, gold, 20)}
          ${balloon(5, 110, 7.5, gold, 30)}${balloon(15, 124, 7, blue, 20)}${balloon(95, 116, 7.5, teal, 25)}${balloon(86, 130, 6.5, blue, 20)}`, 'xMidYMid slice', 'dfull');
    }
  },

  geonavy: {
    name: 'גאומטרי כחול-זהב',
    tags: ['mitzvah', 'business'],
    icon: 'star',
    decor() {
      return stretch(`<g fill="#1b2f5e"><polygon points="0,0 42,0 0,26"/><polygon points="100,0 76,0 100,20"/><polygon points="100,100 52,100 100,68"/><polygon points="0,100 26,100 0,80"/></g>
        <g fill="none" stroke="#c9a24d" stroke-width="1"><polygon points="14,7 84,4 96,22 93,88 80,97 10,95 4,78 7,16"/><polygon points="10,5 88,7 93,26 96,84 76,95 14,97 7,74 4,20" stroke-width=".7"/><path d="M42 0L14 7M76 0L84 4M100 68L93 88M26 100L10 95" stroke-width=".7"/></g>`);
    }
  },

  luxury: {
    name: '✨ יוקרה מונפשת',
    tags: ['wedding', 'mitzvah', 'business'],
    icon: 'star',
    decor() {
      const rand = seeded(29);
      const g = newId('lg'), g2 = newId('lg'), blur = newId('bl');
      let sparkles = '';
      for (let i = 0; i < 34; i++) sparkles += `<circle class="lux-twinkle" style="animation-delay:-${f1(rand() * 4)}s" cx="${f1(rand() * 100)}" cy="${f1(rand() * 140)}" r="${f1(0.2 + rand() * 0.5)}"/>`;
      const flows = ['M-10 100C20 60 40 120 70 80S100 40 120 60', 'M-10 30C30 8 50 62 80 30S110 8 120 22', 'M-10 132C30 110 60 142 110 108'];
      const flowLines = flows.map((d, i) => `<path class="lux-flow" style="animation-delay:-${i * 2}s" d="${d}"/>`).join('');
      const particles = svg('0 0 100 140', `<defs>${goldGradient(g, 140)}<filter id="${blur}"><feGaussianBlur stdDeviation=".9"/></filter></defs>
          <g fill="none" stroke="url(#${g})" stroke-linecap="round"><g stroke-width="1.6" opacity=".3" filter="url(#${blur})">${flowLines}</g><g stroke-width=".7" opacity=".7">${flowLines}</g></g>
          <g fill="#f3d27a">${sparkles}</g>`, 'xMidYMid slice', 'dfull');
      const scroll = `<path d="M74 38C96 18 122 48 146 28C160 16 176 28 166 41C159 50 148 42 154 35" fill="none" stroke="url(#${g2})" stroke-width="4" stroke-linecap="round"/>
        <path d="M82 36C90 18 110 20 114 29C104 29 94 33 82 36Z M118 34C126 46 140 46 146 40C138 38 128 36 118 34Z M130 24C134 12 146 10 152 14C144 18 138 22 130 24Z" fill="url(#${g2})" stroke="#6e4b14" stroke-width=".6"/>
        <circle cx="172" cy="34" r="3.2" fill="url(#${g2})"/>`;
      const corner = svg('0 0 200 200', `<defs>${goldGradient(g2, 200)}</defs>
          <g fill="none" stroke="url(#${g2})"><path d="M10 200V10H200" stroke-width="2.4"/><path d="M20 200V20H200" stroke-width="1.1"/></g>
          <rect x="3" y="3" width="13" height="13" fill="none" stroke="url(#${g2})" stroke-width="1.6"/>
          ${scroll}<g transform="matrix(0 1 1 0 0 0)">${scroll}</g>
          <g fill="url(#${g2})" stroke="#6e4b14" stroke-width=".7">${petalRing(52, 52, 8, 6, 22, 9)}${petalRing(52, 52, 8, 4, 14, 6, 22.5)}<circle cx="52" cy="52" r="7"/></g>
          <g fill="#6e4b14">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${f1(52 + Math.cos(i) * 3.5)}" cy="${f1(52 + Math.sin(i) * 3.5)}" r=".9"/>`).join('')}</g>`);
      return particles +
        stretch('<g fill="none" stroke="#c9963a"><rect x="3" y="2.4" width="94" height="95.2" stroke-width="1.4"/><rect x="5" y="3.8" width="90" height="92.4" stroke-width=".6"/></g>', 'lux-frame') +
        corners('13em', corner, 'mirror lux-corner');
    }
  }
};

// תגיות לסינון גם לעיצובים הוותיקים
const THEME_TAGS = {
  gold: ['wedding'], floral: ['wedding', 'mitzvah'], night: ['mitzvah', 'wedding'], fresh: ['brit'], henna: ['henna'],
  party: ['birthday'], minimal: ['business', 'wedding'], rosegold: ['wedding', 'mitzvah'], olive: ['wedding'],
  royal: ['wedding', 'birthday'], ocean: ['brit', 'birthday'], boho: ['wedding'], marble: ['wedding', 'business'],
  kids: ['birthday', 'brit'], lavender: ['mitzvah', 'wedding'], artdeco: ['birthday', 'wedding'], watercolor: ['mitzvah', 'birthday'],
  jerusalem: ['mitzvah', 'wedding', 'jerusalem'], tropical: ['birthday'], sky: ['brit'], corporate: ['business'], neon: ['birthday']
};

Object.entries(DESIGNS).forEach(([key, d]) => {
  THEMES[key] = d.name;
  THEME_TAGS[key] = [...d.tags, 'new'];
});

const THEME_CATEGORIES = {
  all: 'הכל', new: 'חדשים ✨', wedding: 'חתונה', mitzvah: 'בר/בת מצווה', brit: 'ברית', henna: 'חינה',
  birthday: 'ימי הולדת', jerusalem: 'ירושלים', business: 'עסקי'
};

// עיצוב ברירת מחדל לכל סוג אירוע – מהעיצובים המאוירים
Object.assign(EVENT_TYPES.wedding.defaults, { th: 'goldfloral' });
Object.assign(EVENT_TYPES.henna.defaults, { th: 'hennamandala' });
Object.assign(EVENT_TYPES.bar.defaults, { th: 'navydeco' });
Object.assign(EVENT_TYPES.bat.defaults, { th: 'butterflies' });
Object.assign(EVENT_TYPES.brit.defaults, { th: 'woodland' });
Object.assign(EVENT_TYPES.birthday.defaults, { th: 'balloonsnavy' });
