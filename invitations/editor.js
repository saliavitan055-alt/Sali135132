// ===== עורך ההזמנה + רשימת מוזמנים (נשמר ב-localStorage) =====

const STORE_KEY = 'hazmana.events';
const form = document.getElementById('invite-form');
const preview = document.getElementById('preview');
const eventSelect = document.getElementById('event-select');

let events = loadEvents();
let current = events[0] || newEvent();

function newEvent() {
  return { id: Date.now().toString(36), data: { t: 'wedding', th: 'gold', tm: '19:30' }, guests: [] };
}

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
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
  label.innerHTML = `<input type="radio" name="th" value="${key}"><span class="swatch theme-${key}"></span><span class="theme-name">${name}</span>`;
  themePicker.appendChild(label);
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
  document.getElementById('ct-label').textContent = form.elements.t.value === 'wedding' ? 'חופה' : 'תחילת הטקס';
}

function updatePreview() {
  current.data = readForm();
  renderCard(preview, current.data);
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
  fillForm(current.data);
  form.dataset.prevType = current.data.t;
  document.getElementById('share-box').hidden = true;
  updatePreview();
  renderEventSelect();
  renderGuests();
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
      <td data-label="שם">${escapeHtml(g.name)}</td>
      <td data-label="טלפון" dir="ltr">${escapeHtml(g.phone) || '—'}</td>
      <td data-label="סטטוס">
        <select data-field="status" aria-label="סטטוס">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === g.status ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </td>
      <td data-label="מגיעים"><input data-field="count" type="number" min="0" max="50" value="${g.count}" aria-label="מספר מגיעים"></td>
      <td class="row-actions">
        <button type="button" class="btn btn-whatsapp btn-sm" data-action="send">שליחה</button>
        <button type="button" class="btn-icon" data-action="delete" aria-label="מחיקה">✕</button>
      </td>`;
    rows.appendChild(tr);
  });
  document.getElementById('guests-empty').hidden = current.guests.length > 0;
  renderStats();
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
  if (e.target.dataset.field === 'status') {
    tr.className = `status-${guest.status}`;
    if (guest.status === 'no') { guest.count = 0; tr.querySelector('[data-field="count"]').value = 0; }
  }
  saveEvents();
  renderStats();
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
    updatePreview();
    if (!current.data.n || !current.data.d) { toast('נא למלא שמות ותאריך לפני השליחה'); form.reportValidity(); return; }
    saveEvents();
    window.open(waUrl(guest.phone, shareText(inviteUrl(current.data, guest.name), guest.name)), '_blank', 'noopener');
  }
});

// --- הפעלה ---
loadCurrent();
