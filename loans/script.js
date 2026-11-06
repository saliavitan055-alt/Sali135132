// ===== הגדרות – לעדכן לפני העלייה לאוויר =====
const CONFIG = {
  annualRate: 9.9,          // ריבית שנתית להמחשה במחשבון (%)
  // כתובת שרת (HTTPS) שמקבל את הבקשות. כל עוד ריק – הטופס במצב הדגמה ולא נשלח לשום מקום.
  submitUrl: '',
};

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('he-IL');

// ===== מחשבון =====
const amount = $('amount');
const months = $('months');
$('rateOut').textContent = CONFIG.annualRate;

function paintRange(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--fill', pct + '%');
}

function updateCalc() {
  const P = +amount.value;
  const n = +months.value;
  const r = CONFIG.annualRate / 100 / 12;
  const monthly = r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
  $('amountOut').textContent = fmt(P) + ' ₪';
  $('monthsOut').textContent = n + ' חודשים';
  $('monthlyOut').textContent = fmt(monthly) + ' ₪';
  $('totalOut').textContent = fmt(monthly * n) + ' ₪';
  $('chosenAmount').textContent = fmt(P);
  $('chosenMonths').textContent = n;
  paintRange(amount);
  paintRange(months);
}
amount.addEventListener('input', updateCalc);
months.addEventListener('input', updateCalc);
updateCalc();

// ===== מעבר לטופס =====
$('startBtn').addEventListener('click', () => {
  $('apply').hidden = false;
  $('apply').scrollIntoView({ behavior: 'smooth' });
});

// ===== מסלולי מימון – ממלאים את המחשבון =====
document.querySelectorAll('[data-amount]').forEach((a) =>
  a.addEventListener('click', () => {
    amount.value = a.dataset.amount;
    months.value = a.dataset.months;
    updateCalc();
  })
);

// ===== תפריט נייד =====
const nav = $('nav');
$('menuBtn').addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  $('menuBtn').setAttribute('aria-expanded', open);
});
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') nav.classList.remove('open');
});

// ===== ניקוי קלט =====
$('idNumber').addEventListener('input', (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9)));
$('income').addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
  e.target.value = digits ? (+digits).toLocaleString('en-US') : '';
});
$('phone').addEventListener('input', (e) => (e.target.value = e.target.value.replace(/[^\d-\s]/g, '')));
// הסרת סימון שגיאה ברגע שמתקנים
document.querySelectorAll('#loanForm input, #loanForm select').forEach((el) =>
  el.addEventListener('input', () => {
    el.classList.remove('invalid');
    el.closest('.toggle')?.classList.remove('invalid');
  })
);

// ===== אימות =====
// בדיקת ספרת ביקורת של ת"ז ישראלית
function isValidIsraeliId(id) {
  id = String(id).trim();
  if (!/^\d{5,9}$/.test(id)) return false;
  id = id.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = +id[i] * ((i % 2) + 1);
    sum += d > 9 ? d - 9 : d;
  }
  return sum % 10 === 0;
}

const rules = {
  firstName: (v) => v.trim().length >= 2 || 'נא למלא שם פרטי',
  lastName: (v) => v.trim().length >= 2 || 'נא למלא שם משפחה',
  idNumber: (v) => isValidIsraeliId(v) || 'מספר תעודת הזהות אינו תקין',
  phone: (v) => /^05\d{8}$/.test(v.replace(/[-\s]/g, '')) || 'נא למלא מספר נייד תקין',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'נא למלא אימייל תקין',
  city: (v) => v.trim().length >= 2 || 'נא למלא עיר',
  street: (v) => v.trim().length >= 2 || 'נא למלא רחוב ומספר',
  bank: (v) => !!v || 'נא לבחור בנק',
  employment: (v) => !!v || 'נא לבחור מצב תעסוקתי',
  income: (v) => /^\d{3,7}$/.test(v.replace(/[,\s]/g, '')) || 'נא למלא הכנסה חודשית במספרים',
};

const form = $('loanForm');
const errorEl = $('formError');

function validateStep(step) {
  const fs = form.querySelector(`.step[data-step="${step}"]`);
  let firstError = '';
  fs.querySelectorAll('input, select').forEach((el) => {
    let res = true;
    if (rules[el.name]) res = rules[el.name](el.value);
    else if (el.type === 'radio' && el.required) {
      const ok = !!form.querySelector(`input[name="${el.name}"]:checked`);
      el.closest('.toggle').classList.toggle('invalid', !ok);
      res = ok || 'נא לענות על כל השאלות';
    } else if (el.type === 'checkbox' && el.required) {
      res = el.checked || 'נא לאשר את התנאים';
    }
    if (el.type !== 'radio') el.classList.toggle('invalid', res !== true);
    if (res !== true && !firstError) firstError = res;
  });
  errorEl.textContent = firstError;
  if (firstError) fs.querySelector('.invalid input, input.invalid, select.invalid')?.focus();
  return !firstError;
}

