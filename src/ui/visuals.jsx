import React from "react";

export const GRADS_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g_white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe4e8"/></linearGradient>
<linearGradient id="g_red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A7E"/><stop offset="1" stop-color="#F0231A"/></linearGradient>
<linearGradient id="g_amber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC066"/><stop offset="1" stop-color="#E8801C"/></linearGradient>
<linearGradient id="g_gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F2A310"/></linearGradient>
<linearGradient id="g_blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FDBFF"/><stop offset="1" stop-color="#1593EE"/></linearGradient>
<linearGradient id="g_violet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6B6FF"/><stop offset="1" stop-color="#7C4DE0"/></linearGradient>
<linearGradient id="g_pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB3D1"/><stop offset="1" stop-color="#E0457E"/></linearGradient>
<linearGradient id="g_teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FE9D4"/><stop offset="1" stop-color="#0FA68C"/></linearGradient>
<linearGradient id="g_green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE8A6"/><stop offset="1" stop-color="#5BA34D"/></linearGradient>
<linearGradient id="g_clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b29a"/><stop offset="1" stop-color="#8c6856"/></linearGradient>
<linearGradient id="g_home" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#F2A310"/></linearGradient>
<linearGradient id="g_search" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FDBFF"/><stop offset="1" stop-color="#1593EE"/></linearGradient>
<linearGradient id="g_cats" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC066"/><stop offset="1" stop-color="#E8801C"/></linearGradient>
<linearGradient id="g_heartT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A7E"/><stop offset="1" stop-color="#F0231A"/></linearGradient>
<linearGradient id="g_orders" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FE9D4"/><stop offset="1" stop-color="#0FA68C"/></linearGradient></defs></svg>`;
const ICONS={
    vaso:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M9 3h6l-1 4c1.7 1 2.8 2.8 2.8 5A5.8 5.8 0 1 1 7.2 12c0-2.2 1.1-4 2.8-5z"/>`},
    lampada:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 3h8l2.4 7.5H5.6z"/><path d="M12 10.5V17"/><path d="M8.6 21h6.8l-1-4H9.6z"/>`},
    scatola:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4"/><path d="M12 11v10"/>`},
    gemma:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18"/>`},
    stella:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.4 6L12 16.6 6.5 19.6l1.4-6L3.4 9.6 9.4 9z"/>`},
    fulmine:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`},
    regalo:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13h14v8H5z"/><path d="M12 9v12"/><path d="M12 9C9.5 9 8 4.5 12 4.5 13.7 4.5 13.7 9 12 9z"/>`},
    fiore:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="6.6" r="2.6"/><circle cx="17.4" cy="10.6" r="2.6"/><circle cx="15.3" cy="16.9" r="2.6"/><circle cx="8.7" cy="16.9" r="2.6"/><circle cx="6.6" cy="10.6" r="2.6"/><circle cx="12" cy="12" r="2.1"/>`},
    tazza:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M5 8h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/>`},
    borsa:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`},
    l_tavolo:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 3h8l2 7H6z"/><path d="M12 10v7"/><path d="M8.5 21h7l-1-4h-5z"/>`},
    l_sospensione:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M12 2v3"/><path d="M5 12a7 7 0 0 1 14 0z"/><path d="M9.5 12a2.5 2.5 0 0 0 5 0"/>`},
    l_piantana:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M8 4h8l1 5H7z"/><path d="M9 9 6.5 21M15 9l2.5 12M12 9v12"/>`},
    l_comodino:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M6.5 11a5.5 5.5 0 0 1 11 0z"/><path d="M9.5 15h5l1 6h-7z"/>`},
    l_lampadina:{g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M9 17a5.5 5.5 0 1 1 6 0 2.5 2.5 0 0 0-1 2v.5h-4V19a2.5 2.5 0 0 0-1-2z"/><path d="M9.7 21.5h4.6"/>`},
    v_classico:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M9 3h6l-1 3.5c1.8 1.2 3 3.2 3 5.5a6 6 0 0 1-12 0c0-2.3 1.2-4.3 3-5.5z"/>`},
    v_ampolla:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M10.5 3h3v5a6 6 0 1 1-3 0z"/>`},
    v_tubo:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M8 6h8v11.5a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 8 17.5z"/><ellipse cx="12" cy="6" rx="4" ry="1.3"/>`},
    v_anfora:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M9.5 5h5l-.5 2.2a5.5 5.5 0 1 1-4 0z"/><path d="M9.3 6.2C6 6.2 6 11.4 10 11.8M14.7 6.2c3.3 0 3.3 5.2-.7 5.6"/>`},
    v_conico:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M7 5.5h10l-2 13.5h-6z"/><ellipse cx="12" cy="5.5" rx="5" ry="1.2"/>`},
    a_sedia:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<rect x="8" y="3" width="8" height="4.5" rx="1"/><path d="M8 7.5v4.5M16 7.5v4.5"/><path d="M7 12h10"/><path d="M8.5 12v8M15.5 12v8"/>`},
    a_poltrona:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5H5z"/><path d="M5 16v3M19 16v3"/><path d="M8 9V7a1.6 1.6 0 0 1 1.6-1.6h4.8A1.6 1.6 0 0 1 16 7v2"/>`},
    a_tavolo:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M3 7.5h18v2H3z"/><path d="M5.5 9.5V20M18.5 9.5V20"/>`},
    a_libreria:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<rect x="4.5" y="3" width="15" height="18" rx="1.6"/><path d="M4.5 9h15M4.5 15h15"/><path d="M8 4.6v3.4M10.5 4.6v3.4M15 15.6v3.8"/>`},
    a_armadio:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<rect x="5.5" y="3" width="13" height="18" rx="1.4"/><path d="M12 3v18"/><path d="M10 10.5v2.5M14 10.5v2.5"/><path d="M7.5 21v1.4M16.5 21v1.4"/>`},
    d_stella:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<path d="M12 3.5 14.6 9l6 .6-4.5 4 1.4 6L12 16.6 6.5 19.6l1.4-6L3.4 9.6 9.4 9z"/>`},
    d_cuore:{g:'g_red',f:'rgba(240,35,26,.16)',d:`<path d="M19 14c1.49-1.46 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`},
    d_fiocco:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="M9.6 4.2 12 6.1l2.4-1.9M9.6 19.8 12 17.9l2.4 1.9M4.3 9.6 6.7 9l-.6-2.5M19.7 9.6 17.3 9l.6-2.5M4.3 14.4 6.7 15l-.6 2.5M19.7 14.4 17.3 15l.6 2.5"/>`},
    d_fiore:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="6.6" r="2.6"/><circle cx="17.4" cy="10.6" r="2.6"/><circle cx="15.3" cy="16.9" r="2.6"/><circle cx="8.7" cy="16.9" r="2.6"/><circle cx="6.6" cy="10.6" r="2.6"/><circle cx="12" cy="12" r="2.1"/>`},
    d_cornice:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="m7 16 3.2-3.6 2.3 2.3 2.3-2.8L18 16z"/><circle cx="9" cy="9" r="1.5"/>`},
    c_scatola:{g:'g_blue',f:'rgba(21,147,238,.16)',d:`<path d="M4 8h16v11a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z"/><path d="M4 8 6.2 4h11.6L20 8"/><path d="M12 8v12.5"/>`},
    c_cestino:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 9h16l-1.5 10.2a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="M3.3 9h17.4"/><path d="M8 9a4 4 0 0 1 8 0"/>`},
    c_barattolo:{g:'g_teal',f:'rgba(15,166,140,.16)',d:`<rect x="6" y="8" width="12" height="13" rx="2.5"/><rect x="7.5" y="3.8" width="9" height="4.2" rx="1.3"/><path d="M9 12.5h6"/>`},
    c_portapenne:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M7.5 9h9l-1 11a1.5 1.5 0 0 1-1.5 1.4h-4A1.5 1.5 0 0 1 8.5 20z"/><path d="M11 9 12 3M14.2 9 15.6 3.4"/>`},
    c_ciotola:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 21h6"/>`},

  /* ── OROLOGI ─────────────────────────────────── */
  o_parete:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/>`},
  o_sveglia: {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="13" r="7.5"/><path d="M12 10v4l2.5 1.5"/><path d="M6.5 7 5 5.5M17.5 7l1.5-1.5"/><path d="M10 21.5h4"/>`},
  o_clessidra:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M6 3h12M6 21h12M8 3l4 9-4 9M16 3l-4 9 4 9"/>`},
  o_quadrante:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<circle cx="12" cy="12" r="9"/><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2"/><path d="M12 12l2.5-3.5"/>`},

  /* ── SCRIVANIA ───────────────────────────────── */
  s_scrivania:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M2 14h20v3H2z"/><path d="M5 17v5M19 17v5"/><path d="M5 14v-7h7"/>`},
  s_supporto: {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M8 4h8a1 1 0 0 1 1 1v11H7V5a1 1 0 0 1 1-1z"/><path d="M7 10h10"/><path d="M9 16v3h6v-3"/>`},
  s_fermacarte:{g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M5 14l7-11 7 11z"/><path d="M5 14h14"/><path d="M7 14l-1 6h12l-1-6"/>`},
  s_leggio:   {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M5 5h14v9l-7 3-7-3z"/><path d="M5 14H3v5h18v-5h-2"/><path d="M9 12v5M15 12v5"/>`},

  /* ── PARETE ──────────────────────────────────── */
  p_mensola:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M3 11h18v3H3z"/><path d="M6 14v4M18 14v4"/>`},
  p_gancio:   {g:'g_amber',f:'rgba(232,128,28,.18)',d:`<path d="M8 4h8"/><path d="M12 4v7a4 4 0 0 1-4 4H6a2 2 0 0 0 0 4h1"/>`},

  /* ── TAVOLA ──────────────────────────────────── */
  t_vassoio:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M2 13h20"/><path d="M4 13h16v2H4z"/>`},
  t_sottopiatto:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<ellipse cx="12" cy="15" rx="9" ry="5"/><ellipse cx="12" cy="15" rx="5.5" ry="3"/>`},

  /* ── STAGIONALI ──────────────────────────────── */
  st_candela: {g:'g_gold',f:'rgba(242,163,16,.18)',d:`<path d="M10 11h4v11H10z"/><path d="M12 8c-1.5 1.5-2 3-1 4.5"/><path d="M12 8c1.5 1.5 2 3 1 4.5"/>`},
  st_albero:  {g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M12 2 6 11h5L8 19h4v4h0M12 2l6 9h-5l3 8h-4v4h0"/>`},
  st_ornamento:{g:'g_pink',f:'rgba(224,69,126,.16)',d:`<circle cx="12" cy="16" r="6.5"/><path d="M11 9.5h2v3h-2z"/><path d="M10.5 9.5 Q9 7 12 5 Q15 7 13.5 9.5"/>`},

  /* ── ALTRO ───────────────────────────────────── */
  altro_cubo: {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M4 8.5l8-4.5 8 4.5v9l-8 4.5-8-4.5z"/><path d="M4 8.5l8 4.5 8-4.5"/><path d="M12 13v9"/>`},
  altro_sfera:{g:'g_violet',f:'rgba(124,77,224,.16)',d:`<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3 Q5.5 12 12 21"/><path d="M12 3 Q18.5 12 12 21"/>`},
  altro_geo:  {g:'g_teal',f:'rgba(15,166,140,.16)',d:`<path d="M12 3l9 7-3.5 10h-11L3 10z"/>`},
  acc_portachiavi:{g:'g_amber',f:'rgba(232,128,28,.18)',d:`<circle cx="10" cy="9" r="5.5"/><circle cx="10" cy="9" r="2.5"/><path d="M14.5 12.5l5 5M16.5 16.5l2-2"/>`},
  acc_stand:  {g:'g_clay',f:'rgba(140,104,86,.16)',d:`<path d="M8 4h8v9H8z"/><path d="M6 13h12l-1.5 5H7.5z"/>`}
};
export function glassIcon(k, s = 26) {
  const ic = ICONS[k] || ICONS.vaso;
  return `<svg class="gico" width="${s}" height="${s}" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ic.d}</svg>`;
}

/* coriandoli */
export function confetti(el) {
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const cols = ["#BF6B4A", "#D6B89B", "#9C5C43", "#C89C5B", "#D17C56", "#B69A82"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    const sz = 8 + Math.random() * 7;
    p.style.cssText = "position:fixed;left:" + cx + "px;top:" + cy + "px;width:" + sz + "px;height:" + sz + "px;border-radius:2px;background:" + cols[i % cols.length] + ";z-index:200;pointer-events:none;will-change:transform,opacity";
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 30;
    const rot = Math.random() * 720 - 360;
    p.animate(
      [{ transform: "translate(-50%,-50%) rotate(0) scale(1)", opacity: 1 },
       { transform: "translate(" + dx + "px," + (dy + 150) + "px) rotate(" + rot + "deg) scale(.5)", opacity: 0 }],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.18,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
}

export const ICON_GROUPS = [
  { t: "Luce",       keys: ["l_tavolo","l_sospensione","l_piantana","l_comodino","l_lampadina"] },
  { t: "Forme",      keys: ["v_classico","v_ampolla","v_tubo","v_anfora","v_conico"] },
  { t: "Tempo",      keys: ["o_parete","o_sveglia","o_clessidra","o_quadrante"] },
  { t: "Arredo",     keys: ["a_sedia","a_poltrona","a_tavolo","a_libreria","a_armadio"] },
  { t: "Contenere",  keys: ["c_scatola","c_cestino","c_barattolo","c_ciotola","c_portapenne"] },
  { t: "Parete",     keys: ["p_mensola","p_gancio","d_cornice","a_libreria"] },
  { t: "Scrivania",  keys: ["s_scrivania","s_supporto","c_portapenne","s_fermacarte","s_leggio"] },
  { t: "Tavola",     keys: ["tazza","t_vassoio","c_ciotola","t_sottopiatto","c_barattolo"] },
  { t: "Decoro",     keys: ["d_fiore","d_cornice","d_stella","d_cuore","d_fiocco"] },
  { t: "Stagionali", keys: ["st_candela","st_albero","st_ornamento","d_fiocco","d_stella"] },
  { t: "Altro",      keys: ["altro_cubo","altro_sfera","altro_geo","acc_portachiavi","acc_stand","fulmine","gemma"] },
];

/* ============================ ICONE LINE (dock/topbar) ================ */
export const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2.2l2.1 11a1.4 1.4 0 0 0 1.4 1.1h7.8a1.4 1.4 0 0 0 1.4-1.1L20 7H6.2" /></svg>
);
export const HomeI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></svg>);
export const SearchI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
export const CatsI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="14" rx="1.4" /><rect width="7" height="7" x="3" y="14" rx="1.4" /></svg>);
export const HeartI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>);
export const OrdersI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h4" /></svg>);

