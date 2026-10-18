// ===== קוד משותף: סוגי אירועים, עיצובים, קידוד קישור ורינדור ההזמנה =====

const EVENT_TYPES = {
  wedding:  { label: 'חתונה',       icon: '💍', headline: 'בשמחה רבה אנו מזמינים אתכם לחגוג איתנו את חתונתם של', defaults: { th: 'gold' } },
  henna:    { label: 'חינה',        icon: '🌺', headline: 'בשמחה ובהתרגשות נשמח לראותכם בחינה של', defaults: { th: 'henna' } },
  bar:      { label: 'בר מצווה',    icon: '📜', headline: 'בשמחה רבה נשמח לראותכם בבר המצווה של בננו', defaults: { th: 'night' } },
  bat:      { label: 'בת מצווה',    icon: '🎀', headline: 'בשמחה רבה נשמח לראותכם בבת המצווה של בתנו', defaults: { th: 'floral' } },
  brit:     { label: 'ברית / בריתה', icon: '👶', headline: 'בשמחה ובהודיה לה׳ נשמח לראותכם בברית של בננו', defaults: { th: 'fresh' } },
  birthday: { label: 'יום הולדת',   icon: '🎂', headline: 'בואו לחגוג איתנו את יום ההולדת של', defaults: { th: 'party' } },
  business: { label: 'אירוע עסקי',  icon: '💼', headline: 'אנו שמחים להזמינכם לאירוע', defaults: { th: 'minimal' } },
  other:    { label: 'אירוע אחר',   icon: '🎉', headline: 'נשמח לראותכם באירוע של', defaults: { th: 'party' } }
};

const THEMES = {
  gold:    'זהב קלאסי',
  floral:  'פרחוני ורוד',
  night:   'כחול לילה',
  fresh:   'מנטה רענן',
  henna:   'חינה',
  party:   'מסיבה צבעונית',
  minimal: 'מינימליסטי',
  rosegold: 'רוז גולד',
  olive:   'זית בוטני',
  royal:   'שחור וזהב',
  ocean:   'ים כחול',
  boho:    'בוהו טרקוטה',
  marble:  'שיש לבן',
  kids:    'בלונים לילדים',
  lavender: 'לבנדר',
  artdeco: 'ארט דקו',
  watercolor: 'צבעי מים',
  jerusalem: 'אבן ירושלמית',
  tropical: 'טרופי',
  sky:     'שמיים ועננים',
  corporate: 'עסקי כחול',
  neon:    'ניאון'
};

// אפקטים מונפשים מעל ההזמנה
const EFFECTS = {
  none:     { label: 'ללא' },
  petals:   { label: '🌸 עלי כותרת', items: ['🌸', '🌺', '🌸', '🏵️'], mode: 'fall' },
  hearts:   { label: '💗 לבבות', items: ['💗', '💖', '🤍', '💕'], mode: 'rise' },
  confetti: { label: '🎊 קונפטי', colors: ['#ff6fa8', '#ffd34d', '#4dd6ff', '#8fe36b', '#8a3ffc'], mode: 'fall' },
  sparkles: { label: '✨ נצנצים', items: ['✨', '⭐', '✨'], mode: 'twinkle' },
  balloons: { label: '🎈 בלונים', items: ['🎈', '🎈', '🎉'], mode: 'rise' },
  snow:     { label: '❄️ פתיתים לבנים', colors: ['#ffffff'], mode: 'fall', round: true }
};

function startEffect(container, kind) {
  container.querySelectorAll('.fx').forEach((el) => el.remove());
  const fx = EFFECTS[kind];
  if (!fx || !fx.mode || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = `fx fx-${fx.mode}`;
  layer.setAttribute('aria-hidden', 'true');
  const count = fx.mode === 'twinkle' ? 12 : 14;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const r = (min, max) => (min + Math.random() * (max - min)).toFixed(2);
    p.style.cssText = `left:${r(0, 96)}%;top:${fx.mode === 'twinkle' ? r(2, 94) + '%' : ''};animation-duration:${r(6, 12)}s;animation-delay:-${r(0, 12)}s;font-size:${r(12, 22)}px;--drift:${r(-40, 40)}px`;
    if (fx.items) {
      p.textContent = fx.items[i % fx.items.length];
    } else {
      p.className = fx.round ? 'dot round' : 'dot';
      p.style.background = fx.colors[i % fx.colors.length];
    }
    layer.appendChild(p);
  }
  container.appendChild(layer);
}

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// --- קידוד נתוני ההזמנה לתוך הקישור (base64url של JSON ב-UTF-8) ---
function encodeInvite(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeInvite(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    return null;
  }
}

