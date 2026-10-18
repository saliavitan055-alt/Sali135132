// ===== עמוד האורח: הצגת ההזמנה, ספירה לאחור, ניווט, יומן ואישור הגעה =====

const params = new URLSearchParams(location.hash.slice(1));
const data = params.get('d') ? decodeInvite(params.get('d')) : null;
const guestName = params.get('g') || '';

if (!data) {
  document.getElementById('envelope').hidden = true;
  document.getElementById('invalid').hidden = false;
} else {
  initInvite();
}

function initInvite() {
  const type = EVENT_TYPES[data.t] || EVENT_TYPES.other;
  document.title = `הזמנה ל${type.label} – ${data.n || ''}`;
  document.body.classList.add(`theme-${data.th || 'gold'}-page`);
  document.getElementById('env-to').textContent = guestName ? `${guestName}, הוזמנתם!` : 'הוזמנתם!';

  renderCard(document.getElementById('card'), data, guestName);

  document.getElementById('open-envelope').addEventListener('click', () => {
    const screen = document.getElementById('envelope');
    screen.classList.add('opening');
    document.getElementById('guest-main').hidden = false;
    setTimeout(() => { screen.hidden = true; }, 900);
  });

  // ניווט
  const place = [data.v, data.a].filter(Boolean).join(', ');
  if (place) {
    document.getElementById('nav-waze').href = `https://waze.com/ul?q=${encodeURIComponent(data.a || data.v)}&navigate=yes`;
    document.getElementById('nav-maps').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  } else {
    document.getElementById('nav-waze').hidden = true;
    document.getElementById('nav-maps').hidden = true;
  }

  // יומן
  if (eventDate(data)) {
    document.getElementById('cal-google').href = googleCalendarUrl(data);
    document.getElementById('cal-ics').addEventListener('click', () => downloadIcs(data));
  } else {
    document.getElementById('cal-google').hidden = true;
    document.getElementById('cal-ics').hidden = true;
  }

  startCountdown();
  initRsvp(type);
}

function startCountdown() {
  const el = document.getElementById('countdown');
  const target = eventDate(data);
  if (!target) { el.hidden = true; return; }

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      el.innerHTML = `<p class="countdown-done">${diff > -12 * 3600 * 1000 ? 'האירוע מתקיים היום! 🎉' : 'האירוע כבר התקיים – תודה שהייתם איתנו 💛'}</p>`;
      clearInterval(timer);
      return;
    }
    const units = [
      [Math.floor(diff / 86400000), 'ימים'],
      [Math.floor(diff / 3600000) % 24, 'שעות'],
      [Math.floor(diff / 60000) % 60, 'דקות'],
      [Math.floor(diff / 1000) % 60, 'שניות']
    ];
    el.innerHTML = units.map(([n, label]) => `<div class="cd-unit"><b>${n}</b><span>${label}</span></div>`).join('');
  };
  const timer = setInterval(tick, 1000);
  tick();
}

function initRsvp(type) {
  const section = document.getElementById('rsvp');
  if (!data.p) { section.hidden = true; return; }

  const form = document.getElementById('rsvp-form');
  const countInput = form.elements.count;
  form.elements.name.value = guestName;

  form.addEventListener('change', () => {
    document.getElementById('count-field').hidden = form.elements.answer.value === 'no';
  });

  form.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      countInput.value = Math.min(20, Math.max(1, Number(countInput.value || 1) + Number(btn.dataset.step)));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const answer = form.elements.answer.value;
    const name = form.elements.name.value.trim();
    const lines = {
      yes: `✅ ${name} – מגיעים ל${type.label}! מספר מגיעים: ${countInput.value}`,
      maybe: `🤔 ${name} – עדיין לא בטוחים לגבי ה${type.label}. מספר משוער: ${countInput.value}`,
      no: `❌ ${name} – לצערנו לא נוכל להגיע ל${type.label}`
    };
    const note = form.elements.note.value.trim();
    window.open(waUrl(data.p, lines[answer] + (note ? `\n${note}` : '')), '_blank', 'noopener');
  });
}
