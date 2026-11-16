/* One paper = one deck: its sources and the order of its slides. Each slide is slides/<id>.js; each cited place is in refs.js. */
const DECK={
 title:'Reading example',
 header:'Example deck: the diffraction grating, read from OpenStax University Physics Vol. 3 and Vol. 1',
 sub:'OpenStax, CC BY-NC-SA 4.0',
 aiModel:'Claude Fable 5.2',
 key:'reading-example',
 main:'ox',
 /* The PDFs are not shipped with the deck: each is downloaded from `url` and saved at `pdf`; `sha256` is the file the marked places were located on (downloaded 2026-11-16). */
 docs:{
  ox:{title:'OpenStax, University Physics Vol. 3 (2016), whole book (CC BY-NC-SA 4.0); interference ch. 3, diffraction ch. 4',short:'OpenStax Vol. 3',n:597,pl:p=>p-10,pdf:'docs/openstax-up3/university-physics-volume-3_-_WEB.pdf',url:'https://assets.openstax.org/oscms-prodcms/media/documents/university-physics-volume-3_-_WEB.pdf',sha256:'311c6beb70bb9cc6073d40a6085d290a82afde2b38e9aaf672ccb6de0542541b',ar:'1275/1650'},
  ox1:{title:'OpenStax, University Physics Vol. 1 (2016), whole book (CC BY-NC-SA 4.0); waves ch. 16, sound ch. 17',short:'OpenStax Vol. 1',n:959,pl:p=>p-12,pdf:'docs/openstax-up1/university-physics-volume-1_-_WEB.pdf',url:'https://assets.openstax.org/oscms-prodcms/media/documents/university-physics-volume-1_-_WEB.pdf',sha256:'93652b69c43197d10dc83438b813b5f7515e61e7ea4336da8636ff902cb4aba8',ar:'612/792'},
 },
 slides:[
  'workflow',
  'grating',
 ],
 /* Guided tour. A step with `do` is an action step: the reader has to do it; `after` says what then happened. */
 tour:[
  {at:'#s1 ol.facts li[data-ref="o_trig"]',text:'<b>A numbered fact comes from the source.</b> You can check it against the original.',do:'Click this fact',after:'Three places lit up: the fact, its part of the drawing, the passage on the left.'},
  {at:'#s1 svg #p2a',side:'below',shade:false,text:'<b>The same fact, in the drawing.</b> The parts of the drawing that show this fact lit up with it. Fact, drawing and original always point at each other: click any one of the three and the other two light up.'},
  {at:'#view .mk.on',text:'<b>And this is the passage, in the original PDF.</b> The red bar marks where the fact comes from and the key words are highlighted in yellow. Nothing is drawn over the text.'},
  {at:'#s1 ol.facts li[data-ref="o_order"]',text:'<b>Some facts rest on more than one passage.</b> This one has two, in two different books.',do:'Click this fact',after:'The source side split in two: both books at once.'},
  {at:'#split',hit:'#split .pbody',gesture:'scroll',spot:[.5,.3],text:'<b>Two documents at once, each the whole PDF, opened at its passage.</b> You always get the full document, never only the cited lines.',do:'Scroll inside a panel to read what comes before and after',after:'That panel moved through its book; the other one stayed at its passage.'},
  {at:'#unsplit',text:'<b>One document again.</b>',do:'Click “✕ close”',after:'Back to a single document.',wait:1200},
  {at:'#s1 ol.facts li[data-ref="phstep"]',side:'left',text:'<b>Anything the AI worked out, chose or estimated is marked AI,</b> in the list and in the drawing. It has no source to open, so this is where your own judgement is needed.'},
  {at:'#s1 svg .knobs',side:'below',gesture:'drag',spot:[.38,.3],text:'<b>Drawings are computed from the formulas,</b> so you can try values yourself.',do:'Drag a slider, or press ▶ to let it scan',after:'The drawing above follows the value.'},
  {at:'#s1 svg .ref[data-ref="o_sec"]>circle',hit:'#s1 svg .ref[data-ref="o_sec"]',text:'<b>Labels inside a drawing are linked too.</b>',do:'Click this badge',after:'Its fact and its passage lit up with it.'},
  {at:'#s1 ol.facts li[data-ref="v_phase"]',text:'<b>A fact from another book switches the source side to that book.</b> This one comes from Vol. 1 only.',do:'Click this fact',after:'The source side now shows the other book, at the passage.'},
  {at:'#shelf .thumb[data-doc="ox"]',text:'<b>Every source of the deck sits on this shelf.</b> Click one to open it; each PDF can be paged through from the first page to the last.',do:'Click the first book',after:'Back in the first book, where you left it.',wait:2200},
  {at:'#s0',text:'<b>That is the whole interface.</b> To read a paper of your own, hand GUIDE.md to your AI. This first slide shows the workflow.'},
 ],
};
