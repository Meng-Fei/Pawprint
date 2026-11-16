/* Loader. A deck page is: <script src="deck.js"> then <script src="../engine/boot.js">.
   This file builds the page frame, then loads, in order: the libraries, the drawing kit (draw.js), the deck's refs.js,
   its slides (slides/<id>.js, in DECK.slides order), the engine (engine.js) and, if the deck has one, the guided tour (tour.js).
   A slide file that is missing or broken becomes an error card in its own place; the other slides are not affected. */
const BASE=document.currentScript.src.replace(/[^/]*$/,'');
const $=s=>document.querySelector(s);
const SLIDES=[];
document.title=DECK.title;
document.body.insertAdjacentHTML('afterbegin',`<header>
  <b>${DECK.header}</b>
  <span class="src">${DECK.sub} · left: the paper · right: slides. Click a number on the right to see where it comes from on the left</span>
</header>
<main>
<section id="left">
  <div id="shelf"></div>
  <div class="nav"><button class="btn" id="prev">◀</button><b id="pg">Page 1 / ${DECK.docs[DECK.main||Object.keys(DECK.docs)[0]].n}</b><button class="btn" id="next">▶</button><span class="dname" id="dname"></span>
    <span class="zoom" style="margin-left:auto"><button class="btn" id="zout" title="Zoom out">−</button><span id="zl">100%</span><button class="btn" id="zin" title="Zoom in">+</button><button class="btn" id="zfit" title="Fit width">Fit</button></span></div>
  <div id="view"></div>
  <div id="split" hidden></div>
</section>
<aside id="right">
  <div class="nav"><button class="btn" id="sprev">◀</button><b id="sn">Slide 1 / 1</b><button class="btn" id="snext">▶</button></div>
  <div id="slot"></div>
</aside>
</main>`);
(async()=>{
  // our own files are always fetched fresh (a browser may keep an old copy of a file edited a minute ago); the libraries may be cached
  const NOW='?t='+Date.now();
  const css=href=>new Promise(done=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=l.onerror=done;document.head.appendChild(l)});
  const js=src=>new Promise(done=>{const s=document.createElement('script');s.src=src;s.onload=()=>done(true);s.onerror=()=>done(false);document.body.appendChild(s)});
  let err='';addEventListener('error',e=>{err=e.message+(e.filename?` (${e.filename.split('/').pop().split('?')[0]}:${e.lineno})`:'')});
  await Promise.all([css(BASE+'engine.css'+NOW),css(BASE+'vendor/katex/katex.min.css')]);
  for(const f of ['vendor/pdfjs/pdf.min.js','vendor/katex/katex.min.js'])await js(BASE+f);
  await js(BASE+'draw.js'+NOW);
  await js('refs.js'+NOW);
  for(const id of DECK.slides){const n=SLIDES.length;err='';const found=await js(`slides/${id}.js`+NOW);
    if(SLIDES.length!==n+1){SLIDES.length=n;SLIDES.push({title:id,facts:[],svg:()=>'',foot:'',error:found?(err||'the file did not add a slide'):`slides/${id}.js was not found`})}
    SLIDES[n].id=id}
  await js(BASE+'engine.js'+NOW);
  if(DECK.tour)await js(BASE+'tour.js'+NOW);
})();
