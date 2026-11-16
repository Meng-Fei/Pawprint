# Pawprint: guide

This guide is written for two readers: a person who wants to read papers this way, and that person's AI assistant, which sets the tool up and then makes the slides. Give this file to your AI and ask it to set the tool up on your computer.

## 1. Why this exists

Fact-checking is the key skill of the AI era, and reading the original is scarce. Helping someone read the original is better than handing them second-hand material. But an original is static and hard to read. An AI can help take it apart dynamically, in depth and along the reader's own questions, and what was worked out along the way is kept.

Two things carry all the value. Everything else in the tool serves these two:

1. Reading the PDF and, alongside it, understanding it interactively and keeping what was understood.
2. A clear system for checking facts and marking where each one comes from.

## 2. What the page does

- Left: the original PDFs, complete, each one can be paged through from first page to last.
- Right: slides. Each slide has a drawing (usually interactive, computed from the formulas) and a list of facts.
- A fact with a number comes from a source. Click it: the fact lights up and the left side opens the PDF at the passage, marked with a red bar in the margin and a yellow highlight on the key words. Nothing is drawn over the text.
- A fact marked `AI`, and any number tagged `(AI)`, was worked out, estimated or chosen by the AI. It has no source to open.
- A fact with several sources opens them side by side.

Open `example/` to see all of this. It offers a one-minute guided tour, and its first slide animates the workflow in section 4.

## 3. Setting up (for the AI)

What is in the folder:

```
GUIDE.md          this file
engine/           the engine, shared by every deck; do not copy it per paper
  boot.js         loader: builds the page, then loads everything below in order
  engine.js       PDF side, slide side, linking, the in-page rule check
  draw.js         drawing kit: D (labels, arrows, dimensions, source badges), knobs (sliders and buttons), WV (waves), V3 (simple 3D)
  tour.js         optional guided tour
  engine.css      styles; colours are the CSS variables at the top
  check.sh        runs the rule check from the command line
  tools/          helpers that find where a phrase sits on a PDF page
  vendor/         PDF.js and KaTeX
example/          a working deck: OpenStax University Physics Vol. 3 and Vol. 1 (CC BY-NC-SA 4.0)
```

To start:

0. The example's two source PDFs are not shipped; download them from OpenStax. In `example/deck.js` each entry under `docs` has `url` (where to download), `pdf` (where to save it, relative to `example/`) and `sha256` (the file the marked places were located on). If a checksum differs, OpenStax has revised the book and the marks may sit on the wrong lines: run the check, then re-locate the passages in `refs.js` with the locating tool. Until a PDF is there, the page shows a notice with the link in place of that document.
1. Serve the folder that contains `engine/` over local HTTP, from that folder, so a deck can reach `../engine/`. Any static server works, for example `python3 -m http.server 8795 --bind 127.0.0.1`.
2. Open `http://127.0.0.1:8795/example/`.
3. There is no build step. Edit a file, reload the page.

Adapt these to the user's system; they were written on macOS and nothing else has been tried:

- `engine/check.sh` calls Google Chrome at its macOS path and reads PDF page counts with `mdls`. What it must do on any system: load `<deck>/index.html?check` in a headless browser, read the text of `<pre id="numcheck">` (it starts with `PASS` or `FAIL`), and compare each `n:` in `deck.js` with the real page count of that PDF.
- `engine/tools/pdfloc.swift` and `pdftxt.swift` use macOS PDFKit; `loc.py` uses PyMuPDF and runs anywhere. What a locating tool must do: given a PDF, a page and a phrase, print the phrase's box as fractions of the page (x, y, width, height, origin at the top left).

## 4. The workflow

1. The user hands this guide to their AI; the AI sets the tool up and opens the page.
2. The user names a paper. The AI puts the PDF in the deck's `docs/` folder and lists it in `deck.js`.
3. The AI reads the paper and makes slides. Facts from the source are linked to their passage; anything the AI adds is marked AI.
4. The user reads, clicks facts to check them against the original, and plays with the drawings.
5. The user discusses with the AI, often by sending a screenshot of the part that is unclear. A new slide is made when one is needed, and existing slides are revised in place; a question does not automatically become a slide.

The AI commits after each round, so the deck's history is the record of the reading.

## 5. Making a deck

Copy `example/` to a new folder next to it, then edit four things.

`deck.js`: the sources and the order of the slides.

```js
const DECK={
 title:'…',            // browser tab
 header:'…', sub:'…',  // the line at the top of the page
 aiModel:'…',          // shown in the “AI-made” tag on every drawing
 key:'my-paper',       // name under which the browser remembers the reading position
 main:'paper',         // the source a ref points to when it names none
 docs:{
  paper:{title:'full citation',short:'Name 2026',n:21,pdf:'docs/…/file.pdf',ar:'612/792'},
  // n: number of pages (checked against the file); ar: page width/height; optional pl: p=>p-10 turns a PDF page into the printed page number
  // optional url: where the PDF can be downloaded; when the file is missing the page shows this link instead of the document
 },
 slides:['intro','grating'],   // slides/intro.js, slides/grating.js, in this order
};
```

