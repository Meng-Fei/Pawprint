#!/bin/bash
# Rule checks before every commit:
#  1. every number on a slide drawing or readout is either clickable to its source or marked (AI);
#  2. every evidence PDF can be paged through in full: each source panel holds every page (page check),
#     and docs n in deck.js equals the PDF's real page count (below, read from the PDF file).
#  3. every slide loads and draws (a broken slide is shown as an error card and reported here).
# Renders the deck's index.html in headless Chrome (?check) and reads the result the page writes into <pre id="numcheck">.
# Usage: engine/check.sh <deck folder>   (default: the current folder)
cd "${1:-.}" || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=8000 --dump-dom "file://$PWD/index.html?check" 2>/dev/null | perl -0ne 'print $1 if /<pre id="numcheck">(.*?)<\/pre>/s')
if [ -z "$OUT" ]; then echo "number check: page did not report (render failed?)"; exit 1; fi
# docs n vs real page count, read from the PDF itself with the Python standard library (works on any system and on a file
# that was just downloaded): the largest /Count of a /Type /Pages node, searched in the file and inside compressed object streams
BAD=$(python3 - <<'PY'
import re,zlib,pathlib
def pages(b):
    chunks=[b]
    for m in re.finditer(rb"/Type\s*/ObjStm\b",b):
        k=b.find(b"stream",m.end())
        if k<0: continue
        k+=6; k+=2 if b[k:k+2]==b"\r\n" else 1
        try: chunks.append(zlib.decompressobj().decompress(b[k:k+50_000_000]))
        except zlib.error: pass
    c=[int(x) for ch in chunks for t in re.findall(rb"/Type\s*/Pages\b[^>]*?/Count\s+(\d+)|/Count\s+(\d+)[^>]*?/Type\s*/Pages\b",ch) for x in t if x]
    return max(c) if c else None
s=pathlib.Path('deck.js').read_text()
blk=s[s.index(' docs:{'):]; blk=blk[:blk.index('\n },')]
for k,n,pdf in re.findall(r"^\s+(\w+):\{.*?n:(\d+),.*?pdf:'([^']+)'",blk,re.M):
    p=pathlib.Path(pdf)
    if not p.exists(): print(f"{k}: missing {pdf}"); continue
    real=pages(p.read_bytes())
    if real is None: print(f"{k}: cannot read page count of {pdf}")
    elif real!=int(n): print(f"{k}: deck.js says n={n} but the PDF has {real} pages")
PY
)
if [ -n "$BAD" ]; then OUT=$(printf 'FAIL\n%s\n%s' "$BAD" "${OUT#PASS}"); fi
echo "$OUT"
case "$OUT" in PASS*) exit 0;; *) exit 1;; esac