/* ---- Icone opzioni lampada (inline, solo per la scheda dettaglio) ---- */
/* Stile identico a IcoBulb: strokeWidth 2, round caps, fill none, viewBox 0 0 24 24, 17px */
export const IcoCable = () => (
  /* 3 archi quadratici consecutivi = filo arricciato, stesso arco della dome IcoBulb */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 17 Q5.5 7 9 17 Q12.5 7 16 17 Q19.5 7 23 17"/>
  </svg>
);
export const IcoBulb = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14a5 5 0 1 0-6 0"/><path d="M9 18h6M10 21h4"/>
  </svg>
);
export const IcoHolder = () => (
  /* Cupola bezier (come dome lampadina) + corpo rettangolare = portalampada E27 */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 17 Q12 5 18 17 V21 H6 Z"/>
  </svg>
);

export const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-17z" /><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.3-4.6 2.1-8.2 2.1-6.4 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
);

export const Sun = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>);
export const Moon = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.2A8 8 0 0 1 9.8 4 7.2 7.2 0 1 0 20 14.2z" /></svg>);
export const AutoI = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.4" /><path d="M12 3.6a8.4 8.4 0 0 0 0 16.8z" fill="currentColor" stroke="none" /></svg>);
export const Bell = () => (<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.6 7.6-2.6 7.6h17.2S18 14.5 18 8.5" /><path d="M13.6 21a2 2 0 0 1-3.2 0" /></svg>);
export const Trash = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>);

/* Icone minimali inline: nessuna dipendenza esterna per il set nav/azioni. */
export const ChevronLeft = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>);
export const ChevronDown = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
export const ChevronUp = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>);
export const Check = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
export const User = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
export const LogOut = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
export const Plus = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
export const Pencil = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
export const Trash2 = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
export const Upload = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>);
export const Camera = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
