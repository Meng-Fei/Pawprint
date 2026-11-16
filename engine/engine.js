/* ---- left side: several documents; the open one scrolls and zooms, the others wait on the shelf ---- */
const DOCS=DECK.docs, MAIN=DECK.main||Object.keys(DOCS)[0], AI_MODEL=DECK.aiModel||'AI';
/* PDF.js: each page is drawn on a canvas at the size it is shown (× screen density), only when it comes near the view */
pdfjsLib.GlobalWorkerOptions.workerSrc=BASE+'vendor/pdfjs/pdf.worker.min.js';
const pdfOf=k=>DOCS[k].doc||(DOCS[k].doc=pdfjsLib.getDocument(DOCS[k].pdf).promise.then(async pdf=>{
  // the page shape comes from the PDF itself (page 1), so the boxes in REFS (page fractions) land where they should
  const v=(await pdf.getPage(1)).getViewport({scale:1});DOCS[k].ar=`${v.width}/${v.height}`;
  document.querySelectorAll(`.pstage[data-doc="${k}"]`).forEach(ps=>ps.style.aspectRatio=DOCS[k].ar);return pdf}).catch(e=>{missingDoc(k);throw e}));
// a PDF that is not in the folder (sources are not shipped with a deck): say where to get it and where to put it
function missingDoc(k){const d=DOCS[k],el=$('#doc-'+k);if(!el||el.querySelector('.nopdf'))return;
  el.insertAdjacentHTML('afterbegin',`<div class="nopdf"><b>${d.short}: this PDF is not in the folder yet.</b> ${d.url?`Download it from <a href="${d.url}" target="_blank" rel="noopener">${d.url}</a> and save it as`:'Put it at'} <code>${d.pdf}</code>, then reload the page.</div>`)}
async function drawStage(ps){
  const k=ps.dataset.doc,p=+ps.dataset.page,W=Math.round(ps.clientWidth*(window.devicePixelRatio||1));
  if(!W||ps.hidden||Math.abs((+ps.dataset.w||0)-W)<8)return;
  if(ps._busy){ps._again=true;return}ps._busy=true;ps.dataset.w=W;
  try{const pg=await (await pdfOf(k)).getPage(p),v0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:W/v0.width});
    const c=document.createElement('canvas');c.width=W;c.height=Math.round(vp.height);
    await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
    const old=ps.querySelector('canvas');if(ps._near===false){old?.remove();ps.dataset.w=0}else old?old.replaceWith(c):ps.prepend(c)}
  catch(e){console.error(k,p,e)}
  ps._busy=false;if(ps._again){ps._again=false;ps.dataset.w=0;drawStage(ps)}
}
// pages far from the view give their canvas back (a 600-page book would otherwise keep hundreds in memory)
const seen=new IntersectionObserver(es=>es.forEach(e=>{const ps=e.target;ps._near=e.isIntersecting;
  if(e.isIntersecting)drawStage(ps);else if(!ps._busy){ps.querySelector('canvas')?.remove();ps.dataset.w=0}}),{rootMargin:'1500px 0px'});
let redrawT=0;const redrawNear=()=>{clearTimeout(redrawT);redrawT=setTimeout(()=>document.querySelectorAll('#view .pstage').forEach(ps=>ps._near&&drawStage(ps)),180)};
async function thumbOf(k){const d=DOCS[k];if(d.thumb)return d.thumb;
  const pg=await (await pdfOf(k)).getPage(1),v=pg.getViewport({scale:1}),vp=pg.getViewport({scale:120/v.height}),c=document.createElement('canvas');
  c.width=Math.round(vp.width);c.height=Math.round(vp.height);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
  return d.thumb=c.toDataURL()}

