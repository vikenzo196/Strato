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
    vaso:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M9.2 3.8h5.6c-.2 1.3-.8 2.2-1.7 2.9v8.1c0 3.4-2.3 5.4-5.1 5.4s-5.1-2-5.1-5.4V6.7c-.9-.7-1.5-1.6-1.7-2.9h5.6" transform="translate(3 0)"/>`},
    lampada:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5.2 10.8a6.8 6.8 0 0 1 13.6 0H5.2Z"/><path d="M12 10.8v6.2"/><path d="M8.8 19h6.4"/><path d="M10 21h4"/><path d="M15.5 11.5v2.7"/><circle cx="15.5" cy="15.4" r=".7"/>`},
    scatola:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5 8.2h14v11a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 19.2z"/><path d="M5 8.2 6.8 5h10.4L19 8.2"/><path d="M12 8.2v12.6"/>`},
    gemma:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18"/><path d="m7 4 5 16 5-16"/>`},
    stella:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 3.6 14.7 9l5.9.8-4.3 4 1.2 6-5.5-3.1-5.5 3.1 1.2-6-4.3-4 5.9-.8z"/>`},
    fulmine:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M13.4 2.8 6.4 13h4.7l-1 8.2 7.5-10.8H13z"/>`},
    regalo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<rect x="4" y="9.2" width="16" height="3.8" rx="1"/><path d="M5.2 13h13.6v7.5H5.2z"/><path d="M12 9.2v11.3"/><path d="M12 9c-2.5 0-4-3.8-.6-3.8 1.6 0 1.6 2.4.6 3.8z"/><path d="M12 9c2.5 0 4-3.8.6-3.8-1.6 0-1.6 2.4-.6 3.8z"/>`},
    fiore:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 12c-2.7 0-4.8-2.1-4.8-4.4 0-1.4 1-2.6 2.5-2.6 1.1 0 1.8.4 2.3 1.2.5-.8 1.2-1.2 2.3-1.2 1.5 0 2.5 1.2 2.5 2.6 0 2.3-2.1 4.4-4.8 4.4Z"/><path d="M12 12v8.3"/><path d="M12 15.2c-1.5-.2-3.5.6-4.7 2.4"/><path d="M12 16c1.6-.2 3.5.6 4.7 2.4"/>`},
    tazza:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6 8.4h9.2v5.1a4.5 4.5 0 0 1-4.5 4.5H10A4 4 0 0 1 6 14z"/><path d="M15.2 9.3h1.6a2.4 2.4 0 1 1 0 4.8h-1.6"/>`},
    borsa:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6.3 8.5h11.4l-1 11.3H7.3z"/><path d="M8.7 8.5V7.2a3.3 3.3 0 0 1 6.6 0v1.3"/>`},

    l_tavolo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5.2 10.8a6.8 6.8 0 0 1 13.6 0H5.2Z"/><path d="M12 10.8v6.2"/><path d="M8.8 19h6.4"/><path d="M10 21h4"/><path d="M15.5 11.5v2.7"/><circle cx="15.5" cy="15.4" r=".7"/>`},
    l_sospensione:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 2.8v3.5"/><path d="M6.2 11.1a5.8 5.8 0 0 1 11.6 0H6.2Z"/><path d="M9.4 14.1h5.2"/>`},
    l_piantana:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8.4 7.2a3.6 3.6 0 0 1 7.2 0H8.4Z"/><path d="M12 7.2V18"/><path d="M9.2 21h5.6"/>`},
    l_comodino:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M7.2 11.4a4.8 4.8 0 0 1 9.6 0H7.2Z"/><path d="M12 11.4v4.8"/><path d="M9.4 18.6h5.2"/><path d="M10.2 20.8h3.6"/>`},
    l_lampadina:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 3.6a5.5 5.5 0 0 1 3.9 9.4c-.8.8-1.2 1.6-1.2 2.7h-5.4c0-1.1-.4-1.9-1.2-2.7A5.5 5.5 0 0 1 12 3.6Z"/><path d="M9.7 18.2h4.6"/><path d="M10.2 20.4h3.6"/>`},

    v_classico:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M10 3.8h4c-.2 1-.7 1.8-1.5 2.5v7.9c0 3.5-2 5.8-4.5 5.8s-4.5-2.3-4.5-5.8V6.3C2.7 5.6 2.2 4.8 2 3.8h4" transform="translate(5 0)"/>`},
    v_ampolla:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M10.5 3.8h3v4.2c0 1.1.4 2 1 2.9 1.1 1.4 1.7 2.9 1.7 4.5 0 2.9-2.1 4.9-4.7 4.9s-4.7-2-4.7-4.9c0-1.6.6-3.1 1.7-4.5.6-.8 1-1.8 1-2.9z"/>`},
    v_tubo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<rect x="8" y="4.2" width="8" height="16.2" rx="1.5"/><ellipse cx="12" cy="4.2" rx="4" ry="1.1"/>`},
    v_anfora:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M9.4 4h5.2c-.2 1-.7 1.7-1.3 2.2v8.1c0 3.2-2.1 5.3-4.3 5.3s-4.3-2.1-4.3-5.3V6.2C4 5.7 3.6 5 3.4 4h5.2" transform="translate(3 0)"/><path d="M8.2 7c-2 0-3.1 1.2-3.1 3"/><path d="M15.8 7c2 0 3.1 1.2 3.1 3"/>`},
    v_conico:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8 5h8l-2.2 14H10.2z"/><ellipse cx="12" cy="5" rx="4" ry="1"/>`},

    a_sedia:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8 5.2h8v6.4H8z"/><path d="M8 11.6h8"/><path d="M9 11.6v7.2"/><path d="M15 11.6v7.2"/><path d="M7 15.2h10"/>`},
    a_poltrona:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M7.5 10.5a2.6 2.6 0 0 1 2.6-2.6h3.8a2.6 2.6 0 0 1 2.6 2.6v4.8H7.5z"/><path d="M8.6 8V6.9a2.3 2.3 0 0 1 2.3-2.3h2.2a2.3 2.3 0 0 1 2.3 2.3V8"/><path d="M7.5 15.3v2.4"/><path d="M16.5 15.3v2.4"/>`},
    a_tavolo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<ellipse cx="12" cy="7.8" rx="8" ry="2.3"/><path d="M4 7.8h16"/><path d="M8 10v8"/><path d="M16 10v8"/>`},
    a_libreria:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M4.5 4.2h15v15.6h-15z"/><path d="M4.5 9.6h15"/><path d="M4.5 15h15"/><path d="M8 5.5v2.6"/><path d="M10.8 5.5v2.6"/><path d="M15.2 15.7v2.5"/>`},
    a_armadio:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6 4.2h12v15.8H6z"/><path d="M12 4.2v15.8"/><path d="M10 10.5v2.2"/><path d="M14 10.5v2.2"/><path d="M8 20v1.2"/><path d="M16 20v1.2"/>`},

    d_stella:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 3.6 14.7 9l5.9.8-4.3 4 1.2 6-5.5-3.1-5.5 3.1 1.2-6-4.3-4 5.9-.8z"/>`},
    d_cuore:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 20.5 5.4 14A4.9 4.9 0 0 1 12 7.7 4.9 4.9 0 0 1 18.6 14z"/>`},
    d_fiocco:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 11.2 9.2 8.6c-1.4-1.2-3.7-.8-4.6.8-.6 1.2-.2 2.7.8 3.4L9.2 15"/><path d="M12 11.2 14.8 8.6c1.4-1.2 3.7-.8 4.6.8.6 1.2.2 2.7-.8 3.4L14.8 15"/><path d="M9.2 15 5.8 18.6"/><path d="M14.8 15 18.2 18.6"/><circle cx="12" cy="12.6" r="1.6"/>`},
    d_fiore:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 12c-2.7 0-4.8-2.1-4.8-4.4 0-1.4 1-2.6 2.5-2.6 1.1 0 1.8.4 2.3 1.2.5-.8 1.2-1.2 2.3-1.2 1.5 0 2.5 1.2 2.5 2.6 0 2.3-2.1 4.4-4.8 4.4Z"/><path d="M12 12v8.3"/><path d="M12 15.2c-1.5-.2-3.5.6-4.7 2.4"/><path d="M12 16c1.6-.2 3.5.6 4.7 2.4"/>`},
    d_cornice:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5 4.5h14v15H5z"/><path d="M7.8 7.3h8.4v9.4H7.8z"/>`},

    c_scatola:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5.4 9h13.2v9.8a1.8 1.8 0 0 1-1.8 1.8H7.2a1.8 1.8 0 0 1-1.8-1.8z"/><path d="M5.4 9 7 5.8h10L18.6 9"/>`},
    c_cestino:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5 10.2h14l-1.3 8a2 2 0 0 1-2 1.7H8.3a2 2 0 0 1-2-1.7z"/><path d="M8.2 10.2V8.4a3.8 3.8 0 0 1 7.6 0v1.8"/><path d="M8.1 13h7.8"/><path d="M8.6 15.8h6.8"/>`},
    c_barattolo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<rect x="7" y="8" width="10" height="12" rx="2"/><rect x="8" y="4.2" width="8" height="3.8" rx="1.1"/><path d="M9.5 12.4h5"/>`},
    c_portapenne:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8 9h8l-.8 10.6H8.8z"/><path d="M10.4 9 11.6 3.8"/><path d="M13.2 9 15.2 4.4"/><path d="M15.2 9 17.2 5.2"/>`},
    c_ciotola:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M4.2 11h15.6a7.8 7.8 0 0 1-15.6 0z"/><path d="M8.8 20.8h6.4"/>`},

    o_parete:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<circle cx="12" cy="12" r="8.8"/><path d="M12 7.6v4.6l3.5 2"/>`},
    o_sveglia:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<circle cx="12" cy="13" r="6.9"/><path d="M12 10.1v3.7l2.5 1.5"/><path d="M7.3 5.9 5.6 4.4"/><path d="M16.7 5.9l1.7-1.5"/><path d="M9.8 20.8h4.4"/>`},
    o_clessidra:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6 4h12"/><path d="M6 20h12"/><path d="M8 4c0 3 2 5.2 4 6.4C10 11.6 8 13.8 8 17"/><path d="M16 4c0 3-2 5.2-4 6.4 2 1.2 4 3.4 4 6.6"/>`},
    o_quadrante:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M7.2 19.6V10a4.8 4.8 0 0 1 4.8-4.8h0A4.8 4.8 0 0 1 16.8 10v9.6z"/><path d="M12 10.3v3.2l2.2 1.3"/><path d="M12 7.6v1.2"/>`},

    s_scrivania:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M3 8.2h18v2.4H3z"/><path d="M5.2 10.6v9"/><path d="M18.8 10.6v9"/><path d="M14.2 10.6v9"/><path d="M14.2 13.8h4.6"/><path d="M14.2 16.8h4.6"/>`},
    s_supporto:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6 8h12v8H6z"/><path d="M8 8 10 5h8v8"/><path d="M6 16h12l-1.5 3H7.5z"/>`},
    s_fermacarte:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M6 15a6 6 0 0 1 12 0v2H6z"/><path d="M8 17.2h8"/>`},
    s_leggio:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M5 5h14v8l-7 3-7-3z"/><path d="M12 8v8"/><path d="M8.5 16v3.6"/><path d="M15.5 16v3.6"/><path d="M4 19.6h16"/>`},

    p_mensola:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M4 10.4h16v2.8H4z"/><path d="M7 13.2v2.5"/><path d="M17 13.2v2.5"/>`},
    p_gancio:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M9 4.2h6"/><path d="M12 4.2v8.1a3.8 3.8 0 0 1-3.8 3.8H7a1.8 1.8 0 0 0 0 3.6h1.2"/>`},

    t_vassoio:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<ellipse cx="12" cy="14.8" rx="8.8" ry="4.2"/><ellipse cx="12" cy="14.8" rx="5.9" ry="2.6"/>`},
    t_sottopiatto:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<ellipse cx="12" cy="14.5" rx="9" ry="5"/><ellipse cx="12" cy="14.5" rx="6.5" ry="3.3"/>`},

    st_candela:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8 10h8v10H8z"/><path d="M12 4.2c-1.4 1.6-2 2.8-2 4 0 1.1.8 2 2 2s2-.9 2-2c0-1.2-.6-2.4-2-4Z"/>`},
    st_albero:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 4 6.2 11h3.2L7 16h3l-2 4h8l-2-4h3l-2.4-5H17.8z"/><path d="M12 20v1.5"/>`},
    st_ornamento:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<circle cx="12" cy="13.5" r="6.5"/><path d="M11 7h2v2h-2z"/><path d="M10.8 7c-1-1.4-.7-2.8 1.2-4 1.9 1.2 2.2 2.6 1.2 4"/>`},

    altro_cubo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M4 8.2 12 4l8 4.2v8.6L12 21l-8-4.2z"/><path d="M4 8.2 12 12l8-3.8"/><path d="M12 12v9"/>`},
    altro_sfera:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6"/><path d="M12 3.2c-2.3 2.4-3.8 5.4-3.8 8.8s1.5 6.4 3.8 8.8"/><path d="M12 3.2c2.3 2.4 3.8 5.4 3.8 8.8s-1.5 6.4-3.8 8.8"/>`},
    altro_geo:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M12 4 5 18h14z"/><path d="M12 4v14"/><path d="M8.5 11h7"/>`},
    acc_portachiavi:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<circle cx="9.5" cy="8.5" r="4.5"/><circle cx="9.5" cy="8.5" r="1.8"/><path d="M13 11.8 19.5 18.3"/><path d="M17.2 16 20 13.2"/>`},
    acc_stand:{g:'g_clay',f:'rgba(199,125,107,.10)',d:`<path d="M8 4.8h8v9H8z"/><path d="M6 13.8h12l-1.4 5.2H7.4z"/>`}
};

const CATEGORY_ICON_ALIASES = {
  vaso: "v_classico",
  lampada: "l_tavolo",
  scatola: "c_scatola",
  gemma: "altro_geo",
  stella: "d_stella",
  fulmine: "altro_geo",
  regalo: "d_fiocco",
  fiore: "d_fiore",
  borsa: "c_cestino",
  l_comodino: "l_tavolo",
  v_ampolla: "v_anfora",
  a_armadio: "a_libreria",
  c_ciotola: "t_vassoio",
  stella_decorativa: "d_stella",
};

export function normalizeCategoryIcon(k) {
  const key = String(k || "").trim();
  const mapped = CATEGORY_ICON_ALIASES[key] || key || "v_classico";
  return ICONS[mapped] ? mapped : "v_classico";
}

export function glassIcon(k, s = 26) {
  const ic = ICONS[normalizeCategoryIcon(k)] || ICONS.v_classico;
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
  { t: "Luce",       keys: ["l_tavolo","l_sospensione","l_piantana","l_lampadina"] },
  { t: "Forme",      keys: ["v_classico","v_anfora","v_tubo","v_conico"] },
  { t: "Tempo",      keys: ["o_parete","o_sveglia","o_clessidra","o_quadrante"] },
  { t: "Arredo",     keys: ["a_sedia","a_poltrona","a_tavolo","a_libreria"] },
  { t: "Contenere",  keys: ["c_scatola","c_cestino","c_barattolo","c_portapenne"] },
  { t: "Parete",     keys: ["p_mensola","p_gancio","d_cornice","a_libreria"] },
  { t: "Scrivania",  keys: ["s_scrivania","s_supporto","s_fermacarte","s_leggio"] },
  { t: "Tavola",     keys: ["tazza","t_vassoio","c_ciotola","t_sottopiatto"] },
  { t: "Decoro",     keys: ["d_fiore","d_cornice","d_stella","d_cuore"] },
  { t: "Stagionali", keys: ["st_candela","st_albero","st_ornamento","d_fiocco"] },
  { t: "Altro",      keys: ["altro_cubo","altro_sfera","altro_geo","acc_portachiavi"] },
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
