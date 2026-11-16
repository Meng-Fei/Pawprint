SLIDES.push({
 title:'Workflow: reading a paper with an AI, with every claim linked to its source',
 wide:true,
 facts:[],
 svg:()=>`<svg viewBox="0 0 1000 524" role="img" aria-label="Animated schematic of the workflow in five steps: your AI reads GUIDE.md and sets the tool up; you name a paper; the AI builds slides whose facts are numbered when they come from the source and marked AI when the AI worked them out; you click a numbered fact and the original PDF opens at the passage; you send a screenshot and the AI adds or revises slides" style="color:var(--ink);touch-action:none">${DEFS}
 <defs><clipPath id="wfpdf"><rect x="333" y="106" width="272" height="352" rx="3"/></clipPath><clipPath id="wfwin"><rect x="308" y="62" width="672" height="404" rx="12"/></clipPath></defs><g id="wf"></g></svg>`,
 init:el=>{const svg=el.querySelector('svg'),g=svg.querySelector('#wf');
  const STEPS=[
   {t:'AI reads GUIDE.md',s:'Hand GUIDE.md to your own AI. It adapts the tool to your computer and opens the page.',d:5},
   {t:'You name a paper',s:'Give it the PDF you want to read. The original appears on the left, in full.',d:4.5},
   {t:'AI builds slides',s:'Facts from the source get a number; anything the AI worked out is marked AI. You can also tell it which slide to make.',d:6.5},
   {t:'You check a claim',s:'Click a numbered fact: it lights up, and the original PDF opens at the passage it comes from.',d:7},
   {t:'You discuss, AI revises',s:'Send a screenshot of what is unclear. Slides are added when needed and revised in place.',d:7}];
  const cl=x=>Math.max(0,Math.min(1,x)),ez=x=>x*x*(3-2*x),mix=(u,v,t)=>u+(v-u)*t,f=x=>x.toFixed(1);
  let k=0,p=0,play=true,vis=false,last=0,T=0;
  // a(j,t0,t1): how far an element that enters during step j, between t0 and t1 of that step, has come in (0…1); it stays once the step is over
  const a=(j,t0,t1)=>k>j?1:k<j?0:ez(cl((p-t0)/(t1-t0)));
  const chip=(x,y,name)=>`<rect x="${x}" y="${y}" width="${name.length*5+20}" height="15" rx="4" fill="var(--card)" stroke="var(--line)"/><path d="M${x+5} ${y+3.5}h5l2 2v6h-7z" fill="none" stroke="var(--mute)" stroke-width=".9"/><text x="${x+15}" y="${y+11}" font-size="8.5" fill="var(--mute)">${name}</text>`;
  const bub=(y,me,lines,al,extra='')=>{if(al<=0)return '';const w=226,x=me?56:30,hh=20+lines.length*14;
   return `<g opacity="${al.toFixed(2)}" transform="translate(0 ${f((1-al)*8)})"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="10" fill="${me?'var(--accent)':'var(--card)'}" fill-opacity="${me?.13:1}" stroke="${me?'var(--accent)':'var(--line)'}" stroke-opacity="${me?.45:1}"/>
   <text x="${x+10}" y="${y+14}" font-size="8" font-weight="700" letter-spacing=".6" fill="var(--mute)">${me?'YOU':'YOUR AI'}</text>`+lines.map((l,i)=>`<text x="${x+10}" y="${y+28+i*14}" font-size="10.5" fill="currentColor">${l}</text>`).join('')+(extra?extra(x,y,w):'')+`</g>`};
  const draw=()=>{let h='';
   // the five steps: click one to jump to it
   STEPS.forEach((s,j)=>{const x=20+j*176,on=j===k,dn=j<k;
    h+=`<g data-k="${j}" style="cursor:pointer"><rect x="${x}" y="6" width="168" height="42" rx="10" fill="${on?'var(--hl)':'var(--card)'}" stroke="${on?'var(--hlb)':'var(--line)'}" stroke-width="${on?1.6:1}"/>
    <circle cx="${x+22}" cy="27" r="11" fill="${on||dn?'var(--hlb)':'none'}" stroke="${on||dn?'var(--hlb)':'var(--mute)'}"/><text x="${x+22}" y="31" font-size="11" font-weight="700" text-anchor="middle" fill="${on||dn?'#000':'var(--mute)'}">${j+1}</text>
    <text x="${x+38}" y="31" font-size="10.5" font-weight="${on?700:400}" fill="currentColor">${s.t}</text>${on?`<rect x="${x+12}" y="42" width="${f(144*cl(p))}" height="2.5" rx="1.2" fill="var(--hlb)"/>`:''}</g>`});
   // left: the conversation
   h+=`<rect x="20" y="62" width="272" height="404" rx="12" fill="var(--bg)" stroke="var(--line)"/><text x="34" y="81" font-size="8.5" font-weight="700" letter-spacing=".6" fill="var(--mute)">CHAT WITH YOUR AI</text><text x="140" y="81" font-size="8.5" fill="var(--mute)">e.g. the Claude app</text>`;
   h+=bub(92,1,['Read GUIDE.md and set this','up on my computer.'],a(0,.05,.2),(x,y,w)=>chip(x+w-68,y+5,'GUIDE.md'));
   h+=bub(148,0,['Done. The page is open','in your browser.'],a(0,.5,.65));
   h+=bub(204,1,['Let us study this paper.'],a(1,.05,.2),(x,y,w)=>chip(x+w-73,y+5,'paper.pdf'));
   h+=bub(246,0,['The slides are ready. Numbered','facts open the source; my own','working is marked (AI).'],a(2,.72,.86));
   h+=bub(316,1,['This step is unclear to me.'],a(4,.46,.58),(x,y,w)=>`<rect x="${x+w-42}" y="${y+5}" width="32" height="20" rx="3" fill="var(--accent)" fill-opacity=".15" stroke="var(--accent)"/><path d="${WV.path(x+w-38,x+w-14,X=>y+15-4*Math.sin((X-x)/3.4),1)}" fill="none" stroke="var(--t-red)" stroke-width="1"/>`);
   h+=bub(358,0,['Added a slide for that step','and revised this one.'],a(4,.66,.78));
   // right: the reading page in the browser
   const wa=a(0,.55,.85);
   if(wa>0){h+=`<g opacity="${wa.toFixed(2)}" clip-path="url(#wfwin)"><rect x="308" y="62" width="672" height="404" rx="12" fill="var(--card)" stroke="var(--line)"/><path d="M308 86H980M616 86V466" stroke="var(--line)"/>
    ${[0,1,2].map(i=>`<circle cx="${324+i*13}" cy="74" r="4" fill="var(--line)"/>`).join('')}<text x="644" y="78" font-size="9.5" text-anchor="middle" fill="var(--mute)">your browser: the reading page</text>
    <text x="334" y="100" font-size="8" font-weight="700" letter-spacing=".6" fill="var(--mute)">THE ORIGINAL PDF</text><text x="630" y="100" font-size="8" font-weight="700" letter-spacing=".6" fill="var(--mute)">SLIDES</text>`;
    // the PDF: a page of text lines; in step 4 it jumps to the cited passage (lines 27–29)
    const pa=a(1,.3,.55),N=46,sc=a(3,.38,.68)*270,yL=i=>122+i*15-sc,shown=Math.round(a(1,.4,.95)*N),ma=a(3,.66,.8),ym=yL(28);
    if(pa>0){h+=`<g opacity="${pa.toFixed(2)}" clip-path="url(#wfpdf)"><rect x="333" y="106" width="272" height="352" fill="#fff" stroke="var(--line)"/>`;
     if(ma>0)h+=`<rect x="412" y="${f(ym-4)}" width="104" height="12" fill="#ffe033" opacity="${(ma*.9).toFixed(2)}"/>`;
     for(let i=0;i<shown;i++){const y=yL(i);if(y<96||y>470)continue;const end=i%9===8,w=i===0?150:end?90+((i*37)%70):236-((i*53)%28);
      h+=`<rect x="${i===0?395:354}" y="${f(y)}" width="${w}" height="${i===0?6:4}" rx="2" fill="${i===0?'#5b6270':i>=27&&i<=29&&ma>0?'#8a909c':'#c9ccd3'}"/>`}
     if(ma>0){h+=`<g opacity="${ma.toFixed(2)}"><rect x="346" y="${f(yL(27)-4)}" width="3.2" height="42" rx="1.5" fill="#e0342b"/><circle cx="340" cy="${f(ym+2)}" r="6.5" fill="#e0342b"/><text x="340" y="${f(ym+5)}" font-size="8" font-weight="700" text-anchor="middle" fill="#fff">2</text></g>`;
      const pu=k===3?cl((p-.8)/.2):1;if(pu<1)h+=`<circle cx="340" cy="${f(ym+2)}" r="${f(6.5+12*pu)}" fill="none" stroke="#e0342b" stroke-width="2" opacity="${(1-pu).toFixed(2)}"/>`}
     h+=`</g>`}
    // the slide: a drawing and three facts, two with source numbers, one marked AI
    const sa=a(2,.05,.25);
    if(sa>0){const yR=[292,326,360],rv=a(4,.7,.85);
     h+=`<g opacity="${sa.toFixed(2)}" transform="translate(0 ${f((1-sa)*12)})"><rect x="630" y="106" width="338" height="290" rx="8" fill="var(--card)" stroke="var(--line)"/>
     <rect x="646" y="122" width="190" height="8" rx="3" fill="currentColor" opacity=".75"/><path d="M646 139H952" stroke="var(--line)" stroke-width="1.5"/>
     <rect x="646" y="148" width="306" height="118" rx="6" fill="var(--bg)" stroke="var(--line)"/><rect x="900" y="152" width="48" height="13" rx="3" fill="var(--card)" stroke="var(--line)"/><text x="924" y="161.5" font-size="7.5" text-anchor="middle" fill="var(--mute)">AI-made</text>
     <path d="M660 207H938" stroke="var(--line)"/><path d="${WV.path(660,938,x=>207-30*Math.sin((x-660)/21-T*1.6)*Math.exp(-(((x-800)/120)**2)),2)}" fill="none" stroke="var(--t-red)" stroke-width="1.7"/>
     ${rv>0?`<path d="${WV.path(660,938,x=>207-18*Math.sin((x-660)/12-T*2.4)*Math.exp(-(((x-760)/90)**2)),2)}" fill="none" stroke="var(--t-blue)" stroke-width="1.4" opacity="${rv.toFixed(2)}"/><g opacity="${rv.toFixed(2)}"><rect x="906" y="118" width="46" height="15" rx="7.5" fill="var(--t-green)" fill-opacity=".15" stroke="var(--t-green)"/><text x="929" y="128.5" font-size="8.5" font-weight="700" text-anchor="middle" fill="var(--t-green)">revised</text></g>`:''}
     <circle cx="664" cy="164" r="7" fill="var(--hlb)"/><text x="664" y="167.5" font-size="9" font-weight="700" text-anchor="middle" fill="#000">1</text>`;
     yR.forEach((y,j)=>{const ra=a(2,.3+.13*j,.42+.13*j);if(ra<=0)return;
      h+=`<g opacity="${ra.toFixed(2)}">`+(j===1?`<rect x="638" y="${y-14}" width="322" height="28" rx="5" fill="var(--hl)" opacity="${a(3,.3,.4).toFixed(2)}"/>`:'')
       +(j<2?`<circle cx="656" cy="${y}" r="9" fill="var(--hlb)"/><text x="656" y="${y+3.6}" font-size="10" font-weight="700" text-anchor="middle" fill="#000">${j+1}</text>`
            :`<rect x="646" y="${y-8}" width="20" height="16" rx="5" fill="none" stroke="var(--mute)"/><text x="656" y="${y+3}" font-size="8" text-anchor="middle" fill="var(--mute)">AI</text>`)
       +`<rect x="676" y="${y-7}" width="${[262,240,214][j]}" height="5" rx="2.5" fill="currentColor" opacity=".3"/><rect x="676" y="${y+3}" width="${[180,206,120][j]}" height="5" rx="2.5" fill="currentColor" opacity=".3"/>`
       +(j===2?`<text x="804" y="${y+9}" font-size="9.5" fill="var(--mute)">(AI)</text>`:'')+`</g>`});
     h+=`</g>`;
     // step 5: a new slide joins the deck
     const na=a(4,.8,.96);if(na>0)h+=`<g opacity="${na.toFixed(2)}" transform="translate(0 ${f((1-na)*40)})"><rect x="630" y="408" width="338" height="70" rx="8" fill="var(--card)" stroke="var(--line)"/><rect x="646" y="424" width="150" height="8" rx="3" fill="currentColor" opacity=".75"/><rect x="646" y="442" width="306" height="30" rx="6" fill="var(--bg)" stroke="var(--line)"/>
      <rect x="892" y="419" width="60" height="15" rx="7.5" fill="var(--t-green)" fill-opacity=".15" stroke="var(--t-green)"/><text x="922" y="429.5" font-size="8.5" font-weight="700" text-anchor="middle" fill="var(--t-green)">new slide</text></g>`;
     // step 4: the fact and its passage are linked
     const ca=a(3,.72,.92);if(ca>0)h+=`<path d="M642 326C618 326 632 ${f(ym+2)} 610 ${f(ym+2)}" fill="none" stroke="var(--hlb)" stroke-width="1.8" stroke-dasharray="5 3" marker-end="url(#ah)" style="color:var(--hlb)" opacity="${ca.toFixed(2)}"/>`}
    h+=`</g>`;
    // step 4: the pointer clicks fact 2
    if(k===3&&p<.6){const e=ez(cl((p-.04)/.26)),x=mix(596,662,e),y=mix(440,331,e),rp=cl((p-.3)/.16);
     if(p>.3&&rp<1)h+=`<circle cx="662" cy="331" r="${f(5+16*rp)}" fill="none" stroke="var(--hlb)" stroke-width="2.4" opacity="${(1-rp).toFixed(2)}"/>`;
     h+=`<path d="M0 0V15L4 11L7 17.5L9.6 16.4L6.6 10H12Z" transform="translate(${f(x)} ${f(y)})" fill="currentColor" stroke="var(--card)" stroke-width="1.2"/>`}
    // step 5: a screenshot of the unclear part goes into the chat
    if(k===4){const s1=ez(cl((p-.05)/.15)),fl=ez(cl((p-.22)/.26));
     if(p<.5)h+=`<rect x="${f(mix(700,240,fl))}" y="${f(mix(160,321,fl))}" width="${f(mix(170,32,fl))}" height="${f(mix(96,20,fl))}" rx="3" fill="var(--accent)" fill-opacity=".1" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="${fl>0?'none':'5 3'}" opacity="${s1.toFixed(2)}"/>`}}
   // what this step is
   h+=`<text x="490" y="492" font-size="14.5" font-weight="700" text-anchor="middle" fill="currentColor">${STEPS[k].t}</text><text x="490" y="512" font-size="11.5" text-anchor="middle" fill="var(--mute)">${STEPS[k].s}</text>`;
   h+=`<g class="wfplay" style="cursor:pointer"><title>${play?'pause':'play'}</title><rect x="948" y="480" width="26" height="26" rx="6" fill="var(--card)" stroke="var(--line)"/>${play?'<path d="M957 487V499M965 487V499" stroke="currentColor" stroke-width="2.6"/>':'<path d="M957 486L968 493L957 500Z" fill="currentColor"/>'}</g>`;
   g.innerHTML=h};
  svg.addEventListener('pointerdown',e=>{const s=e.target.closest('[data-k]');if(s){k=+s.dataset.k;p=0;draw();return}
   if(e.target.closest('.wfplay')){play=!play;draw()}});
  svg._seek=(step,part)=>{k=step;p=part;play=false;draw()};   // show one fixed frame (used when checking the drawing)
  // the rule check renders a fixed frame (step 4, finished); otherwise the animation runs while the slide is on screen
  if(/[?&]check/.test(location.search)){k=3;p=1;draw();return}
  new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(svg);
  const frame=ts=>{const dt=Math.min(.1,(ts-last)/1000||0);last=ts;
   if(vis){T+=dt;if(play){p+=dt/STEPS[k].d;if(p>=1.3){p=0;k=(k+1)%STEPS.length}}draw()}
   requestAnimationFrame(frame)};
  draw();requestAnimationFrame(frame)},
 foot:'Schematic of the workflow (AI-made). The number badges, the AI mark, the red margin bar and the yellow highlight are the ones this page itself uses: the next slide is a real one to try them on.'
});
