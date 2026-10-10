// ===== הגדרות העסק – לשנות כאן בלבד =====
const CONFIG = {
  phoneDisplay: '054-4411991',
  phoneTel: '0544411991',
  whatsapp: '972544411991', // פורמט בינלאומי, בלי + ובלי 0 בהתחלה
  whatsappGreeting: 'שלום, אני מעוניין למכור רכב אחרי תאונה. אשמח להצעת מחיר.'
};

const waUrl = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

// טלפון ווואטסאפ בכל הקישורים בעמוד
document.querySelectorAll('[data-phone-link]').forEach((a) => { a.href = `tel:${CONFIG.phoneTel}`; });
document.querySelectorAll('[data-phone-text]').forEach((el) => { el.textContent = CONFIG.phoneDisplay; });
document.querySelectorAll('[data-whatsapp-link]').forEach((a) => { a.href = waUrl(CONFIG.whatsappGreeting); });

document.getElementById('year').textContent = new Date().getFullYear();

// שנות ייצור
const yearSelect = document.getElementById('year-select');
const thisYear = new Date().getFullYear();
for (let y = thisYear + 1; y >= 1990; y--) {
  yearSelect.add(new Option(y, y));
}

// תפריט מובייל
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

// טופס הצעת מחיר -> הודעת וואטסאפ מוכנה
const form = document.getElementById('offer-form');
const errorBox = document.getElementById('form-error');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));

  const missing = [...form.querySelectorAll('[required]')].filter((el) => !el.value.trim());
  missing.forEach((el) => el.classList.add('invalid'));

  const phone = form.phone.value.replace(/[^\d]/g, '');
  const phoneOk = /^0\d{8,9}$/.test(phone) || /^972\d{8,9}$/.test(phone);
  if (form.phone.value.trim() && !phoneOk) form.phone.classList.add('invalid');

  if (missing.length || !phoneOk) {
    errorBox.textContent = missing.length ? 'נא למלא את כל שדות החובה המסומנים' : 'מספר הטלפון אינו תקין';
    errorBox.hidden = false;
    (missing[0] || form.phone).focus();
    return;
  }

  const d = Object.fromEntries(new FormData(form));
  const lines = [
    '🚗 *בקשה להצעת מחיר לרכב*',
    `יצרן: ${d.make}`,
    `דגם: ${d.model}`,
    `שנה: ${d.year}`,
    d.km ? `קילומטראז': ${Number(d.km).toLocaleString('he-IL')}` : null,
    `סוג נזק: ${d.damage}`,
    `נוסע: ${d.drivable}`,
    `אזור: ${d.city}`,
    `שם: ${d.name}`,
    `טלפון: ${d.phone}`,
    d.notes ? `הערות: ${d.notes}` : null,
    '',
    '(מצרף/ת תמונות של הרכב 👇)'
  ].filter((l) => l !== null);

  const url = waUrl(lines.join('\n'));
  document.getElementById('success-whatsapp').href = url;
  window.open(url, '_blank', 'noopener');

  form.hidden = true;
  document.getElementById('form-success').hidden = false;
});

form.addEventListener('input', (e) => e.target.classList.remove('invalid'));

// אנימציית מספרים
const counters = document.querySelectorAll('[data-count]');
const animate = (el) => {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || '+';
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / 1500, 1);
    el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('he-IL') + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.5 });
  counters.forEach((c) => io.observe(c));
} else {
  counters.forEach(animate);
}