`refs.js`: one entry per cited passage.

```js
const REFS={
 o_order:{doc:'ox',page:123,x:.118,y:.255,w:.765,h:.192,keys:[[.335,.4302,.130,.0148]]},  // d sin θ = mλ; "We call m the order"
};
```

`x, y, w, h` is the passage as fractions of the page; `keys` are the boxes of the key words or numbers inside it, which get the yellow highlight. Get the numbers from a locating tool, then look at the page to confirm the box sits on the passage. Keep the quoted words in the comment.

`slides/<id>.js`: one slide per file.

```js
SLIDES.push({
 title:'…',
 wide:true,                       // drawing on top, facts underneath in two columns
 facts:[
  {group:'optional heading',ref:'o_order',html:'A fact taken from the source; <b>$d\\sin\\theta=m\\lambda$</b>.'},
  {ref:'both',src:['o_trig','o_order'],html:'A fact that rests on two passages.'},
  {ref:'mine',src:[],html:'Something the AI worked out (AI reading).'},      // src:[] marks it AI
  {ref:'open',q:true,src:[],html:'A question the source does not answer.'},  // shown with “?”
 ],
 svg:()=>`<svg viewBox="0 0 1000 560">${DEFS}<g id="a"></g><g class="knobs"></g></svg>`,
 init:el=>{ /* draw into the svg; knobs(svg,[…],state=>{…}) adds sliders and buttons and redraws on change */ },
 foot:'Scale, simplifications, what the AI chose.'
});
```

- `$…$` and `$$…$$` are LaTeX.
- In a drawing, `D.ref(id,[x,y],inner)` puts the fact's number badge at `[x,y]` and makes `inner` clickable; `cite(id,text)` does the same for text; `ai(text)` appends the `(AI)` tag.
- `slides/grating.js` in the example is the pattern to follow for an interactive drawing.

`index.html` is the same in every deck apart from its `<title>`.

A slide file that is missing or broken, a fact that cites a ref which is not in `refs.js`, or an error while drawing shows an error card in place of that slide. The other slides are not affected, and the rule check reports it.

A guided tour is optional: add `tour:[{at:'css selector',text:'…',until:'pointerdown'}]` to `deck.js` (see the example).

## 6. Rules

Checked by the machine (`engine/check.sh <deck>`, also shown in the browser console). A deck that fails is not finished:

1. Every number on a drawing or a readout either opens its source when clicked or is marked `(AI)`.
2. Every source PDF can be paged through in full, and its page count in `deck.js` is right.
3. Every slide loads and draws.

Left to judgement. These come from corrections made while reading real papers.

Facts and sources
- Keep what the source says apart from what the AI says. Copied numbers and facts open their passage; whatever the AI computed, estimated or chose is marked AI. An explanation with no source is marked AI, not given a number.
- Show all the evidence for a number. If it rests on several passages, list every one.
- A from-scratch schematic that only helps understanding needs no citation; do not force one onto it.
- Before stating a fact, look it up in the sources at hand, then on the web; do not answer from memory.

Explanation
- Follow the path a good textbook takes for the concept, and cite the textbook.
- One device or one idea per slide. How the pieces fit together gets its own slide.
- Do not skip steps. A new concept or formula is explained before it is used. The step the reader cares about most gets a slide of its own.
- When the answer has many intermediate steps, propose several slides instead of forcing it into one.
- Use the paper's own symbols; do not invent new ones unless there is no way around it. Define every uncommon symbol on the slide where it appears.
- Titles are noun phrases in the style of a textbook or a paper.

Drawings
- Draw the real device and the real fields, not boxes joined by arrows.
- Label every arrow and every quantity on the drawing itself. A 3D drawing has labelled axes and a reference plane.
- Put related quantities in one drawing, as an engineering drawing does. A long optical path takes the full width, with the text underneath.
- A schematic may exaggerate scale but must not change the physics.
- Formulas are rendered LaTeX. A derivation is laid out as formulas with arrows and boxes, not as a paragraph.
- Every adjustable quantity has a visible control: buttons for a few discrete choices, a slider with auto-scan for a continuous quantity. Do not write interaction hints on the slide.
- Before delivering, check the physics in the picture: signs, directions, and that every readout agrees with its formula.

## 7. Copyright

The engine and this guide can be shared. The papers cannot: PDFs belong to their publishers and authors, so share a deck without its `docs/` folder unless the licence allows redistribution. The example uses OpenStax, *University Physics* Volumes 3 and 1 (2016), licensed CC BY-NC-SA 4.0, free at openstax.org; the example does not ship the PDFs, each reader downloads them from OpenStax (links in `example/deck.js`).
