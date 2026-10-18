// ===== עורך ההזמנה + רשימת מוזמנים (נשמר ב-localStorage) =====

const STORE_KEY = 'hazmana.events';
const SETTINGS_KEY = 'hazmana.settings';
const form = document.getElementById('invite-form');
const preview = document.getElementById('preview');
const eventSelect = document.getElementById('event-select');

let events = loadEvents();
let current = events[0] || newEvent();
let settings = loadSettings();

function newEvent() {
  return { id: Date.now().toString(36), data: { t: 'wedding', th: 'gold', tm: '19:30' }, guests: [] };
}

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* מצב פרטי */ }
}

function saveEvents() {
  const i = events.findIndex((e) => e.id === current.id);
  if (i === -1) events.unshift(current); else events[i] = current;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(events)); } catch (e) { /* מצב פרטי – ממשיכים בלי שמירה */ }
  renderEventSelect();
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

// --- סוגי אירוע ועיצובים ---
const typeChips = document.getElementById('type-chips');
Object.entries(EVENT_TYPES).forEach(([key, type]) => {
  const label = document.createElement('label');
  label.className = 'chip';
  label.innerHTML = `<input type="radio" name="t" value="${key}"><span>${type.icon} ${type.label}</span>`;
  typeChips.appendChild(label);
});

const themePicker = document.getElementById('theme-picker');
Object.entries(THEMES).forEach(([key, name]) => {
  const label = document.createElement('label');
  label.className = 'theme-option';
  label.dataset.tags = (THEME_TAGS[key] || []).join(' ');
  label.innerHTML = `<input type="radio" name="th" value="${key}"><span class="swatch theme-${key}">${decorMarkup(key)}</span><span class="theme-name">${name}</span>`;
  themePicker.appendChild(label);
});

// סינון העיצובים לפי קטגוריה
const themeTabs = document.getElementById('theme-tabs');
const TYPE_TO_CATEGORY = { wedding: 'wedding', henna: 'henna', bar: 'mitzvah', bat: 'mitzvah', brit: 'brit', birthday: 'birthday', business: 'business' };
Object.entries(THEME_CATEGORIES).forEach(([key, label]) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-tab';
  btn.dataset.cat = key;
  btn.setAttribute('role', 'tab');
  btn.textContent = label;
  themeTabs.appendChild(btn);
});

