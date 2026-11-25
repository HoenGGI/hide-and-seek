"""Cut the bundled hanja font down to the characters the app actually shows.

Run after changing data.js:  python3 tools/make_font.py
Needs fonttools + brotli (pip install fonttools brotli) and Noto Serif CJK
(apt install fonts-noto-cjk). Writes hanja.woff2 next to index.html.
"""
import pathlib, re, sys
from fontTools import subset
from fontTools.ttLib import TTCollection

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'

text = ''.join(p.read_text(encoding='utf-8') for p in (ROOT / 'data.js', ROOT / 'subjects.js', ROOT / 'exams.js', ROOT / 'app.js', ROOT / 'index.html'))
hanja = sorted(set(re.findall(r'[㐀-鿿豈-﫿]', text)))
hangul = sorted(set(re.findall(r'[가-힣]', text)))
extra = '〈〉《》「」·,.?!()~0123456789 '
chars = ''.join(hanja + hangul) + extra

coll = TTCollection(SRC)
font = next(f for f in coll.fonts if f['name'].getDebugName(1).endswith('KR'))
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.hinting = False
sub = subset.Subsetter(opts)
sub.populate(text=chars)
sub.subset(font)
out = ROOT / 'hanja.woff2'
font.flavor = 'woff2'
font.save(str(out))
print(f'{len(hanja)} hanja + {len(hangul)} hangul -> {out.name} {out.stat().st_size // 1024} KB')