// guest: { name, id } – קישור אישי למוזמן מהרשימה
function inviteUrl(data, guest) {
  const base = new URL('invite.html', location.href);
  const params = new URLSearchParams({ d: encodeInvite(data) });
  if (guest) {
    params.set('g', guest.name);
    params.set('gi', guest.id);
  }
  base.hash = params.toString();
  return base.toString();
}

// --- עזרים ---
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 054-1234567 -> 972541234567
function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '972' + digits.slice(1);
  return digits;
}

const waUrl = (phone, text) => `https://wa.me/${phone ? normalizePhone(phone) : ''}?text=${encodeURIComponent(text)}`;

function eventDate(data) {
  if (!data.d) return null;
  const [y, m, d] = data.d.split('-').map(Number);
  const [hh, mm] = (data.tm || '19:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function formatHebrewDate(data) {
  const date = eventDate(data);
  if (!date) return '';
  return `יום ${HE_DAYS[date.getDay()]}, ${date.getDate()} ב${HE_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// --- רינדור כרטיס ההזמנה ---
// שכבת הקישוט של עיצוב מאויר (designs.js), אם יש
function decorMarkup(theme) {
  const design = typeof DESIGNS !== 'undefined' && DESIGNS[theme];
  return design ? `<div class="card-decor" aria-hidden="true">${design.decor()}</div>` : '';
}

// opts.intro – מנגן את אנימציית הכניסה של ההזמנה
function renderCard(el, data, guestName, opts = {}) {
  const type = EVENT_TYPES[data.t] || EVENT_TYPES.other;
  const theme = THEMES[data.th] ? data.th : 'gold';
  const design = typeof DESIGNS !== 'undefined' && DESIGNS[theme];
  el.className = `invite-card theme-${theme}${design ? ' has-decor' : ''}${opts.intro ? ' intro' : ''}`;
  const icon = design && design.icon === 'star' ? starIcon()
    : design && design.icon === 'none' ? '' : `<div class="card-icon" aria-hidden="true">${type.icon}</div>`;

  const times = [];
  if (data.tm) times.push(`קבלת פנים: ${escapeHtml(data.tm)}`);
  if (data.ct) times.push(`${data.t === 'wedding' ? 'חופה וקידושין' : 'טקס'}: ${escapeHtml(data.ct)}`);

  el.innerHTML = `
    ${decorMarkup(theme)}
    <div class="card-ornament top" aria-hidden="true"></div>
    ${guestName ? `<p class="card-guest">לכבוד ${escapeHtml(guestName)}</p>` : ''}
    ${icon}
    <p class="card-headline">${escapeHtml(data.h || type.headline)}</p>
    <h2 class="card-names">${escapeHtml(data.n || 'שם בעלי השמחה')}</h2>
    ${data.s ? `<p class="card-sub">${escapeHtml(data.s)}</p>` : ''}
    <div class="card-divider" aria-hidden="true"><span></span></div>
    <p class="card-date">${escapeHtml(formatHebrewDate(data) || 'תאריך האירוע')}</p>
    ${times.length ? `<p class="card-times">${times.join(' &nbsp;|&nbsp; ')}</p>` : ''}
    ${data.v ? `<p class="card-venue">${escapeHtml(data.v)}</p>` : ''}
    ${data.a ? `<p class="card-address">${escapeHtml(data.a)}</p>` : ''}
    ${data.m ? `<p class="card-message">${escapeHtml(data.m)}</p>` : ''}
    ${data.f ? `<p class="card-family">${escapeHtml(data.f)}</p>` : ''}
    <div class="card-ornament bottom" aria-hidden="true"></div>
  `;
}

// --- לוח שנה ---
function pad(n) { return String(n).padStart(2, '0'); }
function icsStamp(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
}

function eventTitle(data) {
  const type = EVENT_TYPES[data.t] || EVENT_TYPES.other;
  return `${type.label} – ${data.n || ''}`.trim();
}

function googleCalendarUrl(data) {
  const start = eventDate(data);
  if (!start) return '';
  const end = new Date(start.getTime() + 4 * 3600 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(data),
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    location: [data.v, data.a].filter(Boolean).join(', '),
    details: data.m || ''
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function downloadIcs(data) {
  const start = eventDate(data);
  if (!start) return;
  const end = new Date(start.getTime() + 4 * 3600 * 1000);
  const esc = (s) => String(s || '').replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hazmana//HE', 'BEGIN:VEVENT',
    `UID:${Date.now()}@hazmana`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(eventTitle(data))}`,
    `LOCATION:${esc([data.v, data.a].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${esc(data.m)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(eventTitle(data))}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = 'event.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