function filterThemes(cat) {
  themeTabs.querySelectorAll('.theme-tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.cat === cat));
  themePicker.querySelectorAll('.theme-option').forEach((opt) => {
    opt.hidden = cat !== 'all' && !opt.dataset.tags.split(' ').includes(cat);
  });
}

themeTabs.addEventListener('click', (e) => {
  if (e.target.dataset.cat) filterThemes(e.target.dataset.cat);
});

const fxChips = document.getElementById('fx-chips');
Object.entries(EFFECTS).forEach(([key, fx]) => {
  const label = document.createElement('label');
  label.className = 'chip';
  label.innerHTML = `<input type="radio" name="fx" value="${key}"><span>${fx.label}</span>`;
  fxChips.appendChild(label);
});

const musicSelect = form.elements.mu;
musicSelect.add(new Option('ללא מנגינה', ''));
Object.entries(MUSIC).forEach(([key, song]) => musicSelect.add(new Option(`♪ ${song.label}`, key)));
musicSelect.add(new Option('🔗 שיר משלכם (קישור MP3)', 'custom'));

// --- מנגינה בתצוגה המקדימה ---
const player = new MusicPlayer();
const musicBtn = document.getElementById('music-preview');

function setMusicButton(playing) {
  musicBtn.textContent = playing ? '■ עצירה' : '▶ השמעה';
  musicBtn.setAttribute('aria-pressed', playing);
}

function playPreview() {
  const id = musicSelect.value;
  if (!id) { player.stop(); setMusicButton(false); return; }
  const url = id === 'custom' ? form.elements.mx.value.trim() : '';
  if (id === 'custom' && !url) { toast('הדביקו קישור לקובץ MP3'); return; }
  player.play(id, url).then(() => setMusicButton(player.playing));
  setMusicButton(true);
}

musicBtn.addEventListener('click', () => {
  if (player.playing) { player.stop(); setMusicButton(false); } else playPreview();
});

// --- סנכרון טופס <-> נתונים ---
function fillForm(data) {
  form.reset();
  Object.entries(data).forEach(([k, v]) => {
    if (form.elements[k]) form.elements[k].value = v;
  });
  syncTypeUi();
}

function readForm() {
  const data = {};
  new FormData(form).forEach((v, k) => { if (String(v).trim()) data[k] = String(v).trim(); });
  return data;
}

function syncTypeUi() {
  const type = EVENT_TYPES[form.elements.t.value] || EVENT_TYPES.other;
  form.elements.h.placeholder = type.headline;
  document.getElementById('custom-music-field').hidden = musicSelect.value !== 'custom';
  document.getElementById('ct-label').textContent = form.elements.t.value === 'wedding' ? 'חופה' : 'תחילת הטקס';
}

let previewTheme = null;

function updatePreview() {
  // id – לזיהוי האירוע בגיליון; r – כתובת הגיליון שאליה האורחים שולחים אישור
  current.data = { ...readForm(), id: current.id };
  if (current.data.fx === 'none') delete current.data.fx;
  if (current.data.mu !== 'custom') delete current.data.mx;
  if (settings.url) current.data.r = settings.url;
  // אנימציית הכניסה רק כשמחליפים עיצוב, לא בכל הקלדה
  const intro = previewTheme !== null && previewTheme !== current.data.th;
  previewTheme = current.data.th;
  renderCard(preview, current.data, '', { intro });
}

form.addEventListener('input', updatePreview);
form.addEventListener('change', (e) => {
  if (e.target.name === 't') {
    syncTypeUi();
    // מחליפים עיצוב אוטומטית רק אם המשתמש עדיין על עיצוב ברירת המחדל של הסוג הקודם
    const prevTheme = (EVENT_TYPES[form.dataset.prevType] || {}).defaults?.th;
    if (!form.elements.th.value || form.elements.th.value === prevTheme) {
      form.elements.th.value = EVENT_TYPES[e.target.value].defaults.th;
    }
    form.dataset.prevType = e.target.value;
    filterThemes(TYPE_TO_CATEGORY[e.target.value] || 'all');
  }
  if (e.target.name === 'fx') startEffect(document.querySelector('.phone-frame'), e.target.value);
  if (e.target.name === 'mu') {
    syncTypeUi();
    if (player.playing || e.target.value) playPreview();
  }
  updatePreview();
});

// --- יצירת קישור ושיתוף ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  updatePreview();
  saveEvents();
  const url = inviteUrl(current.data);
  document.getElementById('share-link').value = url;
  document.getElementById('open-invite').href = url;
  document.getElementById('share-wa').href = waUrl('', shareText(url));
  const box = document.getElementById('share-box');
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('ההזמנה נשמרה – הקישור מוכן');
});

function shareText(url, guestName) {
  const type = EVENT_TYPES[current.data.t] || EVENT_TYPES.other;
  const hello = guestName ? `${guestName} שלום,\n` : '';
  return `${hello}אתם מוזמנים ל${type.label} של ${current.data.n || ''} ${type.icon}\n${formatHebrewDate(current.data)}\nלהזמנה ולאישור הגעה:\n${url}`;
}

function pendingReminderText(guest) {
  const type = EVENT_TYPES[current.data.t] || EVENT_TYPES.other;
  return `${guest.name} שלום 🙂\nרק מזכירים שנשמח לדעת אם תגיעו ל${type.label} של ${current.data.n || ''} (${formatHebrewDate(current.data)}).\nלאישור הגעה בלחיצה:\n${inviteUrl(current.data, guest)}`;
}

