// ===== עדכון אוטומטי של אישורי הגעה – קוד ל-Google Apps Script =====
// הוראות התקנה מופיעות באפליקציה תחת "עדכון אוטומטי של אישורי הגעה".
// 1. החליפו את הסיסמה למטה בסיסמה משלכם (אותה סיסמה תזינו באפליקציה).
const ADMIN_KEY = 'החליפו-לסיסמה-שלכם';

const HEADERS = ['זמן', 'אירוע', 'מזהה מוזמן', 'שם', 'תשובה', 'מגיעים', 'הערה'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('אישורי הגעה');
  if (!sh) {
    sh = ss.insertSheet('אישורי הגעה');
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// טקסט חופשי מהאורח – חותכים אורך ומונעים הרצת נוסחאות בגיליון
function clean_(value, max) {
  const s = String(value == null ? '' : value).slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// האורח שולח אישור הגעה
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const answer = ['yes', 'maybe', 'no'].indexOf(d.answer) >= 0 ? d.answer : 'yes';
  const count = answer === 'no' ? 0 : Math.max(0, Math.min(50, Number(d.count) || 0));
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date(), clean_(d.event, 40), clean_(d.gid, 40), clean_(d.name, 80), answer, count, clean_(d.note, 300)]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// האפליקציה של בעלי האירוע קוראת את האישורים (דורש סיסמה)
function doGet(e) {
  if (e.parameter.key !== ADMIN_KEY) return json_({ ok: false, error: 'bad key' });
  const rows = sheet_().getDataRange().getValues().slice(1)
    .filter(function (r) { return String(r[1]) === e.parameter.event; })
    .map(function (r) {
      return { time: new Date(r[0]).getTime(), gid: String(r[2]), name: String(r[3]).replace(/^'/, ''), answer: r[4], count: Number(r[5]) || 0, note: String(r[6]).replace(/^'/, '') };
    });
  return json_({ ok: true, rows: rows });
}
