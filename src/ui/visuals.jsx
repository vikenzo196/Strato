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
  l_tavolo:{d:`<path class="sf" d="M5.2 10.5c.4-3.8 3-6.2 6.8-6.2s6.4 2.4 6.8 6.2H5.2Z"/><path class="sa" d="M8.6 18.4h6.8l-.6 2H9.2z"/><path class="ol" d="M12 10.5v7.9M9.2 18.4h5.6M15.7 10.9v2.7"/><circle class="sa" cx="15.7" cy="15" r=".75"/>`},
  l_sospensione:{d:`<path class="ol" d="M12 2.5v4.1"/><path class="sf" d="M6.3 12.2c.3-3.2 2.5-5.3 5.7-5.3s5.4 2.1 5.7 5.3H6.3Z"/><path class="sa" d="M9.1 14.2h5.8c-.4 1.1-1.4 1.8-2.9 1.8s-2.5-.7-2.9-1.8Z"/>`},
  l_piantana:{d:`<path class="sf" d="M8.7 7.7c.2-2.4 1.5-3.8 3.3-3.8s3.1 1.4 3.3 3.8H8.7Z"/><path class="ol" d="M12 7.7v10.8M8.7 21h6.6"/><path class="sa" d="M10 18.5h4l.8 2.5H9.2z"/>`},
  l_lampadina:{d:`<path class="sf" d="M12 3.5a5.3 5.3 0 0 1 3.8 9c-.9.9-1.4 1.8-1.4 3H9.6c0-1.2-.5-2.1-1.4-3a5.3 5.3 0 0 1 3.8-9Z"/><path class="ol" d="M10 18h4M10.7 20.4h2.6"/><path class="sa" d="M9.7 15.4h4.6v1.7H9.7z"/>`},
  v_classico:{d:`<path class="sf" d="M9.8 4.2h4.4c-.2 1-.7 1.8-1.5 2.4v2.1c2.1.7 3.5 2.8 3.5 5.4 0 3.6-1.8 6.1-4.2 6.1s-4.2-2.5-4.2-6.1c0-2.6 1.4-4.7 3.5-5.4V6.6c-.8-.6-1.3-1.4-1.5-2.4Z"/><path class="ol" d="M9.4 4.2h5.2M8.6 18.8h6.8"/>`},
  v_anfora:{d:`<path class="sf" d="M9.4 4h5.2c-.2 1-.7 1.6-1.4 2.1v1.3c1.7.6 2.9 2.3 2.9 5.4 0 4.7-1.7 7.2-4.1 7.2s-4.1-2.5-4.1-7.2c0-3.1 1.2-4.8 2.9-5.4V6.1C10.1 5.6 9.6 5 9.4 4Z"/><path class="ol" d="M8.7 7.4C6.9 7.3 5.8 8.6 5.8 10.2c0 1.2.8 2.1 2.1 2.4M15.3 7.4c1.8-.1 2.9 1.2 2.9 2.8 0 1.2-.8 2.1-2.1 2.4M9 4h6"/>`},
  v_tubo:{d:`<path class="sf" d="M8.3 5.1h7.4v13.7a1.8 1.8 0 0 1-1.8 1.8h-3.8a1.8 1.8 0 0 1-1.8-1.8z"/><ellipse class="sa" cx="12" cy="5.1" rx="3.7" ry="1.25"/><path class="ol" d="M8.3 5.1v13.7M15.7 5.1v13.7"/>`},
  v_conico:{d:`<path class="sf" d="M8 5.2h8l-2.1 14.6h-3.8z"/><ellipse class="sa" cx="12" cy="5.2" rx="4" ry="1.15"/><path class="ol" d="M8 5.2l2.1 14.6M16 5.2l-2.1 14.6"/>`},
  o_parete:{d:`<circle class="sf" cx="12" cy="12" r="8.6"/><circle class="thin" cx="12" cy="12" r="6.7"/><path class="ol" d="M12 7.8v4.3l3.4 2"/><path class="thin" d="M12 5.6v1M12 17.4v1M5.6 12h1M17.4 12h1"/>`},
  o_sveglia:{d:`<circle class="sf" cx="12" cy="13" r="6.6"/><path class="sa" d="M7.5 5.2a2.1 2.1 0 0 0-2.4 2.4l3-1.9ZM16.5 5.2a2.1 2.1 0 0 1 2.4 2.4l-3-1.9Z"/><path class="ol" d="M12 10v3.7l2.4 1.4M9.8 20.5h4.4"/><path class="thin" d="M7.5 5.2 5.6 3.8M16.5 5.2l1.9-1.4"/>`},
  o_clessidra:{d:`<path class="sf" d="M7.2 4.4h9.6c0 3.3-1.8 5.5-4.8 7.1 3 1.6 4.8 3.9 4.8 7.8H7.2c0-3.9 1.8-6.2 4.8-7.8-3-1.6-4.8-3.8-4.8-7.1Z"/><path class="ol" d="M6.2 4.4h11.6M6.2 19.3h11.6M9.4 8.3h5.2M10 16h4"/>`},
  o_quadrante:{d:`<path class="sf" d="M7.1 19.7v-9.4a4.9 4.9 0 0 1 9.8 0v9.4z"/><path class="ol" d="M12 10.2v3.3l2.1 1.3M9.3 19.7h5.4"/><path class="thin" d="M12 7.4v1"/>`},
  a_sedia:{d:`<path class="sf" d="M8 5.1h8v7H8z"/><path class="sa" d="M7.2 12.1h9.6v2.2H7.2z"/><path class="ol" d="M8.5 14.3v5.2M15.5 14.3v5.2M8 8.6h8"/>`},
  a_poltrona:{d:`<path class="sf" d="M7.3 10.5c0-1.5 1.2-2.7 2.7-2.7h4c1.5 0 2.7 1.2 2.7 2.7v5.1H7.3z"/><path class="sa" d="M8.8 14.2h6.4v2.1H8.8z"/><path class="ol" d="M8.6 7.9V6.8c0-1.3 1-2.3 2.3-2.3h2.2c1.3 0 2.3 1 2.3 2.3v1.1M7.3 15.6v2.5M16.7 15.6v2.5"/>`},
  a_tavolo:{d:`<ellipse class="sf" cx="12" cy="7.8" rx="7.9" ry="2.2"/><path class="sa" d="M5.3 7.8h13.4v2H5.3z"/><path class="ol" d="M8.4 9.8v8.1M15.6 9.8v8.1"/>`},
  a_libreria:{d:`<path class="sf" d="M4.8 4.3h14.4v15.4H4.8z"/><path class="ol" d="M4.8 9.5h14.4M4.8 14.8h14.4M8 5.8v2.4M10.5 5.8v2.4M15.4 15.6v2.5"/><path class="sa" d="M6.5 16.2h4.5v2H6.5z"/>`},
  c_scatola:{d:`<path class="sf" d="M5.1 9h13.8v9.8a1.8 1.8 0 0 1-1.8 1.8H6.9a1.8 1.8 0 0 1-1.8-1.8z"/><path class="sa" d="M5.1 9 7 5.8h10L18.9 9z"/><path class="ol" d="M5.1 9h13.8M12 9v11.4"/>`},
  c_cestino:{d:`<path class="sf" d="M5.2 10.2h13.6l-1.2 7.7a2.1 2.1 0 0 1-2.1 1.8h-7a2.1 2.1 0 0 1-2.1-1.8z"/><path class="ol" d="M8.4 10.2V8.5a3.6 3.6 0 0 1 7.2 0v1.7M7.5 13h9M8.2 15.6h7.6"/>`},
  c_barattolo:{d:`<rect class="sf" x="7" y="8" width="10" height="12" rx="2.2"/><rect class="sa" x="8" y="4.2" width="8" height="3.8" rx="1.1"/><path class="ol" d="M9.4 12.4h5.2"/>`},
  c_portapenne:{d:`<path class="sf" d="M8.2 9.1h7.6l-.8 10.8H9z"/><path class="ol" d="M10.2 9.1 11.4 3.8M13 9.1 15 4.4M15.2 9.2l1.8-3.8"/><path class="sa" d="M8.2 9.1h7.6l-.2 2.1H8.4z"/>`},
  c_ciotola:{d:`<path class="sf" d="M4.1 11h15.8a7.9 7.9 0 0 1-15.8 0Z"/><path class="ol" d="M8.8 20.7h6.4M5.2 13.4h13.6"/>`},
  p_mensola:{d:`<path class="sa" d="M4.2 10.5h15.6v2.5H4.2z"/><path class="ol" d="M7.1 13v2.8M16.9 13v2.8M4.2 10.5h15.6"/>`},
  p_gancio:{d:`<path class="sf" d="M9.3 4.1h5.4v2.2H9.3z"/><path class="ol" d="M12 6.3v6a3.9 3.9 0 0 1-3.9 3.9H7a1.7 1.7 0 1 0 0 3.4h1.2"/>`},
  d_cornice:{d:`<path class="sf" d="M5 4.7h14v14.6H5z"/><path class="ol" d="M7.7 7.4h8.6v9.2H7.7z"/><path class="sa" d="M5 4.7h14v2H5z"/>`},
  s_scrivania:{d:`<path class="sa" d="M3.2 8.3h17.6v2.4H3.2z"/><path class="ol" d="M5.4 10.7v8.8M18.6 10.7v8.8M14 10.7v8.8M14 13.8h4.6M14 16.7h4.6"/><path class="sf" d="M4.4 5.8h7.3v2.5H4.4z"/>`},
  s_supporto:{d:`<path class="sf" d="M6 8.1h12v7.6H6z"/><path class="sa" d="M8 5.4h10v5.3H8z"/><path class="ol" d="M6 15.7h12l-1.4 3.2H7.4z"/>`},
  s_fermacarte:{d:`<path class="sf" d="M6 15c.2-3.7 2.6-6.1 6-6.1s5.8 2.4 6 6.1v2.1H6z"/><path class="ol" d="M8 17.1h8"/>`},
  s_leggio:{d:`<path class="sf" d="M5 5.2h14V13l-7 3.2L5 13z"/><path class="ol" d="M12 8.2v8M8.5 16.2v3.5M15.5 16.2v3.5M4.2 19.7h15.6"/>`},
  tazza:{d:`<path class="sf" d="M6.3 8.5h9.4v5.2a4.4 4.4 0 0 1-4.4 4.4h-.6a4.4 4.4 0 0 1-4.4-4.4z"/><path class="ol" d="M15.7 9.5h1.3a2.35 2.35 0 1 1 0 4.7h-1.3"/>`},
  t_vassoio:{d:`<ellipse class="sf" cx="12" cy="14.6" rx="8.7" ry="4.1"/><ellipse class="ol" cx="12" cy="14.6" rx="5.8" ry="2.4"/>`},
  t_sottopiatto:{d:`<ellipse class="sf" cx="12" cy="14.5" rx="9" ry="4.9"/><ellipse class="ol" cx="12" cy="14.5" rx="6.5" ry="3.1"/>`},
  d_fiore:{d:`<path class="sa" d="M12 12.2c-2.7 0-4.7-2-4.7-4.2 0-1.5 1-2.7 2.5-2.7 1 0 1.7.4 2.2 1.2.5-.8 1.2-1.2 2.2-1.2 1.5 0 2.5 1.2 2.5 2.7 0 2.2-2 4.2-4.7 4.2Z"/><path class="ol" d="M12 12.2v8M12 15.2c-1.7-.1-3.3.7-4.4 2.4M12 16c1.7-.1 3.3.7 4.4 2.4"/>`},
  d_stella:{d:`<path class="sf" d="M12 3.7 14.7 9l5.8.8-4.2 4 1 5.8-5.3-2.9-5.3 2.9 1-5.8-4.2-4L9.3 9z"/><path class="thin" d="M12 6.8v7.7M8.3 11.6h7.4"/>`},
  d_cuore:{d:`<path class="sa" d="M12 20.3 5.4 14a4.7 4.7 0 0 1 6.6-6.6A4.7 4.7 0 0 1 18.6 14z"/>`},
  d_fiocco:{d:`<path class="sa" d="M12 12 8.8 8.7C7.4 7.3 5.1 7.8 4.4 9.5c-.4 1.2.1 2.5 1.2 3.1L9.2 15Z"/><path class="sa" d="M12 12l3.2-3.3c1.4-1.4 3.7-.9 4.4.8.4 1.2-.1 2.5-1.2 3.1L14.8 15Z"/><circle class="sf" cx="12" cy="12.6" r="1.5"/><path class="ol" d="M9.2 15 6 18.6M14.8 15l3.2 3.6"/>`},
  st_candela:{d:`<path class="sf" d="M8.1 10h7.8v10H8.1z"/><path class="sa" d="M12 4.2c-1.3 1.5-1.9 2.8-1.9 3.9 0 1.1.8 2 1.9 2s1.9-.9 1.9-2c0-1.1-.6-2.4-1.9-3.9Z"/><path class="thin" d="M10.2 12v6M13.8 12v6"/>`},
  st_albero:{d:`<path class="sf" d="M12 4.2 6.4 11h3.2l-2.3 4.8h3l-1.8 3.8h7l-1.8-3.8h3L14.4 11h3.2z"/><path class="ol" d="M12 19.6v1.5"/>`},
  st_ornamento:{d:`<circle class="sf" cx="12" cy="13.7" r="6.2"/><path class="sa" d="M10.8 7h2.4v2.1h-2.4z"/><path class="ol" d="M10.8 7c-.9-1.3-.5-2.7 1.2-3.8 1.7 1.1 2.1 2.5 1.2 3.8"/>`},
  altro_cubo:{d:`<path class="sf" d="M4.2 8.3 12 4.1l7.8 4.2v8.5L12 20.9l-7.8-4.1z"/><path class="ol" d="M4.2 8.3 12 12.2l7.8-3.9M12 12.2v8.7"/>`},
  altro_sfera:{d:`<circle class="sf" cx="12" cy="12" r="8.5"/><path class="thin" d="M3.5 12h17M12 3.5c-2.2 2.3-3.5 5.2-3.5 8.5s1.3 6.2 3.5 8.5M12 3.5c2.2 2.3 3.5 5.2 3.5 8.5s-1.3 6.2-3.5 8.5"/>`},
  altro_geo:{d:`<path class="sf" d="M12 4.2 5.2 18.5h13.6z"/><path class="ol" d="M12 4.2v14.3M8.6 11.6h6.8"/>`},
  acc_portachiavi:{d:`<circle class="sf" cx="9.5" cy="8.5" r="4.4"/><circle class="thin" cx="9.5" cy="8.5" r="1.7"/><path class="ol" d="M12.8 11.7 19.5 18.4M17.2 16.1l2.4-2.4"/>`},
  acc_stand:{d:`<path class="sf" d="M8.1 4.8h7.8v8.8H8.1z"/><path class="sa" d="M6.2 13.6h11.6l-1.4 5.4H7.6z"/>`},
  vaso:{d:`<path class="sf" d="M9.8 4.2h4.4c-.2 1-.7 1.8-1.5 2.4v2.1c2.1.7 3.5 2.8 3.5 5.4 0 3.6-1.8 6.1-4.2 6.1s-4.2-2.5-4.2-6.1c0-2.6 1.4-4.7 3.5-5.4V6.6c-.8-.6-1.3-1.4-1.5-2.4Z"/><path class="ol" d="M9.4 4.2h5.2M8.6 18.8h6.8"/>`},
  lampada:{d:`<path class="sf" d="M5.2 10.5c.4-3.8 3-6.2 6.8-6.2s6.4 2.4 6.8 6.2H5.2Z"/><path class="sa" d="M8.6 18.4h6.8l-.6 2H9.2z"/><path class="ol" d="M12 10.5v7.9M9.2 18.4h5.6M15.7 10.9v2.7"/><circle class="sa" cx="15.7" cy="15" r=".75"/>`},
  scatola:{d:`<path class="sf" d="M5.1 9h13.8v9.8a1.8 1.8 0 0 1-1.8 1.8H6.9a1.8 1.8 0 0 1-1.8-1.8z"/><path class="sa" d="M5.1 9 7 5.8h10L18.9 9z"/><path class="ol" d="M5.1 9h13.8M12 9v11.4"/>`},
  gemma:{d:`<path class="sf" d="M12 4.2 5.2 18.5h13.6z"/><path class="ol" d="M12 4.2v14.3M8.6 11.6h6.8"/>`},
  stella:{d:`<path class="sf" d="M12 3.7 14.7 9l5.8.8-4.2 4 1 5.8-5.3-2.9-5.3 2.9 1-5.8-4.2-4L9.3 9z"/><path class="thin" d="M12 6.8v7.7M8.3 11.6h7.4"/>`},
  fulmine:{d:`<path class="sf" d="M12 4.2 5.2 18.5h13.6z"/><path class="ol" d="M12 4.2v14.3M8.6 11.6h6.8"/>`},
  regalo:{d:`<path class="sa" d="M12 12 8.8 8.7C7.4 7.3 5.1 7.8 4.4 9.5c-.4 1.2.1 2.5 1.2 3.1L9.2 15Z"/><path class="sa" d="M12 12l3.2-3.3c1.4-1.4 3.7-.9 4.4.8.4 1.2-.1 2.5-1.2 3.1L14.8 15Z"/><circle class="sf" cx="12" cy="12.6" r="1.5"/><path class="ol" d="M9.2 15 6 18.6M14.8 15l3.2 3.6"/>`},
  fiore:{d:`<path class="sa" d="M12 12.2c-2.7 0-4.7-2-4.7-4.2 0-1.5 1-2.7 2.5-2.7 1 0 1.7.4 2.2 1.2.5-.8 1.2-1.2 2.2-1.2 1.5 0 2.5 1.2 2.5 2.7 0 2.2-2 4.2-4.7 4.2Z"/><path class="ol" d="M12 12.2v8M12 15.2c-1.7-.1-3.3.7-4.4 2.4M12 16c1.7-.1 3.3.7 4.4 2.4"/>`},
  borsa:{d:`<path class="sf" d="M5.2 10.2h13.6l-1.2 7.7a2.1 2.1 0 0 1-2.1 1.8h-7a2.1 2.1 0 0 1-2.1-1.8z"/><path class="ol" d="M8.4 10.2V8.5a3.6 3.6 0 0 1 7.2 0v1.7M7.5 13h9M8.2 15.6h7.6"/>`},
  l_comodino:{d:`<path class="sf" d="M5.2 10.5c.4-3.8 3-6.2 6.8-6.2s6.4 2.4 6.8 6.2H5.2Z"/><path class="sa" d="M8.6 18.4h6.8l-.6 2H9.2z"/><path class="ol" d="M12 10.5v7.9M9.2 18.4h5.6M15.7 10.9v2.7"/><circle class="sa" cx="15.7" cy="15" r=".75"/>`},
  v_ampolla:{d:`<path class="sf" d="M9.4 4h5.2c-.2 1-.7 1.6-1.4 2.1v1.3c1.7.6 2.9 2.3 2.9 5.4 0 4.7-1.7 7.2-4.1 7.2s-4.1-2.5-4.1-7.2c0-3.1 1.2-4.8 2.9-5.4V6.1C10.1 5.6 9.6 5 9.4 4Z"/><path class="ol" d="M8.7 7.4C6.9 7.3 5.8 8.6 5.8 10.2c0 1.2.8 2.1 2.1 2.4M15.3 7.4c1.8-.1 2.9 1.2 2.9 2.8 0 1.2-.8 2.1-2.1 2.4M9 4h6"/>`},
  a_armadio:{d:`<path class="sf" d="M4.8 4.3h14.4v15.4H4.8z"/><path class="ol" d="M4.8 9.5h14.4M4.8 14.8h14.4M8 5.8v2.4M10.5 5.8v2.4M15.4 15.6v2.5"/><path class="sa" d="M6.5 16.2h4.5v2H6.5z"/>`}
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
  return `<svg class="gico gico-set-b" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${ic.d}</svg>`;
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