// ===== שלבים =====
let current = 1;
function showStep(n) {
  current = n;
  form.querySelectorAll('.step').forEach((fs) => (fs.hidden = +fs.dataset.step !== n));
  document.querySelectorAll('.step-dot').forEach((d) => {
    const s = +d.dataset.step;
    d.classList.toggle('active', s === n);
    d.classList.toggle('done', s < n);
  });
  errorEl.textContent = '';
  if (n === 3) buildReview();
  $('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const first = form.querySelector(`.step[data-step="${n}"] input, .step[data-step="${n}"] select`);
  if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
}
form.addEventListener('click', (e) => {
  if (e.target.classList.contains('next') && validateStep(current)) showStep(current + 1);
  if (e.target.classList.contains('prev')) showStep(current - 1);
});

form.querySelectorAll('input[name="bouncedChecks"]').forEach((r) =>
  r.addEventListener('change', () => ($('bouncedMore').hidden = r.value !== 'כן' || !r.checked))
);

function getData() {
  const d = Object.fromEntries(new FormData(form));
  if (d.bouncedChecks !== 'כן') delete d.bouncedCount;
  if (d.income) d.income = d.income.replace(/\D/g, '');
  d.amount = +amount.value;
  d.months = +months.value;
  return d;
}

function buildReview() {
  const d = getData();
  const maskedId = '*****' + d.idNumber.slice(-4);
  const rows = [
    ['סכום', fmt(d.amount) + ' ₪'],
    ['תקופה', d.months + ' חודשים'],
    ['שם', d.firstName + ' ' + d.lastName],
    ['ת"ז', maskedId],
    ['טלפון', d.phone],
    ['כתובת', d.street + ', ' + d.city],
    ['בנק', d.bank],
    ['הכנסה חודשית', fmt(+d.income) + ' ₪'],
    ["צ'קים חוזרים (3 שנים)", d.bouncedChecks + (d.bouncedCount ? ` (${d.bouncedCount})` : '')],
    ['חשבון מוגבל', d.restricted],
  ];
  const box = $('review');
  box.replaceChildren(
    ...rows.map(([k, v]) => {
      const row = document.createElement('div');
      const a = document.createElement('span');
      const b = document.createElement('b');
      a.textContent = k;
      b.textContent = v;
      row.append(a, b);
      return row;
    })
  );
}

// ===== שליחה =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (current !== 3) {
    if (validateStep(current)) showStep(current + 1);
    return;
  }
  if (!validateStep(3)) return;
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'שולח...';
  try {
    if (CONFIG.submitUrl) {
      const res = await fetch(CONFIG.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getData()),
      });
      if (!res.ok) throw new Error('bad status');
    } else {
      console.warn('מצב הדגמה: CONFIG.submitUrl ריק – הבקשה לא נשלחה.');
    }
    form.hidden = true;
    document.querySelector('.steps-bar').hidden = true;
    document.querySelector('.chosen').hidden = true;
    $('refNo').textContent = Date.now().toString().slice(-7);
    $('done').hidden = false;
    $('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {
    errorEl.textContent = 'אירעה שגיאה בשליחה. נסו שוב או התקשרו אלינו.';
    btn.disabled = false;
    btn.textContent = 'שליחת הבקשה';
  }
});

// ===== תפריט פעיל לפי גלילה =====
const navLinks = [...nav.querySelectorAll('a')];
const spy = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }),
  { rootMargin: '-45% 0px -50% 0px' }
);
['top', 'how', 'tracks', 'faq', 'contact'].forEach((id) => $(id) && spy.observe($(id)));

// ===== הצל בכותרת בזמן גלילה =====
const topbar = document.querySelector('.topbar');
addEventListener('scroll', () => topbar.classList.toggle('scrolled', scrollY > 10), { passive: true });

// ===== אנימציית כניסה =====
const reveal = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

// ===== חלונות תנאי שימוש / פרטיות =====
document.querySelectorAll('[data-modal]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    $(a.dataset.modal).showModal();
  })
);
document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.classList.contains('modal-close')) d.close();
  })
);

$('year').textContent = new Date().getFullYear();
