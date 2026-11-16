#!/usr/bin/env python3
"""Record a deck's guided tour as a video, by really doing every step in a headless Chrome.

  python3 record_tour.py http://127.0.0.1:8795/example/ out_dir [width height]

Writes out_dir/tour.webm and out_dir/steps.txt (the second at which each step starts, for cutting clips).
Needs: pip install playwright; Google Chrome; `python -m playwright install ffmpeg` (the encoder Playwright records with).
The steps are read from the page's own DECK.tour, so the recording follows the tour as it is written:
a step with `do` is performed (click, drag or scroll, as its `gesture` says), a step without is read and passed with Next.
"""
import sys, time, math
from playwright.sync_api import sync_playwright

url, out = sys.argv[1], sys.argv[2]
W, H = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1300, 850)

# Playwright's video has no mouse pointer: draw one that follows the real mouse, with a ring on each press.
CURSOR = """
addEventListener('DOMContentLoaded',()=>{
  const c=document.createElement('div');
  c.style.cssText='position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)';
  c.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 1V19L8.6 14.6L11.6 21.6L14.6 20.3L11.6 13.4H18Z" fill="#111" stroke="#fff" stroke-width="1.4"/></svg>';
  document.documentElement.appendChild(c);
  addEventListener('mousemove',e=>{c.style.transform=`translate(${e.clientX-3}px,${e.clientY-1}px)`},true);
  addEventListener('mousedown',e=>{const r=document.createElement('div');
    r.style.cssText=`position:fixed;left:${e.clientX-14}px;top:${e.clientY-14}px;width:28px;height:28px;border-radius:50%;border:3px solid #1a7f37;z-index:2147483646;pointer-events:none;transition:all .45s ease-out;opacity:.9`;
    document.documentElement.appendChild(r);requestAnimationFrame(()=>{r.style.transform='scale(2)';r.style.opacity='0'});setTimeout(()=>r.remove(),500)},true);
});
"""

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": W, "height": H}, record_video_dir=out, record_video_size={"width": W, "height": H})
    ctx.add_init_script(CURSOR)
    page = ctx.new_page()
    T0 = time.time()
    pos = [W * .6, H * .5]
    marks = []

    def pause(s): page.wait_for_timeout(int(s * 1000))

    def glide(x, y, dur=.7):
        x0, y0 = pos; n = max(8, int(dur * 60))
        for k in range(1, n + 1):
            f = k / n; e = .5 - .5 * math.cos(math.pi * f)  # ease in and out
            page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e); page.wait_for_timeout(int(dur * 1000 / n))
        pos[:] = [x, y]

    def spot(sel, fx=.5, fy=.5):
        r = page.locator(sel).first.bounding_box()
        return r["x"] + fx * r["width"], r["y"] + fy * r["height"]

    def click(sel, fx=.5, fy=.5):
        glide(*spot(sel, fx, fy)); pause(.25); page.mouse.down(); pause(.08); page.mouse.up()

    page.goto(url)
    page.wait_for_selector("#touroffer .tnext")
    page.wait_for_selector("#view canvas"); pause(2.5)   # the first PDF page is drawn
    steps = page.evaluate("DECK.tour.map(s=>({at:s.at,hit:s.hit||null,do:!!s.do,gesture:s.gesture||'',spot:s.spot||null,wait:s.wait||0}))")
    marks.append(("offer", time.time() - T0))
    pause(1.5); click("#touroffer .tnext")

    for i, st in enumerate(steps):
        page.wait_for_function("n=>document.querySelector('#tour .tn').textContent.startsWith('Step '+n+' ')", arg=i + 1)
        marks.append((f"step {i+1}", time.time() - T0))
        last = i == len(steps) - 1
        if not st["do"]:
            pause(4.2 if not last else 3.5)               # time to read the popup
            click("#tour .tnext"); continue
        page.wait_for_selector("#tour .tgo:not([hidden])"); pause(2.4)   # the page has settled on the target; read the popup
        g = st["gesture"]
        if g == "drag":
            x, y = spot(st["at"] + " .kh"); glide(x, y); pause(.3); page.mouse.down()
            for dx in (90, -60, 40):                      # there, back, and a little forward again
                glide(pos[0] + dx, y, 1.1)
            page.mouse.up()
        elif g == "scroll":
            glide(*spot(st["hit"] or st["at"], .5, .45)); pause(.4)
            for k in range(14): page.mouse.wheel(0, 45); pause(.07)
            pause(.6)
            for k in range(8): page.mouse.wheel(0, -45); pause(.07)
        else:
            sp = st["spot"] or [.5, .5]
            click(st["at"], *sp)                           # the ring is around `at`; `hit` may be a larger group with empty space at its middle
        if st["wait"]:
            continue                                       # this step moves on by itself
        page.wait_for_selector("#tour .tdo.done"); pause(3.2)   # look at what happened
        click("#tour .tnext")

    pause(2.5)
    marks.append(("end", time.time() - T0))
    video = page.video
    ctx.close()
    video.save_as(out + "/tour.webm")
    b.close()

open(out + "/steps.txt", "w").write("".join(f"{t:7.2f}  {n}\n" for n, t in marks))
print(open(out + "/steps.txt").read())