let doc=MAIN, cur=1, si=0, active=null;
for(const [k,d] of Object.entries(DOCS)){d.zoom=1;d.top=0;d.left=0;d.cur=1;
  const el=document.createElement('div');el.className='doc';el.id='doc-'+k;el.hidden=k!==doc;
  for(let p=1;p<=d.n;p++)el.insertAdjacentHTML('beforeend',`<div class="pstage" id="${k}-p${p}" data-doc="${k}" data-page="${p}" style="aspect-ratio:${d.ar}"></div>`);
  el.querySelectorAll('.pstage').forEach(ps=>seen.observe(ps));
  $('#view').appendChild(el)}
const pageEl=(k,p)=>$(`#${k}-p${p}`);
// only facts with a source get a number (numbers link to the marks on the left); facts without one are tagged AI
function factList(){let k=0;return SLIDES[si].facts.map(f=>({...f,n:f.q?'?':f.src&&!f.src.length?'AI':++k}))}  // q: open question, the paper does not say
// LaTeX: $$…$$ display, $…$ inline, rendered by KaTeX after the slides are drawn
const renderTex=root=>root.querySelectorAll('.tex:not([data-k])').forEach(e=>{e.dataset.k=1;katex.render(e.textContent,e,{displayMode:e.classList.contains('d'),throwOnError:false})});
const texify=h=>h.replace(/\$\$([^$]+)\$\$/g,'<span class="tex d">$1</span>').replace(/\$([^$]+)\$/g,'<span class="tex">$1</span>');
// cite(id, text): a number taken from a source, click → its place on the left; ai(text): a number the AI chose or worked out
const cite=(id,t)=>`<span class="cite" data-ref="${id}">${t}</span>`,ai=t=>`<span class="aiv">${t} <span class="aitg">(AI)</span></span>`;
// a fact's sources: its src list, or the fact id itself when that is a place (titles)
const srcOf=id=>{const f=SLIDES[si].facts.find(f=>f.ref===id);return f?(f.src||[f.ref]):[id]};
function sourceUse(){const m=new Map(),add=(id,n)=>{if(!m.has(id))m.set(id,[]);if(!m.get(id).includes(n))m.get(id).push(n)};
  factList().forEach(f=>(f.src||[f.ref]).forEach(id=>add(id,f.n)));return m}
function paintMarks(el,k,p){
  const use=sourceUse(),act=active?srcOf(active):[];act.forEach(id=>{if(!use.has(id))use.set(id,['·'])});
  for(const [id,ns] of use){const r=REFS[id];if((r.doc||MAIN)!==k||r.page!==p)continue;
    const on=act.includes(id),o=document.createElement('div');o.className='mk'+(on?' on':'');o.dataset.src=id;
    o.style.cssText=`left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%`;
    o.innerHTML=`<span>${ns.join('·')}</span>`;o.title='Click: show on the slide';
    o.onclick=()=>{const f=factList().find(f=>(f.src||[f.ref]).includes(id));pick(f?f.ref:id,'paper')};el.appendChild(o);
    if(on)(r.keys||[]).forEach(([x,y,w,h])=>{const q=document.createElement('div');q.className='key';
      q.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;el.appendChild(q)})}
}
function showPage(){  // redraw frames and key marks on every page, in the main view and in split panels
  document.querySelectorAll('.mk,.key').forEach(o=>o.remove());
  for(const [k,d] of Object.entries(DOCS))for(let p=1;p<=d.n;p++)paintMarks(pageEl(k,p),k,p);
  document.querySelectorAll('#split .pstage').forEach(ps=>paintMarks(ps,ps.dataset.doc,+ps.dataset.page));
}

/* split view: places close together on one page share a panel; every other place gets its own */
function groupSources(ids){const g=[];
  for(const id of ids){const r=REFS[id],k=r.doc||MAIN;
    const hit=g.find(x=>x.k===k&&x.p===r.page&&Math.abs((x.y0+x.y1)/2-(r.y+r.h/2))<.18);
    if(hit){hit.ids.push(id);hit.x0=Math.min(hit.x0,r.x);hit.x1=Math.max(hit.x1,r.x+r.w);hit.y0=Math.min(hit.y0,r.y);hit.y1=Math.max(hit.y1,r.y+r.h)}
    else g.push({k,p:r.page,ids:[id],x0:r.x,x1:r.x+r.w,y0:r.y,y1:r.y+r.h})}
  return g}
