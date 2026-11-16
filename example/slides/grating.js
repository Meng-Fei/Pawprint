SLIDES.push({
 title:'The diffraction grating: path difference, orders and many slits',
 titleRef:'o_inf',
 wide:true,
 facts:[
  {group:'Path difference sets the phase step',ref:'o_trig',html:'Seen far away at angle $\\theta$, neighbouring slits a distance $d$ apart differ in path by <b>$d\\sin\\theta$</b> (the small right triangle in ①).'},
  {ref:'v_phase',html:'Why the path matters: the phase difference between two waves is due to the different path lengths they travel; a path difference of a whole number of wavelengths leaves them <b>in phase</b> (constructive interference).'},
  {ref:'o_order',src:['o_order','v_phase'],html:'Bright where that is a whole number of wavelengths: <b>$d\\sin\\theta=m\\lambda$</b>, $m$ = the <b>order</b>.'},
  {group:'Many slits',ref:'o_sec',html:'With $N$ slits the same directions stay bright (principal maxima); between them there are $N-2$ weak secondary maxima, and the peaks get narrower.'},
  {ref:'o_inf',src:['o_310','o_inf'],html:'As slits are added the principal maxima get brighter and narrower; a <b>grating</b> = very many slits, where only the principal maxima remain, <b>very bright and very narrow</b>.'},
  {group:'Phasor picture',ref:'phstep',src:[],html:'In arrow language: the path difference $d\\sin\\theta$ is a phase step $2\\pi d\\sin\\theta/\\lambda$ between neighbours; the chain in ② is straight exactly at the orders (AI reading).'}
 ],
 svg:()=>`<svg viewBox="0 0 1000 560" role="img" aria-label="Interactive: a plane wave hits N slits; rays leave at angle theta with path difference d sin theta between neighbours; the arrow chain at that angle; intensity versus angle with principal and secondary maxima" style="color:var(--ink);touch-action:none">${DEFS}
 <g id="p2a"></g><path d="M0 300H1000" stroke="var(--line)"/><g id="p2b"></g><path d="M0 486H1000" stroke="var(--line)"/><g class="knobs"></g></svg>`,
 init:el=>{const svg=el.querySelector('svg'),q=s=>svg.querySelector(s);
  const DL=3.2;   // slit spacing in wavelengths (AI choice: shows orders m = 0, ±1, ±2, ±3)
  knobs(svg,[
   {id:'N',x0:220,x1:840,y:512,min:2,max:12,v:5,step:1,label:'number of slits $N$',fmt:v=>`${v}`},
   {id:'th',x0:220,x1:840,y:544,min:-60,max:60,v:12,step:.2,label:'viewing angle $\\theta$',fmt:v=>`${v.toFixed(1)}°`}
  ],st=>{
   const th=st.th*Math.PI/180,N=st.N,a=2*Math.PI*DL*Math.sin(th),pitch=26,xs=200,yc=150,ys=j=>yc+(j-(N-1)/2)*pitch;
   let g=D.t(0,16,`① top view: a plane wave hits $N$ slits $d$ apart (here $d=${DL}\\lambda$ (AI)); rays leave at angle $\\theta$`,{b:1,s:11.5});
   // incoming crests
   for(let k=0;k<6;k++)g+=`<path d="M${40+k*26} ${ys(0)-24}V${ys(N-1)+24}" stroke="var(--t-red)" stroke-width="1.4" opacity=".55"/>`;
   g+=D.arrow(`M20 ${yc}H70`,'var(--t-red)',1.8)+D.t(14,yc-30,'plane wave',{s:9.5});
   // the screen with slits
   g+=`<path d="M${xs} 30V${ys(0)-pitch/2+4}" stroke="currentColor" stroke-width="5"/>`;
   for(let j=0;j<N;j++){const y0=ys(j)+4,y1=(j<N-1?ys(j+1):300-30)-4;g+=`<path d="M${xs} ${y0}V${Math.min(y1,282)}" stroke="currentColor" stroke-width="5"/>`}
   // rays at θ, length 300
   const R=190,dx=Math.cos(th),dy=-Math.sin(th);
   for(let j=0;j<N;j++)g+=`<path d="M${xs} ${ys(j)}L${xs+R*dx} ${ys(j)+R*dy}" stroke="var(--t-red)" stroke-width="1.3" opacity=".8"/>`;
   // path difference: from slit 1 the ray must travel d·sinθ further to reach the wavefront through slit 0 (perpendicular to the rays)
   const tD=(ys(1)-ys(0))*Math.sin(th),fx=xs+tD*dx,fy=ys(1)+tD*dy;
   g+=D.ref('o_trig',[xs-30,ys(0)-6],`<path d="M${xs} ${ys(0)}L${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="var(--t-blue)" stroke-width="1.4" stroke-dasharray="3 2"/>`
     +`<path d="M${xs} ${ys(1)}L${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="var(--t-blue)" stroke-width="3.4"/>`
     +D.t(xs+40,ys(0)-14,'extra path (zoom →)',{s:10,b:1,c:'var(--t-blue)'}));
   // zoomed inset: two neighbouring slits and the right triangle
   {const ix=440,iy0=70,ip=110,S0=[ix,iy0],S1=[ix,iy0+ip],t=ip*Math.sin(th),F=[S1[0]+t*dx,S1[1]+t*dy];
    g+=`<rect x="${ix-30}" y="${iy0-40}" width="200" height="${ip+90}" rx="6" fill="var(--card)" stroke="var(--line)"/>`+D.t(ix-22,iy0-24,'zoom: two neighbouring slits',{s:9.5,b:1,c:'var(--mute)'});
    g+=`<path d="M${S0[0]} ${S0[1]}L${S0[0]+150*dx} ${S0[1]+150*dy}M${S1[0]} ${S1[1]}L${S1[0]+150*dx} ${S1[1]+150*dy}" stroke="var(--t-red)" stroke-width="1.4"/>`;
    g+=`<circle cx="${S0[0]}" cy="${S0[1]}" r="3.5" fill="currentColor"/><circle cx="${S1[0]}" cy="${S1[1]}" r="3.5" fill="currentColor"/>`;
    g+=`<path d="M${S0[0]} ${S0[1]}V${S1[1]}" stroke="currentColor" stroke-dasharray="2 2"/>`+D.t(ix-8,iy0+ip/2+4,'$d$',{s:12,b:1,a:'end'});
    g+=D.cell('o_trig',`<path d="M${S0[0]} ${S0[1]}L${F[0].toFixed(1)} ${F[1].toFixed(1)}" stroke="var(--t-blue)" stroke-width="1.2" stroke-dasharray="4 3"/><path d="M${S1[0]} ${S1[1]}L${F[0].toFixed(1)} ${F[1].toFixed(1)}" stroke="var(--t-blue)" stroke-width="4"/>`
      +D.t((S1[0]+F[0])/2+8,(S1[1]+F[1])/2+16,'$d\\sin\\theta$',{s:12,b:1,c:'var(--t-blue)'}));
    g+=`<path d="M${S1[0]} ${S1[1]-26}A26 26 0 0 ${th>0?1:0} ${(S1[0]+26*Math.sin(Math.abs(th))).toFixed(1)} ${(S1[1]-26*Math.cos(th)).toFixed(1)}" fill="none" stroke="currentColor"/>`+D.t(S1[0]+6,S1[1]-30,'$\\theta$',{s:11,b:1});
    g+=D.t(ix-22,iy0+ip+40,'dashed blue: a wavefront (⊥ rays)',{s:9,c:'var(--mute)'})}
   g+=`<path d="M${xs+6} ${ys(0)}H${xs+14}M${xs+6} ${ys(1)}H${xs+14}M${xs+10} ${ys(0)}V${ys(1)}" stroke="currentColor"/>`+D.t(xs+18,(ys(0)+ys(1))/2+4,'$d$',{s:10,b:1});
   // phase labels on the first rays
   [0,1,2].filter(j=>j<N).forEach(j=>{g+=D.t(xs+R*dx*.92+6,ys(j)+R*dy*.92+4,j?`${j}× step`:'0',{s:9,c:'var(--mute)'})});
   // ② the arrow chain at this angle
   g+=D.t(640,16,'② Phasor sum at the selected angle',{b:1,s:11.5});
   const ch=WV.chain(810,150,N,a,Math.min(24,200/N),'var(--t-red)');g+=ch.d+D.arrow(`M${ch.ox.toFixed(1)} ${ch.oy.toFixed(1)}L${ch.ex.toFixed(1)} ${ch.ey.toFixed(1)}`,'currentColor',2.6);
   const ps=WV.wrap(DL*Math.sin(th));
   g+=D.ref('phstep',[628,262],D.t(640,266,`phase step = $2\\pi d\\sin\\theta/\\lambda$ → ${ps.toFixed(2)} turn; brightness ${WV.grat(N,a).toFixed(2)} (AI)`,{s:10}));
   q('#p2a').innerHTML=g;renderTex(q('#p2a'));
   // ③ intensity vs angle
   const X0=60,X1=980,Y0=470,H=118,xa=t=>X0+(t+60)/120*(X1-X0);
   let b=D.t(0,318,'③ Intensity versus angle (normalized to $N^2$)',{b:1,s:11.5});
   b+=`<path d="M${X0} ${Y0}H${X1}" stroke="currentColor"/>`;
   b+=`<g class="axis">${[-60,-30,0,30,60].map(t=>`<text x="${xa(t)}" y="${Y0+13}" font-size="9" text-anchor="middle" fill="var(--mute)">${t}°</text>`).join('')}</g>`;
   b+=`<path d="${WV.path(X0,X1,x=>{const t=((x-X0)/(X1-X0)*120-60)*Math.PI/180;return Y0-H*WV.grat(N,2*Math.PI*DL*Math.sin(t))},1)}L${X1} ${Y0}L${X0} ${Y0}Z" fill="var(--t-red)" fill-opacity=".12" stroke="var(--t-red)" stroke-width="1.5"/>`;
   for(let m=-3;m<=3;m++){const s=m/DL;if(Math.abs(s)>Math.sin(Math.PI/3))continue;const t=Math.asin(s)*180/Math.PI;b+=D.t(xa(t),Y0-H-8,`$m=${m}$`,{a:'middle',s:9.5,b:1})}
   b+=D.ref('o_order',[xa(0)-26,Y0-H-12],'');
   b+=`<path d="M${xa(st.th)} ${Y0}V${Y0-H-2}" stroke="var(--hlb)" stroke-width="2"/><circle cx="${xa(st.th)}" cy="${Y0-H*WV.grat(N,a)}" r="6" fill="var(--hlb)" stroke="currentColor"/>`;
   b+=D.ref('o_sec',[738,314],D.t(990,318,`between two orders: $N-2$ = ${N-2} small peaks`,{s:10,a:'end'}));
   q('#p2b').innerHTML=b;renderTex(q('#p2b'));
  })},
 foot:'① not to scale; ③ is the textbook’s multiple-slit result computed for the chosen N and slit spacing (AI plot; slit width ignored). Places marked on the left were picked by AI.'
});
