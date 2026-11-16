/* reusable drawing blocks (viewBox units, not to scale) */
const D={
 t:(x,y,t,o={})=>{const s=o.s||11,c=o.c||'currentColor';
   if(!t.includes('$'))return `<text x="${x}" y="${y}" font-size="${s}"${o.b?' font-weight="700"':''}${o.a?` text-anchor="${o.a}"`:''} fill="${c}"${o.h?' style="paint-order:stroke;stroke:var(--card);stroke-width:3px"':''}>${t}</text>`;
   // label with LaTeX: HTML inside the SVG (foreignObject), anchored like SVG text; KaTeX renders it (renderTex)
   const a=o.a||'start',W=600,X=a==='middle'?x-W/2:a==='end'?x-W:x;
   return `<foreignObject x="${X}" y="${y-s*1.25}" width="${W}" height="${s*2}" style="overflow:visible;pointer-events:none"><div xmlns="http://www.w3.org/1999/xhtml" style="font:${o.b?700:400} ${s}px/1.5 system-ui,sans-serif;color:${c};text-align:${a==='middle'?'center':a==='end'?'right':'left'};white-space:nowrap${o.h?';text-shadow:0 0 3px var(--card),0 0 3px var(--card)':''}">${texify(t)}</div></foreignObject>`},
 lens:(x,y,ry)=>`<ellipse cx="${x}" cy="${y}" rx="6" ry="${ry}" fill="none" stroke="currentColor" stroke-width="2"/>`,
 arrow:(d,c='currentColor',w=2,both=false)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" marker-end="url(#ah)"${both?' marker-start="url(#ah)"':''} style="color:${c}"/>`,
 dim:(x1,x2,y,txt,o={})=>`<path d="M${x1} ${y}H${x2}M${x1} ${y-4}V${y+4}M${x2} ${y-4}V${y+4}" stroke="${o.c||'currentColor'}" stroke-width="1.2"/>${D.t((x1+x2)/2,y+15,txt,{a:'middle',s:o.s||11,c:o.c,b:o.b})}`,
 // a focused beam: converges from height h at x0 to a waist at xf, then diverges to x1
 waist:(x0,xf,x1,y,h,c='var(--t-red)')=>{const k=3,a=(x1-xf)/(xf-x0)*h;
   return `<path d="M${x0} ${y-h} L${xf-8} ${y-k} Q${xf} ${y-k+.6} ${xf+8} ${y-k} L${x1} ${y-a} L${x1} ${y+a} L${xf+8} ${y+k} Q${xf} ${y+k-.6} ${xf-8} ${y+k} L${x0} ${y+h}Z" fill="${c}" opacity=".22"/>`+
   `<path d="M${x0} ${y-h} L${xf-8} ${y-k} Q${xf} ${y-k+.6} ${xf+8} ${y-k} L${x1} ${y-a} M${x0} ${y+h} L${xf-8} ${y+k} Q${xf} ${y+k-.6} ${xf+8} ${y+k} L${x1} ${y+a}" fill="none" stroke="${c}" stroke-width="1.4"/>`},
 // true Gaussian beam outline w(z)=w0·sqrt(1+(z/zr)²), centred at xc, drawn over ±half
 gauss:(xc,y,w0,zr,half,c='var(--t-red)')=>{const P=[];for(let z=-half;z<=half;z+=half/30)P.push([xc+z,w0*Math.sqrt(1+(z/zr)**2)]);
   const top=P.map(([x,w])=>`${x.toFixed(1)} ${(y-w).toFixed(1)}`).join(' L'),bot=P.map(([x,w])=>`${x.toFixed(1)} ${(y+w).toFixed(1)}`).reverse().join(' L');
   return `<path d="M${top} L${bot}Z" fill="${c}" opacity=".2"/><path d="M${top}M${bot}" fill="none" stroke="${c}" stroke-width="1.4"/>`},
 outOfPage:(x,y,c='currentColor',r=6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="var(--card)" stroke="${c}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r*.3}" fill="${c}"/>`,
 cell:(id,inner)=>`<g class="ref" data-ref="${id}">${inner}</g>`,
 ref:(id,n,inner)=>{const L=factList(),k=(L.find(f=>f.ref===id)||L.find(f=>(f.src||[]).includes(id))||{}).n;  // a place that is only a source of another fact takes that fact's number
   // a numbered fact gets the yellow disc; AI (and open questions) get the outlined box, the same mark as in the fact list
   const badge=k==='AI'||k==='?'?`<rect x="${n[0]-8}" y="${n[1]-7}" width="16" height="14" rx="3.5" fill="var(--card)" stroke="var(--mute)" stroke-width="1.1"/><text x="${n[0]}" y="${n[1]+3}" font-size="8" font-weight="700" text-anchor="middle" fill="var(--mute)">${k}</text>`
     :`<circle cx="${n[0]}" cy="${n[1]}" r="7" fill="var(--hlb)"/><text x="${n[0]}" y="${n[1]+3.8}" font-size="9.5" font-weight="700" text-anchor="middle" fill="#000">${k}</text>`;
   return `<g class="ref" data-ref="${id}">${inner}${badge}</g>`}
};
const DEFS=`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`;
/* interactive helpers shared by the slides */
const TONE=['var(--t-red)','#e8833a','#9b4dca'];  // three example tones, same colours on every slide
// knobs(svg, defs, redraw): a visible slider per adjustable quantity, each with play (auto-scan) and slower/faster buttons; defs = [{id,x0,x1,y,min,max,v,step,c,label,fmt}]
// redraw(st) runs with this slide as the current one, so drawing badges keep their numbers
function knobs(svg,defs,redraw){
  const IDX=si,st={};defs.forEach(d=>{st[d.id]=d.v;if(!d.choices)d.xe=d.x1-104});   // slider track ends at xe; play / slower / faster sit between xe and x1
  const layer=svg.querySelector('.knobs');
  const SP=[.125,.25,.5,1,2,4,8],A={};defs.forEach(d=>{if(!d.choices)A[d.id]={on:false,k:3,raw:d.v}});   // auto-scan: off, speed index (1× = whole range in 8 s)
  const pos=d=>d.x0+(st[d.id]-d.min)/(d.max-d.min)*(d.xe-d.x0);
  // a def with choices:[labels] is drawn as a row of buttons (value = index) instead of a slider
  const btns=d=>{const n=d.choices.length,gap=6,w=(d.x1-d.x0-gap*(n-1))/n;return d.choices.map((c,i)=>{const x=d.x0+i*(w+gap),on=st[d.id]===i;
    return `<g class="chc" data-id="${d.id}" data-v="${i}" style="cursor:pointer"><rect x="${x.toFixed(1)}" y="${d.y-13}" width="${w.toFixed(1)}" height="26" rx="5" fill="${on?(d.c||'var(--hlb)'):'var(--card)'}" stroke="${on?'currentColor':'var(--line)'}" stroke-width="${on?1.4:1}"/><text x="${(x+w/2).toFixed(1)}" y="${d.y+4}" font-size="10" text-anchor="middle" font-weight="${on?700:400}" fill="currentColor">${c}</text></g>`}).join('')};
  const kb=(d,act,x,body,title)=>`<g class="kbtn" data-id="${d.id}" data-act="${act}" style="cursor:pointer"><title>${title}</title><rect x="${x-10}" y="${d.y-10}" width="20" height="20" rx="4" fill="var(--card)" stroke="var(--line)"/>${body}</g>`;
  const ctl=d=>{const a=A[d.id],x=d.xe+20,y=d.y;
    return `<g class="axis">`+kb(d,'play',x,a.on?`<path d="M${x-4} ${y-5}V${y+5}M${x+4} ${y-5}V${y+5}" stroke="currentColor" stroke-width="2.4"/>`:`<path d="M${x-4} ${y-6}L${x+6} ${y}L${x-4} ${y+6}Z" fill="currentColor"/>`,a.on?'pause the scan':'scan automatically')
      +kb(d,'slow',x+24,`<path d="M${x+19} ${y}H${x+29}" stroke="currentColor" stroke-width="2"/>`,'slower')
      +kb(d,'fast',x+48,`<path d="M${x+43} ${y}H${x+53}M${x+48} ${y-5}V${y+5}" stroke="currentColor" stroke-width="2"/>`,'faster')
      +`<text x="${x+62}" y="${y+4}" font-size="9.5" fill="var(--mute)">${SP[a.k]}×</text></g>`};
  const paint=()=>{layer.innerHTML=defs.map(d=>D.t(d.x0-16,d.y+4,d.label,{a:'end',s:10.5,b:1,c:d.c||'currentColor'})
    +(d.choices?`<g class="axis">${btns(d)}</g>`:
    `<g class="trk" data-id="${d.id}" style="cursor:ew-resize"><rect x="${d.x0-10}" y="${d.y-13}" width="${d.xe-d.x0+20}" height="26" fill="transparent"/><path d="M${d.x0} ${d.y}H${d.xe}" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/><circle class="kh" data-id="${d.id}" cx="${pos(d).toFixed(1)}" cy="${d.y}" r="9" fill="${d.c||'var(--hlb)'}" stroke="currentColor" stroke-width="1"/></g>`
    +ctl(d)+`<g class="axis"><text class="kv" data-id="${d.id}" x="${d.x1+18}" y="${d.y+4}" font-size="10.5" fill="currentColor">${d.fmt(st[d.id])}</text></g>`)).join('');renderTex(layer)};
  const quick=()=>{defs.forEach(d=>{if(d.choices)return;const h=layer.querySelector(`.kh[data-id="${d.id}"]`),t=layer.querySelector(`.kv[data-id="${d.id}"]`);if(h)h.setAttribute('cx',pos(d).toFixed(1));if(t)t.textContent=d.fmt(st[d.id])});const k=si;si=IDX;redraw(st);si=k};
  const run=()=>{paint();const k=si;si=IDX;redraw(st);si=k};
  let drag=null;
  const mv=ev=>{if(!drag)return;const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;const v=p.matrixTransform(svg.getScreenCTM().inverse());
    const u=Math.max(0,Math.min(1,(v.x-drag.x0)/(drag.xe-drag.x0)));let val=drag.min+u*(drag.max-drag.min);if(drag.step)val=Math.round(val/drag.step)*drag.step;
    A[drag.id].raw=val;if(val!==st[drag.id]){st[drag.id]=val;quick()}};
  // auto-scan loop: runs only while some knob of this slide is scanning and the drawing is on screen
  let last=0,loop=false;
  const tick=ts=>{const on=defs.filter(d=>!d.choices&&A[d.id].on);if(!on.length){loop=false;return}
    const dt=last?Math.min(.1,(ts-last)/1000):0;last=ts;const r=svg.getBoundingClientRect();
    if(dt>0&&r.bottom>0&&r.top<innerHeight){on.forEach(d=>{const a=A[d.id];if(drag&&drag.id===d.id)return;a.raw+=(d.max-d.min)*SP[a.k]/8*dt;if(a.raw>d.max)a.raw=d.min+(a.raw-d.max);
      let v=a.raw;if(d.step)v=Math.round(v/d.step)*d.step;st[d.id]=Math.min(d.max,Math.max(d.min,v))});quick()}
    requestAnimationFrame(tick)};
  svg.addEventListener('click',ev=>{const b=ev.target.closest('.chc');if(b){const v=+b.dataset.v;if(st[b.dataset.id]!==v){st[b.dataset.id]=v;run()}return}
    const c=ev.target.closest('.kbtn');if(!c)return;const a=A[c.dataset.id],act=c.dataset.act;
    if(act==='play'){a.on=!a.on;a.raw=st[c.dataset.id];if(a.on&&!loop){loop=true;last=0;requestAnimationFrame(tick)}}
    else if(act==='slow')a.k=Math.max(0,a.k-1);else a.k=Math.min(SP.length-1,a.k+1);
    run()});
  svg.addEventListener('pointerdown',ev=>{const g=ev.target.closest('.trk');if(!g)return;drag=defs.find(d=>d.id===g.dataset.id);svg.setPointerCapture(ev.pointerId);mv(ev)});
  svg.addEventListener('pointermove',mv);svg.addEventListener('pointerup',()=>{drag=null});svg.addEventListener('pointercancel',()=>{drag=null});
  st._redraw=run;run();return st;
}
const WV={
  // sampled curve as an SVG path: f(x) gives y
  path:(x0,x1,f,step=2)=>{let d='';for(let x=x0;x<=x1+1e-9;x+=step)d+=(d?'L':'M')+x.toFixed(1)+' '+f(x).toFixed(1);return d},
  // N-beam grating function, normalised to 1 at the peak: |Σ e^{i j a}|² / N², a = phase step in radians
  grat:(N,a)=>{const s=Math.sin(a/2);return Math.abs(s)<1e-9?1:(Math.sin(N*a/2)/(N*s))**2},
  wrap:x=>((x%1)+1)%1, sw:x=>((x+.5)%1+1)%1-.5,
  // rough visible colour for a wavelength in nm (for drawing only)
  col:nm=>{const P=[[400,270],[450,240],[490,190],[530,120],[575,58],[610,32],[650,8],[700,0]];let h=0;
    if(nm<=400)h=270;else if(nm>=700)h=0;else for(let k=0;k<P.length-1;k++)if(nm<=P[k+1][0]){const u=(nm-P[k][0])/(P[k+1][0]-P[k][0]);h=P[k][1]+u*(P[k+1][1]-P[k][1]);break}
    return `hsl(${h.toFixed(0)},85%,${nm>660?42:48}%)`},
  // phasor chain: N arrows of length s, each turned by step a (rad) from the last; returns {d:svg, sx, sy}
  chain:(cx,cy,N,a,s,c,w=1.6)=>{let x=0,y=0;const P=[[0,0]];for(let j=0;j<N;j++){x+=s*Math.cos(j*a);y+=s*Math.sin(j*a);P.push([x,y])}
    const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),ox=cx-(Math.min(...xs)+Math.max(...xs))/2,oy=cy+(Math.min(...ys)+Math.max(...ys))/2;
    let d='';for(let j=0;j<N;j++)d+=D.arrow(`M${(ox+P[j][0]).toFixed(1)} ${(oy-P[j][1]).toFixed(1)}L${(ox+P[j+1][0]).toFixed(1)} ${(oy-P[j+1][1]).toFixed(1)}`,c,w);
    return {d,ox,oy,ex:ox+x,ey:oy-y,len:Math.hypot(x,y)}},
  // Bessel J_n(x) by its power series (enough for |x| < 4)
  J:(n,x)=>{const m=Math.abs(n);let s=0,f=1;for(let k=1;k<=m;k++)f*=k;let t=Math.pow(x/2,m)/f;for(let k=0;k<30;k++){s+=t;t*=-(x*x/4)/((k+1)*(k+1+m))}return n<0&&m%2?-s:s}
};

// phase needle: tick at the top = crest; the needle turns clockwise once per period
WV.dial=(cx,cy,P,col,R=16)=>{const a=2*Math.PI*P,tx=cx+(R-3)*Math.sin(a),ty=cy-(R-3)*Math.cos(a);
  return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--card)" stroke="currentColor"/><path d="M${cx} ${cy-R}V${cy-R+5}" stroke="currentColor" stroke-width="1.6"/><path d="M${cx} ${cy}L${tx.toFixed(1)} ${ty.toFixed(1)}" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3.2" fill="${col}"/>`};
// simple 3D: world x (sideways), y (up), z (along the beam); view = {az, el}; drag a .r3d area to turn it
const V3={
  P:(v,s,cx,cy)=>p=>{const [x,y,z]=p,ca=Math.cos(v.az),sa=Math.sin(v.az),ce=Math.cos(v.el),se=Math.sin(v.el);const x1=x*ca+z*sa,z1=-x*sa+z*ca;return [cx+s*x1,cy-s*(y*ce-z1*se),y*se+z1*ce]},
  path:(pr,pts)=>pts.map((p,i)=>{const q=pr(p);return (i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)}).join(''),
  line:(pr,a,b,o='')=>{const p=pr(a),q=pr(b);return `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" ${o}/>`},
  // a box drawn back faces first; fill and opacity for the faces
  box:(pr,X,Y,Z,fill,op=.18)=>{const c=(i,j,k)=>[X[i],Y[j],Z[k]],F=[[c(0,0,0),c(1,0,0),c(1,1,0),c(0,1,0)],[c(0,0,1),c(1,0,1),c(1,1,1),c(0,1,1)],[c(0,0,0),c(0,1,0),c(0,1,1),c(0,0,1)],[c(1,0,0),c(1,1,0),c(1,1,1),c(1,0,1)],[c(0,0,0),c(1,0,0),c(1,0,1),c(0,0,1)],[c(0,1,0),c(1,1,0),c(1,1,1),c(0,1,1)]];
    return F.map(f=>({f,d:f.reduce((a,p)=>a+pr(p)[2],0)})).sort((a,b)=>a.d-b.d).map(({f})=>`<path d="${V3.path(pr,f)}Z" fill="${fill}" fill-opacity="${op}" stroke="currentColor" stroke-width=".8" stroke-opacity=".6"/>`).join('')},
  drag:(svg,view,redraw)=>{let d=null;svg.addEventListener('pointerdown',ev=>{if(!ev.target.closest('.r3d'))return;d=[ev.clientX,ev.clientY];svg.setPointerCapture(ev.pointerId)});
    svg.addEventListener('pointermove',ev=>{if(!d)return;view.az+=(ev.clientX-d[0])*.008;view.el=Math.max(-1.3,Math.min(1.3,view.el+(ev.clientY-d[1])*.008));d=[ev.clientX,ev.clientY];redraw()});
    svg.addEventListener('pointerup',()=>{d=null});svg.addEventListener('pointercancel',()=>{d=null})}
};
// labelled axes with a faint grid: o = origin (world), L = axis length; names = [x, y, z] labels
V3.axes=(pr,o,L,names=['x (sideways)','y (up)','z (beam)'],grid=true)=>{let s='';const P=(a,b,c)=>pr([o[0]+a,o[1]+b,o[2]+c]);
  if(grid){for(let i=0;i<=4;i++){const t=i/4*L;s+=`<path d="M${P(t,0,0).slice(0,2).map(v=>v.toFixed(1)).join(' ')}L${P(t,0,L).slice(0,2).map(v=>v.toFixed(1)).join(' ')}M${P(0,0,t).slice(0,2).map(v=>v.toFixed(1)).join(' ')}L${P(L,0,t).slice(0,2).map(v=>v.toFixed(1)).join(' ')}" stroke="var(--line)" stroke-width=".8"/>`}}
  [[L,0,0],[0,L,0],[0,0,L]].forEach((d,i)=>{const a=P(0,0,0),b=P(...d),c=P(d[0]*1.12,d[1]*1.12,d[2]*1.12);
    s+=`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="var(--mute)" stroke-width="1.6" marker-end="url(#ah)" style="color:var(--mute)"/>`+D.t(c[0]+(i===1?4:0),c[1]+(i===1?0:12),names[i],{s:9.5,b:1,c:'var(--mute)',a:'middle'})});
  return s};
// a text label with a thin leader line to a 3D point
V3.tag=(pr,p,text,dx,dy,col='currentColor',o={})=>{const q=pr(p),x=q[0]+dx,y=q[1]+dy;return `<path d="M${q[0].toFixed(1)} ${q[1].toFixed(1)}L${x.toFixed(1)} ${(y-4).toFixed(1)}" stroke="${col}" stroke-width=".8" opacity=".7"/>`+D.t(x+(dx<0?-3:3),y,text,Object.assign({s:10,b:1,c:col,a:dx<0?'end':'start'},o))};
// 3D arrow between two world points
V3.arrow=(pr,a,b,col,w=2.6)=>{const p=pr(a),q=pr(b);return D.arrow(`M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`,col,w)};
