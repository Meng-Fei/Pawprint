/* Where each cited passage sits: document, page, box in page fractions (x, y, w, h); keys = the key words or numbers inside it. */
const REFS={
 o_trig:{doc:'ox',page:123,x:.118,y:.214,w:.765,h:.058,keys:[[.203,.2347,.180,.0148],[.430,.2515,.140,.0200]]},  // "Simple trigonometry shows" Δl = d sin θ
 o_order:{doc:'ox',page:123,x:.118,y:.274,w:.765,h:.173,keys:[[.335,.4302,.130,.0148]]},  // d sin θ = mλ; "We call m the order"
 o_sec:{doc:'ox',page:126,x:.118,y:.628,w:.765,h:.100,keys:[[.303,.6331,.233,.0148],[.267,.6816,.362,.0148],[.740,.7134,.111,.0148]]},  // N−2 secondary maxima; intensity ∝ amplitude²; maxima narrower
 o_310:{doc:'ox',page:127,x:.133,y:.073,w:.735,h:.290,keys:[[.160,.3304,.264,.0123]]},  // Fig. 3.10: principal maxima brighter and narrower
 o_inf:{doc:'ox',page:158,x:.118,y:.117,w:.765,h:.045,keys:[[.375,.1218,.289,.0148]]},  // grating: "only the principal maxima, now very bright and very narrow"
 v_phase:{doc:'ox1',page:840,x:.118,y:.800,w:.765,h:.100,keys:[[.118,.8050,.458,.0148],[.262,.8209,.211,.0148],[.118,.8662,.150,.0148]]},  // Vol. 1 p.828: phase difference is due to different path lengths; integer multiple of a wavelength -> in phase
};
