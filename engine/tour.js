/* Guided tour (optional). A deck that sets DECK.tour gets a "Guided tour" button and, on the first visit, an offer to start it.
   Each step points at one element (spotlight, ring, popup). Two kinds of step:
   - an action step (it has `do`): the ring is green, a green tag ("Click here") and an animated pointer show where and how;
     once the reader has done it the shade lifts, the popup says what happened (`after`) and waits for Next,
     so the reader can look at the result for as long as they like;
   - an information step: yellow ring, a Next button.
   step = {at: CSS selector of what the ring goes around, looked up again while the step is open (some targets appear only after the previous action),
           hit: CSS selector of the area where the action counts, when that is larger than `at` (default: `at`),
           text: html, do: 'what to do' (action step), after: 'what happened',
           wait: ms, only for an action whose result needs no looking at: move on by itself after this time,
           spot: [fx, fy] where in the target the pointer shows (fractions, default the middle),
           gesture: 'drag' for a drag, 'scroll' for scrolling inside the target, instead of a click,
           shade: false to leave the rest of the page undimmed (when the step is about several places at once),
           side: 'below' | 'above' | 'left' | 'right': where the popup goes (default: below, or beside a tall target)} */
(()=>{
  const steps=DECK.tour;if(!steps||!steps.length||/[?&]check/.test(location.search))return;
  const KEY=(DECK.key||'reading')+'-tour';
  document.querySelector('header').insertAdjacentHTML('beforeend','<button class="btn" id="tourbtn" style="margin-left:auto">Guided tour</button>');
  const ov=document.createElement('div');ov.id='tour';ov.hidden=true;
  ov.innerHTML='<div class="tshade"></div><div class="tshade"></div><div class="tshade"></div><div class="tshade"></div><div class="tring"></div>'+
    '<div class="tgo"><span></span><svg viewBox="0 0 20 20"><path d="M3 10H16M10 4L16 10L10 16"/></svg></div>'+
    '<div class="ttap"><i></i><svg viewBox="0 0 24 24"><path d="M5 2V19L9.6 14.6L12.6 21.6L15.6 20.3L12.6 13.4H19Z"/></svg></div>'+
    '<div class="tscr"><i></i></div>'+
    '<div class="tpop"><div class="tarrow"></div><div class="tn"></div><div class="tt"></div><div class="tdo"></div><div class="tb"><button class="btn tskip">End tour</button><button class="btn tnext">Next</button></div></div>';
  document.body.appendChild(ov);
  const q=s=>ov.querySelector(s),sh=[...ov.querySelectorAll('.tshade')],ring=q('.tring'),go=q('.tgo'),tap=q('.ttap'),scr=q('.tscr'),pop=q('.tpop'),arrow=q('.tarrow'),tdo=q('.tdo');
  let i=-1,tick=0,armed=false,seen=null,t0=0,settled=false,where='';
  const box=(e,l,t,w,h)=>{e.style.left=l+'px';e.style.top=t+'px';e.style.width=Math.max(0,w)+'px';e.style.height=Math.max(0,h)+'px'};
  const smooth=()=>document.hidden?'auto':'smooth';
  // Scrolling. The reader should see the drawing together with the target. Tried in this order, the first that fits is
  // moved into view by the shortest way (nothing moves if it already is in view):
  //   the target with the slide's whole drawing; the target with the parts of the drawing linked to the same fact; the target alone.
  // If not even the target fits, it goes as low as it can, which keeps the most of the drawing above it.
  function bring(el,now){const st=steps[i];let sc=null;for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+2){sc=p;break}}
    const r=el.getBoundingClientRect(),c=sc?sc.getBoundingClientRect():{top:0,height:innerHeight};
    const top=c.top+48,bot=c.top+c.height-(st.side==='left'||st.side==='right'?16:Math.min(250,c.height*.32));  // room under the target for the popup
    const span=els=>{let t=r.top,b=r.bottom;els.forEach(x=>{const q=x.getBoundingClientRect();if(q.height){t=Math.min(t,q.top-30);b=Math.max(b,q.bottom)}});return [t,b]};
    const sl=el.closest('.slide'),id=el.dataset&&el.dataset.ref,tries=[];
    if(sl){tries.push(span(sl.querySelectorAll('svg')));if(id)tries.push(span(sl.querySelectorAll(`svg [data-ref="${id}"]`)))}
    tries.push([r.top,r.bottom]);
    const f=tries.find(([t,b])=>b-t<=bot-top),d=f?(f[0]<top?f[0]-top:f[1]>bot?f[1]-bot:0):Math.min(r.bottom-bot,r.top-top);
    if(Math.abs(d)>8)(sc||window).scrollBy({top:d,behavior:now?'auto':smooth()})}
  function place(){const st=steps[i],el=document.querySelector(st.at),W=innerWidth,H=innerHeight;
    if(!W||!H)return;  // the window is not laid out yet
    if(el&&el!==seen){seen=el;bring(el)}
    if(el&&!settled&&Date.now()-t0>900){settled=true;bring(el,true)}  // a smooth scroll that did not arrive (it stalls in a window that is not being drawn): jump
    let r0=el&&el.getBoundingClientRect();
    if(r0&&el.ownerSVGElement){const s=el.ownerSVGElement.getBoundingClientRect(),l=Math.max(r0.left,s.left),tp=Math.max(r0.top,s.top);  // part of a drawing: only what the drawing shows
      r0={left:l,top:tp,right:Math.min(r0.right,s.right),bottom:Math.min(r0.bottom,s.bottom)};r0.width=r0.right-r0.left;r0.height=r0.bottom-r0.top}
    const ok=r0&&r0.width>0&&r0.bottom>0&&r0.top<H;
    if(el&&!ok&&Date.now()-t0>900){t0=Date.now();bring(el,true)}  // smooth scrolling did not get there (it stalls in a background window): jump
    ring.hidden=!ok;go.hidden=!ok||!st.do||armed;tap.hidden=go.hidden||st.gesture==='scroll';scr.hidden=go.hidden||st.gesture!=='scroll';
    if(!ok){box(sh[0],0,0,W,H);sh.slice(1).forEach(s=>box(s,0,0,0,0));pop.style.left=(W-pop.offsetWidth)/2+'px';pop.style.top=(H-pop.offsetHeight)/2+'px';arrow.hidden=true;return}
    const p=6,r={l:Math.max(0,r0.left-p),t:Math.max(0,r0.top-p),r:Math.min(W,r0.right+p),b:Math.min(H,r0.bottom+p)};
    box(sh[0],0,0,W,r.t);box(sh[1],0,r.b,W,H-r.b);box(sh[2],0,r.t,r.l,r.b-r.t);box(sh[3],r.r,r.t,W-r.r,r.b-r.t);
    box(ring,r.l,r.t,r.r-r.l,r.b-r.t);
    // the popup. Its side is chosen once per step and kept (it must not jump when its text changes):
    // the step's `side`, else beside a tall target, else below (above only when there is no room below)
    const pw=pop.offsetWidth,ph=pop.offsetHeight,cx=(r.l+r.r)/2,cy=(r.t+r.b)/2;
    const side=where||st.side||(r.b-r.t>H*.5?(W-r.r>=pw+26?'right':r.l>=pw+26?'left':'in'):(r.b+14+ph+30<H||r.t-14-ph<0?'below':'above'));
    if(armed||settled&&Date.now()-t0>1300)where=side;  // kept from the moment the page has stopped moving to the target
    let left,top,ar='';
    if(side==='left'||side==='right'){top=Math.max(12,Math.min(H-ph-12,cy-ph/2));left=side==='right'?Math.min(W-pw-12,r.r+14):Math.max(12,r.l-pw-14)}
    else if(side==='in'){left=Math.max(12,Math.min(W-pw-12,r.r-pw-18));top=Math.max(12,r.b-ph-18)}
    else{left=Math.max(12,Math.min(W-pw-12,cx-pw/2));top=side==='below'?Math.min(H-ph-12,r.b+14):Math.max(12,r.t-14-ph);ar=side==='below'?'up':'down'}
    pop.style.left=left+'px';pop.style.top=top+'px';arrow.hidden=!ar;arrow.className='tarrow '+ar;arrow.style.left=Math.max(16,Math.min(pw-30,cx-left-7))+'px';
    // an action step: a green "Click here" tag with an arrow, left of the target (above it when there is no room or it would cover the slide),
    // and a pointer that taps (or drags) on the spot to press
    if(!go.hidden){const sp=st.spot||[.5,.5],sx=r0.left+sp[0]*r0.width,sy=r0.top+sp[1]*r0.height,drag=st.gesture==='drag';
      go.firstChild.textContent=drag?'Drag here':st.gesture==='scroll'?'Scroll here':'Click here';go.className='tgo';
      const sl=el.closest('.slide'),over=sl&&r.l-go.offsetWidth-10>sl.getBoundingClientRect().left+8;  // left of the target it would sit on other content of the slide
      if(r.l>=go.offsetWidth+16&&!over){go.style.left=r.l-go.offsetWidth-10+'px';go.style.top=cy-go.offsetHeight/2+'px'}
      else{go.className='tgo down';go.style.left=Math.max(6,Math.min(W-go.offsetWidth-6,sx-go.offsetWidth/2))+'px';go.style.top=Math.max(4,r.t-go.offsetHeight-10)+'px'}
      tap.className='ttap'+(drag?' drag':'');tap.style.left=scr.style.left=sx+'px';tap.style.top=scr.style.top=sy+'px'}}
  function show(k){i=k;armed=false;settled=false;where='';ov.classList.remove('lit');seen=null;t0=Date.now();if(i>=steps.length)return end();const st=steps[i];
    q('.tn').textContent=`Step ${i+1} of ${steps.length}`;q('.tt').innerHTML=st.text;
    tdo.hidden=!st.do;tdo.className='tdo';tdo.innerHTML=st.do?'<span class="tdoi"></span>'+st.do:'';
    ring.className='tring'+(st.do?' act':'');
    const n=q('.tnext');n.textContent=i===steps.length-1?'Finish':st.do?'Skip this step':'Next';n.className='btn tnext'+(st.do?'':' main');
    ov.classList.toggle('lit',st.shade===false);ov.hidden=false;clearInterval(tick);tick=setInterval(place,80);place()}
  function end(){clearInterval(tick);ov.hidden=true;i=-1;try{localStorage.setItem(KEY,'1')}catch(e){}}
  q('.tnext').onclick=()=>show(i+1);q('.tskip').onclick=end;
  // the reader did what the step asks: lift the shade (what just changed is shown undimmed) and say what happened.
  // The reader then presses Next; only a step with `wait` moves on by itself.
  function done(){const st=steps[i],k=i;armed=true;place();ov.classList.add('lit');
    tdo.className='tdo done';tdo.innerHTML='<span class="tdoi"></span>'+(st.after||'Done.');
    const n=q('.tnext');n.textContent=i===steps.length-1?'Finish':'Next';n.className='btn tnext main';
    if(st.wait)setTimeout(()=>{if(i===k)show(k+1)},st.wait)}
  const inTarget=(st,t)=>t.nodeType===1&&!!t.closest(st.hit||st.at);  // any element the selector matches, not only the first
  addEventListener('pointerdown',e=>{if(i<0||armed)return;const st=steps[i];if(st.do&&st.gesture!=='scroll'&&inTarget(st,e.target))done()},true);
  // a scroll step: the reader scrolls inside the target (the first moments are skipped: the page may still be moving there by itself)
  addEventListener('scroll',e=>{if(i<0||armed)return;const st=steps[i];if(st.do&&st.gesture==='scroll'&&Date.now()-t0>800&&inTarget(st,e.target))done()},true);
  addEventListener('keydown',e=>{if(i>=0&&e.key==='Escape')end()});
  document.querySelector('#tourbtn').onclick=()=>{document.querySelector('#touroffer')?.remove();show(0)};
  // first visit: offer the tour once
  let first=true;try{first=!localStorage.getItem(KEY)}catch(e){}
  if(first){const o=document.createElement('div');o.id='touroffer';
    o.innerHTML='<div class="tpop"><div class="tn">First time here</div><div class="tt"><b>Take the guided tour?</b> It points at the few things this page does and has you try each one. About two minutes.</div><div class="tb"><button class="btn tskip">Not now</button><button class="btn tnext main">Start the tour</button></div></div>';
    document.body.appendChild(o);
    o.querySelector('.tskip').onclick=()=>{o.remove();try{localStorage.setItem(KEY,'1')}catch(e){}};
    o.querySelector('.tnext').onclick=()=>{o.remove();show(0)}}
})();