let splitOn=false;
function openSplit(groups,n){
  const S=$('#split');S.style.top=$('#view').offsetTop+'px';
  S.innerHTML=groups.map((g,i)=>{const d=DOCS[g.k];
    return `<div class="pane"><div class="phead"><b>Source ${i+1} of ${groups.length}</b> ${d.short} p.${d.pl?d.pl(g.p):g.p} <span style="color:var(--mute)">· scroll for all ${d.n} pages</span>${i===0?`<button class="btn" id="unsplit" title="Back to one document">✕ close</button>`:''}</div>
      <div class="pbody">${Array.from({length:d.n},(_,j)=>`<div class="pstage" data-doc="${g.k}" data-page="${j+1}" style="aspect-ratio:${d.ar};margin-bottom:8px"></div>`).join('')}</div></div>`}).join('');  // the whole PDF, opened at the cited page
  const fresh=!splitOn;S.hidden=false;splitOn=true;$('#view').style.visibility='hidden';showPage();
  S.querySelectorAll('.pane').forEach((pane,i)=>{const g=groups[i],b=pane.querySelector('.pbody'),ps=pane.querySelector(`.pstage[data-page="${g.p}"]`);
    // zoom so the sources fill the panel's width, but still fit its height
    const [aw,ah]=DOCS[g.k].ar.split('/').map(Number),pageH=b.clientWidth*ah/aw;
    const zf=Math.max(.6,Math.min(2.4,.92/(g.x1-g.x0),.85*b.clientHeight/((g.y1-g.y0)*pageH)));
    pane.querySelectorAll('.pstage').forEach(q=>{q.style.width=zf*100+'%';seen.observe(q)});drawStage(ps);
    b.scrollTop=ps.offsetTop+(g.y0+g.y1)/2*ps.offsetHeight-b.clientHeight/2;b.scrollLeft=g.x0*ps.offsetWidth-70;  // keep the margin bar and badge in view
    pane.animate([{opacity:0,transform:`translateY(${fresh?24:10}px) scale(.96)`},{opacity:1,transform:'none'}],
      {duration:560,delay:i*110,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})});
  $('#unsplit').onclick=closeSplit;
}
function closeSplit(){
  if(!splitOn)return;splitOn=false;const S=$('#split'),V=$('#view');
  S.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.97)'}],{duration:320,easing:'ease-in'});
  setTimeout(()=>{if(!splitOn){S.hidden=true;S.innerHTML=''}},330);  // timer, not .finished: hidden tabs pause animations
  V.style.visibility='';V.animate([{opacity:0},{opacity:1}],{duration:420,easing:'ease-out'});
}
function renderShelf(){
  $('#shelf').innerHTML=Object.entries(DOCS).map(([k,d])=>
    `<div class="thumb${k===doc?' on':''}" data-doc="${k}" title="Open: ${d.title}"><img data-thumb="${k}" src="${d.thumb||''}" alt=""><span>${d.short}</span></div>`).join('');
  document.querySelectorAll('img[data-thumb]').forEach(im=>{if(!im.getAttribute('src'))thumbOf(im.dataset.thumb).then(u=>im.src=u,()=>{})});
  $('#dname').textContent=DOCS[doc].title;
}
$('#shelf').addEventListener('click',e=>{const t=e.target.closest('.thumb');if(t){closeSplit();switchDoc(t.dataset.doc)}});

/* switching documents, animated like macOS Stage Manager:
   the new document grows out of its thumbnail into the view, the old one shrinks into its new thumbnail */
