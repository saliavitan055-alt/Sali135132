// ===== עמוד האורח: הצגת ההזמנה, ספירה לאחור, ניווט, יומן ואישור הגעה =====

const params = new URLSearchParams(location.hash.slice(1));
const data = params.get('d') ? decodeInvite(params.get('d')) : null;
const guestName = params.get('g') || '';
const guestId = params.get('gi') || '';

if (!data) {
  document.getElementById('envelope').hidden = true;
  document.getElementById('invalid').hidden = false;
} else {
  initInvite();
}

function initInvite() {
  const type = EVENT_TYPES[data.t] || EVENT_TYPES.other;
  document.title = `הזמנה ל${type.label} – ${data.n || ''}`;
  document.body.classList.add(`theme-${THEMES[data.th] ? data.th : 'gold'}`);
  document.getElementById('env-to').textContent = guestName ? `${guestName}, הוזמנתם!` : 'הוזמנתם!';

  renderCard(document.getElementById('card'), data, guestName, { intro: true });

  document.getElementById('open-envelope').addEventListener('click', () => {
    startMusic();
    startEffect(document.body, data.fx);
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

// המנגינה מתחילה בלחיצה על המעטפה – דפדפנים לא מאפשרים צליל לפני שהמשתמש לחץ על משהו
function startMusic() {
  const hasMusic = data.mu && (MUSIC[data.mu] || (data.mu === 'custom' && data.mx));
  if (!hasMusic) return;
  const player = new MusicPlayer();
  const toggle = document.getElementById('sound-toggle');
  const play = () => player.play(data.mu, data.mu === 'custom' ? data.mx : '');
  const sync = () => {
    toggle.textContent = player.playing ? '🔊' : '🔇';
    toggle.setAttribute('aria-label', player.playing ? 'השתקת המנגינה' : 'הפעלת המנגינה');
  };
  play().then(sync);
  toggle.hidden = false;
  sync();
  toggle.addEventListener('click', () => {
    if (player.playing) { player.stop(); sync(); } else play().then(sync);
    sync();
  });
  // עוצרים כשהאורח עובר לאפליקציה אחרת (למשל וויז או וואטסאפ)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && player.playing) { player.stop(); sync(); }
  });
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
  if (!data.p && !data.r) { section.hidden = true; return; }

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

  const whatsappText = () => {
    const answer = form.elements.answer.value;
    const name = form.elements.name.value.trim();
    const lines = {
      yes: `✅ ${name} – מגיעים ל${type.label}! מספר מגיעים: ${countInput.value}`,
      maybe: `🤔 ${name} – עדיין לא בטוחים לגבי ה${type.label}. מספר משוער: ${countInput.value}`,
      no: `❌ ${name} – לצערנו לא נוכל להגיע ל${type.label}`
    };
    const note = form.elements.note.value.trim();
    return lines[answer] + (note ? `\n${note}` : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!data.r) {
      window.open(waUrl(data.p, whatsappText()), '_blank', 'noopener');
      return;
    }

    // שמירה בגיליון של בעלי האירוע – מתעדכן אצלם ברשימה אוטומטית
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'שולחים...';
    try {
      await fetch(data.r, {
        method: 'POST',
        mode: 'no-cors', // Apps Script לא מחזיר CORS ל-POST; הבקשה עדיין נשמרת
        body: JSON.stringify({
          event: data.id,
          gid: guestId,
          name: form.elements.name.value.trim(),
          answer: form.elements.answer.value,
          count: form.elements.answer.value === 'no' ? 0 : Number(countInput.value),
          note: form.elements.note.value.trim()
        })
      });
      showThanks();
    } catch (err) {
      button.disabled = false;
      button.textContent = 'אישור הגעה';
      alert(data.p ? 'השליחה נכשלה. אפשר לנסות שוב או לשלוח בוואטסאפ.' : 'השליחה נכשלה. בדקו את החיבור לאינטרנט ונסו שוב.');
    }
  });

  if (data.r) form.querySelector('[type="submit"]').textContent = 'אישור הגעה';
  if (data.r && data.p) {
    const wa = document.createElement('a');
    wa.className = 'rsvp-alt';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.textContent = 'או שלחו את התשובה בוואטסאפ';
    wa.href = '#';
    wa.addEventListener('click', () => { wa.href = waUrl(data.p, whatsappText()); });
    form.appendChild(wa);
  }

  function showThanks() {
    const answer = form.elements.answer.value;
    const messages = {
      yes: 'תודה! אישור ההגעה התקבל. מחכים לראותכם 🎉',
      maybe: 'תודה! עדכנו אותנו כשתדעו – אפשר לחזור לקישור הזה בכל זמן.',
      no: 'תודה שעדכנתם. נתגעגע! 💛'
    };
    form.hidden = true;
    const box = document.createElement('div');
    box.className = 'rsvp-thanks';
    box.innerHTML = `<p>${messages[answer]}</p><button type="button" class="btn btn-ghost">שינוי תשובה</button>`;
    box.querySelector('button').addEventListener('click', () => {
      box.remove();
      form.hidden = false;
      const button = form.querySelector('[type="submit"]');
      button.disabled = false;
      button.textContent = 'אישור הגעה';
    });
    section.appendChild(box);
  }
}