function comingReminderText(guest) {
  const type = EVENT_TYPES[current.data.t] || EVENT_TYPES.other;
  const days = daysUntilEvent();
  const when = days === 0 ? 'היום' : days === 1 ? 'מחר' : `ב${formatHebrewDate(current.data)}`;
  const time = current.data.tm ? ` בשעה ${current.data.tm}` : '';
  const venue = current.data.v ? ` ב${current.data.v}` : '';
  const nav = current.data.a ? `\nניווט בוויז: https://waze.com/ul?q=${encodeURIComponent(current.data.a)}&navigate=yes` : '';
  return `${guest.name} שלום!\nמחכים לראותכם ${when}${time}${venue} ${type.icon}${nav}\nלפרטי ההזמנה:\n${inviteUrl(current.data, guest)}`;
}

function daysUntilEvent() {
  const date = eventDate(current.data);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return Math.round((day - today) / 86400000);
}

function requireEventDetails() {
  updatePreview();
  if (current.data.n && current.data.d) return true;
  toast('נא למלא שמות ותאריך לפני השליחה');
  form.reportValidity();
  return false;
}

document.getElementById('copy-link').addEventListener('click', async () => {
  const input = document.getElementById('share-link');
  try { await navigator.clipboard.writeText(input.value); } catch (e) { input.select(); document.execCommand('copy'); }
  toast('הקישור הועתק');
});

// --- האירועים שלי ---
function renderEventSelect() {
  eventSelect.innerHTML = '';
  const list = events.some((e) => e.id === current.id) ? events : [current, ...events];
  list.forEach((ev) => {
    const type = EVENT_TYPES[ev.data.t] || EVENT_TYPES.other;
    const label = ev.data.n ? `${type.icon} ${ev.data.n}` : `${type.icon} אירוע חדש`;
    eventSelect.add(new Option(label, ev.id, false, ev.id === current.id));
  });
}

eventSelect.addEventListener('change', () => {
  current = events.find((e) => e.id === eventSelect.value) || current;
  loadCurrent();
});