function switchDoc(k){
  if(k===doc)return Promise.resolve();
  const V=$('#view'),from=document.querySelector(`.thumb[data-doc="${k}"]`)?.getBoundingClientRect(),vr=V.getBoundingClientRect();
  const old=DOCS[doc];old.top=V.scrollTop;old.left=V.scrollLeft;old.cur=cur;
  $('#doc-'+doc).hidden=true;const prev=doc;doc=k;const d=DOCS[k];$('#doc-'+k).hidden=false;
  $('#zl').textContent=Math.round(d.zoom*100)+'%';V.scrollTop=d.top;V.scrollLeft=d.left;cur=d.cur;
  renderShelf();trackPage();
  const anims=[];
  if(from&&V.animate){
    const sc=from.height/vr.height;
    anims.push(V.animate([{transform:`translate(${from.left-vr.left}px,${from.top-vr.top}px) scale(${sc})`,opacity:.4,borderRadius:'8px'},
      {transform:'none',opacity:1,borderRadius:'0'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'}).finished);
    const t=document.querySelector(`.thumb[data-doc="${prev}"]`);
    if(t){const tr=t.getBoundingClientRect();
      anims.push(t.animate([{transform:`translate(${vr.left-tr.left}px,${vr.top-tr.top}px) scale(${vr.height/tr.height})`,opacity:0},
        {transform:'none',opacity:.85}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'}).finished)}
  }
  return Promise.all(anims);
}
function go(p){const far=Math.abs(p-cur)>3;cur=Math.max(1,Math.min(DOCS[doc].n,p));pageEl(doc,cur).scrollIntoView({block:'start',behavior:far?'auto':'smooth'})}  // long jumps skip the scroll animation so the pages in between are not drawn
$('#prev').onclick=()=>go(cur-1);$('#next').onclick=()=>go(cur+1);
// page counter follows the page under the top third of the view
function trackPage(){const y=$("#view").getBoundingClientRect().top+$("#view").clientHeight/2;let p=1;
  for(let i=1;i<=DOCS[doc].n;i++)if(pageEl(doc,i).getBoundingClientRect().top<=y)p=i;
  cur=p;const d=DOCS[doc];$('#pg').textContent='Page '+cur+' / '+d.n+(d.pl?` (p.${d.pl(cur)})`:'')}
$('#view').addEventListener('scroll',trackPage,{passive:true});

/* zoom (per document): buttons, or ctrl/⌘ + wheel and trackpad pinch; keeps the point under the cursor in place */
function setZoom(z,cx,cy){
  const V=$('#view'),P=$('#doc-'+doc),d=DOCS[doc],r=P.getBoundingClientRect(),vr=V.getBoundingClientRect();
  z=Math.max(.5,Math.min(4,z));if(z===d.zoom)return;
  const ax=cx??V.clientWidth/2,ay=cy??V.clientHeight/2;
  const fx=(ax-(r.left-vr.left))/r.width,fy=(ay-(r.top-vr.top))/r.height;
  d.zoom=z;P.style.width=(z*100)+'%';redrawNear();$('#zl').textContent=Math.round(z*100)+'%';
  const r2=P.getBoundingClientRect();
  V.scrollLeft+=(r2.left-vr.left)+fx*r2.width-ax;V.scrollTop+=(r2.top-vr.top)+fy*r2.height-ay;trackPage();
}
const zoom=()=>DOCS[doc].zoom;
$('#zin').onclick=()=>setZoom(zoom()*1.25);$('#zout').onclick=()=>setZoom(zoom()/1.25);$('#zfit').onclick=()=>setZoom(1);
$('#view').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();
  const vr=$('#view').getBoundingClientRect();setZoom(zoom()*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.004),e.clientX-vr.left,e.clientY-vr.top)},{passive:false});
let gz=1;  // Safari trackpad pinch
$('#view').addEventListener('gesturestart',e=>{e.preventDefault();gz=zoom()});
$('#view').addEventListener('gesturechange',e=>{e.preventDefault();setZoom(gz*e.scale)});
renderShelf();

/* the matching label in the slide drawing lights up too (default for every fact) */
// the box around what a group of a drawing really shows. getBBox would take a LaTeX label at the full width of its
// holder (600 units, see D.t), so labels are measured by their text and everything else by its own shape
function tightBox(g){const m=g.ownerSVGElement.getScreenCTM().inverse();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const add=r=>{if(!r.width&&!r.height)return;for(const [x,y] of [[r.left,r.top],[r.right,r.bottom]]){const p=new DOMPoint(x,y).matrixTransform(m);x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)}};
  g.querySelectorAll('*').forEach(e=>{const t=e.tagName.toLowerCase();
    if(t==='foreignobject'){const rg=document.createRange();rg.selectNodeContents(e.firstElementChild||e);for(const r of rg.getClientRects())add(r)}  // the label's text, not its 600-wide block
    else if(!e.closest('foreignObject')&&t!=='g'&&!e.classList.contains('hlbox'))add(e.getBoundingClientRect())});
  return x1<x0?g.getBBox():{x:x0,y:y0,width:x1-x0,height:y1-y0}}
function markDrawing(ref){
  document.querySelectorAll('svg .hlbox').forEach(r=>r.remove());
  if(!ref)return;
  document.querySelectorAll(`#s${si} svg .ref[data-ref="${ref}"]`).forEach(g=>{
    const b=tightBox(g),r=document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('class','hlbox');r.setAttribute('rx',4);
    for(const [k,v] of Object.entries({x:b.x-4,y:b.y-3,width:b.width+8,height:b.height+6}))r.setAttribute(k,v);
    g.insertBefore(r,g.firstChild)});
}
/* clicking a fact (either side) highlights it on both sides */
async function pick(ref,from){
  active=ref;const groups=groupSources(srcOf(ref));
  if(from!=='paper'){
    if(groups.length>1)openSplit(groups);
    else{closeSplit();if(groups[0]&&groups[0].k!==doc)await switchDoc(groups[0].k)}  // facts with no source (generic schematics) keep the current page
  }
  showPage();
  document.querySelectorAll('ol.facts li').forEach(li=>{const on=li.dataset.ref===ref&&li.closest('.slide').id==='s'+si;
    li.classList.toggle('on',on);li.classList.toggle('showai',on);  // the clicked fact opens its working, others fold
    const h=li.querySelector('.how');if(h)h.textContent=on?'hide':'how?'});
  markDrawing(ref);
  if(from!=='paper'){if(groups.length===1){const m=document.querySelector('#view .mk.on');m&&m.scrollIntoView({block:'center',inline:'center',behavior:'smooth'})}}
  else{const li=document.querySelector(`#s${si} ol.facts li[data-ref="${ref}"]`);li&&li.scrollIntoView({block:'nearest',behavior:'smooth'})}
}

/* ---- slide side: all slides in one scrolling column ---- */
/* A slide that fails (a broken file, a fact citing a place that is not in refs.js, an error while drawing) becomes an error card
   in its own place; the other slides render as usual. The rule check reports every failed slide. */
const slideErrors=[];
function failSlide(i,e){const s=SLIDES[i],msg=String(e&&e.message||e);slideErrors.push(`slide ${i+1} (${s.id||s.title}): ${msg}`);console.error('slide '+(i+1),e);
  SLIDES[i]={id:s.id,title:s.title||s.id||'',facts:[],svg:()=>'',foot:'',error:msg};
  return `<div class="bar">Slide ${i+1}</div><div class="slide" id="s${i}" data-i="${i}"><h2></h2><div class="slerr"><b>This slide could not be shown</b> (${s.id?'slides/'+s.id+'.js':'slide '+(i+1)})<pre></pre></div></div>`}
function slideHTML(s,i){si=i;  // D.ref numbers badges from SLIDES[si]
  if(s.error)throw new Error(s.error);
  for(const f of s.facts)for(const id of (f.src||[f.ref]))if(!REFS[id])throw new Error(`fact "${f.ref}" cites "${id}", which is not in refs.js`);
  return `<div class="bar">Slide ${i+1}<span class="aitag">AI-made · ${AI_MODEL}</span></div><div class="slide${s.wide?" wide":""}" id="s${i}" data-i="${i}"><h2>${texify(s.title)}</h2>
   <div class="sbody"><div class="dgm">${s.svg()}</div>
   <ol class="facts">${factList().map(f=>`${f.group?`<li class="grp">${f.group}</li>`:''}<li data-ref="${f.ref}"><span class="n${f.n==='AI'||f.n==='?'?' nai':''}">${f.n}</span><span>${texify(f.html)} ${f.html.includes('class="ai"')?'<button class="how" title="Show how this was worked out">how?</button>':''} <span class="pg">${[...new Set((f.src||[f.ref]).map(id=>{const r=REFS[id];return (d=>d.short+' p.'+(d.pl?d.pl(r.page):r.page))(DOCS[r.doc||MAIN])}))].join(', ')}</span></span></li>`).join('')}</ol></div>
   <div class="sfoot">${texify(s.foot)}</div></div>`}
function renderSlides(){
  $('#slot').innerHTML=SLIDES.map((s,i)=>{try{return slideHTML(s,i)}catch(e){return failSlide(i,e)}}).join('');
  SLIDES.forEach((s,i)=>{si=i;if(s.error){const el=$('#s'+i);el.querySelector('h2').textContent=s.title;el.querySelector('pre').textContent=s.error;return}
    try{s.init&&s.init($('#s'+i))}catch(e){$('#s'+i).outerHTML=failSlide(i,e).replace(/^<div class="bar">.*?<\/div>/,'');const el=$('#s'+i);el.querySelector('h2').textContent=SLIDES[i].title;el.querySelector('pre').textContent=SLIDES[i].error}});  // interactive slides wire up their drag handles
  renderTex($('#slot'));
  si=0;setSlide(0);
}
// the slide under the top third of the view decides which frames the paper shows
function setSlide(i){
  if(i!==si){si=i;active=null;document.querySelectorAll('ol.facts li.on').forEach(li=>li.classList.remove('on'));markDrawing(null);closeSplit()}
  $('#sn').textContent=`Slide ${si+1} / ${SLIDES.length}`;
  $('#sprev').disabled=si===0;$('#snext').disabled=si===SLIDES.length-1;showPage();
}
function trackSlide(){const y=innerHeight/3;let i=0;
  SLIDES.forEach((_,k)=>{if($('#s'+k).getBoundingClientRect().top<=y)i=k});if(i!==si)setSlide(i)}
$('#right').addEventListener('scroll',trackSlide,{passive:true});addEventListener('scroll',trackSlide,{passive:true});
$('#slot').addEventListener('click',e=>{const h=e.target.closest('.how');
  if(h){const li=h.closest('li');li.classList.toggle('showai');h.textContent=li.classList.contains('showai')?'hide':'how?';return}
  const t=e.target.closest('[data-ref]');if(!t)return;
  const i=+t.closest('.slide').dataset.i;if(i!==si)setSlide(i);pick(t.dataset.ref,'slide')});
const goSlide=i=>$('#s'+Math.max(0,Math.min(SLIDES.length-1,i))).scrollIntoView({block:'start',behavior:'smooth'});
$('#sprev').onclick=()=>goSlide(si-1);$('#snext').onclick=()=>goSlide(si+1);
renderSlides();
/* after a refresh, both sides come back to where the reader was (this browser only) */
(()=>{if(/[?&]check/.test(location.search))return;
  const K=DECK.key||'reading-view',R=$('#right'),V=$('#view');let st=null,moved=false;
  try{st=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}
  const save=()=>{try{localStorage.setItem(K,JSON.stringify({r:R.scrollTop,w:scrollY,doc,z:DOCS[doc].zoom,v:V.scrollTop,vl:V.scrollLeft}))}catch(e){}};
  const apply=()=>{if(!st||moved)return;R.scrollTop=st.r||0;scrollTo(0,st.w||0);
    if(st.z&&Math.abs(st.z-DOCS[doc].zoom)>.01)setZoom(st.z);V.scrollTop=st.v||0;V.scrollLeft=st.vl||0;trackSlide();trackPage()};
  if(st){if(st.doc&&DOCS[st.doc]&&st.doc!==doc)switchDoc(st.doc);apply();setTimeout(apply,900)}  // second pass once PDF pages have their real shape
  let t=0;const later=()=>{clearTimeout(t);t=setTimeout(save,250)};
  ['wheel','touchstart','keydown','mousedown'].forEach(e=>addEventListener(e,()=>{moved=true},{passive:true,once:true}));
  R.addEventListener('scroll',later,{passive:true});V.addEventListener('scroll',later,{passive:true});addEventListener('scroll',later,{passive:true});addEventListener('pagehide',save);
})();
/* ---- rule check: every number on a drawing or readout is either clickable to its source ([data-ref]) or marked AI ---- */
function numberCheck(){
  const NUM=/\d*\.?\d+\s*(°|%|mm|µm|μm|nm|cm|MHz|kHz|Hz|mrad|rad|ms|µs|μs|ns|m\b|s\b|\/mm|mm⁻¹|grooves)|\d+\.\d+/;
  const ok=el=>el.closest('[data-ref],.ai,.aiv,.aitag,ol.facts,h2,.bar,.axis');  // .axis: tick labels are a scale, not claims
  const aiNext=n=>{let x=n.nextSibling;while(x&&x.nodeType===3&&!x.textContent.trim())x=x.nextSibling;return x&&x.nodeType===1&&x.classList.contains('aitg')};
  const bad=[];
  document.querySelectorAll('#slot .slide').forEach((sl,i)=>{
    // svg labels: each <text> / foreignObject is one label
    sl.querySelectorAll('svg text, svg foreignObject').forEach(el=>{if(el.closest('foreignObject')!==el&&el.tagName!=='text')return;
      const txt0=el.tagName==='text'?el.textContent:[...el.querySelectorAll('div')].slice(0,1).map(d=>{const c=d.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(m=>m.remove());return c.textContent})[0]||'',txt=txt0.replace(/§\s*[\d.]+/g,'');
      if(NUM.test(txt)&&!ok(el)&&!txt.includes('(AI)'))bad.push(`slide ${i+1}: "${txt.trim()}"`)});
    // html outside the fact list (readouts, foot): text nodes and KaTeX blocks
    const walk=document.createTreeWalker(sl,NodeFilter.SHOW_TEXT);let n;
    while(n=walk.nextNode()){const p=n.parentElement;if(p.closest('svg,.katex-mathml'))continue;
      const k=p.closest('.katex'),seg=k||n,txt=k?(()=>{const c=k.cloneNode(true);c.querySelectorAll('.katex-mathml').forEach(m=>m.remove());return c.textContent})():n.textContent.replace(/§\s*[\d.]+/g,'');
      if(NUM.test(txt)&&!ok(p)&&!aiNext(seg))bad.push(`slide ${i+1}: "${txt.trim()}"`)}
  });
  return [...new Set(bad)]}
// rule check 2: a source panel must hold every page of its PDF; check-numbers.sh also checks DOCS.n against the real page count
function pdfCheck(){const bad=[],ids=Object.keys(REFS).filter(id=>REFS[id].page);
  for(const k of Object.keys(DOCS)){const id=ids.find(i=>(REFS[i].doc||MAIN)===k);if(!id)continue;
    openSplit(groupSources([id]),1);const n=document.querySelectorAll('#split .pane .pstage').length;if(n!==DOCS[k].n)bad.push(`${k}: source panel shows ${n} of ${DOCS[k].n} pages`)}
  closeSplit();return bad}
setTimeout(()=>{const b=slideErrors.concat(numberCheck());if(b.length)console.warn('number check: '+b.length+' unsourced numbers\n'+b.join('\n'));
  if(/[?&]check/.test(location.search)){const all=b.concat(pdfCheck()),pre=document.createElement('pre');pre.id='numcheck';pre.textContent=all.length?'FAIL\n'+all.join('\n'):'PASS';document.body.prepend(pre)}},1500);
