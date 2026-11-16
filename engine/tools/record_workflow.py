#!/usr/bin/env python3
"""Record one full loop of the workflow animation (the example's first slide) as a video, in a headless Chrome.

  python3 record_workflow.py http://127.0.0.1:8795/example/ out_dir

Writes out_dir/workflow.webm and out_dir/workflow.txt: the loop's start and end second, and the slide's box in the video
(x y w h), for cutting and cropping with ffmpeg. Needs the same things as record_tour.py.
"""
import sys, time
from playwright.sync_api import sync_playwright

url, out = sys.argv[1], sys.argv[2]
W, H = 1900, 1150
STEP = "document.querySelector('#s0 svg text[font-size=\"14.5\"]').textContent"   # the name of the step being shown

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": W, "height": H}, record_video_dir=out, record_video_size={"width": W, "height": H})
    page = ctx.new_page(); T0 = time.time()
    page.goto(url)
    page.wait_for_selector("#touroffer .tskip"); page.click("#touroffer .tskip")   # no tour
    page.wait_for_selector("#s0 svg [data-k='0']"); page.wait_for_timeout(1500)
    page.locator("#s0").scroll_into_view_if_needed()
    page.evaluate("document.querySelector('#s0').scrollIntoView({block:'start'})"); page.wait_for_timeout(500)
    first = page.evaluate("document.querySelector('#s0 svg [data-k=\"0\"] text:last-of-type').textContent")
    r = page.locator("#s0 svg [data-k='0']").bounding_box()
    page.mouse.click(r["x"] + r["width"] / 2, r["y"] + r["height"] / 2)             # start the loop at step 1
    page.mouse.move(5, H - 5)                                                         # pointer out of the picture
    t1 = time.time() - T0
    page.wait_for_function(f"{STEP}!=={first!r}", timeout=120000)                     # step 2 has begun
    page.wait_for_function(f"{STEP}==={first!r}", timeout=300000)                     # round again to step 1
    t2 = time.time() - T0
    s = page.locator("#s0").bounding_box()
    page.wait_for_timeout(500)
    video = page.video; ctx.close(); video.save_as(out + "/workflow.webm"); b.close()

line = f"{t1:.2f} {t2:.2f} {int(s['x'])} {int(s['y'])} {int(s['width'])} {int(s['height'])}\n"
open(out + "/workflow.txt", "w").write(line); print(line)