document.getElementById('new-event').addEventListener('click', () => {
  current = newEvent();
  loadCurrent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function loadCurrent() {
  player.stop();
  setMusicButton(false);
  fillForm(current.data);
  if (!current.data.fx) form.elements.fx.value = 'none';
  filterThemes(TYPE_TO_CATEGORY[current.data.t] || 'all');
  startEffect(document.querySelector('.phone-frame'), current.data.fx);
  form.dataset.prevType = current.data.t;
  document.getElementById('share-box').hidden = true;
  updatePreview();
  renderEventSelect();
  renderGuests();
  syncNow();
}

// --- רשימת מוזמנים ---
const STATUS = { pending: 'ממתין לתשובה', yes: 'מגיע/ה', maybe: 'אולי', no: 'לא מגיע/ה' };
const rows = document.getElementById('guest-rows');

function addGuest(name, phone) {
  name = String(name || '').trim();
  if (!name) return;
  current.guests.push({ id: Math.random().toString(36).slice(2, 9), name, phone: String(phone || '').trim(), status: 'pending', count: 1 });
}

document.getElementById('guest-form').addEventListener('submit', (e) => {
  e.preventDefault();
  addGuest(e.target.elements.name.value, e.target.elements.phone.value);
  e.target.reset();
  e.target.elements.name.focus();
  saveEvents();
  renderGuests();
});

document.getElementById('bulk-add').addEventListener('click', () => {
  const input = document.getElementById('bulk-input');
  const lines = input.value.split('\n').filter((l) => l.trim());
  lines.forEach((line) => {
    const [name, phone] = line.split(/[,\t;]/);
    addGuest(name, phone);
  });
  input.value = '';
  saveEvents();
  renderGuests();
  toast(`נוספו ${lines.length} מוזמנים`);
});

function renderGuests() {
  rows.innerHTML = '';
  current.guests.forEach((g) => {
    const tr = document.createElement('tr');
    tr.dataset.id = g.id;
    tr.className = `status-${g.status}`;
    tr.innerHTML = `
      <td data-label="שם"><span class="guest-name">${escapeHtml(g.name)}</span>${guestMeta(g)}</td>
      <td data-label="טלפון" dir="ltr">${escapeHtml(g.phone) || '—'}</td>
      <td data-label="סטטוס">
        <select data-field="status" aria-label="סטטוס">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === g.status ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </td>
      <td data-label="מגיעים"><input data-field="count" type="number" min="0" max="50" value="${g.count}" aria-label="מספר מגיעים"></td>
      <td class="row-actions">
        <button type="button" class="btn ${g.invitedAt ? 'btn-ghost' : 'btn-whatsapp'} btn-sm" data-action="send">${g.invitedAt ? 'שליחה שוב' : 'שליחה'}</button>
        <button type="button" class="btn-icon" data-action="delete" aria-label="מחיקה">✕</button>
      </td>`;
    rows.appendChild(tr);
  });
  document.getElementById('guests-empty').hidden = current.guests.length > 0;
  renderStats();
  renderReminders();
}

const shortDate = (t) => new Date(t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

function guestMeta(g) {
  const parts = [];
  if (g.auto) parts.push('<span class="meta-auto">⚡ אישר/ה בהזמנה</span>');
  if (g.remindedAt) parts.push(`🔔 תזכורת ${shortDate(g.remindedAt)}`);
  else if (g.invitedAt) parts.push(`✓ נשלח ${shortDate(g.invitedAt)}`);
  if (g.note) parts.push(`💬 ${escapeHtml(g.note)}`);
  return parts.length ? `<small class="guest-meta">${parts.join(' · ')}</small>` : '';
}

function renderStats() {
  const sum = (status) => current.guests.filter((g) => g.status === status).reduce((n, g) => n + Number(g.count || 0), 0);
  const pending = current.guests.filter((g) => g.status === 'pending').length;
  document.getElementById('stats').innerHTML = `
    <span class="stat stat-yes"><b>${sum('yes')}</b> מגיעים</span>
    <span class="stat stat-maybe"><b>${sum('maybe')}</b> אולי</span>
    <span class="stat stat-no"><b>${current.guests.filter((g) => g.status === 'no').length}</b> לא מגיעים</span>
    <span class="stat"><b>${pending}</b> ממתינים</span>`;
}

rows.addEventListener('change', (e) => {
  const tr = e.target.closest('tr');
  const guest = current.guests.find((g) => g.id === tr.dataset.id);
  if (!guest) return;
  guest[e.target.dataset.field] = e.target.dataset.field === 'count' ? Math.max(0, Number(e.target.value) || 0) : e.target.value;
  guest.rsvpAt = Date.now(); // עדכון ידני גובר על תשובות ישנות מהגיליון
  if (e.target.dataset.field === 'status') {
    tr.className = `status-${guest.status}`;
    if (guest.status === 'no') { guest.count = 0; tr.querySelector('[data-field="count"]').value = 0; }
  }
  saveEvents();
  renderStats();
  renderReminders();
});

rows.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const tr = btn.closest('tr');
  const guest = current.guests.find((g) => g.id === tr.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (!confirm(`למחוק את ${guest.name} מהרשימה?`)) return;
    current.guests = current.guests.filter((g) => g.id !== guest.id);
    saveEvents();
    renderGuests();
  } else if (btn.dataset.action === 'send') {
    if (!requireEventDetails()) return;
    window.open(waUrl(guest.phone, shareText(inviteUrl(current.data, guest), guest.name)), '_blank', 'noopener');
    guest.invitedAt = Date.now();
    saveEvents();
    renderGuests();
  }
});

// --- תזכורות: שולחים בוואטסאפ אחד אחרי השני ---
const REMINDERS = {
  unsent: {
    title: 'שליחת ההזמנה למי שעוד לא קיבל',
    list: () => current.guests.filter((g) => !g.invitedAt && g.status === 'pending'),
    text: (g) => shareText(inviteUrl(current.data, g), g.name),
    mark: (g) => { g.invitedAt = Date.now(); }
  },
  pending: {
    title: 'תזכורת למי שעוד לא ענה',
    list: () => current.guests.filter((g) => g.invitedAt && g.status === 'pending'),
    text: pendingReminderText,
    mark: (g) => { g.remindedAt = Date.now(); }
  },
  coming: {
    title: 'תזכורת לפני האירוע למגיעים',
    list: () => current.guests.filter((g) => g.status === 'yes' || g.status === 'maybe'),
    text: comingReminderText,
    mark: (g) => { g.dayBeforeAt = Date.now(); }
  }
};

const dialog = document.getElementById('remind-dialog');
let queue = null;

function renderReminders() {
  document.getElementById('unsent-count').textContent = REMINDERS.unsent.list().length;
  document.getElementById('pending-count').textContent = REMINDERS.pending.list().length;
  document.getElementById('coming-count').textContent = REMINDERS.coming.list().length;

  const tip = document.getElementById('reminder-tip');
  const days = daysUntilEvent();
  const pending = REMINDERS.pending.list().length;
  const coming = REMINDERS.coming.list().length;
  let text = '';
  if (days !== null && days >= 0 && days <= 2 && coming) {
    text = `${days === 0 ? 'האירוע היום' : days === 1 ? 'האירוע מחר' : 'האירוע בעוד יומיים'}! זה הזמן לשלוח למגיעים תזכורת עם ניווט.`;
  } else if (days !== null && days > 2 && days <= 21 && pending) {
    text = `נשארו ${days} ימים לאירוע ו-${pending} מוזמנים עוד לא ענו. כדאי לשלוח להם תזכורת.`;
  }
  tip.textContent = text;
  tip.hidden = !text;
}

function startReminders(kind) {
  if (!requireEventDetails()) return;
  const list = REMINDERS[kind].list();
  if (!list.length) { toast('אין למי לשלוח כרגע'); return; }
  queue = { kind, list, index: 0, sent: 0 };
  document.getElementById('remind-title').textContent = REMINDERS[kind].title;
  showQueueItem();
  dialog.showModal();
}

function showQueueItem() {
  const guest = queue.list[queue.index];
  if (!guest) { dialog.close(); return; }
  document.getElementById('remind-progress').textContent = `${queue.index + 1} מתוך ${queue.list.length}`;
  document.getElementById('remind-guest').innerHTML = `<b>${escapeHtml(guest.name)}</b> <span dir="ltr">${escapeHtml(guest.phone) || 'ללא טלפון – תבחרו איש קשר בוואטסאפ'}</span>`;
  const text = document.getElementById('remind-text');
  text.value = REMINDERS[queue.kind].text(guest);
  text.scrollTop = 0;
}

document.getElementById('remind-send').addEventListener('click', () => {
  const guest = queue.list[queue.index];
  window.open(waUrl(guest.phone, document.getElementById('remind-text').value), '_blank', 'noopener');
  REMINDERS[queue.kind].mark(guest);
  queue.sent++;
  saveEvents();
  queue.index++;
  showQueueItem();
});

document.getElementById('remind-skip').addEventListener('click', () => {
  queue.index++;
  showQueueItem();
});

dialog.addEventListener('close', () => {
  if (queue && queue.sent) toast(`נשלחו ${queue.sent} הודעות`);
  queue = null;
  renderGuests();
});

document.getElementById('invite-unsent').addEventListener('click', () => startReminders('unsent'));
document.getElementById('remind-pending').addEventListener('click', () => startReminders('pending'));
document.getElementById('remind-coming').addEventListener('click', () => startReminders('coming'));

// --- עדכון אוטומטי מגיליון גוגל ---
const syncForm = document.getElementById('sync-form');
let lastSync = 0;

async function fetchRsvps(url, key) {
  const res = await fetch(`${url}?${new URLSearchParams({ key, event: current.id })}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error === 'bad key' ? 'הסיסמה לא תואמת ל-ADMIN_KEY בקוד' : 'שגיאה בגיליון');
  return json.rows || [];
}

function mergeRsvps(rows) {
  let changed = 0;
  rows.sort((a, b) => a.time - b.time).forEach((row) => {
    const name = String(row.name || '').trim();
    let guest = current.guests.find((g) => row.gid && g.id === row.gid)
      || current.guests.find((g) => name && g.name.trim() === name);
    if (!guest) {
      if (!name) return;
      guest = { id: row.gid || Math.random().toString(36).slice(2, 9), name, phone: '', status: 'pending', count: 1 };
      current.guests.push(guest);
    }
    if (row.time <= (guest.rsvpAt || 0)) return;
    Object.assign(guest, { status: row.answer, count: row.count, note: row.note || '', rsvpAt: row.time, auto: true });
    changed++;
  });
  return changed;
}

async function syncNow(manual) {
  if (!settings.url || !settings.key) return;
  const status = document.getElementById('sync-status');
  try {
    const changed = mergeRsvps(await fetchRsvps(settings.url, settings.key));
    lastSync = Date.now();
    status.textContent = `עדכון אוטומטי פעיל · נבדק ב-${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('sync-bar').classList.remove('error');
    if (changed) {
      saveEvents();
      renderGuests();
      toast(`התקבלו ${changed} אישורי הגעה חדשים`);
    } else if (manual) {
      toast('אין תשובות חדשות');
    }
  } catch (e) {
    status.textContent = `העדכון האוטומטי נכשל: ${e.message}`;
    document.getElementById('sync-bar').classList.add('error');
  }
}

function renderSyncUi() {
  const connected = Boolean(settings.url && settings.key);
  document.getElementById('sync-bar').hidden = !connected;
  const badge = document.getElementById('sync-badge');
  badge.textContent = connected ? 'מחובר ✓' : 'לא מחובר';
  badge.classList.toggle('on', connected);
  syncForm.elements.url.value = settings.url || '';
  syncForm.elements.key.value = settings.key || '';
}

syncForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = syncForm.elements.url.value.trim();
  const key = syncForm.elements.key.value.trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { toast('הכתובת צריכה להתחיל ב-https://script.google.com'); return; }
  try {
    await fetchRsvps(url, key);
  } catch (err) {
    toast(`החיבור נכשל: ${err.message === 'Failed to fetch' ? 'בדקו שהפריסה פתוחה ל"כל אחד"' : err.message}`);
    return;
  }
  settings = { url, key };
  saveSettings();
  renderSyncUi();
  updatePreview();
  document.getElementById('share-box').hidden = true;
  toast('מחובר! צרו את הקישור מחדש ושלחו אותו');
  syncNow();
});

document.getElementById('sync-disconnect').addEventListener('click', () => {
  settings = {};
  saveSettings();
  renderSyncUi();
  updatePreview();
  toast('העדכון האוטומטי נותק');
});

document.getElementById('sync-now').addEventListener('click', () => syncNow(true));

document.getElementById('copy-script').addEventListener('click', async () => {
  try {
    const code = await (await fetch('apps-script.gs')).text();
    await navigator.clipboard.writeText(code);
    toast('הקוד הועתק');
  } catch (e) {
    toast('לא הצלחנו להעתיק. לחצו "צפייה בקוד" והעתיקו משם');
  }
});

// בדיקה כל דקה כשהעמוד פתוח, ומיד כשחוזרים ללשונית
setInterval(() => { if (!document.hidden) syncNow(); }, 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() - lastSync > 15000) syncNow();
});

// --- הפעלה ---
renderSyncUi();
loadCurrent();
