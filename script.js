// ===== הגדרות העסק – לשנות כאן בלבד =====
const CONFIG = {
  phoneDisplay: '054-4411991',
  phoneTel: '0544411991',
  whatsapp: '972544411991', // פורמט בינלאומי, בלי + ובלי 0 בהתחלה
  whatsappGreeting: 'שלום קרש קאר, אני מעוניין למכור רכב אחרי תאונה. אשמח להצעת מחיר.'
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
    errorBox.textContent = missing.length ? 'נא למלא את כל השדות' : 'מספר הטלפון אינו תקין';
    errorBox.hidden = false;
    (missing[0] || form.phone).focus();
    return;
  }

  const d = Object.fromEntries(new FormData(form));
  const message = [
    '🚗 *בקשה להצעת מחיר – קרש קאר*',
    `שם: ${d.name}`,
    `טלפון: ${d.phone}`,
    `יצרן ודגם: ${d.car}`,
    `שנת ייצור: ${d.year}`,
    '',
    '(מצרף/ת תמונות של הרכב 👇)'
  ].join('\n');

  const url = waUrl(message);
  document.getElementById('success-whatsapp').href = url;
  window.open(url, '_blank', 'noopener');

  form.hidden = true;
  document.getElementById('form-success').hidden = false;
});

form.addEventListener('input', (e) => e.target.classList.remove('invalid'));

// סימון הקישור הפעיל בתפריט לפי הגלילה
const navLinks = [...nav.querySelectorAll('a')];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const setActive = () => {
  const y = window.scrollY + 120;
  let current = sections[0];
  sections.forEach((sec) => { if (sec.offsetTop <= y) current = sec; });
  navLinks.forEach((a) => a.classList.toggle('active', document.querySelector(a.getAttribute('href')) === current));
};
window.addEventListener('scroll', setActive, { passive: true });
setActive();
