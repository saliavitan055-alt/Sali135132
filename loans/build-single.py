# בונה קובץ HTML יחיד (עם העיצוב והקוד בפנים) שאפשר לשמור בשולחן העבודה ולפתוח בלחיצה כפולה
from pathlib import Path
here = Path(__file__).parent
html = (here / 'index.html').read_text(encoding='utf-8')
css = (here / 'styles.css').read_text(encoding='utf-8')
js = (here / 'script.js').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="script.js"></script>', '<script>\n' + js + '\n</script>')
assert 'styles.css' not in html and 'script.js' not in html
(here / 'click-credit.html').write_text(html, encoding='utf-8')
print('click-credit.html', len(html.encode()) // 1024, 'KB')
