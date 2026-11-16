#!/bin/bash
# Rule checks before every commit:
#  1. every number on a slide drawing or readout is either clickable to its source or marked (AI);
#  2. every evidence PDF can be paged through in full: each source panel holds every page (page check),
#     and docs n in deck.js equals the PDF's real page count (below).
#  3. every slide loads and draws (a broken slide is shown as an error card and reported here).
# Renders the deck's index.html in headless Chrome (?check) and reads the result the page writes into <pre id="numcheck">.
# Usage: engine/check.sh <deck folder>   (default: the current folder)
cd "${1:-.}" || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=8000 --dump-dom "file://$PWD/index.html?check" 2>/dev/null | perl -0ne 'print $1 if /<pre id="numcheck">(.*?)<\/pre>/s')
if [ -z "$OUT" ]; then echo "number check: page did not report (render failed?)"; exit 1; fi
# docs n vs real page count (macOS Spotlight metadata, falls back to the PDF's /Count)
BAD=$(python3 - <<'PY'
import re,subprocess,pathlib
s=pathlib.Path('deck.js').read_text()
blk=s[s.index(' docs:{'):]; blk=blk[:blk.index('\n },')]
for k,n,pdf in re.findall(r"^\s+(\w+):\{.*?n:(\d+),.*?pdf:'([^']+)'",blk,re.M):
    p=pathlib.Path(pdf)
    if not p.exists(): print(f"{k}: missing {pdf}"); continue
    real=None
    try:
        r=subprocess.run(['mdls','-raw','-name','kMDItemNumberOfPages',str(p)],capture_output=True,text=True).stdout.strip()
        real=int(r)
    except Exception: pass
    if real is None:
        c=[int(x) for x in re.findall(rb"/Type\s*/Pages\b[^>]*?/Count\s+(\d+)",p.read_bytes())]
        real=max(c) if c else None
    if real is None: print(f"{k}: cannot read page count of {pdf}")
    elif real!=int(n): print(f"{k}: deck.js says n={n} but the PDF has {real} pages")
PY
)
if [ -n "$BAD" ]; then OUT=$(printf 'FAIL\n%s\n%s' "$BAD" "${OUT#PASS}"); fi
echo "$OUT"
case "$OUT" in PASS*) exit 0;; *) exit 1;; esac
