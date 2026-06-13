import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./lib/supabase";

/* ============================ STILE (Liquid Glass) ===================== */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root{
    --text:#2b2620; --soft:rgba(43,38,32,.66); --faint:rgba(43,38,32,.42);
    --glass:rgba(252,247,240,.30); --glass2:rgba(252,247,240,.46);
    --strokeSoft:rgba(255,252,247,.46); --hi:rgba(255,253,249,.5); --glassDock:rgba(247,243,238,.82);
    --shadow:0 14px 44px rgba(60,40,30,.22); --txtShadow:rgba(70,45,30,.32);
    --shx:0px; --shy:14px; --shblur:44px; --shcol:rgba(60,40,30,.22); --hlx:32%; --hly:10%;
    --b1:#E4C9B0; --b2:#D9C2A3; --b3:#C9A07F; --b4:#C77D6B; --bg:#F4EFE8; --heart:#C2553F;
    --card:rgba(252,248,242,.55);
    --accent:#C77D6B; --accent2:#A65435; --accentDeep:#8B4A32; --sand:#D9C2A3; --clay:#C69B72; --terra:#B7795E;
  }
  body.dark{
    --text:#f1ece5; --soft:rgba(241,236,229,.7); --faint:rgba(241,236,229,.42);
    --glass:rgba(255,255,255,.10); --glass2:rgba(255,255,255,.18);
    --strokeSoft:rgba(255,255,255,.16); --hi:rgba(255,255,255,.2); --glassDock:rgba(45,36,32,.78);
    --shadow:0 16px 48px rgba(0,0,0,.55); --txtShadow:rgba(0,0,0,.55);
    --shy:16px; --shblur:48px; --shcol:rgba(0,0,0,.55);
    --b1:#4A382C; --b2:#5A4030; --b3:#6B463B; --b4:#7A4A38; --bg:#2D2420; --heart:#E0917B;
    --card:rgba(51,39,35,.56);
    --accent:#C77D6B; --accent2:#B7795E; --accentDeep:#A65435; --sand:#7A5A42; --clay:#8A6A4E; --terra:#B7795E;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  .bgttl{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:17px;color:var(--text);margin:18px 2px 8px}
  .bgpick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
  .bgsw{border:1px solid var(--strokeSoft);border-radius:16px;padding:8px;cursor:pointer;background:var(--glass2);display:flex;flex-direction:column;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--text);transition:box-shadow .15s, transform .12s;box-shadow:inset 0 1px 0 var(--hi), var(--elev1)}
  .bgsw:active{transform:scale(.97)}
  .bgsw .sw{width:100%;height:40px;border-radius:11px;border:1px solid var(--strokeSoft)}
  .bgsw.act{box-shadow:inset 0 1px 0 var(--hi), 0 0 0 2px var(--text)}
  html,body{margin:0;min-height:100%;touch-action:pan-x pan-y;}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg);overflow-x:hidden;}

  .glass{
    background:var(--glass);
    -webkit-backdrop-filter:blur(20px) saturate(160%); backdrop-filter:blur(20px) saturate(160%);
    border:1px solid var(--strokeSoft);
    box-shadow:var(--shx) var(--shy) var(--shblur) var(--shcol), inset 0 1px 0 var(--hi), inset 0 0 0 1px rgba(255,255,255,.06), inset 0 -8px 20px rgba(0,0,0,.05);
    position:relative;
  }
  .glass::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
    background:
      radial-gradient(70% 70% at var(--hlx) var(--hly), rgba(255,255,255,.16), rgba(255,255,255,0) 60%),
      linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,0) 46%, rgba(255,255,255,0) 84%, rgba(255,255,255,.06));
    opacity:.7;mix-blend-mode:screen;}
  body.dark .glass::before{opacity:.32}

  /* tutte le scritte: ombra proiettata */
  .shadowText{text-shadow:0 6px 18px var(--txtShadow);}

  /* .wrap canonicalizzato più in basso (riga unica) */

  .eyebrow{margin:14px 4px 0;color:var(--soft);font-weight:600;font-size:12.5px;letter-spacing:1.4px;text-transform:uppercase;}
  h1.hero{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:33px;letter-spacing:-1px;line-height:1.12;margin:8px 4px 16px;}
  h2.title{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:27px;letter-spacing:-.5px;margin:10px 4px 16px;display:flex;align-items:center;gap:10px;}
  .ticon{width:28px;height:28px;flex:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.5))}

  .heroCard{border-radius:30px;overflow:hidden;position:relative;aspect-ratio:3/2;}
  .heroCard>img{width:100%;height:100%;object-fit:cover;display:block;}
  .chip{position:absolute;left:14px;bottom:14px;padding:10px 14px;border-radius:18px;}
  .chip .t{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:18px}
  .chip .p{font-size:13px;color:var(--soft)}
  .dots{position:absolute;bottom:18px;right:18px;display:flex;gap:6px}
  .dots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.6)} .dots i.on{width:18px;background:#fff}

  .sec{display:flex;align-items:center;justify-content:space-between;margin:30px 4px 14px}
  .sec h2{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:22px;margin:0}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
  .card{border-radius:26px;overflow:hidden;display:flex;flex-direction:column;background:var(--glassDock);-webkit-backdrop-filter:blur(18px) saturate(175%);backdrop-filter:blur(18px) saturate(175%);box-shadow:var(--elev2)}
  .card::before{display:none}
  .card .ph{position:relative;aspect-ratio:1}
  .card .ph img{width:100%;height:100%;object-fit:cover;display:block}
  .lk{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.62);box-shadow:var(--elev1);transition:transform .15s}
  .card .cnt{position:absolute;bottom:10px;left:10px;display:flex;align-items:center;gap:4px;font-size:11px;color:#fff;background:rgba(0,0,0,.5);padding:3px 8px;border-radius:20px}
  .card .body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:9px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .row .t{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:17px}
  .row .p{font-weight:700;white-space:nowrap}
  .mat{font-size:12.5px;color:var(--soft)}
  .qstep{display:flex;align-items:center;gap:8px}
  .qstep button{width:38px;height:38px;border-radius:12px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;font-weight:600;cursor:pointer;display:grid;place-items:center}
  .qstep span{min-width:26px;text-align:center;font-weight:700;font-size:17px;color:var(--text)}
  .qsend{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:16px;border:1px solid var(--strokeSoft);background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-weight:600;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45), var(--elev2);transition:transform .12s}
  .qsend:active{transform:scale(.98)}
  .qsend svg{width:20px;height:20px}
  .heart{width:24px;height:24px;display:block;fill:rgba(255,255,255,.22);stroke:url(#g_white);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.5)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.5));transition:fill .15s, stroke .15s}
  .heart.liked{fill:rgba(240,35,26,.24);stroke:url(#g_red)}

  /* SEARCH */
  .searchbar{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:20px;margin-bottom:18px}
  .searchbar input{flex:1;border:none;background:transparent;outline:none;font-family:inherit;font-size:16px;color:var(--text)}
  .searchbar input::placeholder{color:var(--faint)}

  /* CATEGORIE */
  .cats{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .cat{position:relative;border-radius:22px;padding:24px 14px 18px;display:flex;flex-direction:column;align-items:center;gap:14px;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:21px;text-align:center}
  .cat .ci{position:relative;display:grid;place-items:center}
  .cat .ci .gico{width:57px;height:57px}
  .catedit{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 4px 12px rgba(0,0,0,.2)}
  .catedit:active{transform:scale(.92)}
  .catedit svg{width:18px;height:18px}
  .gico{display:block;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.55))}
  .cathint{margin:16px 4px 14px;color:var(--soft,#9a8d7d);font-size:13px}
  .ipick{position:fixed;inset:0;z-index:85;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .28s ease, background .28s ease, visibility .28s}
  .ipick.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.4)}
  .ipick .sheet{width:100%;max-width:520px;max-height:86vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:var(--glassDock);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border-top-left-radius:24px;border-top-right-radius:24px;border:1px solid var(--strokeSoft);box-shadow:0 -12px 40px rgba(0,0,0,.32);padding:16px 18px calc(26px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
  .iplabel{display:block;font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.05em;text-transform:uppercase;margin:6px 2px 8px}
  .catinput{width:100%;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:14px;padding:12px 14px;font-family:inherit;font-size:15px;color:var(--text);outline:none;margin-bottom:6px;box-shadow:inset 0 1px 0 var(--hi)}
  .catinput:focus{box-shadow:inset 0 1px 0 var(--hi),0 0 0 2px var(--text)}
  .iggroup{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.04em;text-transform:uppercase;margin:16px 2px 9px}
  .ipick.on .sheet{transform:translateY(0)}
  /* POPUP BENVENUTO / TEMA */
  .welcome{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .3s ease, background .3s ease, visibility .3s}
  .welcome.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.46)}
  .wcard{width:100%;max-width:420px;max-height:88vh;overflow-y:auto;border-radius:28px;padding:26px 22px 22px;background:var(--glassDock);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border:1px solid var(--strokeSoft);box-shadow:0 24px 60px rgba(0,0,0,.4);transform:translateY(16px) scale(.98);transition:transform .34s cubic-bezier(.2,.8,.2,1)}
  .welcome.on .wcard{transform:none}
  .wmk{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#C77D6B,#A65435);display:grid;place-items:center;color:#fff;margin:0 auto 14px;box-shadow:0 10px 24px var(--txtShadow),inset 0 1px 0 rgba(255,255,255,.6)}
  .wttl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:23px;text-align:center;color:var(--text);margin:0 0 5px}
  .wsub{text-align:center;color:var(--soft);font-size:14px;margin:0 0 18px;line-height:1.45}
  .wlabel{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.06em;text-transform:uppercase;margin:0 2px 10px}
  .themes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .thopt{border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:18px;padding:15px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--text);font-weight:600;font-size:13px;transition:box-shadow .15s, transform .12s;box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.10)}
  .thopt:active{transform:scale(.96)}
  .thopt.on{box-shadow:inset 0 1px 0 var(--hi), 0 0 0 2px var(--text)}
  .thopt .gico{width:28px;height:28px}
  .wgo{width:100%;border:1px solid var(--strokeSoft);border-radius:16px;padding:14px;background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-weight:600;font-size:16px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 26px var(--shcol)}
  .ipick h4{margin:4px 0 14px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:18px;color:var(--text);display:flex;align-items:center;gap:10px}
  .sheetclose{display:flex;align-items:center;justify-content:center;width:42px;height:42px;margin:0 auto 14px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.16);transition:transform .12s}
  .sheetclose:active{transform:scale(.9)}
  .sheetclose svg{width:22px;height:22px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25)) drop-shadow(0 -.7px .7px rgba(255,255,255,.5))}
  .ipick h4 .gico,.invhead .gico{width:24px;height:24px;flex:none}
  .ipick .ig{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .ipick .ib{aspect-ratio:1;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:16px;display:grid;place-items:center;cursor:pointer;transition:transform .12s}
  .ipick .ib:active{transform:scale(.92)}
  .ipick .ib.on{box-shadow:inset 0 1px 0 var(--hi),0 0 0 2px var(--text)}

  /* ===== DOCK (versione pulita: icone standard allineate + riquadro vetro sull'attiva) ===== */
  .dockwrap{position:fixed;left:0;right:0;bottom:18px;z-index:72;display:flex;justify-content:center;pointer-events:none}
  .dock{pointer-events:auto;display:flex;align-items:center;gap:5px;padding:8px 11px;border-radius:30px;
    background:var(--glassDock);
    -webkit-backdrop-filter:blur(20px) saturate(190%);backdrop-filter:blur(20px) saturate(190%);
    border:1px solid var(--strokeSoft);
    box-shadow:inset 0 1px 0 var(--hi), var(--elev3), 0 0 0 .5px rgba(0,0,0,.05)}
  .dnav{position:relative;width:53px;height:53px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:17px;padding:0;transition:background .2s, box-shadow .2s}
  .dnav svg{width:26px;height:26px;display:block;opacity:.95;transition:opacity .2s, filter .2s;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.55))}
  .dnav.act{background:var(--glass2);box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.12)}
  .dnav.act svg{opacity:1}
  .dnav:not(.act) svg{stroke:var(--text);fill:none}
  .tb-spacer{width:44px;height:1px}
  .cardcat{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12.7px;font-weight:600;color:var(--soft)}
  .cardcat .gico{width:16px;height:16px;flex:none}
  .dnav .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:5px;background:var(--heart);border:1.5px solid var(--glassDock)}
  .topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:10px;padding:10px 14px;background:transparent;pointer-events:none}
  .topbar>*{pointer-events:auto}
  .topbar::after{content:"";position:absolute;left:0;right:0;top:0;height:128px;z-index:-1;opacity:0;transition:opacity .28s;
    background:linear-gradient(to bottom, rgba(0,0,0,.34), rgba(0,0,0,.16) 42%, transparent);
    -webkit-backdrop-filter:blur(10px) saturate(150%);backdrop-filter:blur(10px) saturate(150%);
    -webkit-mask-image:linear-gradient(to bottom,#000 50%,transparent);mask-image:linear-gradient(to bottom,#000 50%,transparent)}
  .topbar.scrolled::after{opacity:1}
  .topbar .brand2{justify-self:center;display:flex;align-items:center;gap:10px;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:21px;letter-spacing:-.5px;color:var(--text);text-shadow:0 2px 10px var(--txtShadow)}
  .topbar .brand2 .mk{width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#C77D6B,#A65435);display:grid;place-items:center;color:#fff;box-shadow:0 6px 16px var(--txtShadow), inset 0 1px 0 rgba(255,255,255,.6)}
  .tb-btn{width:40px;height:40px;border:none;background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:13px;transition:background .2s}
  .tb-btn.left{justify-self:start}
  .tb-btn.right{justify-self:end}
  .tb-btn svg{width:25px;height:25px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.6))}
  .tb-btn .av{width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;border:1.5px solid var(--strokeSoft);box-shadow:var(--elev1)}
  .tb-btn.act{background:var(--glass2)}
  .tb-btn.right.act .av{box-shadow:0 0 0 2px var(--glass2), var(--elev1)}
  .tb-right{justify-self:end;display:flex;align-items:center;gap:4px}
  .tb-btn.cart{position:relative}
  .cbadge{position:absolute;top:6px;right:6px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--heart);color:#fff;font-size:10px;font-weight:700;display:none;place-items:center;border:1.5px solid var(--glassDock)}
  .tb-btn.orders{position:relative}
  .tb-btn.orders .dot{position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:5px;background:var(--heart);border:1.5px solid var(--bg)}
  .addcart{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-weight:600;font-size:13.5px;cursor:pointer;transition:transform .12s}
  .addcart:active{transform:scale(.97)}
  .addcart svg{width:22px;height:22px;display:block}
  .dback{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 0;background:linear-gradient(to bottom,var(--bg) 70%,transparent)}
  .dback button{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;cursor:pointer;display:grid;place-items:center}
  .dbt{font-family:'Inter',system-ui,sans-serif;font-weight:600;color:var(--text)}
  .dimg{width:100%;aspect-ratio:1;border-radius:24px;object-fit:cover;border:1px solid var(--strokeSoft);box-shadow:0 18px 50px var(--shcol)}
  .dttl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:30px;color:var(--text);margin:5px 2px 6px;letter-spacing:-.02em;line-height:1.06}
  .dkick{font-size:11.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:16px 2px 0}
  .dpricerow{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin:2px 2px 0}
  .dprice{font-family:'Inter',system-ui,sans-serif;font-weight:800;font-size:30px;color:var(--priceCol);margin:0;letter-spacing:-.02em}
  .dmat{display:inline-flex;align-items:center;padding:4px 11px;border-radius:20px;background:rgba(199,125,107,.10);border:1px solid rgba(199,125,107,.24);color:var(--accent);font-size:12.5px;font-weight:600;margin:0}
  .ddesc{margin:14px 2px 0;font-size:14px;line-height:1.55;color:var(--text);opacity:.88}
  .dlabel{font-size:12px;font-weight:700;color:var(--soft);margin:18px 2px 9px;letter-spacing:.06em;text-transform:uppercase}
  .dswatches{display:flex;gap:16px;flex-wrap:wrap}
  .dswbox{display:flex;flex-direction:column;align-items:center;gap:7px;background:none;border:0;padding:0;cursor:pointer}
  .dsw{width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);transition:transform .12s,box-shadow .12s;display:block}
  .dswbox.on .dsw{box-shadow:0 0 0 3px var(--text);transform:scale(1.08)}
  .dswn{font-size:12px;color:var(--soft);letter-spacing:.01em}
  .dswbox.on .dswn{color:var(--text);font-weight:600}
  .dqty{gap:14px}
  .dgrid{display:grid;gap:16px;grid-template-columns:1fr;grid-template-areas:"photo" "opts" "buy";margin-top:4px}
  .dphoto{grid-area:photo;position:relative}
  .dimgup{position:absolute;right:10px;bottom:10px;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px) saturate(180%);backdrop-filter:blur(16px) saturate(180%);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.2);transition:transform .12s}
  .dimgup:active{transform:scale(.9)}
  .dimgup svg{width:21px;height:21px}
  .dopts{grid-area:opts}
  .dbuy{grid-area:buy;display:flex;flex-direction:column;align-items:center}
  .dbuy .dadd2{width:100%;max-width:320px}
  .dopts .dttl{margin-top:0}
  .dbuy .dlabel.dctr{text-align:center;margin:2px 0 9px}
  .dbuy .dqty{justify-content:center}
  .seg{display:flex;gap:6px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:5px;max-width:360px;-webkit-backdrop-filter:blur(12px) saturate(160%);backdrop-filter:blur(12px) saturate(160%)}
  .seg button{flex:1;border:none;background:transparent;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:13.5px;padding:9px 6px;border-radius:11px;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}
  .seg button.on{background:rgba(199,125,107,.14);color:var(--accent);font-weight:700;box-shadow:inset 0 0 0 1px rgba(199,125,107,.32),0 3px 9px rgba(199,125,107,.16)}
  .seg button i{font-style:normal;font-weight:600;font-size:11px;opacity:.6;margin-left:3px}
  .seg button.on i{opacity:.95;color:var(--accent)}
  .elecedit{margin-top:14px;background:none;border:none;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;padding:2px 0}
  .elecprices{margin-top:8px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:13px;padding:6px 12px}
  .epp{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;font-size:13.5px;color:var(--text);border-bottom:1px solid var(--strokeSoft)}
  .epp:last-child{border-bottom:none}
  .epp .eur{display:flex;align-items:center;gap:4px;color:var(--soft);font-weight:600}
  .epp .eur input{width:62px;text-align:right;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);border-radius:9px;padding:6px 8px;font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:14px}
  .iitem{padding:12px 0;border-bottom:1px solid var(--strokeSoft)}
  .iitem:last-child{border-bottom:none}
  .iitem .iline{display:flex;align-items:center;gap:10px;font-size:15px;color:var(--text);margin:0 0 8px}
  .iitem .iname{flex:1;font-weight:700}
  .ithumb{width:46px;height:46px;border-radius:12px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
  .ibd{display:flex;justify-content:space-between;font-size:13px;color:var(--soft);margin-top:4px;margin-left:56px}
  .ibd.ifin{color:var(--text);font-weight:600;margin-top:7px}
  .ibd.isub{color:var(--text);font-weight:700;font-size:14.5px;margin-top:7px}
  #invoiceSheet .cttot{font-size:18px;align-items:baseline;margin-top:8px}
  #invoiceSheet #invTot{font-size:30px;font-weight:800;color:var(--text)}
  .invav{width:46px;height:46px;border-radius:50%;object-fit:cover;flex:none;border:1px solid var(--strokeSoft);box-shadow:0 2px 8px rgba(0,0,0,.2)}
  .invtt{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
  .bnav{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;align-self:flex-start}
  .dadd2{margin-top:12px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;border-radius:16px;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);color:var(--text);font-weight:700;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 8px 22px rgba(0,0,0,.18);transition:transform .12s}
  .dadd2:active{transform:scale(.96)}
  .dadd2 svg{width:21px;height:21px;stroke:var(--text);filter:drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 -.7px .7px rgba(255,255,255,.5))}
  @media(min-width:560px){.dgrid{grid-template-columns:1fr 1fr;grid-template-areas:"photo opts" "buy opts";align-items:start}.dbuy{margin-top:6px}}
  .crow{display:flex;align-items:center;gap:12px;padding:10px;border-radius:16px;background:var(--glass2);border:1px solid var(--strokeSoft);margin-bottom:10px}
  .crow img{width:52px;height:52px;border-radius:12px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
  .crow .cinfo{flex:1;min-width:0}
  .crow .cn{font-weight:700;font-size:15px;color:var(--text)}
  .crow .cp{font-size:12px;color:var(--soft);margin-top:1px;line-height:1.3}
  .crow .cprice{font-size:12.5px;color:var(--faint);margin-top:2px}
  .qstep.csmall{gap:6px}
  .qstep.csmall button{width:30px;height:30px;border-radius:9px;font-size:17px}
  .qstep.csmall span{min-width:16px;text-align:center;font-weight:600}
  .cttot{display:flex;justify-content:space-between;align-items:center;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:19px;color:var(--text);margin:14px 2px 12px;padding-top:14px;border-top:1px solid var(--strokeSoft)}
  #cartSheet .sheet{min-height:46vh}
  #cartSheet h4{font-size:20px}
  #cartSheet h4 .gico{width:27px;height:27px}
  #cartSheet .cn{font-size:16.5px}
  #cartSheet .cp{font-size:13.5px}
  #cartSheet .cttot{font-size:21px}
  #cartSheet .qsend{font-size:16.5px}
  .inv .invhead{display:flex;justify-content:flex-start;align-items:center;gap:11px;margin-bottom:6px}
  .invmeta{font-size:13px;color:var(--soft);display:flex;align-items:center;gap:6px}
  .invitems{margin:6px 0 2px}
  .iline{display:flex;justify-content:space-between;font-size:15px;color:var(--text);margin-top:12px}
  .iline .ix{color:var(--soft);font-size:13px}

  /* ORDINI */
  .banner{border-radius:20px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .banner .txt{flex:1;min-width:140px;font-size:14px}
  .btnY{border:none;border-radius:12px;padding:9px 14px;font-weight:600;font-size:13px;cursor:pointer;background:#2e7d4f;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)}
  .btnN{border:1px solid var(--strokeSoft);border-radius:12px;padding:9px 12px;font-weight:600;font-size:13px;cursor:pointer;background:transparent;color:var(--text)}
  .osec{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--soft);margin:4px 4px 12px}
  .ord{display:flex;gap:12px;align-items:center;border-radius:20px;padding:10px;margin-bottom:10px}
  .ord img{width:56px;height:56px;border-radius:14px;object-fit:cover}
  .ord .t{font-weight:600} .ord .s{font-size:12.5px;color:var(--soft)}
  .badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:20px;white-space:nowrap}
  .bp{background:rgba(210,150,40,.18);color:#b07c1e} .bc{background:rgba(46,125,79,.18);color:#2e7d4f}
  body.dark .bp{color:#e3b261} body.dark .bc{color:#7fc79b}

  /* PROFILO */
  .pcard{border-radius:26px;padding:22px;display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .pcard .pav{width:68px;height:68px;border-radius:50%;border:2px solid rgba(255,255,255,.6)}
  .pcard .nm{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:24px}
  .pcard .em{font-size:13.5px;color:var(--soft)}
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .stat{border-radius:20px;padding:16px} .stat .n{font-family:'Inter',system-ui,sans-serif;font-size:28px;font-weight:600} .stat .l{font-size:13px;color:var(--soft)}
  .logout{width:100%;border-radius:16px;padding:14px;border:1px solid var(--strokeSoft);background:transparent;color:var(--heart);font-weight:600;font-size:15px;cursor:pointer}

  .note{text-align:center;color:var(--faint);font-size:12.5px;margin:26px 0 0}
  .screen{display:none} .screen.on{display:block;animation:scrIn .3s cubic-bezier(.22,1,.36,1) both}
  @keyframes scrIn{from{opacity:0}to{opacity:1}}
  @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes itemIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
  .grid .card{opacity:0}
  .card.in,.cat.in,.ord.in,.banner.in{animation:itemIn .5s cubic-bezier(.2,.8,.25,1) both}
  svg{display:block}
  #toast{position:fixed;left:50%;transform:translateX(-50%);bottom:120px;z-index:95;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
  .tt{padding:11px 18px;border-radius:30px;font-size:13.5px;color:#fff;background:rgba(20,18,16,.82);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:fu .35s both;box-shadow:0 8px 24px rgba(0,0,0,.3)}
  @media (prefers-reduced-motion: reduce){.blob{animation:none}.px{transform:none!important}.screen.on,.card.in,.cat.in,.ord.in,.banner.in{animation:none!important}.grid .card{opacity:1}.ipick,.ipick .sheet,.welcome,.wcard{transition:none}}

/* ---- supplemento React (login, hero, admin, stati vuoti) ---- */
.boot{min-height:100vh;display:grid;place-items:center;color:var(--soft);font-weight:600}
.wrap{max-width:680px;margin:0 auto;padding:62px 0 132px;min-height:100vh;min-height:100dvh}
.wrap .grid{padding:0 18px}
.grid{grid-template-columns:repeat(2,1fr);gap:12px}
.grid .card{opacity:1}
.px{padding-left:18px;padding-right:18px}
.kick{font-size:13px;font-weight:700;letter-spacing:1.5px;color:var(--soft);margin:10px 0 2px}
.hero{font-size:40px;line-height:1.04;font-weight:800;color:var(--text);margin:0 0 18px}
.herocard{position:relative;margin:0 18px 18px;border-radius:26px;overflow:hidden;box-shadow:var(--elev3);cursor:pointer;aspect-ratio:16/11}
.herocard img{width:100%;height:100%;object-fit:cover;display:block}
.herotag{position:absolute;left:14px;bottom:14px;background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--strokeSoft);border-radius:15px;padding:9px 13px}
.herotag .ht{font-weight:700;color:var(--text)}
.herotag .hp{font-size:13px;color:var(--soft)}
.searchbox{width:calc(100% - 36px);margin:0 18px 16px;padding:13px 16px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-size:15px}
.empty{color:var(--faint);font-size:14px;padding:6px 18px}
.catgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:0 18px}
.cat{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 12px 18px;border-radius:22px;text-align:center;cursor:pointer}
.cat .ci{display:grid;place-items:center}
.cat .ci .gico{width:54px;height:54px}
.cat .catn{font-weight:700;font-size:18px;color:var(--text)}
.heartred svg{stroke:#F0231A;fill:rgba(240,35,26,.18)}
.cempty{text-align:center;color:var(--soft);padding:42px 0 16px;font-size:19px;font-weight:600}
.osec{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--soft);margin:4px 20px 12px}
.qsend{display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 36px);margin:8px 18px 0;padding:15px;border-radius:17px;border:none;background:linear-gradient(135deg,var(--b3,#e0a890),#c2715f);color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;cursor:pointer;box-shadow:0 2px 6px rgba(120,60,40,.16), 0 14px 32px rgba(120,60,40,.24)}
.qsend:disabled{opacity:.6}
.invtot{font-size:30px;font-weight:800;color:var(--text)}
.invtotrow{align-items:baseline}
/* profilo */
.pcard{display:flex;align-items:center;gap:14px;margin:0 18px;padding:16px;border-radius:20px}
.pav{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--strokeSoft)}
.pname{font-weight:700;font-size:18px;color:var(--text)}
.prole{font-size:13px;color:var(--soft)}
.psec{font-weight:700;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:var(--soft);margin:18px 20px 10px}
.bgpick{padding:0 18px}
.throw{display:flex;gap:8px;padding:0 18px}
.thopt{flex:1;padding:12px;border-radius:14px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
.thopt.on{background:var(--glassDock);color:var(--accent);box-shadow:inset 0 1px 0 var(--hi),0 0 0 1.5px var(--accent)}
.logout{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 36px);margin:22px 18px 0;padding:13px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
/* login */
.loginwrap{min-height:100vh;display:grid;place-items:center;padding:22px}
.loginbox{padding:34px 28px;border-radius:26px;text-align:center;max-width:360px;width:100%;background:var(--glassDock);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 24px 60px rgba(0,0,0,.32)}
.loginbox.glass{-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%)}
.brand2.big{font-size:30px;justify-content:center}
.brand2.big .mk{width:40px;height:40px}
.lsub{color:var(--soft);margin:6px 0 22px}
.gbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 6px 16px rgba(0,0,0,.12)}
/* admin */
.sheet.admin{max-height:88vh;overflow-y:auto}
.afield{display:flex;flex-direction:column;gap:5px;margin:10px 0}
.afield label{font-size:12.5px;font-weight:600;color:var(--soft)}
.afield input,.afield select,.afield textarea{padding:11px 12px;border-radius:12px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-family:inherit;font-size:14.5px}
.afrow{display:flex;gap:10px}
.afrow .afield{flex:1}
.afrow3{display:flex;gap:8px}
.afrow3 .afield{flex:1}
.afrow3 input{width:100%}
.achk{display:flex;align-items:center;gap:9px;margin:8px 0;font-size:14px;color:var(--text);cursor:pointer}
.colrow{display:flex;gap:11px;align-items:center;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:10px;margin-bottom:9px}
.colthumb{width:50px;height:50px;border-radius:11px;object-fit:cover;flex:none;border:1px solid var(--strokeSoft)}
.colfields{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.colfields input[type=text],.colfields>input{padding:8px 10px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit}
.colpicks{display:flex;align-items:center;gap:8px}
.colpicks input[type=color]{width:34px;height:34px;border:none;border-radius:9px;background:none;cursor:pointer}
.upbtn{width:36px;height:36px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);display:grid;place-items:center;cursor:pointer;color:var(--text)}
.coldel{width:36px;height:36px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glass2);color:#c0392b;display:grid;place-items:center;cursor:pointer;margin-left:auto}
.addcolor{display:flex;align-items:center;gap:7px;background:none;border:1px dashed var(--strokeSoft);border-radius:12px;padding:10px 14px;color:var(--soft);font-family:inherit;font-weight:600;cursor:pointer;margin:2px 0 12px}
.saveaddons{margin-top:8px;background:var(--glassDock);border:1px solid var(--strokeSoft);border-radius:11px;padding:9px 14px;color:var(--text);font-family:inherit;font-weight:600;cursor:pointer}
.elecedit{margin-top:14px;background:none;border:none;color:var(--soft);font-family:inherit;font-weight:600;font-size:12.5px;cursor:pointer;padding:2px 0}
.card{opacity:1}
.orddot{position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:#e0584a}

/* ---- fix porting ---- */
.dnav.home.act svg{stroke:url(#g_home)}
.dnav.search.act svg{stroke:url(#g_search)}
.dnav.cats.act svg{stroke:url(#g_cats)}
.dnav.like.act svg{stroke:url(#g_heartT)}
.dnav.orders.act svg{stroke:url(#g_orders)}
.dnav.act svg{fill:none}
.sheet h4 svg{width:26px;height:26px;flex:none}
.dbacklbl{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
.dedit{margin-left:auto;width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}
.dedit svg{width:18px;height:18px}
.cedit{position:absolute;top:10px;left:10px;width:34px;height:34px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);display:grid;place-items:center;color:var(--text);cursor:pointer;z-index:3}
.cedit svg{width:16px;height:16px}
.cedit.hero{top:14px;left:14px;width:38px;height:38px}
.brand2 .mk svg{width:18px;height:18px}

/* ---- title icon sizing ---- */
.title .ticon{display:grid;place-items:center}
.title .ticon svg{width:26px;height:26px;display:block;stroke:var(--text);fill:none}
.title .ticon.heartred svg{stroke:#F0231A;fill:rgba(240,35,26,.16)}
.title .ticon.heartred svg,.heartred svg{width:26px;height:26px}
/* ---- safe-area / full screen ---- */
.topbar{padding-top:calc(10px + env(safe-area-inset-top));padding-left:calc(14px + env(safe-area-inset-left));padding-right:calc(14px + env(safe-area-inset-right))}
.wrap{padding-top:calc(62px + env(safe-area-inset-top))}
.dockwrap{bottom:calc(18px + env(safe-area-inset-bottom))}
#toast{bottom:calc(120px + env(safe-area-inset-bottom))}
.sheet{padding-bottom:calc(18px + env(safe-area-inset-bottom))}

/* ---- card: tile piu' compatta, testo piu' leggibile ---- */
.card{min-width:0}
.card .ph{aspect-ratio:1.1}
.cbody{padding:10px 11px 11px;display:flex;flex-direction:column;gap:6px;min-width:0}
.cbody .cardcat{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:11.5px;font-weight:600;color:var(--soft);min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cbody .cardcat .gico{width:14px;height:14px;flex:none}
.cbody .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cbody .ct{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:15px;color:var(--text);line-height:1.15;min-width:0}
.cbody .cp{font-weight:700;font-size:15px;white-space:nowrap;color:var(--text)}
.cbody .mat{font-size:11.5px;color:var(--soft)}
.cbody .addcart{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:13px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-weight:600;font-size:12.5px;cursor:pointer}
.cbody .addcart svg{width:18px;height:18px;display:block}
.cbody .addcart .gico{width:16px;height:16px}

/* ---- sezione colore dettaglio ---- */
.dlabel.dcolor{font-size:13.2px;margin-bottom:16px}
.dswatches{gap:18px}
.dsw{width:46px;height:46px;border:2.5px solid rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(0,0,0,.28),0 2px 7px rgba(0,0,0,.3),inset 0 1px 3px rgba(255,255,255,.55)}
.dswbox.on .dsw{border-color:#fff;box-shadow:0 0 0 2px #fff,0 0 0 4.5px var(--text),0 0 14px 3px rgba(255,255,255,.6),inset 0 1px 3px rgba(255,255,255,.55);transform:scale(1.12)}
body.dark .dsw{border-color:rgba(255,255,255,.85);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 2px 7px rgba(0,0,0,.45),inset 0 1px 3px rgba(255,255,255,.4)}
body.dark .dswbox.on .dsw{border-color:#fff;box-shadow:0 0 0 2px #1a1714,0 0 0 4.5px #fff,0 0 16px 4px rgba(255,255,255,.5),inset 0 1px 3px rgba(255,255,255,.4)}

/* ---- pulsante cambia foto (admin) sul dettaglio ---- */
.dphoto{position:relative}
.dphotobtn{position:absolute;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:grid;place-items:center;color:var(--text);cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25);z-index:3}

/* ---- topbar: back + carrello accanto al profilo ---- */
.topbar{pointer-events:none}
.topbar button,.topbar .tb-right{pointer-events:auto}
.tb-back{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:grid;place-items:center;color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi), var(--elev1)}
.tb-back svg{width:22px;height:22px;stroke:var(--text)}
.tb-btn.cart{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 var(--hi), var(--elev1)}
.tb-btn.cart svg{width:23px;height:23px;stroke:var(--text);fill:none}
.tb-btn.cart .cbadge{display:grid}
.tb-right{gap:10px}

/* ---- parallasse leggera su scroll (solo immagine hero) ---- */
.herocard img{transform:scale(1.08) translateY(calc(var(--par,0) * -0.015px));transition:transform .05s linear}

/* ---- scrim sfumato in alto (home, primi ~125px) allo scroll ---- */
.topscrim{position:fixed;top:0;left:0;right:0;height:calc(125px + env(safe-area-inset-top));z-index:49;pointer-events:none;background:linear-gradient(180deg,var(--scrim) 0%,var(--scrim2) 52%,transparent 100%);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);-webkit-mask:linear-gradient(180deg,#000 0%,#000 52%,transparent 100%);mask:linear-gradient(180deg,#000 0%,#000 52%,transparent 100%);opacity:min(1,calc(var(--par,0) / 60));transition:opacity .08s linear}
:root{--scrim:rgba(244,239,232,.9);--scrim2:rgba(244,239,232,.5)}
body.dark{--scrim:rgba(45,36,32,.9);--scrim2:rgba(45,36,32,.5)}

/* ---- animazione apertura carrello dal basso ---- */
.ipick.on .sheet{animation:sheetUp .4s cubic-bezier(.2,.85,.25,1) both}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.ipick.on{animation:scrimIn .32s ease both}
@keyframes scrimIn{from{background:rgba(0,0,0,0)}to{background:rgba(0,0,0,.4)}}

/* ---- ordini: margine laterale (~3mm) ---- */
.banner{margin-left:12px;margin-right:12px}
.ord{margin-left:12px;margin-right:12px}
.osec{margin-left:14px;margin-right:14px}

/* ---- titolo con azione (es. + categorie) ---- */
.titlerow{display:flex;align-items:center;justify-content:space-between;gap:12px}
.titlerow .title{margin:10px 0 16px}
.tb-back.addnew{flex:none}

/* ---- pencil di modifica sulle tile categoria ---- */
.catedit2{left:auto;right:8px;top:8px}

/* ---- icon picker categorie ---- */
.iggroup{font-size:12px;font-weight:700;color:var(--soft);text-transform:uppercase;letter-spacing:.04em;margin:14px 2px 8px}
.ig{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.ib{aspect-ratio:1;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:14px;display:grid;place-items:center;cursor:pointer;color:var(--text)}
.ib.on{box-shadow:0 0 0 2px var(--text);background:var(--glassDock)}

/* ---- pulsante elimina ---- */
.delbtn{width:calc(100% - 36px);display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 18px 0;padding:13px;border-radius:15px;border:1px solid rgba(192,57,43,.4);background:rgba(192,57,43,.1);color:#c0392b;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer}
.delbtn svg{width:18px;height:18px}

/* ---- feedback "press" su tutti i pulsanti ---- */
button{transition:transform .14s cubic-bezier(.22,.7,.28,1.5)}
button:active{transform:scale(.93)}
.card,.cat,.herocard{transition:transform .16s cubic-bezier(.22,.7,.28,1.4);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.card:active,.cat:active,.herocard:active{transform:scale(.94)}

/* ---- nascondi scrollbar (scroll resta attivo) ---- */
*{scrollbar-width:none;-ms-overflow-style:none}
*::-webkit-scrollbar{width:0;height:0;display:none}

/* ---- chiusura carrello (slide-down + fade scrim) ---- */
.ipick.on.closing .sheet{animation:sheetDown .34s cubic-bezier(.4,0,.7,.4) both}
.ipick.on.closing{animation:scrimOut .34s ease both}
@keyframes sheetDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes scrimOut{from{background:rgba(0,0,0,.4)}to{background:rgba(0,0,0,0)}}

/* ---- foglio dall'ALTO (notifiche): identico al carrello ma scende dall'alto ---- */
.ipick.top{align-items:flex-start}
.ipick.top .sheet{border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:24px;border-bottom-right-radius:24px;box-shadow:0 12px 40px rgba(0,0,0,.32);transform:translateY(-100%);padding:calc(16px + env(safe-area-inset-top)) 18px 20px}
.ipick.top.on .sheet{transform:translateY(0);animation:sheetTopIn .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.top.on.closing .sheet{animation:sheetTopOut .34s cubic-bezier(.4,0,.7,.4) both}
@keyframes sheetTopIn{from{transform:translateY(-100%)}to{transform:translateY(0)}}
@keyframes sheetTopOut{from{transform:translateY(0)}to{transform:translateY(-100%)}}
.ipick.top .sheetclose{margin:14px auto 0}

/* ---- wrapper foglio: porta l'animazione di slide; il pulsante di chiusura
   sta FUORI dal foglio (sopra per carrello/dettaglio, sotto per notifiche) ---- */
.ipick .sheetwrap{width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center;transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
.ipick.on .sheetwrap{transform:translateY(0);animation:sheetUp .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.on.closing .sheetwrap{animation:sheetDown .34s cubic-bezier(.4,0,.7,.4) both}
/* il foglio dentro al wrapper non slitta da solo (slitta il wrapper) */
.sheetwrap .sheet{transform:none!important;animation:none!important;max-width:100%}
/* pulsante chiusura sopra al foglio (carrello/dettaglio) */
.sheetwrap>.sheetclose{margin:0 0 12px}
/* variante dall'alto: wrapper scende dall'alto e il pulsante sta SOTTO il foglio */
.ipick.top .sheetwrap{transform:translateY(-100%)}
.ipick.top.on .sheetwrap{transform:translateY(0);animation:sheetTopIn .4s cubic-bezier(.2,.85,.25,1) both}
.ipick.top.on.closing .sheetwrap{animation:sheetTopOut .34s cubic-bezier(.4,0,.7,.4) both}
.ipick.top .sheetwrap>.sheetclose{margin:12px 0 0}

/* ---- modale conferma ordine (centrata, vetro frostato, auto-dismiss) ---- */
.odone{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.34);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:odIn .3s ease both}
.odone.out{animation:odOut .4s ease both}
.odcard{width:100%;max-width:340px;text-align:center;padding:32px 28px;border-radius:28px;background:var(--glassDock);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 26px 64px rgba(0,0,0,.42);animation:odCard .44s cubic-bezier(.2,.85,.25,1) both}
.odone.out .odcard{animation:odCardOut .4s ease both}
.odicon{width:66px;height:66px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:rgba(199,125,107,.16);color:var(--accent);box-shadow:inset 0 1px 0 var(--hi)}
.odicon svg{width:32px;height:32px;stroke:var(--accent)}
.odt{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:22px;color:var(--text);margin-bottom:9px}
.ods{font-size:13.5px;color:var(--soft);line-height:1.5}
.authcard .authgbtn{margin-top:20px}
.authlater{margin-top:10px;width:100%;padding:11px;border:none;background:transparent;color:var(--soft);font-family:inherit;font-weight:600;font-size:13.5px;cursor:pointer;border-radius:12px}
.authlater:active{transform:scale(.97)}
@keyframes odIn{from{opacity:0}to{opacity:1}}
@keyframes odOut{from{opacity:1}to{opacity:0}}
@keyframes odCard{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes odCardOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.96)}}

/* ---- carosello rimosso: la home usa una singola tile .herocard ---- */

/* ---- transizione apertura/chiusura dettaglio ---- */

/* ---- galleria foto (fino a 5 per colore) ---- */
.dgallery{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;border-radius:24px;-webkit-overflow-scrolling:touch}
.dgallery .dimg{flex:0 0 100%;scroll-snap-align:center;width:100%;aspect-ratio:1;object-fit:cover;display:block;border-radius:24px}
.gdots{display:flex;justify-content:center;gap:6px;margin-top:9px}
.gdot{width:6px;height:6px;border-radius:50%;background:var(--faint)}

/* ---- editor: righe colore con 5 foto ---- */
.colrow2{background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:15px;padding:11px;margin-bottom:10px}
.colhead{display:flex;align-items:center;gap:8px}
.colname{flex:1;min-width:0;padding:8px 10px;border-radius:10px;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);font-family:inherit;font-size:14px}
.colhead input[type=color]{width:34px;height:34px;border:none;border-radius:9px;background:none;cursor:pointer;flex:none}
.colphotos{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.colph{position:relative;width:60px;height:60px;border-radius:11px;overflow:hidden;border:1px solid var(--strokeSoft)}
.colph img{width:100%;height:100%;object-fit:cover;display:block}
.colphdel{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:15px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}
.colphmain{position:absolute;bottom:0;left:0;right:0;font-size:8.5px;font-weight:600;text-align:center;background:rgba(0,0,0,.55);color:#fff;padding:1px 0}
.coladd{width:60px;height:60px;border-radius:11px;border:1.5px dashed var(--strokeSoft);display:grid;place-items:center;cursor:pointer;color:var(--soft);background:var(--glassDock)}
.colhint{font-size:11px;color:var(--faint);margin-top:7px}

/* ---- dettaglio come popup a foglio (stile carrello) ---- */
:root{--sheetbg:#f6f1ea}
body.dark{--sheetbg:#1f1b17}
:root{--detailGlass:linear-gradient(180deg,rgba(249,242,234,.82),rgba(244,233,222,.80));--detailBorder:rgba(199,125,107,.20);--priceCol:#8F4E37}
body.dark{--detailGlass:linear-gradient(180deg,rgba(40,32,26,.84),rgba(30,24,20,.84));--detailBorder:rgba(209,124,86,.22);--priceCol:#E6A079}
.sheet.detailsheet{position:relative;background:var(--detailGlass);-webkit-backdrop-filter:blur(26px) saturate(185%);backdrop-filter:blur(26px) saturate(185%);max-height:calc(100vh - 96px - env(safe-area-inset-top));max-height:calc(100dvh - 96px - env(safe-area-inset-top));padding-top:14px;border:1px solid var(--detailBorder);box-shadow:inset 0 1px 0 var(--hi),0 -14px 44px rgba(0,0,0,.34)}
.detailsheet .detailedit{position:absolute;top:12px;right:16px;margin:0;z-index:4}
.detailsheet .dgrid{margin-top:6px}

/* ================= DESIGN SYSTEM — premium warm (light/dark auto) ============= */
:root{
  --text:#2D2621; --soft:#6E6257; --faint:rgba(110,98,87,.55);
  --glass:rgba(252,247,240,.46); --glass2:rgba(250,242,233,.62);
  --strokeSoft:rgba(199,125,107,.14); --hi:rgba(255,255,255,.5); --glassDock:rgba(246,236,225,.74);
  --bg:#F4EFE8; --bg2:#EFE7DD;
  --accent:#C77D6B; --accent2:#A65435; --accentDark:#8B4A32;
  --icon:#9A7D6A; --heart:#C2553F; --success:#6E8B69; --warning:#C89C5B;
  --txtShadow:rgba(70,45,30,.14); --shcol:rgba(120,80,55,.12); --shblur:42px; --shy:12px;
  --elev1:0 1px 2px rgba(74,45,28,.20), 0 3px 10px rgba(74,45,28,.24);
  --elev2:0 2px 6px rgba(74,45,28,.18), 0 10px 24px rgba(74,45,28,.30);
  --elev3:0 5px 14px rgba(74,45,28,.18), 0 20px 44px rgba(74,45,28,.34);
  --card:rgba(255,255,255,.5); --sheetbg:#F7F2EB;
  --scrim:rgba(247,242,235,.9); --scrim2:rgba(247,242,235,.5);
}
body.dark{
  --text:#F2E5D5; --soft:#B9A897; --faint:rgba(185,168,151,.5);
  --glass:rgba(214,184,155,.06); --glass2:rgba(214,184,155,.10);
  --strokeSoft:rgba(209,124,86,.16); --hi:rgba(255,255,255,.1); --glassDock:rgba(45,36,32,.78);
  --bg:#2D2420; --bg2:#3B2B25;
  --accent:#CC7E5E; --accent2:#B7795E; --accentDark:#A65435;
  --icon:#9A8472; --heart:#DD8468; --success:#7A9774; --warning:#D1A366;
  --txtShadow:rgba(0,0,0,.5); --shcol:rgba(0,0,0,.5);
  --elev1:0 1px 2px rgba(0,0,0,.34), 0 6px 16px rgba(0,0,0,.42);
  --elev2:0 2px 8px rgba(0,0,0,.34), 0 16px 36px rgba(0,0,0,.46);
  --elev3:0 4px 12px rgba(0,0,0,.34), 0 28px 60px rgba(0,0,0,.52);
  --card:rgba(51,39,35,.54); --sheetbg:#3B2B25;
  --scrim:rgba(45,36,32,.9); --scrim2:rgba(45,36,32,.5);
}

/* ======================= SFONDO — wallpaper frosted raster ==================
   Lo sfondo e' un'IMMAGINE (JPEG frosted 4k, vedi WP_LIGHT/WP_DARK + syncBackstop)
   applicata sul <body> con background-attachment:SCROLL (NON fixed): scorre col
   contenuto come parte del normale rendering del documento. Niente layer ancorato
   al viewport = niente ridisegno parziale = niente "rettangolo"/linea netta.
   L'<html> porta solo la tinta unita di base come backstop (overscroll/bordi).
   Qui nel CSS restano solo le transizioni di tema. */

/* ---- vetro: frosted ceramic ---- */
.glass{-webkit-backdrop-filter:blur(26px) saturate(125%);backdrop-filter:blur(26px) saturate(125%)}

/* ---- icone monocromatiche (famiglia terracotta) ---- */
.gico{stroke:var(--accent);fill:rgba(199,125,107,.10)}
body.dark .gico{fill:rgba(209,124,86,.12)}
.dock .dnav svg{stroke:var(--icon)!important;fill:none}
.dock .dnav.act svg{stroke:var(--accent)!important}
.heart.liked svg{stroke:var(--heart)!important;fill:rgba(199,125,107,.16)!important}
body.dark .heart.liked svg{fill:rgba(209,124,86,.18)!important}
.title .ticon.heartred svg,.heartred svg{stroke:var(--heart)!important;fill:rgba(199,125,107,.14)!important}

/* ---- micro-interazioni: morbide, senza rimbalzo ---- */
button{transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s ease,background .22s ease}
button:active{transform:scale(.97)}
.card,.cat,.herocard{transition:transform .24s cubic-bezier(.4,0,.2,1)}
.card:active,.cat:active,.herocard:active{transform:scale(.985)}

/* ---- dock sempre ancorata al bordo visibile (no jitter con barra Safari) ---- */
.dockwrap{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom))}

/* ---- testo aspetto profilo ---- */
.paspect{color:var(--soft);font-size:13.5px;margin:2px 2px 18px;line-height:1.5}

/* ---- selettore tema: segmented premium (Luce/Buio/Automatico) ---- */
.themeseg{display:flex;gap:6px;padding:6px;margin:0 18px;background:var(--glass);border:1px solid var(--strokeSoft);border-radius:18px;-webkit-backdrop-filter:blur(22px) saturate(120%);backdrop-filter:blur(22px) saturate(120%);box-shadow:inset 0 1px 0 var(--hi),0 6px 20px var(--shcol)}
.segbtn{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 6px;border:none;background:transparent;border-radius:13px;color:var(--soft);font-family:inherit;font-weight:500;font-size:12.5px;letter-spacing:.01em;cursor:pointer;transition:background .35s ease,color .35s ease,box-shadow .35s ease,transform .2s cubic-bezier(.4,0,.2,1)}
.segbtn .segico{display:grid;place-items:center}
.segbtn .segico svg{width:22px;height:22px;display:block;stroke:currentColor}
.segbtn .seglbl{font-weight:600}
.segbtn:active{transform:scale(.97)}
.segbtn.on{background:var(--glassDock);color:var(--accent);box-shadow:0 4px 14px var(--shcol),inset 0 1px 0 var(--hi)}

/* ---- transizione morbida al cambio tema ---- */
body,.card,.cat,.herocard,.glass,.sheet,.detailsheet,.topbar,.dock,.cbody,.ord,.banner,.segbtn,.title,.kick,.empty,.mat,.cardcat{transition:background-color .42s ease,color .38s ease,border-color .42s ease,box-shadow .42s ease}
.gico,.dnav svg,.heart svg,.ticon svg{transition:stroke .4s ease,fill .4s ease}

/* ============================ BRIEF: e-commerce premium ====================== */
/* ---- card: gerarchia editoriale parte inferiore ---- */
.cbody{padding:14px 14px 15px;display:flex;flex-direction:column;gap:0;min-width:0}
.cbody .cardcat{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--soft);margin:0 0 9px}
.cbody .cardcat .gico{width:13px;height:13px;flex:none}
.cbody .ct{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:16px;line-height:1.18;color:var(--text);margin:0 0 4px;min-width:0}
.cbody .mat{font-size:11.5px;color:var(--soft);margin:0 0 9px}
.cbody .cp{font-weight:700;font-size:16.5px;color:var(--text);margin:0 0 13px;letter-spacing:.01em}
.configbtn{width:100%;padding:11px;border-radius:13px;border:1px solid rgba(199,125,107,.26);background:linear-gradient(180deg,rgba(199,125,107,.15),rgba(199,125,107,.09));color:var(--accent);font-family:inherit;font-weight:700;font-size:13px;letter-spacing:.02em;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(199,125,107,.13);transition:background .28s ease,box-shadow .28s ease,transform .2s cubic-bezier(.4,0,.2,1)}
.configbtn:hover{background:linear-gradient(180deg,rgba(199,125,107,.22),rgba(199,125,107,.13))}
.configbtn:active{transform:scale(.97)}
body.dark .configbtn{border-color:rgba(209,124,86,.32);background:linear-gradient(180deg,rgba(209,124,86,.2),rgba(209,124,86,.11));color:#E7A57E;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(0,0,0,.3)}

/* ---- card: ombra a strati (sospesa) + lift elegante ---- */
.card{box-shadow:0 1px 3px rgba(70,45,30,.05),0 10px 26px var(--shcol),0 24px 50px rgba(90,55,35,.05);transition:transform .3s ease-out,box-shadow .3s ease-out}
body.dark .card{box-shadow:0 1px 3px rgba(0,0,0,.3),0 14px 34px rgba(0,0,0,.45)}
.card:active,.card:hover{transform:scale(1.02);box-shadow:0 4px 10px rgba(70,45,30,.07),0 18px 40px var(--shcol),0 34px 70px rgba(90,55,35,.08)}
body.dark .card:active,body.dark .card:hover{box-shadow:0 6px 16px rgba(0,0,0,.4),0 26px 60px rgba(0,0,0,.55)}
.herocard{transition:transform .3s ease-out,box-shadow .3s ease-out}
.herocard:hover,.herocard:active{transform:scale(1.015)}
.cat:active{transform:scale(.985)}

/* ---- dock a 4 (Home/Esplora/Piaciuti/Ordini) ---- */
.dock.dock4{gap:4px}
.dock.dock5{gap:2px}
.dock.dock5 .dnav{width:51px}
@media(max-width:360px){.dock.dock5 .dnav{width:46px}}
.dnav.liked.act svg{stroke:var(--accent);fill:none}
.dnav.cart{position:relative}
.cartbadge{position:absolute;top:1px;right:1px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:var(--accent);color:#fff;font-size:11.5px;font-weight:800;line-height:19px;text-align:center;border:2px solid var(--bg);box-shadow:0 2px 5px rgba(0,0,0,.35);z-index:3}
.cartdot{position:absolute;top:7px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock)}
.dnav.profile svg{stroke:var(--icon)}
.dnav.profile.act svg{stroke:var(--accent)}

/* ---- campanella notifiche (topbar) ---- */
.tb-btn.bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 var(--hi), var(--elev1);color:var(--text)}
.tb-btn.bell svg{width:22px;height:22px;stroke:var(--text);fill:none}
.belldot{position:absolute;top:9px;right:10px;width:9px;height:9px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock);box-shadow:0 0 8px rgba(199,125,107,.5)}

/* ---- foglio notifiche ---- */

.notifrow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);margin-bottom:9px;cursor:pointer;color:var(--text);font-family:inherit;transition:background .25s ease,transform .2s ease}
.notifrow:active{transform:scale(.985)}
.notifdot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px rgba(199,125,107,.35)}
.notifdot.s-pending{background:var(--warning)}
.notifdot.s-confirmed{background:var(--success)}
.notifdot.s-rejected{background:#b06a52}
.notiftxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.notiftxt b{font-size:14px;font-weight:700;color:var(--text)}
.notifb{font-size:12.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notifarrow{color:var(--faint);font-size:22px;line-height:1;flex:none}

/* ---- caricamento sfondo (admin) ---- */
.bgup{display:flex;gap:10px;margin:0 18px}
.bgupbtn{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:16px 10px;border-radius:18px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi), var(--elev1);transition:transform .12s,box-shadow .2s;overflow:hidden}
.bgupbtn:active{transform:scale(.98)}
.bgupbtn.busy{opacity:.7;pointer-events:none}
.bgupbtn input{position:absolute;inset:0;opacity:0;cursor:pointer}
.bgupbtn.busy input{cursor:default}
.bgupi{display:grid;place-items:center;color:var(--accent)}
.bgupi svg{width:22px;height:22px}
.bgupt{font-weight:700;font-size:13px}
.bgups{font-size:11px;color:var(--soft);font-weight:600}
.bgupbtn.dark .bgupi{color:var(--accent2)}
.bgnote{margin:9px 18px 0;font-size:11.5px;color:var(--soft);line-height:1.45}

/* ---- riga Tema + Esci (collegati) ---- */
.prefrow{display:flex;gap:10px;align-items:stretch;margin:0 18px}
.prefrow .themeseg{flex:1;margin:0}
.themeseg.compact .segbtn{padding:11px 4px;gap:6px;font-size:10.5px}
.themeseg.compact .segbtn .segico svg{width:20px;height:20px}
.logout.side{flex:none;width:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin:0;padding:11px 18px;border-radius:18px;border:1px solid var(--strokeSoft);background:var(--glass);color:var(--soft);font-family:inherit;font-weight:600;font-size:10.5px;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi)}
.logout.side svg{width:20px;height:20px}
.logout.side:active{transform:scale(.97)}

/* ---- evidenziazione ordine da notifica ---- */
.ofocus{animation:ofocusPulse 2.4s cubic-bezier(.4,0,.2,1)}
@keyframes ofocusPulse{0%{box-shadow:0 0 0 0 rgba(199,125,107,0)}22%{box-shadow:0 0 0 3px rgba(199,125,107,.55),0 8px 24px rgba(199,125,107,.2)}100%{box-shadow:0 0 0 0 rgba(199,125,107,0)}}
.badge.br{background:rgba(176,106,82,.16);color:#b06a52}
.orddel{flex:none;width:34px;height:34px;margin-left:8px;border-radius:11px;border:1px solid rgba(192,57,43,.35);background:rgba(192,57,43,.08);color:#c0392b;display:grid;place-items:center;cursor:pointer;transition:transform .12s,background .2s}
.orddel:active{transform:scale(.9)}
.orddel svg{width:18px;height:18px}
.notifhead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.notifclear{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-family:inherit;font-weight:600;font-size:12.5px;padding:7px 12px;border-radius:20px;cursor:pointer;transition:transform .12s,background .2s}
.notifclear:active{transform:scale(.95)}
.notifclear svg{width:15px;height:15px}

/* ---- dock: tab ordini ---- */
.dnav.orders{position:relative}
.dnav.orders svg{stroke:var(--icon)}
.dnav.orders.act svg{stroke:var(--accent)}
.dnav.orders .orddot{position:absolute;top:7px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock)}

/* ---- detail: colori in sola lettura ---- */
.dswatches.readonly{pointer-events:none}
.dswbox.ro{cursor:default}

`;
const GRADS_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g_white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe4e8"/></linearGradient>
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
    c_ciotola:{g:'g_green',f:'rgba(91,163,77,.16)',d:`<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 21h6"/>`}
  };
function glassIcon(k, s = 26) {
  const ic = ICONS[k] || ICONS.vaso;
  return `<svg class="gico" width="${s}" height="${s}" viewBox="0 0 24 24" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ic.d}</svg>`;
}

/* coriandoli */
function confetti(el) {
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

const ICON_GROUPS = [
  { t: "Lampade", keys: ["l_tavolo", "l_sospensione", "l_piantana", "l_comodino", "l_lampadina"] },
  { t: "Vasi", keys: ["v_classico", "v_ampolla", "v_tubo", "v_anfora", "v_conico"] },
  { t: "Arredo", keys: ["a_sedia", "a_poltrona", "a_tavolo", "a_libreria", "a_armadio"] },
  { t: "Decorazioni", keys: ["d_stella", "d_cuore", "d_fiocco", "d_fiore", "d_cornice"] },
  { t: "Contenitori", keys: ["c_scatola", "c_cestino", "c_barattolo", "c_portapenne", "c_ciotola"] },
  { t: "Altre", keys: ["vaso", "lampada", "scatola", "gemma", "stella", "fulmine", "regalo", "fiore", "tazza", "borsa"] },
];

/* ============================ HELPERS ================================= */
const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return "";
  return d.getDate() + " " + MESI[d.getMonth()] + " " + d.getFullYear();
}
function gimg(a, b) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='600' fill='url(#g)'/><circle cx='300' cy='285' r='150' fill='rgba(255,255,255,.12)'/><circle cx='300' cy='285' r='95' fill='rgba(255,255,255,.10)'/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function avatarURI(name) {
  const init = ((name || "?").trim()[0] || "?").toUpperCase();
  const cols = ["#1593EE", "#7C4DE0", "#E0457E", "#0FA68C", "#E8801C", "#5BA34D"];
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = cols[h % cols.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><circle cx='40' cy='40' r='40' fill='${c}'/><text x='40' y='53' font-family='Arial,sans-serif' font-size='38' font-weight='700' fill='#fff' text-anchor='middle'>${init}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function colImg(c) {
  if (!c) return gimg("#cfc4b4", "#9a8d79");
  return c.img || gimg(c.a, c.b);
}
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 2400;
        let w = img.width, h = img.height;
        if (w >= h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h > w && h > max) { w = Math.round((w * max) / h); h = max; }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cv.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Ridimensiona un'immagine a larghezza max e la esporta in WebP leggero.
   Usata per generare le versioni ottimizzate dello sfondo (mobile + pc). */
function makeWebp(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cv.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", quality || 0.82);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function mapPrint(r) {
  const cols = (r.print_colors || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((c) => {
      const imgs = (c.images && c.images.length) ? c.images : (c.image_url ? [c.image_url] : []);
      return { id: c.id, name: c.name, a: c.color_a, b: c.color_b, img: imgs[0] || "", imgs };
    });
  if (!cols.length) {
    const img0 = r.images && r.images.length ? r.images[0] : "";
    cols.push({ id: null, name: "Unico", a: "#cfc4b4", b: "#9a8d79", img: img0, imgs: img0 ? [img0] : [] });
  }
  return {
    id: r.id,
    title: r.title,
    price: Number(r.price) || 0,
    material: r.material || "",
    desc: r.description || "",
    likeCount: r.like_count || 0,
    category_id: r.category_id || "",
    isElectrical: !!r.is_electrical,
    addons: { braided: Number(r.addon_braided) || 0, bulb: Number(r.addon_bulb) || 0, holder: Number(r.addon_holder) || 0 },
    allowBraided: r.allow_braided !== false,
    featured: !!r.featured,
    categoryName: r.categories ? r.categories.name : "",
    categoryIcon: r.categories ? r.categories.icon : "v_classico",
    cols,
    createdAt: r.created_at,
  };
}

/* Sfondi: wallpaper frosted 4k incorporati (JPEG base64). Vedi syncBackstop. */
const WP_LIGHT = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wgARCAhwDwADASIAAhEBAxEB/8QAGQABAQEBAQEAAAAAAAAAAAAAAAEDBAIH/8QAFwEBAQEBAAAAAAAAAAAAAAAAAAECBP/aAAwDAQACEAMQAAAB+kjm6QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFlAAAAAAAAApZZAAAAUAKAFQIAAAACgAAAABQAAAAAAAAAAEAAAAABRQEAAAAAAAUAAAAAAAAABQAAAAAAAAAAEAAAUoAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAiwAAAAAAAAAAAAAAAAAAAAAAAACEogoAAAAAAAAAIAAAAAAAAABQAAAAAAAIsQAAAAAAAAAAAAAAAAAAAAAAAAADINgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAVRIAACgABQCyyAAAABQAAAAAsBQAAAAAAAAAAIAAAACgKIAAAAAAAKAAAAAAAAAKAAAAAAAAAAAIAAKBQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAlEAAAAAAAAAAAAAAAAAAAAAAAEAQUAAAAAAAAAEAAAAAAAAAAoAAAAAAACWAIAAAAAAAAAAAAAAAAAAAAAAAABkGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFlAAAAAAAAApZZAAAAUAKAFQIAAAACgAAABYCgAAAAAAAAAAQAAAAFAFAQAAAAAACgAAAAAAAAUAAAAAAAAAAAAQAUCgAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAABKIsAAAAAAAAAAAAAAAAAAAAAAAhLAKAAAAAAAACAAAAAAAAAAUAAAAAAAACBAAAAAAAAAAAAAAAAAAAAAAAUADINAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAUKgQAACgABQCkgAAAAUAAAAApAUAAAAAAAAAACAAAAoACiAAAAAAAKAAAAAAAAAoAAAAAAAAAAACAKAUAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARYAAAAAAAAAAAAAAAAAAAAABCUQUAAAAAAAAEAAAAAAAAAAoAAAAAAAAEWIAAAAAAAAAAAAAAAAAAAACgAAAZBoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAClJAAAUAAKAFkAAAACgAAAAFICgAAAAAAAAAAQAAAFAAWVAAAAAAABQAAAAAAAAUAAAAAAAAAAABBSUoAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiAAAAAAAAAAAAAAAAAAAACAIKAAAAAAAAACAAAAAAAAAUAAAAAAAABKIEAAAAAAAAAAAAAAAAABQAAAAAMg0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFKQAAAAAAAFAKSAAAoAAUAKgQAAAFAAAAAKQFAAAAAAAAAAAgAAAKAAKAgAAAAAAFAAAAAAAAAoAAAAAAAAAAAgoFAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUQAAAAAAAAAAAAAAAAAAAAQlgFAAAAAAAABAAAAAAAAAKAAAAAAAAABAgAAAAAAAAAAAAAAAAKAAAAAABkGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABaCAAAAAAAAoBSQAAFAACgASiAAAAoAAAABSAoAAAAAAAAAAAEAABQAAKEAAAAAAAUAAAAAAAAFAAAAAAAAAAAEKAoAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiAAAAAAAAAAAAAAAAAAACAIKAAAAAAAACAAAAAAAAAUAAAAAAAAABLAEAAAAAAAAAAAAAABQAAAAAAAMg0AAAAAAAAAAAAAAAAAAAAAAAAAAAAFKQAAAAAAAAFCpKQAACgBQAAqBAAAAUAAAAApAUAAAAAAAAAAACAAAoAACiAAAAAAAKAAAAAAAACgAAAAAAAAAACKAUAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJRAAAAAAAAAAAAAAAAAABAEWAUAAAAAAAEAAAAAAAAAAoAAAAAAAAAECAAAAAAAAAAAAAAAoAAAAAAAGQaAAAAAAAAAAAAAAAAAAAAAAAAAACioAAAAAAAACgBZAAAAUAKAAFkAAAACgAAAAFICgAAAAAAAAAAAQAAFAAAWVAAAAAAABQAAAAAAABQAAAAAAAAAAFQKAAAAAAAAAAACAAAAAAAAAoAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAASiAAAAAAAAAAAAAAAAAACAIKAAAAAAAACAAAAAAAAAUAAAAAAAAACLEAAAAAAAAAAAAABQAAAAAAAAMg0AAAAAAAAAAAAAAAAAAAAAAAALUVAAAAAAAAAAUCKQAACgABQABUgAAAAUAAAALEoBQAAAAAAAAAAAIAACgAACgIAAAAAAKAAAAAAAACgAAAAAAAAACiBQAAAAAAAAAAQAAAAAAFAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAACUQAAAAAAAAAAAAAAAAAQAlEFAAAAAAABAAAAAAAAAKAAAAAAAAAAlECAAAAAAAAAAAAAoAAAAAAAAGQaAAAAAAAAAAAAAAAAAAAAACiiUgAAAAAAAAAAKKkAAABQAAoAEUgAAAAKAAAAFgAKAAAAAAAAAAABAAAUAAAUBAAAAAABQAAAAAAAAUAAAAAAAAAFJSwAAAAAAAAAIBQAQAAAKAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAEogAAAAAAAAAAAAAAAAAgBLFCwAAAAAAIAAAAAAAABQAAAAAAAAAAIEAAAAAAAAAAAABQAAAAAAAAMg0AAAAAAAAAAAAAAAAAAAKRQAAAAAAAAAAAAKgAAAAKAAFACyAAAAABQAAAAsABQAAAAAAAAAAAIAACgAACgIAAAAAAKAAAAAAAACgAAAAAAAAAoFgAAAAAAAAQCgAAgAUAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAJRAAAAAAAAAAAAAAAABAALFlgAAAAAAAQAAAAAAAACgAAAAAAAAAJYAgAAAAAAAAAAAKAAAAAAAABkGgAAAAAAAAAAAAAAACiUAAAAAAAAAAAAAApSQAAAFAAACgBZAAAAAAoAAAAqAAoAAAAAAAAAAEAABQAAACkAAAAAAAFAAAAAAAABQAAAAAAAAAVAoAAAAAAAIBQAAQAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAEogAAAAAAAAAAAAAAAAgBKWCwAAAAAAIAAAAAAAABQAAAAAAAAAAIEAAAAAAAAAAABQAAAAAAAAMg0AAAAAAAAAAAAAUSgAAAAAAAAAAAAAAFCpKQAAACgAABQCkgAAAAUAAAAApAAUAAAAAAAAAACAAAoAAACiAAAAAAACgAAAAAAAAoAAAAAAAAALYAAAAAAAEAoAAAIFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAACWAAAAAAAAAAAAAAAAQACpYBYAAAAAAEAAAAAAAAoAAAAAAAAAAEWIAAAAAAAAAAACgAAAAAAAAZymooiiKIoiiKIoiiKIoAAAAAAAAAAAAAAAAACgRSAAAAUAAAKABFIAAAACgAAABYlAKAAAAAAAAAAABAAAUAAABRAAAAAAABQAAAAAAAAoAAAAAAAAAUsAAAAAACAUAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAACLAAAAAAAAAAAAAAAAIABYLAAAAAAAgAAAAAAAFAAAAAAAAAAASwBAAAAAAAAAAAUAAAAAAAADMNAAAAAAAAAAAAAAAAAAAAAAAAABQIVAAAAAKAAAFAFSAAAAABQAAAAsABQAAAAAAAAAAAIAACgAAAKIAAAAAAAKAAAAAAAAKAAAAAAAAAUogAAAAAQCgAAABYAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAABQAAAAAAAQAAAAAAAAAAAAAAAAABFgAAAAAAAAAAAAAAEAAqUQWAAAAAABAAAAAAAAKAAAAAAAAAABAgAAAAAAAAAAKAAAAAAAABmGgAAAAAAAAAAAAAAAAAAAAAAoAVJSAAAAAUAAAKAFSUgAAAAKAAAAAUgAKAAAAAAAAAAABAAAUAAABRAAAAAAAFAAAAAAAABQAAAAAAAAClEAAAACAUAAAAKBAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAKAAAACAAAAAAAAAAAAAAAAAEogAAAAAAAAAAAAAAAgAFixAoAAAAAIAAAAAAABQAAAAAAAAAAIsQAAAAAAAAAAFAAAAAAAAAzDQAAAAAAAAAAAAAAAAAAAUACFQAAAAACgAABQAIVAAAAAAUAAAALEoABQAAAAAAAAAAAIACgAAACkogAAAAAACgAAAAAAAAoAAAAAAABQoCAAABAKAAAAFAgAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAFAAABAAAAAAAAAAAAAAAAACWAAAAAAAAAAAAAAAQACpRBYAAAAAAEAAAAAAAoAAAAAAAAAACWAIAAAAAAAAACgAAAAAAAAZhoAAAAAAAAAAAAAAAAKAFSKiUAAAAAAUAAAKABCoAAAAAACgAAACoACgAAAAAAAAAAAAQAFAAAAFAQAAAAAABQAAAAAAAAUAAAAAAAAoVAAAAAlAAAACgAQAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAgAAAAAAAAAAAAAAAACLAAAAAAAAAAAAAAAIBQIsQKAAAAACAAAAAAAAUAAAAAAAAAACBAAAAAAAAAAAUAAAAAAADMXQQAAAAAAAAAAFAACpFRKAAAAAAAAKAAAFAAhUAAAAAABQAAAAQoABQAAAAAAAAAAAAIACgAAACgIAAAAAAKSgAAAAAAAKAAAAAAAABRSAAABAKAAAAFAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAFABAAAAAAAAAAAAAAAACUQAAAAAAAAAAAAAAAQCpRBYAAAAAAEAAAAAAAoAAAAAAAAAAECAAAAAAAAAAAoAAAAAAAGYtABQAAAAQAoioiiKAAAAAAAAAAAUAAAKABCoAAAAAACgAAAABYACgAAAAAAAAAAAAQAFAAAAAUQAAAAAAAUAAAAAAAAFAAAAAAAAoBRAAAgFAAAACgAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAACgAgAAAAAAAAAAAAAAABLAAAAAAAAAAAAAAAIBQILAAAAAAAgAAAAAAFAAAAAAAAAAASxAAAAAAAAAAAUAAAAAAADwFAAAAAAAAAAAAAAAAAAAABQAAoAAEKgAAAAAAKAAAAAFiUAAoAAAAAAAAAAAAEABQAAAAFEAAAAAAAFAAAAAAAACgAAAAAAAKFJRAAAgFAAACgAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAACggAAAAAAAAAAAAAAACAAAAAAAAAAAAAAACAVLALAAAAAAAgAAAAAAFAAAAAAAAAASwBAAAAAAAAAAUAAAAAAADwFAAAAAAAAAAAAAAAAABQAAoAAEKiUAAAAAAAoAAAAAAqAAoAAAAAAAAAAAAAEABQAAABSUQAAAAAABQAAAAAAAAUAAAAAAAAoUBAAgFAAAACgAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAACggAAAAAAAAAAAAAABLAAAAAAAAAAAAAAAIBUogsAAAAAACAAAAAAAUAAAAAAAAABLAEAAAAAAAAABQAAAAAAAPAUAAAAAAAAAAAAAAFACgAAAQWIoAAAAAAACgAAAAABYlAAKAAAAAAAAAAAABAAUAAAAAUBAAAAAAAFAAAAAAAABQAAAAAAAChUAACAUAAAKAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAKCAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAJQILAAAAAAAAgAAAAAFAAAAAAAAAASwBAAAAAAAAAAAUAAAAAADwLQAgAAAAAAKAABQAAAAQWIolAAAAAAAAAKAAAAAAFiUAAoAAAAAAAAAAAAAEABQAAAACkAAAAAAAFJQAAAAAAAFAAAAAAAAoBRAAAlAAAACgAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAACggAAAAAAAAAAAAABLAAAAAAAAAAAAAAAIBUsQKAAAAAACAAAAAAUAAAAAAAAABLAEAAAAAAAAAABQAAAAAAPAtAAAAAABQAAAAQWIoiiUAAAAAAAAAAoAAAAAAAIKAAoAAAAAAAAAAAAAEAABQAAABSUQAAAAAAAUAAAAAAAAFAAAAAAAAoUlEACAUAAAKAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAKCAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAJUsAsAAAAAACAAAAAAAUAAAAAAAABLAEAAAAAAAAAABQAAAAAAPCliiKIoiiKIoiiKIoAAAAAAAAAAAACgAAAAAAAAACoCgAAAAAAAAAAAAAAAQAFAAAAAKAQAAAAAAAoAAAAAAACioAAAAAAAChQEACAUAAAKAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAKCAAAAAAAAAAAAAAIsAAAAAAAAAAAAAAAlSwCwAAAAAAAIAAAAABQAAAAAAAAEsAQAAAAAAAAAAFAAAAAAA8hQAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAoAAAAAAAAAAAAAAAABAAAUAAAAUlEAAAAAAAAUAAAAAAAAFAAAAAAAKAKQAAJQAAAAoAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAoIAAAAAAAAAAAAASwAAAAAAAAAAAAAACVLALAAAAAAAAgAAAAAFAAAAAAAAASwBAAAAAAAAAAAUAAAAAADyFAAAAAAAAAAACgAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAEAABQAAAACgEAAAAAAAFAAAAAAAAoWJQAAAAAACgFEACAUAAAKAABAAAAAAAAAAAAAAAAAAAAAAAAAAAACiKIoiiKIoiiKIoiiKIogAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAKCAAAAAAAAAAAAAAIAAAAAAAAAAAAAABLJQsAAAAAAAACAAAAAUAAAAAAAABLAEAAAAAAAAAABQAAAAAAPItAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAQAAFAAAAFJRAAAAAAAAFAAAAAAAAKFgAAAAAAKAFJRAAgFAAACgAAQAAAAAAAAAAAAAAAAAAAAAAAAAUigAAAAAAAAAAAAAABKIsAAAAAAAAAAAAAAAAAAgAAAAAAAAAAKCAAAAAAAAAAAAAIAAAAAAAAAAAAAABLFBAAAAAAAAAgAAAAFAAAAAAAAASwBAAAAAAAAAAAUAAAAAADyLQAAAAAAAAAAAAAAAAAAAAAABSUAAAAAAAAAAAAAAAAAAQAAFAAAAFJRAAAAAAAABSUAAAAAAAAFAAAAAAAKAFAQAJQAAAoAAAEAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAEoiwAAAAAAAAAAAAAAAACAAAAAAAAAAoAIAAAAAAAAAAAASwAAAAAAAAAAAAAASxQQAAAAAAAAAIAAABQAAAAAAAAEsAQAAAAAAAAAAFAAAAAAA8i0AAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAABAAAAUAAAAoBAAAAAAAACgAAAAAAAKFiUAAAAAAAoAVAAAlAAACgAAQAAAAAAAAAAAAAAAAAAAAAAAUlAAAAAAAAAAAAAAAAAAAAAAAACLAAAAAAAAAAAAAAAAIAAAAAAAAACgAgAAAAAAAAAAABLAAAAAAAAAAAAAABLFBAAAAAAAAAAgAAAFAAAAAAAAASxAAAAAAAAAAAAUAAAAAADyLQAAAAAAAAAAAAAAAAACiUAAAAAAAAAAAAAAAAAAQAAAAFAAAAKAQAAAAAAAAUlAAAAAAAAKFgAAAAAAKAAUQAIBQAAoAAAEAAAAAAAAAAAAAAAAAAAAAAFJQAAAAAAAAAAAAAAAAAAAAAAAAAAAiwAAAAAAAAAAAAAAACAAAAAAAAAAoIAAAAAAAAAAAASwAAAAAAAAAAAAAASxQQAAAAAAAAAIAAABQAAAAAAAAIEAAAAAAAAAAABQAAAAAAPItAAAAAAAAAAAAAAAKJQAAAAAAAAAAAAAAAAAABAAAAAUAAAAoBAAAAAAAAACgAAAAAAAKCFAAAAAAAKAAUQAIBQAAoAAAEAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEsAAAAAAAAAAAAAAAAAgAAAAAAAAKACAAAAAAAAAAAEsAAAAAAAAAAAAAAEsUEAAAAAAAAAACAAAUAAAAAAAAQBAAAAAAAAAAAAUAAAAAADyLQAAAAAAAAAABSKJQAAAAAAAAAAAAAAAAAABAAAAAAAUAAAoBAAAAAAAAABQAAAAAAAKAFgAAAAAAKAAFAQAIBQAAoAAAEAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIogAAAAAAAAAAAAAAAgAAAAAAAAKACAAAAAAAAAAAEsAAAAAAAAAAAAAAEsAAAAAAAAAAAAgAAFAAAAAAAASxAAAAAAAAAAAAUAAAAAAADyLQAAAAAABSKJQAAAAAAAAAAAAAAAAAAABAAAAAAAAUAAAoBAAAAAAAAABSUAAAAAAAAoIUAAAAAAAoAApAAAgFACgAAAQAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEsUAAAAAAAAAAAAAAAIAAAAAAACgAAgAAAAAAAAABLAAAAAAAAAAAAAACAAAAAAAAAAAACAAAUAAAAAAACCwIAAAAAAAAAABQAAAAAAAIKAAABQAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAFAAFJQBAAAAAAAAAAFAAAAAAAAKAFiUAAAAAAoAABRAAAlAACgAAAQAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIsUAAAAAAAAAAAAAAIAAAAAAACgAAgAAAAAAAAABLAAAAAAAAAAAAAAQAAAAAAAAAAAAACAAUAAAAAABLALAgAAAAAAAAAAFAAAAAAAAgtAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAUAAoBAAAAAAAAAAACgAAAAAAAAKCFAAAAAAAKAAFQAAAJQAoAAAAEAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQBLFAAAAAAAAAAAAAACAAAAAAAAoAAIAAAAAAAAAASwAAAAAAAAAAAAASwAAAAAAAAAAAAACAUAAAAAAACCwAIAAAAAAAAABQAAAAAAAAILQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAFAKJQBAAAAAAAAAAAoqAAAAAAAAAoAWAAAAAAAoAABRAAAAlACgAAAQAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAEsUAAAAAAAAAAAAAAAIAAAAAACgAAgAAAAAAAAABAAAAAAAAAAAAAAQAAAAAAAAAAAAAAgFAAAAAAAQQKAACAAAAAAAAAUAAAAAAAACC0AAAAAAAAAAAAEAAAAAAAAAAAAAAAABSiUAQAAAAAAAAAAAKKgAAAAAAAAKAFiUAAAAAAAoAAUlEAAABQAAAAAQAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAEsUAAAAAAAAAAAAAAAIAAAAAACgAAgAAAAAAAAACAAAAAAAAAAAAAAgAAAAAAAAAAAAAAgFAAAAAAEAsAAACAAAAAAAAUAAAAAAAAACCgAAAAAAAAAAAAAAAAAAAAAAAAABSKWUAQAAAAAAAAAAAAAoAAAAAAAACgAgoAAAAAACgAACkAAAABQAAAAQAAAAAAAAAAAAAAAAAAAAAAABZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAASxQAAAAAAAAAAAAAAAgAAAAAKAAACAAAAAAAAAEsAAAAAAAAAAAAAEsAAAAAAAAAAAAAAAlAAAAAAAgsAAAACAAAAAAAUAAAAAAAAAACCgAAAAAAAAAAAAAAAAAAAAAABSUAAAAAAAAAAAAAAAoWJQAAAAAAAACgAgoAAAAAACgAABSUQAAAAFAAAABAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAASxQAAAAAAAAAAAAAAAgAAAAAKAAACAAAAAAAAAEAAAAAAAAAAAAABAAAAAAAAAAAAAAACUAAAAABCwAAAAAIAAAAAABQAAAAAAAAAAIKAAAAAAAAAAAAAAAAAAAAFIoAAAAAAAAAAAAAAACiolAAAAAAAAAKAAFgAAAAAAAKAAAKQAAAAAFAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAASxQAAAAAAAAAAAAAAAgAAAAAKAAACAAAAAAAAAIAAAAAAAAAAAAAQAAAAAAAAAAAAAABQgAAAABBAoAAAAAIAAAAABQAAAAAAAAAAAIKAAAAAAAAAAAAAAFIoiiKAAAAAAAAAAAAAAAAAoWIoAAAAAAAAACgABYlAAAAAAAKAAAFJRAAAAAAUAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAABLFAAAAAAAAAAAAAAACAAAAAoAAAAIAAAAAAAAAgAAAAAAAAAAAAEAAAAAAAAAAAAAAAFCAAAAEsAsAAAAAACAAAAAUAAAAAAAAAAAACKqKIoiiKIoiiKIoiiKJQAAAAAAAAAAAAAAAAAAAAChYigAAAAAAAAAAKAAFiUAAAAAAAoAAABRAAAAAAAUAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAACBQAAAAAAAAAAAAAAAgAAAAKAAAACAAAAAAAAAIAAAAAAAAAAAAQAAAAAAAAAAAAAABQAgAAAQCwAAAAAAAIAAABQAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAKAFiKAAAAAAAAAAAAoAAWJQAAAAAACgAAACkAAAAAAAABQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAEsUAAAAAAAAAAAAAAAAIAAACgAAAAAgAAAAAAAASggAAAAAAAAAACAAAAAAAAAAAAAABQAAgAAQCwAAAAAAAAIAABQAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAKAFiKJQAAAAAAAAAAACgAAgoAAAAAAACgAAABSUQAAAAAAAAFABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAEUAAAAAAAAAAAAAAAAIAAAACgAAAAAgAAAAAAAKSyAAAAAAAAAAAEAAAAAAAAAAAAAAAFAACAEECgAAAAAAAAAgAFAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAoAIKIolAAAAAAAAAAAAAAKAAFiKAAAAAAAAoAAAAUlEAAAAAAAAABQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAABFAAAAAAAAAAAAAAAAACAAAAoAAAAAIAAAAAAAACkIAAAAAAAAAAEAAAAAAAAAAAAAAAUAAAIQsAAAAAAAAAAACAUAAAAAAAAAAAAAAAAAKAAAAAAAAAAACgAAgUiiKJQAAAAAAAAAAAAAAACgAAgolAAAAAAAAKAAAAAKQAAAAAAAAAAFBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAEUAAAAAAAAAAAAAAAAAAIAACgAAAAAAgAAAAAAAKAggAAAAAAAAAQAAAAAAAAAAAAAABQAABCwQAAAAAAAAAAAAJQAAAAAAAAAAAAAAAAACqiiKIoiiKIoiiKIoiiKAAAAAAAAAAAAAAAAAAAAoAAAAolIAAAAAAAACgAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAQFAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAABFAAAAAAAAAAAAAAAAAACAAAoAAAAAAAIAAAAAACgEsgAAAAAAAAAQAAAAAAAAAAAAAABQAABAEAAAAAAAAAAABQgAAAAAAAAAAAAAAAAAgsLPQUAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAKJRAgFAAAAAAACgAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWUBAAAAUAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAEUAAAAAAAAAAAAAAAAAAAIACgAAAAAAAgAAAAAAKAAggAAAAAAAAQAAAAAAAAAAAAAABQAACEAAAAAAAAAAAABQAgAAAAAAAAAAAAAAQqLAAAPQUAAAAAAAAAAAAAAAAAAAAAAKAAAAAAKJRAAAlAAAAAAACgAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoQAAAAAAFAAAAAAAAAAAAABAAAAAAAAAAAAAAAVAAAAAAAAAAAAAAAAAAAACAAoAAAAAAAAIAAAAACgAEsgAAAAAAAACAAAAAAAAAAAAAABQABCwQAAAAAAAAAAAAFAACAAAAAAAAAAAACCwsAAAAA9BQAAAAAAAAAAAAAAAAAoAAAAAAUiiKQAAAAIBQAAAAAoAAAAAUlEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFAAAAAAAAAAAAAAAAAAAACAAoAAAAAAAAIAAAAACgABAIAAAAAAAASwAAAAAAAAAAAAABQACAEAAAAAAAAAAABQAAAgAAAAAAAAAAAiwAAAAAAAD0LQAAAAAAAAAAAAAAAAAABSKIpJQAAAAAACAUAAAAKAAAAAAKSUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFlAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAoAABCAAAAAAAABAAAAAAAAAAAAAAFAELBAAAAAAAAAAAAAUAAAIAAAAAAAAAELCwAAAAAAAAAD0LQAAAAAAAAAAACiKIpIolAAAAAAAAAAAIBQAAAoAAAAAAUikAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAACgAAEsgAAAAAAAAKQgAAAAAAAAAAAFAAIAQAAAAAAAAAAAFAAAACAAAAAAAACCwsAAAAAAAAAAAA9igAAAAAAAAAAAAAAAAAAAAAAAAAAlAACgAAAAAACklAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAKAAAAEgAAAAAAAAKSyAAAAAAAAAAAAUAQBAAAAAAAAAAAAUAAAAAAIAAAAAEKiwAAAAAAAAAAAAAAD2KAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAACklAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZQEAAAAAAAAAAAAAAAAAAAAAAAAAAIWwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAKAAAAEAgAAAAAAAKEgAAAAAAAAAAFAELBAAAAAAAAAAAAAUAAAAAAIAAAAELCwAAAAAAAAAAAFAAAAA9iwAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAFIpJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWUBAAAAAAAAAAAAAAAAAAAAAAABFqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAACgAAABAIAAAAAACgBIAAAAAAAAABQAEEAAAAAAAAAAAABQAAAAAAAgAAAhAoAAAAAAAAAFAAAAAAAAA9iwAAAAAAAAAAAAAAAAAAAAFAAAAAFIpIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWUBAAAAAAAAAAAAAAAAAAAABFqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAACgAAAACIAAAAAACgABIAAAAAAAAABQCAEAAAAAAAAAAABQAAAAAAAgAAQqLAAAAAAAAAAUAAAAAAAAIAAA9jUAAAAAAAAAAAAAAAAAABQAACiKSUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKlAQAAAAAAAAAAAAAAAFILAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAoAAAAAgCAAAAAAAoABCAAAAAAAAAUAgBAAAAAAAAAAAUAAAAAAAAAIAILCwAAAAAAAFAAAAAAAAACAAAAAAPY1AAAAAAAAAAAAAAAACiKIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoKAAAAAAAAAQqCoLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAoAAAAAgACAAAAAAoAASLAAAAAAAABQCAEAAAAAAAAAABQAAAAAAAAAAghAoAAAAAAFAAAAAAAAACAAAAAAAAAPY1AAAAAAAAAAAAACiUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQFAAAAAAAAAAAAAAACAoAAAAAgACAAAAAAoAAAiAAAAAAAUAAgBAAAAAAAAAAAUAAAAAAAAAAQsEAAAAABQAAAAAAAAAAAgAAAAAAAAAAD2NQAAAAAAAAAAoigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBQAAAAAAAAAAAAAAAAAAAAACAAAIAAACgAAABIsAAAAAAAFAELBAAAAAAAAAAUAAAAAAAAAAAhAAAAAAUAAAAAAAAAAAAIAAAAAAAAAAAAA9jUAAAAAAFIolAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEABQAAAAAAAAAAAAAAAAAAAABCwAAAgAAAAKAAAAIgAAAAAAFABEAAAAAAAAAAFAAAAAAAAAAELBAAAAUAAAAAAAAAAAAAIAAAAAAAAAAAAAAAA9jUAAFIolAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEABQAAAAAAAAAAAAAAAAAAAAACCwAAAAgAAAKAAAAAQgAAAAAFABBCwAAAAAAAAAUAAAAAAAAAAhAAAAAUAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAABPdNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAFAAAAAAAAAAAAAAAAAAAAAAIAAAAAgAAAKAAAAAEiwAAAAAUAEChIAAAAAAAABQAAAAAAAABCwQAAAAFAAAAAAAAAAACAAAAAAAAAAAAAAAAoAAAAADQWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAoAAAAAAAAAAAAAAAAAAAAAAhYAAAAAAQAAFAAAAAAEQAAAACggAUEIAAAAAAAAKAAAAAAAAAQgAAAAKAAAAAAAAAAAEAAAAAAAAAABQAAAAAAAAAAAAAGgsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAABQAAAAAAAAAAAAAAAAAAAABCoAAAAAAAgAAKAAAAAAEiwAAAAAAoAASLAAAAAAABQAAAAAAACCwQAAAAFAAAAAAAAAACAAAAAAAAAAoAAAAAAAAAAAAAAAAADQWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAoAAAAAAAAAAAAAAAAAAAAABBYAAAAAAAAQAFAAAAAAAEQAAAAAFAABBAAAAAAACgAAAAAACFQgAAAAKAAAAAAAAAAAEAAAAAAABQAAAAAAAAAAAAAAAAAAAAAGgsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAABQAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAAAAAAABIsAAAAKAAAAEgAAAAAAFAAAAAAAIQAAAAFAAAAAAAAAAAACAAAAAAoAAAAAAAAAAAAAAAAAAAAIACgAANBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAACFQAAAAAAAAAAAAAAAAAAACRYAAAAUAAAAJFgAAAAAAoAAAAABCWAAAAACgAAAAAAAAAAABAAAAAUAAAAAAAAAAAAAEAAAAAAAAAAAAAAAaDUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAABCoAAAAAAAAAAAAAAAAAAAAACIAAACgAAAACIAAAABQAAAAACEsAAAAAAFAAAAAAAAAAAACAAAoAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAA0GoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAACFQAAAAAAAAAAAAAAAAAAAAAAERYAAAUAAAAAJFgAAAAoAAAABCWAAAAAACgAAAAAAAAAAAABAAUAAAAAAAAAAAAAEAAAAAAAAEFQVBUFQVBUFQVBUCwVBUFQajUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAQqAAAAAAAAAAAAAAAAAAAAAAAQsIAAACgAAAABIsAAAAFAAAAESwAAAAAAAUAAAAAAAAAAAAAIACgAAAAAAAAAAAgAAAAAQqCoLAACgAAAAAAAAAAAAAANRYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAABBYAAAAAAAAAAAAAAAAAAAAAAAhUAAQAAFAAAAABBAAAACgAAAAiAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAABAAAABBUFgBQAAAAAAAAAAAAAAAAAAAAGosAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAgsAAAAAAAAAAAAAAAAAAAAAAAAgAACAAoAAAAAAAiAAAAUAAAEAIAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAIAEKgsAKAAAAAAAAAAAAAAAAAAAAAAAAAA1FgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAACFQAAAAAAAAAAAAAAAAAAAAAAAAEFgAAAAAAAAAAAACQAACgAAAgUEEAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAECFQWAFAAAAAAAAAAAAAAAAAAAABAAAAAAUAABqLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAILAAAAAAAAAAAAAAAAAAAAAAAAAELAAAAAAAAAAAAAAEiwAAUAAECgAgQAAAABQAAAAAAAAAAAQFAAAAAAAAAAAAACCCoAoAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAA1GoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAhUAAAAAAAAAAAAAAAAAAAAAAAAAhUAAAAAAAAAAAAAAAkWAACgAAgUAAJFgAAAAoAAAAAAAAAAIACgAAAAAAAAAAAAEFhAUAAAAAAAAAAAAAAEAAAAAAAAAAAACFQVBUFQVBUoAABqNZBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAEKgAAAAAAAAAAAAAAAAAAAAAAAAEKgAAAAAAAAAAAAAAAEiwAUAAECgAABIsAAAAFAAAAAAAAABAAUAAAAAAAAAAAAQqAAAAAAAAAAAAAAAAIAAAAAIKgqCwAoAAAAAAAAAAAAAAADYXIAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiWCgAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAkWACgAgUAAAAJFgAAAoAAAAAAAAAIACgAAAAAAAAAAAEFgAAAAAAAAAAAAAABAAABBUFgBQAAAAAAAAAAAAAAAAAAAAAAGwuQAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAhQAAAAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAAAAABIsAFABAoAAAASLAAABQAAAAAAAAQAAFAAAAAAAAAAAILAAAAAAAAAAAAAAACACCoLACgAAAAAAAAAAAAAAAAAAAAAAAAAAANhcgAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAhUKAAAAAAAAAAAAAAAAAAAAAAAQWAAAAAAAAAAAAAAAAAAJFgAABQAAAAAkWAACgAAAAAAAAgAAKAAAAAAAAAAAQWAAAAAAAAAAAAAAAEEFQBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGwuQAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAILBQAAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAAAAAAABIsAAKAAAAACBCwAAUAAAAAAAEAAABQAAAAAAAAABCwAAAAAAAAAAAAAACIqAKAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAANhrIAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAACFQoAAAAAAAAAAAAAAAAAAAAABBYAAAAAAAAAAAAAAAAAAAAhYQAFAAAAABAhYAAKAAAAAAACAAAoAAAAAAAAAAhUAAAAAAAAAAAAAAhUAAAAAAAAAAAAAAAAQAAAAAAAAIVBUFQVBUFQVBUFQVBUFQVBUFAABsNZAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAQqFAAAAAAAAAAAAAAAAAAAAAAILAAAAAAAAAAAAAAAAAAAAAILAAAAAAAACCAAFAAAAAAABAAAAUAAAAAAAAAQqAAAAAAAAAAAAAAgsAAAAAAAAAAAAAAAIAAAAIKgqCwoAAAAAAAAAAAAAAAAAAAAADcXIAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAEKAAAAAAAAAAAAAAAAAAAAAAQWAAAAAAAAAAAAAAAAAAAAAIVAAAAAAAAAEEAAKAAAAAACAAAAoAAAAAAAAABBYAAAAAAAAAAAAhUAAAAAAAAAAAAAAAQAAQVBYUAAAAAAAAAAAAAAAAAAAAAAAAAAAABuLkAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAACFsAAAAAAAAAAAAAAAAAAAAAAgsAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAACCAAFAAAAAABAAAAUAAAAAAAAAQsAAAAAAAAAAAAQqAAAAAAAAAAAAAAIAIKgsKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3FyAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAABC2AAAAAAAAAAAAAAAAAAAAAAQWAAAAAAAAAAAAAAAAAAAAAAQWAAAAAAAAAAEEAKAAAAAACAAAAoAAAAAAAAABAAAAAAAAAAAAIVAAAAAAAAAAAAAAARFQBQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAFAAAAbi5AAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAgsFAAAAAAAAAAAAAAAAAAAAAILAAAAAAAAAAAAAAAAAAAAAAEKgAAAAAAAAAACCAFAAAAABAAAAAUAAAAAAAAAQsAAAAAAAAAAAQqAAAAAAAAAAAAAAgqAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAA3GsgAAAAAAAAAABAAAKFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAABBYKAAAAAAAAAAAAAAAAAAAAAQWAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAABBACgAAAAAgAAAAKAAAAAAAAIVAAAAAAAAAAAAQAAAAAAAAAAAACFQWAAAAAAAAAAAAAAEAAAAAEFQVC1FWAAAAAAAAAAAAAAAAAABUFQVElSm41kAAAAAAAAIAAAABQoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAILBQAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAggBQAAAAQKCAAAAUAAAAAAAAQsAAAAAAAAAAAgsAAAAAAAAAAAAQqAAAAAAAAAAAAAAIAAAIKi2wAAAAAAAAAAAQAAAAAAAAAAAAAAAAAADoFyAAAAAEAAAAAAAoUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAACFgoAAAAAAAAAAAAAAAAAAAABBYAAAAAAAAAAAAAAAAAAAAAAAhUAAAAAAAAAAAAAkVACgAAAAgUEAAAoAAAAAAAABAAAAAAAAAAAIVAAAAAAAAAAAAQWAAAAAAAAAAAAAEAAEFRbYAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAB0C5AAACAAAAAAAAUKAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCoUAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAILAAAAAAAAAAAAAEiwAUAAAECgAgAAFAAAAAAAAAIAAAAAAAAAACAAAAAAAAAAAAgsAAAAAAAAAAAAAIEKgsLQAAAAAAQAAAAAAAAAAIAAAAAAAAAAAAAACgAAAAAAOgXIAQAAAAAAACgBQAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIVCgAAAAAAAAAAAAAAAAAAAAACFgAAAAAAAAAAAAAAAAAAAAAACFQAAAAAAAAAAAAACRYAKAAACBQAQAACgAAAAAAACFgAAAAAAAAACFgAAAAAAAAAACFQAAAAAAAAAAAACFQWCgAAAAAgAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAFAdAZAAAAAAAABQoAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKhQAAAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAAAAAAAAAAACCwAAAAAAAAAAAAABIsAFAABAoAAIAABQAAAAAAABCwAAAAAAAAACCwAAAAAAAAABCoAAAAAAAAAAAACCoUAAAAAEAAAAAACAAAAAAAAAtAAAAAAAAAAAAAAAAAAAAACQAAADoFyAAAAAAAChQAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIVCgAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAhUAAAAAAAAAAAAAAAkWACgAAgUAAEAAAoAAAAAAAAhYAAAAAAAAABAAAAAAAAAAAQWAAAAAAAAAAAAQWCgAAAAgAAAAAAQAAAAAFoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHQGAAAAAAUAKAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgQqLQAAAAAAAAAAAAAAAAAAAAAAABEsFAAAAAAAAAAAAAAAAAAAAAAELAAAAAAAAAAAAAAACEAFABAoAAAIAABQAAAAAAACCwAAAAAAAAACAAAAAAAAAAQqAAAAAAAAAAAAgsFAAAABAAAAAAAgAAALQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgMAAAAAoUACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAhUKAFAAAAAAAAAAAAAAAAAAAAAAAgi2AAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAABBACgAgUAAAEAAAoAAAAAAABAAAAAAAAAAIWAAAAAAAAAAIWAAAAAAAAAAAQWCgAAAgAAAAAAQAAAFoAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAFAAAAAAAAdAYAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAQqFACgAAAAAAAAAAAAAAAAAAAAAAQAhbAAAAAAAAAAAAAAAAAAAAAAEKgAAAAAAAAAAAAAAACCAFABAoAAAIAABQAAAAAABCwAAAAAAAAABCwAAAAAAAAACAAAAAAAAAAAQqFAAABAAAAAAAgAALQAAAAAAAAAAAAAgAAAAAAAgqEqCoKgqCoKgqCoKgqCoKlAAAAAAAAoAAF6AwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAhUKAFAAAAAAAAAAAAAAAAAAAAAAAgABCgAAAAAAAAAAAAAAAAAAAAACFgAAAAABAUAAAAAAAAEEAKACBQAAAAQAACgAAAAAEAICgAAAAAAACFgAAAAAAAAAEAAAAAAAAAABACgAAgAAAAAAQAAFoAAAAAAAAAAAQAAAIVBUFQABQAAAAAAAAAAAAAAAAAAAASVBUFQUAAAHQNZAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAABCoUAKAAAAAAAAAAAAAAAAAAAAAAABAAghQoAAAAAAAAAAAAAAAAAAAAAQsAAAAAAIACgAAAAAAAgQAAACgAAAAgAAFAAAAAELABAAUAAAAAAAQsAAAAAAAAAQqAAAAAAAAAAQsFAABAAAAAAAAgKBQAAAAAAAAAAgAAQqCwAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYkqDpGsgAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAhUKAFAAAAAAAAAAAAAAAAAAAAAAAAgQAIVCgBQAAAAAAAAAAAAAAAAAAABAAAAAAAEAABQAAAAAAAkWAAAFAAAABAAAKAAAAAIWACAAoAAAAAAACAAAAAAAAAAgAAAAAAAAACFgoAIAAAAAAAAACgAAAAAAAABAABBUAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0i4AAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAABCoUAKAAAAAAAAAAAAAAAAAAAAAAACQAAAQsFCgAAAAAAAAAAAAAAAAAAAACAAAAAAAIAACgAAAAAAAhAAACgAAAAgAAAFAAAAELABAAUAAAAAAAAgAAAAAAAAAIAAAAAAAAACAFABAAAAAAAAAUAAAAAAAAAIAEKgACgAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAKAAAAAAAAAA6RcAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAABC2AAFAAAAAAAAAAAAAAAAAAAAAABAIAAAIWChQAAAAAAAAAAAAAAAQAFAAAEAAAAAAAQAAFAAAAAAABBAAAFAAAAABAAAKAAAAIWACAAAoAAAAAAAhYAAAAAAAABAAAAAAAAAAQAoIAAAAAAAAACgAAAAAAABAAhUAUAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAHSLgAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILBQAoAAAAAAAAAAAAAAAAAAAAAIABAAAABCwUKAAAAAAAAAAAAAACAAAoAAAgAAAAAAACAAoAAAAAAAASAAAoAAAAAIAABQAAAAEAEAABQAAAAAABCwAAAAAAAACAAAAAAAAAAgBQQAAAAAAAAFAAAAAAAAACBEsALQAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAA6RcAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUKAFAAAAAAAAAAAAAAAAAAABAAAAAIAAAAIWChQAAAAAAAAAAAAAAQAAAFAAEAAAAAAAAQAAFAAAAAAACRYAAAUAAAAEAAAAoAAAAgCAAAoAAAAAAABAAAAAAAAAIWAAAAAAAAAIAAAAAAAAAAAoAAAAAAAAQIlQBaAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdI1gAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIWwAAoAAAAAAAAAAAAAAAAAIAAAAABAAAAABCwUKAAAAAAAAAAAAACAAAAAoAAgAAAAAAACAAAoAAAAAAAIIAAAoAAAAAIAABQAAAAEEAAABQAAAAAABCwAAAAAAAAEAAAAAAAAAQsAAAAAAAAAAFAAAAAAAACQgsALQAAAAAAAAAgAAAAAAAAAAAAAAgqCoKgCgAAAAAAAAAAAAAAAAKiKgqCpQAAAADpGsAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUKAFAAAAAAAAAAAAAAABAAAAAAAAAIAAAAAIWChQAAAAAAAAAAAAQAAAAAFAACFgAAAAAABAAAUAAAAAAAAJFgAABQAAAAAQAACgAAACAIAAACgAAAAAAEAAAAAAAAAgAAAAAAAAIWAAAAAAAAAACgAAAAAAAgQQBaAAAAAAAAAEAAAAAAAAAAAEFQVAFAAAAABAAAAAAAAAAAUAAAAAAAAAAAAAsRUFSnSNYCAAAAAAAAAAAAAAAAAAAAAAAAAAAABCwUAKAAAAAAAAAAAACAAAAAAAAAAAQAAAAAABBQoAAAAAAAAAAAIAAAAAAACgBCwAAAAAAAgAAAKAAAAAAACEAAAKAAAAACAAAUAAAABBAAAAUAAAAAAABAAAAAAAAAQAAAAAAAACAAAAAAAAAAFAAAAAABAAggC0AAAAAAAAIAAAAAAAAAEKgqAKAAACAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAADqDAAAAAAAAAAAAAAAAAAAAAAAAAAAAhYKAFAAAAAAAAABAAAAAAAAAAAAAAIAAAAAAAQoAUAAAAAAAAAAEAAAAAAABQABAAAAAAAEAAABQAAAAAAAQQAABQAAAAAQAAACgAAACJYAAAAKAAAAAAAIAAAAAAAACAAAAAAAAAhYAAAAAAAAAAKAAAAACABBAFoAAAAAAAAQAAAAAAAIVBYAUAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAHUGAAAAAAAAAAAAAAAAAAAAAAAAABCwUKAAAAAAACAAAAAAAAAAAAAAAAAQAAAAAAAhQAoAAAAAAAAAIAAAAAAAAACgCAAAAAAAIAAAACgAAAAAABIsAAAKAAAAACAAAAUAAAAhAAAAUAAAAAAABAAAAAAAAAQAAAAAAAACAAAAAAAAAAFAAAAABAAggC0AAAAAAAAIAAAAAAEKgCgAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAA6gwAAAAAAAAAAAAAAAAAAAAAAAIWCgBQAAAQAAAAAAAAAAAAAAAAAACAAAAAAAACLYAUAAAAAAAAAEAAAAAAAAABQAhYAAAAAAQAAAAFAAAAAAABBAAAFAAAAAABAAAKAAAACIAAAAKAAAAAAAIWAAAAAAAAIWAAAAAAAAIWAAAAAAAAACgAAAAAgABEABaAAAAAAAEAAAAACFQBQAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFdQYAAAAAAAAAAAAAAAAAAAAAAQUAKACAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAQsFCgAAAAAAAAgAAAAAAAAAAAKAIAAAAAAgAAAAAKAAAAAAAEiwAAAoAAAAAIAAABQAAABEAAAABQAAAAAABAAAAAAAAAgAAAAAAAAIAAAAAAAAAAUAAAAEAAELCAtAAAAAAACAAAAACAKAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOoXAAAAAAAAAAAAAAAAAAAAAgChQQAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAEKAFAAAAAAABAAAAAAAAAAAAUAIWAAAAAEAAAAAABQAAAAAAkWAAAAFAAAAABAAAKAAAACEAAAAKAAAAAAAAIAAAAAAAAIAAAAAAAACAAAAAAAAACgAAAAgAACACgAAAAAABAAAAAhYAUAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdQuAAAAAAAAAAAAAAAAAAAEFAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAABCwUKAAAAAACAAAAAAAAAAAAAAoAgAAAACAAAAAAAAoAAAAAIIAAAAAoAAAAAIAABQAAAARAAAABQAAAAAAAEAAAAAAAABAAAAAAAAEAAAAAAAAAAUAAAEAAAIAUAAAAAAAIAAAAIAoAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6hcAAAAAAAAAAAAAAAAACAKAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEKFAAAAAABAAAAAAAAAAAAAAAUIWAAAAEAAAAAAAABQAAAAQQAAAABQAAAAAQAAACgAAAAiAAAACgAAAAAACFgAAAAAAAAIAAAAAAAAgAAAAAAAACgAAAAgAACACgAAAAAABAAABAFAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUFQVBUFQVBUFQVBUoAAAAAAAAAAAAAAAB1C4AAAAAAAAAAAAAAAAEAUAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAELBQoAAAAIAAAAAAAAAAAAAAAAChAAAAAIAAAAAAACgAAAABIsAAAAAKAAAACAAAAAUAAAARAAAAUAAAAAAAAQAAAAAAAAEAAAAAAAABAAAAAAAAAFAAABAAABAFAAAAAAACAAACAKAAAACAAAAAAAAAAAAAAAAAAAAAACCoKgAAAAAAAAAAAAAAAAAAWCoKgoAAAAAAAAAOoXAAAAAAAAAAAAAAABCgAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAigBQAAAQAAAAAAAAAAAAAAAAFAEAAAAQAAAAAAAAFAAAAACQAAAAAFAAAABAAAAAKAAAAggAAAKAAAAAAAAgAAAAAAAAIAAAAAAAACAAAAAAAAACgAAAgAAAkBaAAAAAAAEAACFhQAAAAAQAAAAAAAAAAAAAAAAAAIVBYAAAAAAAAAAAAAAAAAAAAAAAAAAAACwVBQAAAAAdQuAAAAAAAAAAAAAAEFAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAEFCgAAAgAAAAAAAAAAAAAAAAAKAQAAAAgAAAAAAAAKAAAACEAAAAAAKAAAACAAAAAUAAAQsEAAABQAAAAAAAEAAAAAAAABAAAAAAAAELAAAAAAAAABQAAQAAABABQAAAAAAAgABACgAAAAAgAAAAAAAAAAAAAAAAQqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYKgoAAOoXAAAAAAAAAAAAAAigAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAACChQAQAAAAAAAAAAAAAAAAAAAFAIAAAQAAAAAAAAAAFAAABCAAAAAAAFAAABAAAAAKAAAIAgAAAAKAAAAAAAgAAAAAAACFgAAAAAAACAAAAAAAAAKAAACAAACAKAAAAAAAAEACAUAAAAAEAAAAAAAAAAAAAAACFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVBQdQuAAAAAAAAAAAABAFAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAEFCggAAAAAAAAAAAAAAAAAAAAKEAAAAgAAAAAAAAAAKAAACEAAAAAAAKAAACAAAAAUAAAQBAAAAAUAAAAAABAAAAAAAAEAAAAAAAABAAAAAAAAAFAAABAAAEAFAAAAAAACAAEAKAAAAACAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADrFwAAAAAAAAAAABAoAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAgoAAAAAAAAAAAAAAAAAAAAAAUIAAABAAAAAAAAAAAUAAAEIAAAAAAAUAAAEAAAAAAoAAgCAAAAAoAAAAAAAgAAAAAAAAgAAAAAAAIAAAAAAAAAKAAACAAAIAKAAAAAAAEACFhQAAAAAQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdYuAAAAAAAAAAAEsUAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAQUAAAAAAAAAAAAAAAAAAAAAAASgAAAgAAAAAAAAAAKAAACEAAAAAAAKAAACAAAAAAUAACBAAAAAUAAAAAAACAAAAAAAAQAAAAAAABAAAAAAAAAFAAABAABAFAAAAAAAACABAKAAAACAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADrFwAAAAAAAAAABAoAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAgoAAAAAAAAAAAAAAAAAAAAAAAVAAABAAAAAAAAAAAUAAAEIAAAAAAAAUAAEAAAAAAoAACCAAAAAAoAAAAAACAAAAAAAAIAAAAAAACAAAAAAAAAKAAACAACAKAAAAAAAEAACAUAAAAEAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHWLgAAAAAAAAABLFAAAAAAAAAAAAAAAAABAAAAAAAAAAAAABFAAAAAAAAAAAAAAAAAAAAAAACkAAAIAAAAAAAAAAACgAAEIAAAAAAACgAAgAAAAAAFAAEQAAAAAFAAAAAAAEAAAAAAAAIAAAAAAABAAAAAAAABQAAAQAABABQAAAAAAgAAQCgAAAAgAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAEKgqCoKgqCoKgqCoKgqCpQAAAAAAAAAAAAAAAAAADrFwAAAAAAAAAAligAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAECgAAAAAAAAAAAAAAAAAAAAABSAAAEAAAAAAAAAAABQAAAkAAAAAAABQAAAQAAAAACgAAQIAAAAACgAAAAAAQAAAAAAACWAAAAAAAAgAAAAAAAACgAAgAACWAKAAAAAAEAACAUAAAAEAAAAAAAAAAAACFgAAAAAAAAAAAAAAAAAAAEFgAoAAAAAAAAAAAAACwlSgAAAAAAAAAAAAAAAHWLgAAAAAAAAABLFAAAAAAAAAAAAAAAABAAAAAAAAAAAAAEsUAAAAAAAAAAAAAAAAAAAAAAASgAAgAAAAAAAAAAAAKAACIAAAAAAAAKAACAAAAAAAUABLEAAAAABQAAAAAAEsAAAAAAAAIAAAAAAACAAAAAAAABQAAAQAAQBQAAAAAAAgAQCgAAAAgAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAELABQAAAAAAAAAAAAAAAAAAAKlQAAAAAAAAAAAAADrFwAAAAAAAAAAligAAAAAAAAAAAAAAAgAAAAAAAAAAAAAECgAAAAAAAAAAAAAAAAAAAAABUAAEAAAAAAAAAAAABQAACWQAAAAAAAFAAABAAAAAAKAACQAAAAAAKAAAAAAAgAAAAAAAJYAAAAAAAJYAAAAAAAAAoAAIAAAgAoAAAAAAQAAhQAAAAQAAAAAAAAAAAAIAAAAAAAAAAAAAAAAACFgAoAAAAAAAAAAAAAAAAAAAAAACwlAAAAAAAAAAAAB1i4AAAAAAAAAASxQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAQBQAAAAAAAAAAAAAAAAAAAAAEKAACAAAAAAAAAAAAAoAAIgAAAAAAAAoAAIAAAAAABQAEsQAAAAAFAAAAAAAEAAAAAAAAIAAAAAAACAAAAAAAABQAAQAAACBQAAAAAAAgBACgAAAAgAAAAAAAAAAAQAAAAAAAAAAAAAAAAAEAUAAAAAAAAAAAAAAAAAAAAAAAAAACpUAAAAAAAAAAA6xcAAAAAAAAAAJYoAAAAAAAAAAAAAAIAAAAAAAAAAAAAAligAAAAAAAAAAAAAAAAAAAAACAUAEAAAAAAAAAAAABQAACWQAAAAAAAAFAABAAAAAAAKACQAAAAAAKAAAAAAAgAAAAAAACAAAAAAAAgAAAAAAAACgAAgAACWAKAAAAAAEACAUAAAAEAAAAAAAAAAACAAAAAAAAAAAAAAAAACACgAAAAAAAAAAAAAAAAAAAAAAAAAAALCUAAAAAAAAAAHWLgAAAAAAAAABLFAAAAAAAAAAAAAABAAAAAAAAAAAAAAEsUAAAAAAAAAAAAAAAAAAAAABCgAAgAAAAAAAAAAAAKAAAQgAAAAAAAKAAACAAAAAAUAALIIAAAAABQAAAAABAAAAAAAABLAAAAAAABLAAAAAAAAFAABAAAAIAFAAAAAACAEAKAAAACAAAAAAAAAAAEAAAAAAAAAAAAAAAAAQBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFlQAAAAAAAAADrFwAAAAAAAAAAligAAAAAAAAAAAAAgAAAAAAAAAAAAAACWKAAAAAAAAAAAAAAAAAAAAABBQAAQAAAAAAAAAAAAFAABEAAAAAAAAFAABAAAAAAAKAAliAAAAAAoAAAAAACWAAAAAAAAEAAAAAAABAAAAAAAAAoAAIAAAIAoAAAAAAAQIBQAAAAAQAAAAAAAAAAIAAAAAAAAAAAAAAAACAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQgAAAAAAAAHWLgAAAAAAAAABLFAAAAAAAAAAAAABAAAAAAAAAAAAAAAEsUAAAAAAAAAAAAAAAAAAAABLAKAACAAAAAAAAAAAAAoAAIgAAAAAAAAoAAIAAAAAABQARLAAAAAAFAAAAAAAgQFAAAAAAAgAAAAAAAIAAAAAAAAFAABAAAEsAUAAAAAAIASwCgAAAAAgAAAAAAAAABAAAAAAAAAAAAAAAAASwBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKEAAAAAAAAA6xcAAAAAAAAAAJRAoAAAAAAAAAAAAIAAAAAAAAAAAAAAAligAAAAAAAAAAAAAAAAAAAAJYBQAAQAAAAAAAAAAAAFAABEAAAAAAAAFAABAAAAAAAKAFiWQAAAAACgAAAAACAICgAAAAACAAAAAAAAEAAAAAAAACgAgAAACWAKAAAAAAEAQUAAAAAAEAAAAAAAAACAAAAAAAAAAAAAAAAAECgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUIAAAAAAAAB/8QAFBABAAAAAAAAAAAAAAAAAAAA4P/aAAgBAQABBQJ//v8A/f8A+6Q//8QAFBEBAAAAAAAAAAAAAAAAAAAA4P/aAAgBAwEBPwF9If/EABQRAQAAAAAAAAAAAAAAAAAAAOD/2gAIAQIBAT8BfSH/xAAUEAEAAAAAAAAAAAAAAAAAAADg/9oACAEBAAY/An/+/wD9/wD7pD//xAAUEAEAAAAAAAAAAAAAAAAAAADg/9oACAEBAAE/IX/+/wD9/wD7pD//2gAMAwEAAgADAAAAEAAAAAAAAAAAAAAAAAAAAAAAPPPPPPPPPPPPPKvPPPPPPPPKwAAQAAAEQAAAAgAAAAAGAAAAAAAAAAHfPPPPfOHfPPPPPPIAAAAAAAAAGAAAAAAAAAAAQQRYQQQQQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQZQQQQQQQQQQQQQQQQQQQQQQQQQ0wQQQQQQQQQQwQQQQQQQQQAAAAAAAANffffffffffffffffffffffffffQAAAAAAAAAAAAAAAAAAAAAHPPPPPPPPPPPPPtvPPPPPPPvAAAAAAgAKwAAAgAAAAAGgAAAAAAAAABPPPPPPPJfPPPPPPOAAAAAAAABIAAAAAAAAAAAQQWwQQQQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQQQQQQwaQQQQQQQQQQwQQQQQQQQQAAAAAAAAFPfffffffffffffffffffffffffQAAAAAAAAAAAAAAAAAAAABPPPPPPPPPPPPPLvPPPPPPPPKwAAQAAAEQAAAAgAAAAEgAAAAAAAAAAHfPPPPPOPPPPPPPPAAAAAAAAAIAAAAAAAAAAAAQWwQQQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQQQQQQQUZQQQQQQQQQQQQQQQQQQQQQQQQwQQQQQQQQQwQQQQQQQQQAAAAAAAAAPfffffffffffffffffffffffPPAAAAAAAAAAAAAAAAAAAABPPPPPPPPPPPPPOnvPPPPPPPOQAAQAAgAIgAAAgAAAABIgAAAAAAAAABPPPPPPPNfPPPPPPIAAAAAAAAGAAAAAAAAAAAARYwQQQQQQQQQQQQQwwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQZQQQQQQQQQQQQQQQQQQQQQQ0wQQQQQQQQQwQQQQQQQQQAAAAAAAAANfffffffffffffffffffffPPPPAAAAAAAAAAAAAAAAAAAHPPPPPPPPPPPPPPtvPPPPPPPvIgAQAAgAGwAAAgAAAABIgAAAAAAAAAAHfPPfPPLfPPPPPPOAAAAAAAAEAAAAAAAAAAAAS4QQQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQQQwaQQQQQQQQQQQQQQQQQQQAAAAAAAAAEPffffffffffffffffffPPPPPPAAAAAAAAAAAAAAAAADPPPPPPPPPPPPPPvLvPPPPPPPPIwAQAAgAEQAAAgAAAABIgAAAAAAAAAAFfPPfPPOHfPPPPPPAAAAAAAABIAAAAAAAAAAAWwQQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQQQRwQQQQQQQQQQQQQQQQQQAAAAAAAAAAPfffffffffffffffffPPPPPPPAgggAAAAAAAAAghjvPPPPPPPPPPPPPPuHvPPPPPPvPIwAQAAgABQgAAgAAAABIgAAAAAAAAAABPPPfPPPHfPPPPPPIAAAAAAABIAAAAAAAAAABUwQQQQQQQQQQQQwwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQQwSQQQQQQQQQwQQQQQQQQAAAAAAAAAAFPfffffffffffffffPPPPPPPPLjjjjjjjjjjjvvPPPPPPPPPPPPPPPvJvPPPPPPPvOYgAQAAAACQAAAgAAAABIgAAAAAAAAAAAPfPfPPPJfPPPPPPIAAAAAAABIAAAAAAAAAABYwQQQQQQQQQQQQwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQwZwQQQQQQQQwQQQQQQQQQAAAAAAAAAAPfffffffffffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPvNnvPPPPPPvPOwAAQAgAAGwAAAgAAAABIgAAAAAAAAAAAHfPfPPPLfPPPPPPOAAAAAAAAAAAAAAAAAAAGwQQQQQQQQQQQQwwQQQTz/8A333333333888kEEEEEEEEEEEEEEEEEEEEEEEFEkEEEEEEEEEEEEEEEEEMEkEEEEEEEEEEEEEEEEEAAAAAAAAAADX3333333333333zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz77jZ7zzzzzzz7z2MAEAAAAARMAAAIAAAAAqIAAAAAAAAAAAB3z3zzzzjzzzzzzzgAAAAAAABgAAAAAAAAASMEEEEEEEEEEEMMEEU//AN9999999999999999/PJBBBBBBBBBBBBBBBBBBBBBBRJBBBBBBBBBBBBBBBBDBTJBBBBBBBDBBBBBBBBAAAAAAAAAAAQ99999999999998888888888888888888888888888888+8wue88888888+8zAABAAAAANiAAACAAAAAaCAAAAAAAAAAAEd8988884d8888884AAAAAAAAYAAAAAAAAAKhBBBBBBBBBDCABBP/8AffffffffffffffffffffffbyQQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQQQRgQQQQQQQwQQQQQQQQAAAAAAAAAAAPfffffffffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPutnvPPPPPPPPPvuwgAAQAAgAGwAAAAgAAAAGggAAAAAAAAAABPfPfPPPOHPPPPPPOAAAAAAAAGAAAAAAAAAGgQQQQQQQQQwAAB3/fffffffffffffffffffffffffffbyQQQQQQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQwQIQQQQQQQQQQQQQQQQQAAAAAAAAAAFPffffffffffffPPPPPPPPPPPPPPPPPPPPPPPPPPsrjvPPPPPPPPPPPvIwAAQAAAgAGwAAAAgAAABEggAAAAAAAAAABfPfPPPPNfPPPPPPOAAAAAAAAmgAAAAAAAAGwQQQQQQQQwAAD/8A333333333333333333333333333333328kEEEEEEEEEEEEEEEEEEFEkEEEEEEEEEEEEEEEEFIkEEEEEEMEEEEEEEEAAAAAAAAAAAD333333333333zzzzzzzzzz77777777777777K57zzzzzzzzzzzz7zmIAAEAAAIASMAAAIAAAAASIIAAAAAAAAAAAXz3zzzzyXzzzzzzzgAAAAAAAJoAAAAAAAAJkEEEEEEEMAAAb/3333333333333333333333333333333333308EEEEEEEEEEEEEEEEEEEUEEEEEEEEEEEEEEEMEAYEEEEEEEEEEEEEEEAAAAAAAAAAADX33333333333zzzzzzzzzx77LLLLLLL7447zzzzzzzzzzzzzz7z2MAAEAAAIAA2IAAAIAAAAAqIAAAAAAAAAAAAXz3zzzzyXzzzzzzzgAAAAAAAJIAAAAAAAAaEEEEEEEMAAAI73333333333333333333333333333333333333328EEEEEEEEEEEEEEEEEEGUEEEEEEEEEEEEEEEMECkEEEEEEMEEEEEEEAAAAAAAAAAABT33333333333zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz77z3MAAAEAAIIARMAAAAIAAAABoIAAAAAAAAAAAAXz3zzzzyXzzzzzzzgAAAAAAAYIAAAAAAAISEEEEEEMAAAIZ33333333333333333333333/8A/wD/AP8A/wD/AP8A/wD/AH3333330sEEEEEEEEEEEEEEEEEGEEEEEEEEEEEEEEEMEBIEEEEEEEEEEEEEEEAAAAAAAAAAAD33333333333zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz77zzmMAAAEAAAIAAmIAAAAAAAAASIIAAAAAAAAAAAA3z3zzzzyXzzzzzzyAAAAAAAAaAAAAAAAAISEEEEEMAAAAIT33333333333333333333/8A9999999999999999/wD/AH33308EEEEEEEEEEEEEEEEFEkEEEEEEEEEEEEEEMECMEEEEEEMEEEEEEEAAAAAAAAAAADX3333333333zzzzzzzzzzzzzzzzzzzzzzzzzzzz77zz3MIAAAEAAAIAA3MAAAAIAAAAAqAIAAAAAAAAAAAB33zzzzzj3zzzzzzyAAAAAAAAaAAAAAAAIBgEEEEMIAAAIB3333333333333333333//AN999999999999999999999/9999vBBBBBBBBBBBBBBBBBFBBBBBBBBBBBBBBDBASBBBBBBBBBBBBBBAAAAAAAAAAAAU9999999999888888888888888888888888+++885ziAAAABAAACAAFTAAAAACAAAAESCAAAAAAAAAAAAAd9888884d8888888gAAAAAACGgAAAAAACAZBBBBCAAACAE9999999999999999999//AP8A/wD/AP8A/wD/AP8A3333333333333333/wB99vBBBBBBBBBBBBBBBBBhBBBBBBBBBBBBBBDAAjBBBBBBDBBBBBBBAAAAAAAAAAAA999999999998888888888+++++++++++8885zjAAAAAABAAACAAFTAAAAACAAAAAOiCAAAAAAAAAAAAE99888884d8888884gAAAAAACaAAAAAAACERBBBDAAACCAM99999999999999999999999999999999//APfffffffffffffff/fbwQQQQQQQQQQQQQQQUSQQQQQQQQQQQQQQQQEgQQQQQQQQQQQQQQAAAAAAAAAAAPfffffffffffPPPPPPPPPffPPPPPfcc88wgAAAAAAAAQAAggABUwAAAAAgAAAABGggAAAAAAAAAAAABffPPPPPJfPPPPPPOAAAAAAAAmgAAAAAAgBIQQQwgAAAgAHfffffffffffffffffffffffffffffffffffff/AP3333333333333/AN9vBBBBBBBBBBBBBBBBFBBBBBBBBBBBBBBDAApBBBBBBDBBBBBBAAAAAAAAAAAAV9999999999888888888AAAAAAAAAAAAAAAAAAABBACCAAANzAAAAACAAAAAAKiCAAAAAAAAAAAAAd9888888l88888884AAAAAAAGSAAAAAACAAhBBDAAACAAE99999999999999999999999999999999999999999/wDfffffffffffff/bwQQQQQQQQQQQQQQQSQQQQQQQQQQQQQQQQBgQQQQQQQQQQQQQQAAAAAAAAAAFPffffffffffPPPPPPPPAAAAAAAAAAAAAAAAAQQgggAABQ4gAAAAAgAAAAABEggAAAAAAAAAAAABHffPPPPOPfPPPPPPIAAAAAAABoAAAAAAAgGAQQwgAAAgAHfffffffffffffffffffffffffffffffffffffffffffff/ffffffffffff/bwQQQQQQQQQQQQQQVQQQQQQQQQQQQQQQwEgQQQQQQQwQQQQQQAAAAAAAAAAFPffffffffffPPPPPPPPAAAAAAAAAAAAAAwwggAAADS8gAAAAAggAAAAAAGoggAAAAAAAAAAAABffPPPPPOHfPPPPPPIAAAAAAAhoAAAAAAAgGQQQwAAAgABHfffffffffffffffffffffffffffffffffffffffffffffff/ffffffffffff8A2sEEEEEEEEEEEEEEGkEEEEEEEEEEEEEEACkEEEEEEEEEEEEEAAAAAAAAAABT33333333333zzzzzzzwAAIIIIIIIEEEAAAAA0tOIAAAAAAIIAAAAAAAqIIAAAAAAAAAAAAAB33zzzzzzXzzzzzzzqAAAAAAAJoAAAAAAIASEEEIAAAIAAT33333333333333333333333333333333333333333333333333/wB9999999999/8ASQQQQQQQQQQQQQQRQQQQQQQQQQQQQQQwAwQQQQQQQwQQQQQAAAAAAAAAAFPfffffffffffPPPPPPPAAAAAQQQAAABDS084gAAAAAAAggAAAAAAADsggAAAAAAAAAAAAABfffPPPPOLfPPPPPPOgAAAAAAAmgAAAAAAgAIQQwAAAgAAHfffffffffffffffffffffffffffffffffffffffffffffffffffff/ffffffffffffwQQQQQQQQQQQQQQSQQQQQQQQQQQQQQQFgQQQQQQQwQQQQQQAAAAAAAAAFPfffffffffffPPPPPPPM88888888sggAAAAAAAAAggAAAAAAAAABEgAAAAAAAAAAAAAABHffPPPPPNHfPPPPPPsgAAAAAAhEgAAAAAAgGAQQwAAAgABHfffffffffffffffffffffffffffffffffffffffffffffffffffffff/ffffffffff/bwQQQQQQQQQQQQQYQQQQQQQQQQQQQQQlgQQQQQQQQwQQQQQAAAAAAAAAFPfffffffffffPPPPPPPAAAAAAAAAAAAAAAAgggAAAAAAAAAAABEAAAAAAAAAAAAAAAADfffPPPPOJfPPPPPPPoAAAAAAAhoAAAAAAgBEQQQgAAggABPfffffffffffffffffffffffffffffffffffffffffffffffffffffffff8A3333333333/0sEEEEEEEEEEEEFUEEEEEEEEEEEEEEJYEEEEEEEEMEEEEEAAAAAAAAABT33333333333zzzzzzzwIIIIIIIIIIIIAAAAAAAAAAAAAAAAxAAAAAAAAAAAAAAAAAX33zzzzzzR3zzzzzz7oAAAAAAIAqAAAAAAIASEEMAAAIAAB33333333333333333333333333333HH33333333nH3333333333333333333/wB99999999/9/BBBBBBBBBBBBBBJBBBBBBBBBBBBBBWBBBBBBBBBDBBBBAAAAAAAAAAU9999999999988888888AAAAAAAAAAAAAAAAAAAAAAAAAAMwAAAAAAAAAAAAAAAAEd99888884t8888888+iAAAAAACAaAAAAACAAAhBDAAACAAAd999999999999999999999999951Nd999999999999td199999999999999999/999999999/wDawQQQQQQQQQQQQaQQQQQQQQQQQQQQVAQQQQQQQQQwQQQQAAAAAAAAAFPfffffffffffPPPPPPPAAAAAAAAAAAAAAAAAAAAAAABCIAAAAAAAAAAAAAAAABHfPfPPPPOJffPPPPPPuoAAAAAAAhoAAAAAAgAGAQQgAAgAABPffffffffffffffffffffffffdTfffffffffffffffffffXdfffffffffffffffff/ffffffff8A30EEEEEEEEEEEEEEEEEEEEEEEEEEEFQEEEEEEEEEEEEEEAAAAAAAAABT33333333333zzzzzzzwAAAAAAAAAAAAAAAAAAAAAxAAAAAAAAAAAAAAAAAAR3z33zzzzzR3zzzzzzz7IAAAAAAIAqAAAAAAIABkEEIAAIAAA333333333333333333333333m1333333333333333333333323X333333333333333/33333333332sEEEEEEEEEEEEEEEEEEEEEEEEEEFQEEEEEEEEEEMEEEAAAAAAAAABX33333333333zzzzzzzwAAAAAAAAAAAAAAAAAAxCAAAAAAAAAAAAAAAAAA13zz3zzzzzR3zzzzzzz7qAAAAAAIIBoAAAAAIAASEEMAAIAAAB33333333333333333333333m3333333333333333333333333323X333333333333333/AN9999999/8AfwQQQQQQQQQQQQQQQQQQQQQQQQQQVAQQQQQQQQQQwQQQAAAAAAAAAPffffffffffffPPPPPPPAAAAAAAAAAAAAAADEIAAAAAAAAAAAAAAAAAADffPPfPPPPNHfPPPPPPPvsgAAAAAAgBoAAAAAAgABIQQwAAgAABPffffffffffffffffffffffdXffffffffffffffffffffffffffffVfffffffffffffffffffffffff/AH2sEEEEEEEEEEEEEEEEEEEEEEEEEFQEEEEEEEEEEEEEEAAAAAAAAAT333333333333zzzzzzzwAAAAAAAAAAAQhCAAAAAAAAAAAAAAAAAAA13zzz33zzzzR33zzzzzz77oAAAAAAIABoAAAAAIAABgEEMAIIAAAz3333333333333333333333l3333333333333333333333333333332zj333333333333333/wB999999/8AfbwQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQwQQAAAAAAAAF/fffffffffffPPPPPPPPDDDDDDDDCEIAAAAAAAAAAAAAAAAAAABTfPPPPffPPPNH/fPPPPPPPuoAAAAAAAgBoAAAAAAgABEQQQwAgAAAHffffffffffffffffffffffdXffffffffffffffffffffffffffffffffPXPffffffffffffffffffffff/AH30EEEEEEEEEEEEEEEEEEEEEEEEEGkEEEEEEEEEEEMEEAAAAAAAAL333333333333zzzzzzzzwEEEEAAAAAAAAAAAAAAAAAAAAAAA03zzzzzz3zzzi5/wA8888888++iAAAAAACAAagAAAACAAAEhBBCACAAAE99999999999999999999999l999999999999999999999999999999999899199999999999999/999999/8AffSQQQQQQQQQQQQQQQQQQQQQQQQRQQQQQQQQQQQQQQQQAAAAAAAFvf8A3333333333zzzzzzzzwAAAAAAAAAAAAAAAAAAAAAAAQ13zzzzzzz3zzzA/3zzzzzzzz77IAAAAAAIIAaAAAAAAIAABkEEEIIAAAAz33333333333333333333332X3333333333333333333333333333333333z31X33333333333333/333333/wB99rBBBBBBBBBBBBBBBBBBBBBBBBRBBBBBBBBBBBBBDAAAAAAAAC99/wDfffffffffPPPPPPPPPAAAAAAAAAAAAAAAAAAADTXfPPPPPPPPPfPMLn/fPPPPPPPPvMgAAAAAAggBGgAAAAAgAABIQQQQggAAAHfffffffffffffffffffffffZffffffffffffffffffffffffffffffffffffPfVffffffffffffffffffffff/AH32sEEEEEEEEEEkEEEEEEEEEEEEEkEEEEEEEEEEEEEMAAAAAAAB/wB999999999998888888888AAAAAAAAAAAAMNNN988888888888898wuf8AfPPPPPPPPPvMgAAAAAAAgACoAAAAAggAACIQQQQAAAABPfffffffffffffffffffffffZfffffffffffffffffffffffffffffffffffffPfVffffffffffffffffffffff/AH32sEEEEEEEEEGEEEEEEEEEEEEEGEEEEEEEEEEEEEEMAAAAAAAb3333/wB999999888888888889999999998888888888888888895yuf9888888888+++yAAAAAAACAAGyAAAAACAAAERBBBBAAAAAN999999999999999999999999t9999999999999999999999999999999999999999V9999999999999999999999999rBBBBBBBBBVBBBBBBBBBBBBBVBBBBBBBBBBBBBBCAAAAAAC99999/8AffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPObz/wD3zzzzzzzzzz7zqIAAAAAAAIAAZIAAAAAIAAAAiEEEEEAAAAR333333333333333333333333313333333333333333333333333333333333333z331X33333333333333333333/AN999rBBBBBBBBBJBBBBBBBBBBBBBJBBBBBBBBBBBBBBCAAAAAAd99999/8AffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPutj/fPPPPPPPPPPPvvMoAAAAAAAAgABGgAAAAAggAABMQQQQQQAAABPfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffPfffVfffffffffffffffffffff8A3332sEEEEEEEEGEEEEEEEEEEEEEUEEEEEEEEEEEEEEAIAAAAB/333333/wB999988888888888888888888888888++6y2+Mc888888888888++86yAAAAAAAACAAEagAAAAACAAAAYhBBBBBAAAAd999999999999999999999999999999999999999999999999999999999999999899999V9999999999999999999999995DBBBBBBBBDBBBBBBBBBBBBBJBBBBBBBBBBBBBBACAAAAW9999999/8AffffPPPPPPPPPPPPPMsssssssstvrjDHPPPPPPPPPPPPPPPPvvOsgAAAAAAAAggABGoAAAAAAgAAABIQQQQQQQAABPffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffPffffefffffffffffffffffffff/fffQQwQQQQQQQQwQQQQQQQQQQQRQQQQQQQQQQQQQQQAAgAABvffffffff/AH33zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz77zzrIAAAAAAAAAIIAARqAAAAAAIAAAAREEEEEEEEEAAz333333333333333333333333333333333333333333333333333333333333333z3333333T3333333333333333333/3332EEMEEEEEEEMUEEEEEEEEEEEGEEEEEEEEEEEEEEAAAIAAb333333333/wB988888888888888888888888888888888888888++886ygAAAAAAAAACCAAAOSAAAAAACAAAAAYhBBBBBBBBAEd99999999999999999999999999999999999999999999999999999999999999989999999k9999999999999999/999/999hBBBBBBBBBBBXBBBBBBBBBBBZBBBBBBBBBBBBBBAAACAf9999999999/8AfPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPvvvvPPssoAAAAAAAAAAAAggABCsAAAAAAAgAAAACIQQQQQQQQQQDPffffffffffffffffffffffffffffffffeffffffffffffffffffffffffffffffPfffffffbPfffffffffffffffff/ff/AH3mEEEMEEEEEEEMEsEEEEEEEEEEUEEEEEEEEEEEEEEAAAAB333333333333/wA88888888888888888++++++++++++888+6yygAAAAAAAAAAAAACCAAAOSgAAAAAACAAAAAMxBBBBBBBBBBEd999999999999999999999999999999999989999999999999999999999999988999999999899999999999999999999/wDfeQQQQQwQQQQQQwQYQQQQQQQQQRYQQQQQQQQQQQQQQAAABHfffffffffffffPPPPPPPPPPPPPPPPPPMsssssssssssgAAAAAAAAAAAAAAAAAggAAABEIgAAAAAAAgAAAADMQQQQQQQQQQQRfffffffffffffffffffffffffffffffffffZPfPffffffffffffffffffffffPPffffffffffZPffffffffffffffffff/AH/33EEEEEEEEEEEEMEFMEEEEEEEEEWEEEEEEEEEEEEEEAAAAT333333333333z7zzzzzzzzzzzzzzzzq50AAAAAAAAAAAAAAAAAAAAAAAAAIIIAAAAwCEMAAAAAAIIAAAAAzEEEEEEEEEEEEEX33333333333333333333333333333333332z3333z33333333333333333zz3333333333332T33333333333333333333/32EEEEEEMEEEEEMEEGEEEEEEEEEWEEEEEEEEEEEEEEAAAA3333333333333zz7zzzzzzzzzzzzzzY3330AAAAAAAAAAAAAAAAAAAAIIIAAAAAQxCEEEIAAAAAIIAAAAAzEEEEEEEEEEEEEEH3333333333333333333333333333333333313333333zzzzzzzzzzzzzz333333333333333h33333333333333333333/AP8AeQQQQQQQQQQQQQwQQUwQQQQQQQQaQQQQQQQQQQQQQQAABHfffffffffffffPPPPPPPPPPPPPPOrnfffffQAAAAAAAAAAAAggggggAAAAADCEMQQQQQwAAAAggAAAAACIQQQQQQQQQQQQQQQXfffffffffffffffffffffffffffffffffffafffffffffffffffffffffffffffffffffffZPffffffffffffffffffff/8A2EEEEEEEEMEEEEMEEEWEEEEEEEEFMEEEEEEEEEEEEEAAAz333333333333zzzz7zzzzzzzzzzI333333330AAAAAAAAAAAAAAAAAAQwhDGEEEEEEEMAAAIIAAAAAARGEEEEEEEEEEEEEEEEEX333333333333333333333333333333333332n333333333333333333333333333333333R33333333333333333333333EEEEEEEEEMEEEEMEEEFsEEEEEEEEeEEEEEEEEEEEEEAAR3333333333333zzzz7zzzzzzzzjZ33333333330AAAAAAAAQwwwwBDHGEEEEEEEEEEEMIAIIAAAAAAAjEEEEEEEEEEEEEEEEEEEF3333333333333333333333333333333333332n3333333333333333333333333333333R33333333333333333333333mEEEEEEEEEMEEEEMEEEFMEEEEEEEMFkEEEEEEEEEEEAAAz333333333333zzzzz7zzzzzzzq53333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEEIIIAAAAAAAxGEEEEEEEEEEEEEEEEEEEEEX3333333333333333333333333333333333332n33333333333333333333333333333R33333333333333333333333mEEEEEEEEEEEEEEMEEEEEeEEEEEEEMFMEEEEEEEEEEEAAT333333333333zzzzzzzzzzzzzY3333333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEAAAAAAAAxGEEEEEEEEEEEEEEEEEEEEEEEF33333333333333333333333333333333333332n33333333333333333333333333mx33333333333333333333333mEEEEEEEEEEEEMEEMEEEEEWEEEEEEMMEeEEEEEEEEEEAAR3333333333333zzzzzzzzzzzjZ333333333333zzzzzwEEEEEEEEEEEEEEEEEEEEEEEEAAAAAAQjGEEEEEEEEEEEEEEEEEEEEEEEEEEH33333333333333333333333333333333333332n33333333333333333333333nQz333333333333333333333332EEEEEEEEEEEEEMEMMEEEEEWEEEEEEMEEeEEEEEEEEEAAB3333333333333zzzzzzzzzzzq/3333333333zzzzzzzzzwEEEEEEEEEEEEEEEEEEEEEAAAAAQhHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH33333333333333333333333333333333333332n33333333333333333333nQz333333333333333333333333zAEEEEEEEEEEEEMEEMEEEEEE+EEEEEMEEEeEEEEEEEEEAAz333333333333zzzzzzzz7zzY3333333333zzzzzzzzz777wEEEEEEEEEEEEEEEEEEEAAwwDGEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH333333333333333333333333333333333333333j333333333333333nCx33333333333333333333333333zgEEEEEEEEEEEEEMMMEEEEEE3MEEEEMMEEFsEEEEEEEEAAz33333333333zzzzzzzzzz7q533333333zzzzzzzzzz77zzzzwEEEEEEEEEEEEEEEE1HHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH33333333333333333333333333333333333333323zDDDDDDDDDTwx333333333333333333333333333zziAEEEEEEEEEEEEEMMEEEEEE3EMEEEMMEEEdEEEEEEEEAAz33333333333zzzzzzzzzzzK/3333333zzzzzzzzzz77zzzzzzzwEEEEEEEEEEEEEVGEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH3333333333333333333333333333333333333333333333333333333333333333333333333333333z3CEEEEEEEEEEEEEEEMEEEEEE3EMEEEMMEEEEuEEEEEEAAAz33333333333zzzzzzzzzzjR333333zzzzzzzzzzzz77zzzzzzzzzwEEEEEEEEEE0HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH3333333333333333333333333333333333333333333333333333333333333333333333333333zz3AEEEEEEEEEEEEEEEEEEEEEEmEEMEEMEEEEEdEEEEEEEAAR3333333333zzzzzzzzzzzC333333zzzzzzzzzzzzz7zzzzzzzzzzzzwEEEEEEUlGEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH3333333333333333333333333333333333333333333333333333333333333333333333333zz33AEEEEEEEEEEEEEEEEEEEEEVmEEMEEMMEEEEEuEEEEEEAAN3333333333zzzzzzzzzzjR3333zzzzzzzzzzzzzz77zzzzzzzzzzzzzzwEU0nGEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEH3333333333333333333333333333333333333333333333333333333333333333333333zz33iAEEEEEEEEEEEEEEEEEEEEE1EEEEMEEMEEEEEFsEEEEEAAMd333333333zzzzzzzzzzC33333zzzzzzzzzzzzz77zzzzzzzzzzzzz7rLLOEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEETz33333333333333333333333333333333333333333333333333333333333333333zz3333CEEEEEEEEEEEEEEEEEEEEEEnEEEEMMEMEEEEEEdEEEEEAIMEf33333333zzzzzzzzzjR33333zzzzzzzzzzzz77zzzzzzzzz7rLLKAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFz3333333333333333333333333333333333333333333333333333333333333333zz3333jAEEEEEEEEEEEEEEEEEEEEEVGEEEEEMMMEEEEEEE+EEEEAMMEN/3333333zzzzzzzzzC33333zzzzzzzzzzzz77zzzzzzzLKAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFz3333z3333333333333333333333333333333333333333333333333333333zzz333333CAEEEEEEEEEEEEEEEEEEEEUnEEEEEEMMMEEEEEEEdEEEEEMEEEd3333333zzzzzzzzix33333zzzzzzzzzzz77zzzzz7LIAAAAAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEET3333333z33333333333333333333333333333333333333333333333333zzz3333333iAEEEEEEEEEEEEEEEEEEEEE1EEEEEEEEMMEEEEEEEEuEEEMMEEEM/333333zzzzzzzzQ33333zzzzzzzzzzzz77zzz7LIAAAAAAAAAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEz3333333333z3333333333333333333333333333333333333333333zzz333333333nAEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEdEEEMEEEEEf333333zzzzzzzC33333zzzzzzzzzzzzz77zzrIAAAAAAAAAAAAAAAAAAAAAIIAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFz3333333333333zz3333333333333333333333333333333333zzzz333333333333CAEEEEEEEEEEEEEEEEEEEEUnEEEEEEEEEEEEEEEEEEEdsEMMEEEEEd333333zzzzzzC133333zzzzzzzzzzzzz777KIAAAAAAAAAAAAAAIIIAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEV3333333333333333333zzzz3333333333333333333zzzzzz3333333333333333CAEEEEEEEEEEEEEEEEEEEEUnEEEEEEEEEEEEEEEEEEEEEuEMMEEEEEE/3333zzzzzzC1333333zzzzzzzzzzzzz77KAAAAAAAAAAAAAAIIAAAAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEET3333333333333333333333333333zzzzzzzzzz333333333333333333333333CAEEEEEEEEEEEEEEEEEEEEUnEEEEEEEEEEEEEEEEEEEEEE9EMMEEEEEEd3333zzzzzC1333333zzzzzzzzzzzzzz7KAAAAAAAAAAAAAAIIAAAAAAAw444oIIIIKIIIIEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEz33333333333333333333333333333333333333333333333333333333333jAAEEEEEEEEEEEEEEEEEEEEUnEEEEEEEEEEEEEEEEEEEEEEVOMMMEEEEEEd3333zzzzzV3333333zzzzzzzzzzzzzzKIAAAAAAAAAAAAIIAAAAQ4pLKAAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEFz333333333333333333333333333333333333333333333333333333333DAEEEEEEEEEEEEEEEEEEEEE1HEEEEEEEEEEEEEEEEEEEEEEUnEMMMEEEEEEM/333zzzz7N3333333zzzzzzzzzzzzjCAAAAAAAAAAAAAIIAAA4pLAAAAAAAAAAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEED333333333333333333333333333333333333333333333333333333jAAEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEEEEEnEEMMEEEEEEEE/333zzz7/ALt99999888888888888wwAAAAAAAAAAAAAACAEOSwAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBA999999999999999999999999999999999999999999999999994wgBBBBBBBBBBBBBBBBBBBBBFJxBBBBBBBBBBBBBBBBBBBBBBBNRhBBBBBBBBBBBH99888+/8Ae7/fffffPPPPPPPPPPMIAAAAAAAAAAAAAAAhjksAAAAAAAAAAAAAAAAAAAAAggggggAAAAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPfffffffffffffffffffffffffffffffffffffffffffffeMIAQQQQQQQQQQQQQQQQQQQQQTUcQQQQQQQQQQQQQQQQQQQQQQQRUYQQQQQQQQQQQQR3ffPPP/fe5/ffffPPPPPPPPPPMIQAAAAAAAAAAAAAAjgsAAAAAAAAAAAAAAAAggggAAAAAAAAAAAAAAAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPfffffffffffffffffffffffffffffffffffffffffcMAQQQQQQQQQQQQQQQQQQQQQQQRCIQQQQQQQQQQQQQQQQQQQQQQQRScQQQQQQQQQQQQQR3ffPPv8A33md3333zzzzzzzzzzCEEAAAAAAAAAAAAAAxKAAAAAAAAAAAAAAAIIIAAAAAAAAIIY44444oIAD0wgEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEED3333333333333333333333333333333333333DCAEEEEEEEEEEEEEEEEEEEEEEEEAQjAEEEEEEEEEEEEEEEEEEEEEEEUnEEEEEEEEEEEEEEEd3zz7/wB9953d999888888888whBAAAAAAAAAAAAAEIwAAAAAAAAAAAAAACCAAACOOCSwwwAAAAAAAAAAAAAQ9999sMBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBA99999999999999999999999999999994wwABBBBBBBBBBBBBBBBBBBBBBBBBBAAFQhBBBBBBBBBBBBBBBBBBBBBBBJxBBBBBBBBBBBBBBBHd88/999993d99888888888whBAAAAAAAAAAAAAMQwAAAAAAAAAAAAACCAAOOSwgAAAAAAAAAAAAAAAAAAAAAA99999999MIBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBA9999999999999999999999994wwwABBBBBBBBBBBBBBBBBBBBBBBBBBBBAABBIwBBBBBBBBBBBBBBBBBBBBBBBNRBBBBBBBBBBBBBBBBHd8+/wDfffed3fffPPPPPPPMIQQQAAAAAAAAAAADEIAAAAAAAAAAAAAAgjiksAAAAAAAAAAAAAAAAAAAAAAAAAAAAPffffffffffTCAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQcMMPffffffffffMMMMMMAAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQAAQQRSIQQQQQQQQQQQQQQQQQQQQQQTUYQQQQQQQQQQQQQQQQR3/8A/wB99999nd9888888884xBBAAAAAAAAAAAAMQgAAAAAAAAAAAAACOCwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999999999999MBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAABBBBBNQBBBBBBBBBBBBBBBBBBBBBBNRhBBBBBBBBBBBBBBBBBHf8A/fffffe53ffPPPPPPOMQQQQAAAAAAAAAABEIAAAAAAAAAAAAADgsAAAAAAAAAAAAAAAAAgggggAAAAAAAAAAAAgggvffffffffffffffQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQAAAQQQQQRSMAQQQQQQQQQQQQQQQQQQQQTUYQQQQQQQQQQQQQQQQQQRX/8A333333ud33zzzzzzjAEEEAAAAAAAAAAAQjAAAAAAAAAAAAAQjAAAAAAAAAAAAAAAIIIIAAAIIY44444444444444IID333333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAEEEEEEEUjAEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEE133333333u/3zzzzzzzCEEEEAAAAAAAAAAQjAAAAAAAAAAAAAxCAAAAAAAAAAAAAAIIIAI445zzzzzzzzzzzzzzzzzzzzzzz333333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAEEEEEEEEEEzAEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEEU333333333u/3zzzzzzzEEEEAAAAAAAAAAAxAAAAAAAAAAAAQjAAAAAAAAAAAAAAIII45zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz333333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAEEEEEEEEEEEExCEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEEE3333333333u/3zzzzzz7EEEEAAAAAAAAAARiAAAAAAAAAAAQjAAAAAAAAAAAAAII45zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz333333333333330EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAEEEEEEEEEEEEEExCEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEEE13333333333u3zzzzzz7/ADBBAAAAAAAAAAAIwAAAAAAAAAAEIwAAAAAAAAAAAAAOO8888888888888888888+++++++++++++++88888999999999999999BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBAAABBBBBBBBBBBBBBBBBNQhBBBBBBBBBBBBBBBBBBBBNRhBBBBBBBBBBBBBBBBBBBBFN99999999997t888888/7jBBAAAAAAAAAAEQgAAAAAAAAAEIwAAAAAAAAAAAAMM888888888888888++++8889zzzzzzzzzzzzz38888++999999999999/wD/AEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEAAAAEEEEEEEEEEEEEEEEEEEE1CEEEEEEEEEEEEEEEEEEEEE1GEEEEEEEEEEEEEEEEEEEEEE333333333333O3zzzzz7/uEEEAAAAAAAAAQjAAAAAAAAAAAjAAAAAAAAAAAAQxzzzzzzzzzzzzzz777zPP/wDOMc888888888888888888MM/7999999999/8A/ffcgQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQAAAAAQQQQQQQQQQQQQQQQQQQQQQTUIAQQQQQQQQQQQQQQQQQQQTUYQQQQQQQQQQQQQQQQQQQQQTXfffffffffffczfPPPPP8A3uEEEAAAAAAAAARCAAAAAAAAAAxCAAAAAAAAAAAQzzzzzzzzzzzzzz77PP8AMc888888888899999999999999999999999999//APffffYgQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQAAAAAQQQQQQQQQQQQQQQQQQQQQQQQQQQRUIAQQQQQQQQQQQQQQQQQQQTUYQQQQQQQQQQQQQQQQQQQQQRTffffffffffffdzfPPPPv/e4QQAAAAAAAAADMAAAAAAAAABCIAAAAAAAAAADHPPPPPPPPPPPPPu87zHPPPPPPPPfffffPPPPPPPPPPPPPPPPPPPPPPPffff8A333333mIEEEEEEEEEEEEEEEEEEEEEEEAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEUjAEEEEEEEEEEEEEEEEEEEEEmEEEEEEEEEEEEEEEEEEEEEEE13333333333333d3zzzz/33uEEAAAAAAAAAAiAAAAAAAAAAzAAAAAAAAAAAxzzzzzzzzzzzzzPc9zzzzzzz3333zzzzzzz777777777777777zzzzzzzz33/3333333gMEEEEEEEEEEEEEEEAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEUjAEEEEEEEEEEEEEEEEEEEEERCEEEEEEEEEEEEEEEEEEEEEEU33333333333333d3zzz7/wB97hBAAAAAAAAAEYgAAAAAAAAEYgAAAAAAAAAEM8888888888851tc88888999988888++++888/8A+888888889//AP3zzz777zz/AN9999999yBBBBBBBBBBAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBFIwBBBBBBBBBBBBBBBBBBBBBAMQBBBBBBBBBBBBBBBBBBBBBBNd99999999999993d888/9997hBAAAAAAAAAEQAAAAAAAAAMQAAAAAAAAAEM88888888888x9M888889998888+++8/wC8884AAAAAAAAAAAAAAAAAAAAEM88//PfffffffYgQQQQQAAAAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQRSMAQQQQQQQQQQQQQQQQQQQQQACMQQQQQQQQQQQQQQQQQQQQQRTffffffffffffffd3fPPv8A333uEEAAAAAAAAARAAAAAAAAAAjAAAAAAAAAAxzzzzzzzzzzzG1zzzzz333zzzz777vPMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD333333gMEEAAAEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMcjAEEEEEEEEEEEEEEEEEEEEEAAViEEEEEEEEEEEEEEEEEEEEEEV333333333333333N3zz/wB9997hBAAAAAAAAAMQAAAAAAAAAIgAAAAAAAAEM8888888888xtc88889988888+/zzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999yAABBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBDDDDDFKyBBBBBBBBBBBBBBBBBBBBBAABEQhBBBBBBBBBBBBBBBBBBBBBN9999999999999997t88/99997jBAAAAAAAAAIgAAAAAAAAEYgAAAAAAAAEc8888888885tc8889988888+/zzAAAAAAAAAAAAAAAACCCCCCCCCCCCCCCCCCAAAAAAAAA999/jBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBDDDDDDBBBBBBFKyBBBBBBBBBBBBBBBBBBBBBAABBMQBBBBBBBBBBBBBBBBBBBBBFN9999999999999997t8+/8Affff8wQAAAAAAABGIAAAAAAAABEIAAAAAAAADPPPPPPPPPOdTPPPPffPPPPPu8wAAAAAAAAAAAAAAgggAAAADjzzzzzzzzzzzywAAAAwwwQQQP8A/kEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEMMMMMMMEEEEEEEEEEEEUrIEEEEEEEEEEEEEEEEEEEEEEAEEEzEEEEEEEEEEEEEEEEEEEEEEV333333/wB999999997v8+/99999zBBAAAAAAAIxAAAAAAAAAEYgAAAAAAAAM888888888xt8889988888+7jAAAAAAAAAAAACCCAEOKCywgAAAAAAAAAAAAAAAAAAwzDHPAACC95BBBBBBBBBBBBBBBBBBBBBBBBBBDDDDBBBBBBBBBBBBBBBBBBBFKyBBBBBBBBBBBBBBBBBBBBBBAABBDKhBBBBBBBBBBBBBBBBBBBBBFd99999//wDfffffffe5/f8A/wB9999zBBAAAAAAEYhBAAAAAAAAEYgAAAAAAAEM8888888881c88998888887hAAAAAAAAAAACCAGKSygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwjPxBBBBBBBBBBBBBBBBBBBBBDDDBBBBBBBBBBBBBBBBBBBBBBBFKyBBBBBBBBBBBBBBBBBBBBBBAABDDHKjBBBBBBBBBBBBBBBBBBBBBN999999/8A/wD33333333d3/8A999997hBAAAAAAEYhBAAAAAAAAAYgAAAAAAAAc888888885lc8998888885xAAAAAAAAAACCAOKygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBDDDBBBBBBBBBBBBBBBBBBBBBBBBBFKyBBBBBBBBBBBBBBBBBBBBBBBADDDBFahBBBBBBBBBBBBBBBBBBBBBN999999//wD/AH3333333N3/AP8Afffff4wQQAAAABGIQQAAAAAAAACIAAAAAAAADPPPPPPPPObfPPffPPPPPcQAAAAAAAAAAghisoAAAAAAAAAAAAAAAggggggggggggggggggAAAAAAAAAAAQQQQQQQQQQQQQwwwQQQQQQQQQQQQQQQQQQQQQQQQQQTEgwQQQQQQQQQQQQQQQQQQQQQQAgwQQRWoQQQQQQQQQQQQQQQQwwQQQTfffffff/AP8A999999997t9/999999zBBAAAAAEYhBBAAAAAAAAEQAAAAAAAAM888888885t8998888885hAAAAAAAAACCGCwAAAAAAAAAAAACCCAAAAAAAAAAAAAAAAAAAAAAACCCAAAAAABBBBBBBBBBDDBBBBBBBBBBBBBBBBBBBBBBBBBBBBNSjBBBBBBBBBBBBBBBBBBBBBBDCBBBBBFahBBBBBBBBBBBBBBDDDBBBBN9999999/wD/AH33333332f3/wB999997hBAAAAAAYhBBAAAAAAAAEYAAAAAAAAM888888885t8998888885gAAAAAAAAACHbgAAAAAAAAAACCCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCAAABBBBBBBDDBBBBBBBBBBBBBBBBBBBBBBBBBBBBFKiBBBBBBBBBBBBBBBBBBBBDDDAABBBBBFahBBBBBBBBBBBBBBDBDDBBBN9999999//AP8A33333333d3//AN9999/jBBAAAAAEhBBAAAAAAAAAIgAAAAAAAEc88888885l998888888xAAAAAAAAACHLwAAAAAAAAAACCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCBBBBBDDBBBBBBBBBBBBBBBBBBBBBBBBBBBBMSDBBBBBBBBBBBBBBBBBBDDDBBABBBBBBFahBBBBBBBBBBBBBDDBBDBBBN9999999/wD/AP33333333u33/333333sEEAAAAABkEEEAAAAAAAARAAAAAAAABzzzzzzzzzV3zzzzzzzzEAAAAAAAAAM9MAAAAAAAAAAIAAAAAAAAAAAAAA44ILDDDAAAAAAAAAADDDDAIY4oAAAAAEEEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEUqIEEEEEEEEEEEEEEEEMMMEEEEAAEEEEEEVqEEEEEEEEEEEEEMMEEEMEEEV3333333/3/AN99999999nd/wD/AH33332MEEAAAAAaEEEEAAAAAAAAyAAAAAAAATzzzzzzzzR3zzzzzzzzkAAAAAAAAEMvAAAAAAAAAAIIAAAAAAAAAA44LDAAAAAIIIIIIIIIIIAAAAAAAAAAABDCI4oEMEEEEEEEEEEEEEEEEEEEEEEEEEEEEVKMEEEEEEEEEEEEEMMMEEEEEEEAEEEEEEEFqEEEEEEEEEEEEMMEEEEEMEEV3333333/AN9/99999999zd9/9999997BBAAAAACbBBBAAAAAAAAAYAAAAAAAAc88888884s888888885gAAAAAABBCLgAAAAAAAACCAAAAAAAAGOCwgAACCCCAAAAAAAAAAAAAAAAACCCCAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBFSDBBBBBBBBBBDDDBBBBBBBBBAABBBBBBBBKjBBBBBBBBBBBDDBBBBBDBBBN999999//APf/AH3333333u33/wB99999/jBBAAAAAHTBBBAAAAAAAAEgAAAAAAAE888888880c88888889hAAAAAABACLgAAAAAAAACAAAAAAAGOSwAAACCAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCAAAAAABBBBBBBBBBBBBBBBBBBBBBBBBBFSBBBBBBBBDDDBBBBBBBBBBBBAABBBBBBBBOjBBBBBBBBBBDDBBBBBBBDBBN999999/wD/AH3/AN99999993d9/wDfffffewQQQAAAAi4QQQAAAAAAAAGAAAAAAAAHPPPPPPPOLPPPPPPPPMQAAAAAAQAi4AAAAAAAAAgAAAAABisAAAAggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAggAAAQQQQQQQQQQQQQQQQQQQQQQQRUgwQQQQwwwQQQQQQQQQQQQQQQAQQQQQQQQREgQQQQQQQQQQwwQQQQQQQwQRXffffff/fff/fffffffe7ff/ffffffYwQQAAAAA0wQQQAAAAAAABEAAAAAAABHPPPPPPPNHPPPPPPPOYAAAAAAQAD8wAAAAAAAAgAAAABisAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAggAQQQQQQQQQQQQQQQQQQQQQQWowQQwwwQQQQQQQQQQQQQQQQQAQQQQQQQQRWgQQQQQQQQQwwQQQQQQQQQwQTffffff8A3333/wB99999993d9/8Afffffe4QQQAAAAB4QQQQAAAAAAABIAAAAAAADPPPPPPPOLPPPPPPPPMQAAAAAQABUwAAAAAAAAgAAAAisAAAAAggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQQQQQQQQQQQQQQQQQQQRYgQwwQQQQQQQQQQQQQQQQQQQAQQQQQQQQQSowQQQQQQQQwQQQQQQQQQQwQRXfffff/fffff8A3333333d333/AN999997BBAAAAADLhBBAAAAAAAAAEgAAAAAAAc88888884c88888885gAAAABAAAZAAAAAAAACAAAAGSgAAACCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBaDDBBBBBBBBBBBBBBBBBBBBABBBBBBBBBBFSBBBBBBBDDBBBBBBBBBBBDBBN9999/wDffffff/fffffezffff/fffffcwQQAAAAA2wQQQAAAAAAAAGAAAAAAAAHPPPPPPPNPPPPPPPPMQAAAAQAADYAAAAAAAAggAADsAAAAAggAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQQQQQQQQQQQQQQQQRYgQQQQQQQQQQQQQQQQQQQQQAQQQQQQQQQQSoQQQQQQQwQQQQQQQQQQQQQwRXffff/wD333333/33333u/wB9999999997BBBAAAAADbBBBAAAAAAAAEQAAAAAAAAc8888888k88888888gAAAABAAAZAAAAAAAACAAAOwAAAACCAAAAAAAAAAAAAAAAAAAAAAAAAAEMMMMMMMMMIAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBFhBBBBBBBBBBBBBBBBBBBBABBBBBBBBBBBFSBBBBBDDBBBBBBBBBBBBBBDBF9999/8Affffffffffffd3ffffffffff4wQQQAAAAh4QQQAAAAAAAABIAAAAAAABPPPPPPPPJPPPPPPPPYAAAAQAABYAAAAAAAAgAADsAAAAAggAAAAAAAAAAAAAAAAAAAADDDPPPPPPPPPPPPPPPPPPLDDAAAAAAAAAAAQQQQQQQQQQQQQQQSAQQQQQQQQQQQQQQQQQQQQAAQQQQQQQQQQRIwQQQQwQQQQQQQQQQQQQQQwQTffff/fffffffffffffZ/fffffffffewQQQQAAAAmwQQQAAAAAAAAGAAAAAAAAHPPPPPPPOHPPPPPPPOQAAAAQAAB4AAAAAAAAgABkAAAAAAgAAAAAAAAAAAAAAAAABDHPPPPPPPPPPPPPPPPPPPPPPPPPPPPLDAAAAAAAQQQQQQQQQQQQQQWAQQQQQQQQQQQQQQQQQQQQAQQQQQQQQQQQWgQQQQwQQQQQQQQQQQQQQQQwQXffff/ffffffffffffe3ffffffffffYwQQQQAAABkwQQQAAAAAAAAGAAAAAAAAHPPPPPPPNHPPPPPPPMQAAAQAAAGQAAAAAAAAgAGgAAAAAAAAAAAAAAAAAAAAAABDPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLDAAAAQQQQQQQQQQQQQQAQQQQQQQQQQQQQQQQQQQAQQQQQQQQQQQQWgQQwwQQQQQQQQQQQQQQQQQwQXfff8A333333333/3333t333333/3332MEEEEAAAAaEEEEEAAAAAAABgAAAAAAARzzzzzzzyTzzzzzzz2AAAAEAAAWAAAAAAAAAIAaAAAAAAIAAAAAAAAAAAAAAAQzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwwAEEEEEEEEEEEEEWEEEEEEEEEEEEEEEEEEEAEEEEEEEEEEEEFoEMMEEEEEEEEEEEEEEEEEEMEX333/333333333/wB9997d99999/8AfffYwQQQQAAABoQQQQQAAAAAAAGAAAAAAABPPPPPPPPJPPPPPPPOQAAAAQAAGQAAAAAAAAgAGgAAAAAAgAAAAAAAAAAAAADPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAQQQQQQQQQQQQYAQQQQQQQQQQQQQQQQQQAQQQQQQQQQQQQWgwwQQQQQQQQQQQQQQQQQQQQRffff/fffffffff8A3333t333333/AN999jBBBBBAAAEhBBBBAAAAAAAAEAAAAAAAAc8888888888888885AAAABAAARAAAAAAAACAGQAAAAACAAAAAAAAAAAAAAM888888888888888888888888888888888888888888888888BBBBBBBBBBBBQBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBaDBBBBBBBBBBBBBBBBBBBBBDF999/8Afffffffff/fffe3ffffffffffawQQQQQAAAIQQQQQAAAAAAAAIAAAAAAAHPPPPPPPJPPPPPPPOQAAAAQABIAAAAAAAAAgBoAAAAAgAAAAAAAAAAAAADPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAQQQQQQQQQQQYQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQWAQQQQQQQQQQQQQQQQQQQQQQwffffffffffffffffffe3fffffff/ffewQQQQQAAAGwQQQQQAAAAAAAGAAAAAAABPPPPPPPLPPPPPPPOQAAAAQABIAAAAAAAAgABoAAAAAgAAAAAAAAAAAABPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAQQQQQQQQQQVAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQRAQQQQQQQQQQQQQQQQQQQQQQwXffffffffffffff/fffXfffffff/fffwQQQQQQAABwQQQQQAAAAAAABAAAAAAAAPPPPPPPOHPPPPPPPIAAAAQAACQAAAAAAAgABoAAAAAgAAAAAAAAAAAAHPPPPPPPPPPPPPPPPPPPPONbTTTTTTTTTXedPPPPPPPPPPPPPPPPPPAQQQQQQQQQQQAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQYQQQQQQQQQQQQQQQQQQQQQQQXffffffffffffff/AH332f33333333332MEEEEEAAAKEEEEEEAAAAAAACgAAAAAABTzzzzzzyTzzzzzzykAAAEAABEAAAAAAAIAAaAAAAAIAAAAAAAAAAAARzzzzzzzzzzzzzzzzzzzC13zzzzzzzzzzzzzzy3nTzzzzzzzzzzzzzzwEEEEEEEEEEEAEEEEEEEEEEEEEEEAEEEEEEEEEEEEEFAEEEEEEEEEEEEEEEEEEEEEEMX33/wB9999999999/8Affe/fffffff/AH33sEEEEEEAABMEEEEEAAAAAAABQAAAAAAADzzzzzzzjzzzzzzz0AAAAAAASAAAAAAAAAAaAAAAAIAAAAAAAAAAAATzzzzzzzzzzzzzzzzzzV3zzzzzzzzzzzzzzzzzzzzxnzzzzzzzzzzzzzwEEEEEEEEEEEAEEEEEEEEEEEEEEAEEEEEEEEEEEEEEGkEEEEEEEEEEEEEEEEEEEEEEH33/AN9999999999/wDfffVfffffffffffYQQQQQQAAA4QQQQQQAAAAAAACAAAAAAAFPPPPPPPNPPPPPPPKQAAAQAAGQAAAAAAAgACAAAAAgAAAAAAAAAAABPPPPPPPPPPPPPPPPPNHfPPPPPPPPPPPPPPPPPPPPPPPLdPPPPPPPPPPPPAQQQQQQQQQQQAQQQQQQQQQQQQQQQQQQQQQQQQQQQQRQQQQQQQQQQQQQQQQQQQQQQQ3fffffffffffffff8A332v3333333/AN997BBBBBBAAAXBBBBBAAAAAAAAEAAAAAAAA8888888488888889AAABAAAAgAAAAAAAAAaAAAAACAAAAAAAAAAAE88888888888888888l8888888888888888888888888888888888888888BBBBBBBBBBBABBBBBBBBBBBBBABBBBBBBBBBBBBBBUBBBBBBBBBBBBBBBBBBBBBBH99/999999999999999939999999/wDffawQQQQQQAA6wQQQQQAAAAAAACAAAAAAABPPPPPPPLPPPPPPPKQAAAQAAEQAAAAAAAgBoAAAAAgAAAAAAAAAABPPPPPPPPPPPPPPPPPPfPPPPPPPPPPPPPPPPPPPPPPPPPPPPLdPPPPPPPPPPAQQQQQQQQQQQAQQQQQQQQQQQQQAQQQQQQQQQQQQQQVAQQQQQQQQQQQQQQQQQQQQQXfff/fffffffffff/fffXfffffffffffQQQQQQQAAAYQQQQQQAAAAAABAAAAAAAAFPPPPPPPFPPPPPPPIAAAQAAAKQAAAAAAAACgAAAAAgAAAAAAAAAAHPPPPPPPPPPPPPPPPJfPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPOfPPPPPPPPPAQQQQQQQQQQQAQQQQQQQQQQQQQQQQQQQQQQQQQQQQVAQQQQQQQQQQQQQQQQQQQQQffffffffffffffff/ffa/fffffff/fffwQQQQQQAAlwQQQQQAAAAAAAEAAAAAAAAPPPPPPPPPPPPPPPPQAAAQAABAAAAAAAAABgAAAAAAAAAAAAAAAABPPPPPPPPPPPPPPPPLPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAQQQQQQQQQQRAQQQQQQQQQQQQAQQQQQQQQQQQQQQQVAQQQQ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9J9Goot0ccPua49Rx5xOW9Fx9CoouBHHD7lOPWee6ZNd6L59RRRcKOOGM49h57qE1noOPnFFFxY5B4Djj2XnuqTVeg+YUUUXIjknYccce4891TVcee+XXLjlXHHHHHHHHHHHHHHHHHHwDz3WJqOPOcfLKLmR5K891zTee+WUXODyN5zjrk1Cc1x8qoufHkLznHXJqPNfKqLoh4+852XTeY4+TUUXSjxxx5zsk1HlvklFF1I8aee7RNMnKcfIKKLrR4w85x2yaZOS+Jcf+qKKLsh4q4856BOO4+EcccfejxN5zjuk7T4Fxxx+BAeIuPOcd4mmTiuPaccccccfg4HiDznHgE0ycR67jj8QA8Pec48Amm8Nx6jjj8TA8Ocea48ImmTguPTccfiwHhjjznhk0zgvScfjQHhbznHiOmTfceg44/4lcea48V03fee44/HgPCHHnPGdQm685xx+QgeDvOceOTTdxx5rj/ilx5rjyHTdtx5jjj8lA8Ecea48l1CbLjzHH5QB4E481x5bpuw48xx+VAeAOPNceYTlOPMcf8VOPNcea6hNVx5jj8tA71x5rjznUdRx5jj0XHHHHHHHHHRfSAd2481x5zjqum815rjjj8BA7hx5zjznHWdN5bjynHHH74485x5zjrumTlOPIccfhQ7Rx57jz3YdNx47jjxnHH4eOwccec49Bx2HHTeM48Zxx+JjrXHnuPQcdp03ivGcfjA6lx6Dj0HHbdN4jxXH44Olceg49J3HTeG8Rx+QDoXHouPSd10ycJ4bj8kHOOOPScek47rpvBeG4/JxzDjj03HpOO86bjvvCcflY5Nxx6rj03HedR3nhOPYccccccccccccccccccf/AEoudHHOOOPXem48B03cceE485xxxxx4ii5kcS4449lx6TjwXScdx4Ljy3HHHoKLlhwjjj3HHpOPCdN23guPIcce0ouTG8444996Tjw3Tdp4LjxXHHHwai48a7jjjj4N6LjxHTdl4Ljw3HHxii4waDjjjj4dx6DjxXScdh4LjwXHHyii4kY7jjjjj416DjxXHScddx4DjwHHHzi4lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx8q489x4zjpus48Bx33HH0Si83cec48dx0nHVceA47zjj/AIcec48l0nHUceA47rjj60+YOPNceS46TqOPAcd1x9ifLnnPKcdJx03gOO4489xxxxxxxxx1XHHHHHHHgnyt5zy3TdNx33HbcceU4444+KPlDjzXluOm6bwHbceO4444+RPkrjzXluOo6TjvuO048Rxxx8wfInHmvMdV0nHecdpx4Tjj54+PuPNeY46rpO+7LjwXHH0Z8ccea811nSd5x2XgOPqD4y4815rjrOk7zsu+4+sPizjzXmuOu6TuuOu47rjj7A+KPNec7DpO4467juuPtD4i815zjsOk7jjru449Jxxxxxxxxxxxxxxxxxxxxxxxxxxx5Z8Oea481x2XSdtx13HacceU444448Zxxxx4R8LceY4852XHSdt13HaceO4449Z3ifCXHmOPOcdlx0XHbdd2nHiOOPmifB3HmOPOcdp03acdZ2XHhOOOPnifBXHmOPPdt0nHadZx2HHgOOOPoj4G48xx57jtum7LjrOw477jj6UnwJx5r0HcdJx2XHVcddx3XHH1JPgDjzXHnuO46Tjsuq467juOOPrCe+cec9B3XSdp1XHWcdxx9ce9cee89x3XSdlx1XXdtx6Ljjjjjjjjjjjjjjjjjjjjjjjjjjxie7cee4893nSdlx1HHWcdpx5LjjjjjxXHHHHcJ7lx6Dz3HedJx2HHUcdVx2XHjOOOPVcccfhjj0Xnu+6TjsOq6zsuPDcccfAugT2zj0XHnOO+6TjsOq6rjsOPBccfLE9o49Jx5zjvum7DqOOq7DjvuOP0xx6bz3gOOk7DqOq467jvOOPnCexceo85x4LpOu46jquu47rj6Anr3HqOPOeE6TruOo6rru44+jPWuPVcec8J0nXdV1HHWdtxx9IT1jj1nnvCdJ1nHVdR1nHaceg44444444444444444444444447xPVOPXec48J0nWdZ1HWdpx5LjjjjjwnHHHHVJ6hx7Dznhum6jjrOo6rjsvGcccek444+0cey854bpuo67qOq7Lw3HHvuOP/ALJ6Vx7LjznhuOk6jruo6rsPBccfEOOP/Cejce04854jpOo67qOo467jvuPkCehce2894jpk03YdN1HXcd5x+Zvcec48R03Tdgmm6jru64/NHuvOceI6bpuw6bqOs47bj81ce6854zpuk7Dpuo6ztuPzVx7zznjE0yaTsuk6jrO04/NXHvvOeM6bpOy6bpuq47Lj82fAPOeO6bouyTTdN1XZcfmzj4B5zjxiabou06Tpuq7Dj83fAvPeM6bpE2SaRNN1XYfm7j4F57xyabok5jpuo67j2XHHHHHHZccccccfMvgnnvHdN0nZJpE03Udd6jjjjjzXHHHx7j4J57x3HTJok2iaRNJ1HWceg4449pxx8Q+Dee8h1DRJsk0iaTqOs85xx8K44+BfBvPeQTUJpGyTSJpE03WeW44/CnHwb0Hjuo6RNkmkTSdNx1XkuPw18K88nIJqE0ibJNImkTTdV47j8PfCvPeQ6jpOyTSJpOm6rxXH4i+Feg8g1CaRNkmkTSJpk1CcNx+JvhXoPIJqOm7JNEmk6bqOPBcfij4V6DyXUJpOyTSJpE0nVeA4/Fnwr0HkE1XSJsk4ZNMmo77j8XfCvQJySahNJ2iaJNImkTUd9+ME8K+ZdUmkTlk0XTNN3nH689AnIdYmkTlk0SaRNN3n40Twr5h5JsnDJpOmTccfjT4V6JOO67zCaJwyabuOPxsnhSdEnHJrukbRNEmiTSJpk2346+EJ0Scd1yaZNkmkTRJxCbb8dJ4UnRJxia5NQmyTSJok4hNp8C444444444444444444444444444+CJ8cdcnNOGTRNM2XtuOOOPDccce0TwhOiTjE1yahNkmkTSJok0ibL2HHHnuOPVPCE6JOMTXJqE2SaRNEmkTSJsPWcey4+zOkTjGsahNonDJpE0ibD03HwDj68nlzXJqE2iaJNJ0Sabrk6Ljj4Zx9WTok4xNcmo7Rok0SaRNInh3HxrxTwZOiTjE5RtmiTRJwzYJz3yTjwT2hOMTlE2zRJok0SaRPCvmHePaE4xOUTbNE0SaJNJ1ycxx9ue0Jxia5pk2zRJonCJsE5bj9sJxjXNMm2aJ0ya5OW+7PZnGNc0zcNA6Zrk5T7w9mcYmuc84JoHJJyX5+dEnGNc1DbNE0Dsk5Dj748CdE4xyzmGgehfoB0TjGwaZuHRPHk+AngDonGNg55omgaBoneJznHHHHHHHHHHHHHHHHHHHwJ4A6B3jUNw0DQOCd0nLccdlx7p+755c5ZuHBNA0Duk5LjwXtH715xjYNQ5hoGgaJrHGJx3HjOPXP3eOgeSNw8Cax4x5j1T96045sHgDQNA4xxTjPPeofu6dA4xsGobh4E1TinFemDpH7unPOObBqG4aBoGgeKOI9YHRP3cPLHMNw0TQOAapxDiE9Qfu4c845sGobhoGgaBxTxBO0M8/dw5x680TQNA0DsnnxnH7uHOOObBqG4eBNQ4h6EZp+7h5U/bBqHMNA/KBoHYOGesP3cOaeAOeaJoGgftA1Dwx4EZh+7h5Q/Mw/M0/aBwDrnCPBDMP3cOYcg2D8qG2dE/MQ8MeuP3cOYcg2DUNs0T8oH5QNA/Nc4R4QfMs7hzD9yD9sGofuYaBoH7QNM8MeEHzpzmH7kH7YP2ofto0jQP2gaB+0zhnpx8zDtnMP3IP2wftQ2jSP2gfuAfusfvTj5U/9k=";
const WP_DARK = "data:image/jpeg;base64,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ABFEAAAAAAAAAAAAAABuGPoAACwCiAUAAAABZQAAAAAAAAAAAAAAAAolAAAAAAAAAAAAAAEAAAAASiLKAAAAAAAAAABAAEogAAAAAAEsAoAICgAIsQAFSkgAAAAAAAAAQACBQQAAAABKqACAIsQAAKiiAAAAAAACgAgEAAAASiLKAAAAAAAiwAAAAAiwAAAAAAAAAAASiKqAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIoiwAAAAAAAAAAAASiABAoAAAAABKiAACgAAAAEogAAAAAAAAAAAAANwx9AAAWAUQACgAAALKAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAIAAAAABFlAAAAAAgAAAAAAEWAAAAAAAEWUAAAAACQAKBFiAAAAAAAAAAgEWAAAAAAAEFAAJUQIAAFJYAAAAAAAgKFBAIAAAAAlEWUAAAAABFgAAAABFEAAAAAAAAAAAAACRRFlAoAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAABFEAAAAACAAoAAAEUQAIFAAAAABEWAAUAAAAAlEAAAAAAAAAAAABuGO4KAFgFEAAoAAACygAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAACAAAAAAJYBQAAAAIAAAAAAABFgAAAAAAlEWUAAAABFiAAqUkAAAAAAAAACAJRAAAAAAARZQAAECBAAUlgAAAAAAACAoUACBAAAAAEUQUAAAAAlEAAAAAlEWAUEAAAAAAAAAAAAgEURZQKAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAARRAAAAAAgAKAAAlEACABQAAAACVEAFAAAAAJRAAAAAAAAAAAAbhjuAChYBRAAAKAAAsqAoAAAAAAAAAAAACygAAAAAAAAAAAAAAAAAIAAAAAAlgFAAAAAAgAAAAAAACURYAAAAABSUQAAACUkAABFgAAAAAAAAACAJRFgAAAAAlgFgKBFiAAAARRAAAAAAAgAWgAAgAAQAAAlgFAAAAAJRFgAAAAAlEFAAAAABAAAAAAAAIABFVAoAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAABFEAAAAAACAAAoCUQAAIFAAAAAJURYABQAAACUQAAAAAAAAAAG4Y7gABQFSwAAAACgLKgAKAAAAAAAAAAAAsoAAAAAAAAAAAAAAAAACAAAAAAJYBQAAAAAIAAAAAAAAABFgAAAAAFARYgKABAgAAEUQAAAAAICgAgAAEUQAAAAEWIAFqUQIAAAABFgAAAACAABaACAAAAAAJURZQAAAAAAEAAAAAAlEFAAAAAAAAAABAAAAIBFlAoAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAABFEWAAAAAAIAACgARRAAgUAAAAAERYABQAAACUQAAAAAAAAAG4Y7gAABQFSwAAAACrKgAAKAAACAoAAAAACygAAAAAAAAAAAAAAAAAIAAAAAAlgFAAAAAAgAAAAAAAAACUQAAAAAUAliAAoECAAAAJRAAAAAgAAKCAAAARYAAAJRAgAUlEAAAAAAlEWAAAAIAAAFAAAAAAAAJUQUAAAABFgAAAAAAlEURZQAAAAAAAAAAAAAQCAJRFEWUCgAAAAAgAAAAAAAAAAAAAAAAAAAAAAACURRAAAAAAgUEAoAEUQIFAAAAABEAAFAAAAJRAAAAAAAAAbhjuAAAFALLAAAAACygAAAKAACAAoAAAACygAAAAAAAAAAAAAAAAAIAAAAAAllAAAAAAgAAAAAAAAAAAEAAAAAFAJYgAKBAgAAAACWAAAAIAACggAAAACUQAACWAIAAlVAAAAAAARRAAAAgAAAAUAAAAAAAlEAAAAAlEAAAAAAAAABFEUQUAAAAAAAAAAACABAAAEURZQKAAACAAAAAAAAAAAAAAAAAAAAAAAAARRAAAAAgUEAoACURYgUAAAAAlRAABQAAACUQQFAAAAAAbkuO4AAAUAsRQAAAABVSwAAACgAgAAAKAAAsFCAAoAAAAAAAAAAAAAIAAAAAAIBQAAAAAIAAAAAAAAAAABAAAAABQCWIACgQIAAAAAlgAAACAAAAAAAAAAQUEAJRAgAAUlgAAAAAAAlEWAAAIAAAAAFAAAAAAJRAAAAAJRAAAAAAAAAAAAJRFEFAAAAAAAAAAgAAAAQAAlEVUCgAgAAAAAAAAAAAAAAAAAAAAAAAAAEUQAAIFABAKAABAgUAAAAEJSwIFAAAAAJRBAUAAAABtGW9EAABQAFSwAAAAFAVLAAAAKCAAAAAoAAFSgIACgAAAAAAAAAAAgAAAAAAgFAAAAAAgAAAAAAAAAAAAEAAAAFAAJYgAKBAgAAAACWAAAAIAAAAAAAAABBQQABAgAAUBAAAAAAAAgLAAAAgAAAAAAUAAAAAlEWAAAAAEUQAAAAAAAAAAAACURSQWgAAAAAAAgAAAAAAQAAlEVUAAAAAAAAAAAAAAAAAAAAAAAAAAAlEAACABQSgAAARYgUAAAAEqUQIFAAAAABEWAUAAABtGW6wVLAAUAABURQAABQAFRFAACggUAEAAAoAAFQVKgAAAAAAAAAAAAAAAAABAFAAAAAAAgAAAAAAAAAAAAEAAAAFAAQIACiIAAAAAAlgAAACAAAAAAAAAAQUEAAQIAAFAQAAAAAAAIAligAAgAAAAAAAUAAAAABFgAAAAAlEWAAAAAAAAAAAAAAIlEUQWgAAAAAAgAAAAAAQAAAlEWUAAAAAAAAAAAAAAAAAAAAAAAAABFgAACAAoAAAECBQAAAQCpRAgUAAAAEJSwIFAAAbRluAABQAAAAAVLAAUAAAsRUoAAFAABAAAKAAAAFlQVEUAAAAAAAAAAAAAEFAAAAAAAgAAAAAAAAAAAAACFBAAAUAAggAAKggAAAAACWAAAAIAAAAAAAAABBQQABAgAAUBAAAAAAAAgCWKAACAAAAAAABQAAAAAAEWAAAAAAEWAAAAAAAAAAAAAAAIBFlAoAAAAAAAIAAAEAAAAARRBQAAAAAAAAAAAAAAAAAAAAAAACUQAAAAAAAAEWAAWAABAKBFgCBQAAAQCxYgUAABtGW4AACwUICgAAALEUAUAAABUsAABQAAAQAACgAAAAgUAsFRFSgAAAAAAABAFAAAAAAAgAAAAAAAAAAABBYAUEAABQAECAACAAAAAAACAAACAAAAAAAAAACAUEACAIAAFAQAAAAAAAIAligAAgAAAAAAAUAAAAAAAlgAAAAAAlEAAAAAAAAAAAAAAAAliBaAAAAAAAAACABAAAAAAEFoAIAAAAAAAAAAAAAAAAAAAAAAAlgAAAAAAAAlgAAFgAQCgJYAAgUAAEAqWAIFAAbRlsCgAALBQgKAAABUsABQAAAFEAAABQAAQAAACgAAAABYAAAAAAAAAAAAAAAACAAAAAAAAAAAEFgABQQAAAFAAJYgAAKggAAAAACWAAAAIAAAAAAAAAAgBQQAlgCAABQEAAAAAAACAJYoAAIAAAAAAAFAAAAAAAJYAAAAAAAQAAAAAAAAAAAAAAACWAUAAAAAAAAAAAEgAAAAAEFoAAAIAAAAAAAAAAAAAAAAAAAAAlgAAAAAAAAlgAAAFgQCgJYAABYAAEAqWAAIFAbRlsACgAAAVKAAAAALEUAUAABUsAAAABQAAQAAAAACgAAAAgAUAAAAAAAAAACAAAAAAAAAAAEAAAAAAAAAAUIVAAAACQAAAAAAEAAACAAAAAAAAAAIAIFoQIAgAAAUBAAAAAAAAgCWKAACAAAAAAABQAAAAAACWAAAAAAAEAAAAAAAAAAAAAAAAlgFAAAAAAAAAAABAIAAAABBaAAAAACAAAAAAAAAAAAAAAAAAAJYAAAAAAAAJYAAAAgAKAlgAACBQAQCpYAAgUBssZb0IAAAACgVBQgKAAABURQBQACxFSgAAAAUEAAAAAAAAAAAAAAAAAAABQAAAAAAAIAAAAAAgAAAAAAAAABSAAAAACIAAAAAAAgAAACAAAAAAAAAAQWAoAkAgAAAUAgAAAAAAAAgCCgAAgAAAAAAAUAAAAAAAlgAAAAAABAAAAAAAAAAAAAAAAJYBQAAAAAAAAAAAQACAAAAQWgAAAAAAgAAAAAAAAKCAAAAAAAAJYAAAAAAAAJYAAAAAgKAlgAACBQAQCpYAABYBsGWywtACAAAAoCwUIACgAALBUsBQAACxFSgAAAAAAAAAAAAAAAAAAAAAAUAAAAAAACAAAAAACAAAAAAAAAUAgAAAAAkAAAAAIVAAAAAACAoAIAAAAARQAAAQggAAAUIWAAAAAAAACACKAACAAAAAAAABQAAAAAACWAAAAAAAEAAAAAAAAAAAAAAAAlgFAAAAAAAAAAABAAIAAABBaAAAAAACAAAAAAAAAoIAAAAAAAAlgAAAAAAAAlgAAAACAoCWAAAAWABAKlgAACBWwZbAAtSoAAAACgAVKAgKAAAAsRUtAAAAALEVKAAAABQQAAAAAAAAAAFAAAAAAAAAgAAAAhUFgAAAAAAAAABQAgAAAACIAAACAAAAAAAAAAACAAAAEUAAAEAAQIAAFIAAAAAAAAAICoUEAAgAAAAAAAAAUAAAAAAAlgAAAAAABAAAAAAAAAAAAAAAAJYBQAAAAAAAAAAAQACAAAAQWgAAAAAAgAAAAAAAAKCAAAAAAAAJYAAAAAAAAJYAAAAAgKAlgAAACBQQCpYAAAgVsGWwAAAAFSgAAACwtCAAAoAACwUAAAAAAARUFAAAFAAAAAAAAAAAAAAAAAAgAAAhUAAAAAAAAAAAAAUIWAAAAAIgAAACWAAAAAAAAICgAgAAACAFBAAAACWAIFAogCAAAAAAACFgAAAAgAAAAAAAAUAAAAAAAAQAAAAAAACAAAAAAAAAAAAAAAACWAUAAAAAAAAAAEAAAgAAAEFoAAAAAAIAAAAAAAACggAAAAAAACWAAAAAAAACWAAAAAAACWAAAAIFBAKlgAACBWwZbAAAAAALBUoAAAsFSgAAAKAAsFSoACgAAAAAAVEVBUVUFAAAAAAAAAAACAAAACFQAAAAAAAAAAAAAEVYAAAAAACCAAACFgAAAAAAAgAKACAAAAAQAAAAABACBaAIAgAAAAAAhYAAAAAIAAAAAAFAAAAAAAAACFgAAAAAAACAAAAAAAAAAAAAAAAACFAAAAAAAAAABAAAAIAAABBaAAAAAACAAAAAABAUCggAAAAAAACWAAAAAAAACWAAAAAAACWAAAAIFBAKlgAACBWxLlsAAAAAAAABUFAAAsFSgAAAAKAsFCAAAoAAAAAAAACwVBUqAAAAAAAAAEFQAAAAAAAAAAAAAEFhQAAAAAAAIgAAACAAAAAAAAICgAAgAAAAgAAAAAAgAgAWiAIAAAAAIAAAAAAAAgAAAAUAAAAAAAAAAQAAAAAAACFgAAAAAAAAAAAAAAAAEAUAAAAAAAAAEAAAAAAgAACFAoAAAAAAIAAAAAEABaACAAAAAAAAQAAAAAAAACWAAAAAAACWAAAAIFBKAlgAACBWsZ7LEVKAAAAAAAAAVBQAALBUFAAAACgVBUqAAAAoAAAAAAAAAAFQVCVBUFgAAAAAAAAAAAAAEFQWAFBAAAUAAACEAAAAhYAAAAAAAAAAAAIAAAIWAAAAAAAQAgUCiAIAAAAAAlgAAAAAACAABaACAAAAAAAAABCFAAAAAAAEAAAAAAAAAAAAAAABBYUAAAAAAAAAAEAAAAAAAAgACFAoAAAAAAAIAAAAEABaAACAAAAAAAJYAAAAAAAAAIAAAAAAAEAAAACAAoEAAACBWsZbABQRUFAAAAAAAABUFAAAAsFQUAAAACwVBQAAAAAAAAAAAAAAAAAAAACFQVBUFQVBYAAAAAAAAAAUAACEAAAABAAAAAAAAAAAAACAAEAAAAAAAACCBQKAIBIAAAFAAEAAAAAAAIAAChQAIAAAAEAAAEAUAAAAAAIAAAAAAAAAAAAAEFQBQAAAAAAAAAQAAAAAAAAAACACAWgAAAAAAAAAgAAQAAFAoAAIAAAAAAIAAAAAAAAACAAAAAAAAEAAAACAoAgAAACBWsZbAABQARUFSgAAAUEAAALBUFAAAAsFQVBQAAAAVBUFQVBUoAAAAAAAIVBUFQVAAAAAAAAAAAAAAAAAFAACFggAKACEAAAAAAAAAAAAAIAAIAAAAAAAACAUAAAggQAAFAAEAAAAAAAAIAAFoAIAEAAAAAAAJYBQAAAAAACAAAAAAAAAAQVAFAAAAAAAABAAAAAAAAAAAAAAABCBaAAAAAAAAAACAABAAAUCgAAAgAAAAACAAAAAAAAAAgAAAAAAAJYAAAAAgKAlgAAACBWqxltUoAAFAABFQUAAAUAEAAAALBUFAAAAAsFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAhUFgAAAAAhAAAAAAAAAAAAAACAEFgAAAAAAAACUAAAAhIAAAFCFgAAAAAAAAAgKFAABIAAAAAAAAIWFAAAAAAAACAAAAAAAAgFAAAAABAAAAAAAAAAAAAAAAAAAhUUAAAAAAAAAAAAAACBAAAAUCgAAAAgAAAACAACggAAAAAAgAAAAAAABAAAAAAAAQAAAAIFahnsAsRUoAAFAABFQUAAAUAEAAAAALBUFSgAAAACwVBUFQVBUFQVBQAAAAAAAAAAAAAAAAACVUFQVAAAAAAACCFgAAAAAAAAAAAAAAhBYAKCAAAAAAAEUAAAECAIAAAJQAAAAAAAAAAAUAEAAgAAAAAABBYUAAAAAAAAAQAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAhUFhQAAAAAAAAAAAAAAAQCAAAABaAAAAACAAAAAIAAKCAAAAAAAQAAAAAAACWAAAAAAACWAAAAAIBqHGwAACxFSgUAAAAEVBUoAFAABAAAAAAAVURQAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAIIVAAAAAAAAAAAAAAAQlgAoAIAAAAAAQWAAAAAAggAAAlVAAAAAAAAAAAFBAAAAIAAAAAQWFAAAAAAAAAAEAAAAAAAAAgAAAAAAAAAAAAAAAAAAIVBUUAAAAAAAAAAAAAAAAEAAAAgAAAWgAAAAAAAgAAACAACgAgAAAAACAAAAAAAABAAAAAAACAAAAAAIC6kvGoAAAAAFQUAAAAAQsFSgAUAAEAAAAAAABVRFQUAAAAAAAAAAAAAAAAAAAAAAUAAAAAACEFgAAAAAAAAAAAAAAEFgAAAAgAAAABBYAAAAAABACABQKQgAAAAAAAAAAAAAAAIAAAAQWFAAAAAAAAAAACFgAAAAAAACFgAAAAAAAAAAAAAAAAAEAUAAAAAAAAAAAAAAAEAAAAAAAgAUCgAAAAAAAAgAAACACgAAAgAAAACAAAAAAAAAgAAAAAAAIAAAAAAAGkcarBUoAAAAABUFSgAAAACxFQUAUAAAEAAAAAAABQAFRFQVBUoAAAAAAAAAAAAAFAAAAAEJUAAAAKCAAAAAAAAAAEFgAAAAAgAAABBYAAAAAAABACBQKAIAgAAAAAAAAAAAAAAIAAAAQWFAAAAAAAAAAAACAAAAAAAAhYAAAAAAAAAAAAAAAAhUFhQAAAAAAAAAAAAQAAAAAAAAAAAFAAAAAAAAAAAAAgAAkBQKAAACAAAAAIAAAAAAAAAgAAAAAAAIAAAAAAAAaRxqAABUFAAAAAAsFQUAAAAAFRFS0AAAAAEAAAAAAAAABQAAAAAAFQVBUFQVBUFQAAAAAAAAAgAAAAAAAAAAAhUAAAAAAIAAAQWAAAAAAAAAQBYCgACFggAAAAAAAAAAAAAAAIAAQWFoIAAAAAAAAAEAACFhQAAAAAACWAAAAAAAAAAAAAAhUFhQAAAAAAAAAAAQAAAAAAAAAAAAAFAAAAAAAAAAAAAAAgQAQBQKAAAACAAAAIAAAAAAAAAEAAAAAAABAAAAAAAAAaUcaVKAoAAAFQUICgAAAVBUoAAAAABUFSgAAAAAAQAAAAAAAAFAAAAAAAAAAAAAAAgAAAAAAAAAAAABBUAAAAAAIAAQVAAAAAAAAAAARQAAAAhYIAAAAAAAAAAAAAAACCFQthQAAIAAAAEAAAAACFRQAAAAAAAAhYAAAAAAAAAABBUUAAAAAAAAAAAEAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAASCFQBQKAAAAACAAAAIAAAAAAAAACAAAAAAAAgAAAAAAAAAaBxoABUFQVBQAoAJUFSgKAAAsFQUAAAAAAFQVBQAAAAAAAAAAAAAAAAAAAAAAgAAAAAABBUFQVBUFQAAAAAAAAAAghUFQAoIAAAAAAAAARVgAAAAEFggQAAFAAAAAAAAAAAEFRQAAAAIAEAAAAAAAEFRQAAAAAAAAAhYAAAAAAAAACFAAAAAAABAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAEAACJYAUCgAAAAAAAgAACAAACggAAAACAAAAAAAAIAAAAAAAAAAaBxoAAAAAAsFSgAAACwVBQAoACwVBUqAoAAAAAFQVBUFAAAAAAAAAAAAAAAAAAAQlQVBYAAAAAAAAAAAAABBUFQgKAACAAAAAAAAEVUAAAAAAQQgAAAUAAAAAAAAAAIVAFAAAAABIAAAAAAAQVFAAAAAAAAAAAEAAAAAAAAAAhUAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAEAAAEAAUAAAAAAAAACAACAAAKACAAAAAIAAAAAAAACAAAAAAAAAABoHGgAAAAAAACwVKAAAAAAVBUFACgAgFQVBUoCgAAAAAAVBUFQlQVBUFQVBUFQAAAAAAAAAAAAAAAAAACFQVAAAAAACAAAAAACVUFQAAABAAAAhYIAFAoAIAAAAAAAAAQBQAAQAAACAAAACFQVFAAAAAAAAAAAACFgAAAAAAAAAEFgAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAQAAAAIWAFAAAAAAAAAAAAgABAACgAAAgAAACAAAAAAAAAgAAAAAAAAAAAaEvGgAAAAAAAAACwVKAAAAAAAAVBUFSgAAAAFQVBUFQVKAAoAAAAAIAAAAAAAAAAAAAAAAIVBUFgAAAAAAgAAAAAhUFQAAAAAAAAACFQgUCgAAAgAAAAAABBUFgAAAAAAAgAABC1FWCAAAAAAAAAAAAAAEAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAABAAAAAABBYAUAAAAAAAAAAAAACCFgAoAAAAAIAAAgAAAAAAAACAAAAAAAAAAAAHccaAVBUFAAAAAAAAABUFAAAAAAAAAAsFQVKAAAAAAAAAAAAAAAAAAAAAALBUFQVBUFgAAAAAAAAgABBUFQVAAAAAAAAAAAAAJVQAAAAAAgAAAABBUAAAAAAAAAAAIAQtRVgAAAgAAAAAAAAAAAAhYAAAAAAAAABBYAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAEAAAAAAAACFQWAFAAAAAAAAAAAAAAACSWAFoAAAAAAIAAAgAAAAAAAACAAAAAAAAAAAAAHdHGlSgAAAAFQVKAAAAAAAAVBUFAAAAAAAAAAsFQVKAAAAAAAAAAAAAAAAAAAAAAAACFQVBUFQWAAAAACAAAAAAAAAABQhUFQAAAAAAgAAAhUFgAAAAAAAAAAAAEFRQAAAAIAAAAAAAAEAEFRVQAAAAAAAAAAEFgAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAQAAAAAAAAAAAAIVBYAUAAAAAAAAAAAAAAAAECFgBQAAAAAAAAIAIWAAACgAgAAAgAAAAAAAAAAAAAB2HGgACwVBQAAAALBUFSgAAAAAAAFQVBUoAAAAAAAAABUFQVBQAAAAAAAAACFQVBUFQVAAAAAAAACAAAAAAAAABQhUFQVBYAAAAAAAAIEAAEVYAAAAAAAAAAAAhUFhQAAAAAIAAAAEAAAEFRVgAAAAAAAAAAAAEFgAAAAAAAAAAAABQAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAIVBYAUAAAAAAAAAAAAAAAAAEACFgBQAAAAAAAAAAIIAAAoAAIAAAIAAAAAAAAAAAAAAAdkvHYAAKAAsFQlAACgAALBUFAAAAAAAAABUFQVBQAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAUQVBUFQVAAAAAAAAEAAAAgAUAItQWCAAAAAAAAAAAEFhQAAAAAAIEAAAAAEFRVgAAAAAAAAAAAAAAEFgAAAAAAAAAAABQAAAAAQAAAAAAAAAAAAAAAAAAAAAAAQVBUAAUAAAAAAAAAAAAAAAAAAEAACFgBQAAAAAAAAAAAIgAAAoAAAIAAIAAAAAAAAAAAAAAAAdRz2sRUFAAAFABKsJUFAAACgALBUFSoCgAAAAAAAAAAAAVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQWAACAAAAAAAAAAAAAAAABQAAAABBYAIAAAAAAAAAAAQWFAABAAAAAIAAAQtRZYAAAAAAAAAAAAAAAAhUFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACFQVBUFgABQAAAAAAAAAAAAAAAAAAAAQAAAAQWAFAAAAAAAAAAAAAIIACgAAAAAgAgAAAAAAAAAAAAAAAAgdhz2AAAsFQUQFAAAALEVBQAAAAoAFQlQUAAKAAAAAAAAAAACAAoAAAAIAAAAAAAAAAAAAAAAAAAAAFAAAAAAAACFQVACAAAAAAACFQVBUFQAAAAAAAAAgAKQVFWAAACAAAAAAAAAAAAAAEFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQVBUFgABQAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAIVAFAAAAAAAAAAAAAACFgAAAAAAAAgAgAAAACggAAAAAAAAAAgB2Rz3QAAAAALBUFAAAAAAsFQVLAAAAUAEoJUFQVKAAAAAoAAAAAAAAIAAAAAAAAAFAAAAAAAAAAAAAAAAAAAEFQWACAAAACFQVAAAAAAAAAAAAAAAIVFVBYAAAAIAAAAAAAAAAAIVBUFQAAAAAAAAAAAAAAAAAAAAAAAAAACFQVBUAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAACFQBQAAAAAAAAAAAAAAAgAAAAAAAAAACCAAAAKAACAAAAAAAAAAQAHUc9gLBUoAAAAAAsFQUAAAAAAFQVKBAAAUAAAAELBUFQVKAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAhUFQWACAAAAoBBUIAAAAAAAAAAAAAIVBUVYAAAAAAAIAAAAAAAAIVBUFQAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQWAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAhUAUAAAAAAAAAAAAAAAAJFhQAAAAAAAAAAAJAAAAoAAAIAAAAAAAAAgAAdRz2AAABUFQUAAAAACwVBQAAAAAALBUFQUQAFAAAAAAAAAALBUFQVBUFRFQVBUFSgAAAAAABBUFQVBUVUFQWAAAAAAAIVBUFggAAAAAAAAAAAAAhUVYAAAAAAAAIAEAAAACFRVQWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQVAAFAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAABBUAUAAAAAAAAAAAAAAAAAECFhQAAAAAAAAAAAAAiAAoAAAAAIAAAAACgAggAAB1HPYAAAAAACwVKAAAAAALBUFSgAAAAAAACwVBUFEABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUFQWCAAAAAAAAAAAAAAACFRVgAAAABAAAAIAACiFRVQWCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQWAAFAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBUFQBQAAAAAAAAAAAAAAAAAAAQAIWAFAAAAAAAAAAAAACAAAAAAAAAIAAAACgAAkAAAB1Rz3UFAAACAAoAAAFQVBQAAAAAVBUFAAAAAAAAAAAsFQVBUFQVKAAAAAAAAAAAAAAAAEFQVBUFQgAAAAAAAAAAAAAAhUFQVBUFQAAAAAAAAAACFRVQVAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIVBUFQVBUFQVBUAUAAAAAAAAAAAAAAAAAAAAAAAEAACFhQAAAAAAAAAAAAAAhYAAAAAAAAAAIAAACgAAJYgAAAHQc9AAVBQoAAAIAACgAAALCVBUqgAAAALBUFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUFQlQAAAAAAAAAAAAAAAAAAEVUFQVAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQWAAAAAAAAAAAAAAAAAAAAAAQVBUFQVBUFQVAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAhYUAAAAAAAAAAAAAAIWAAAAAAAAAAAACAAAoAAAECAAAAdBz0AAABUFAAAAAAAAAACgAAgFQVBULQAAAAAAVBUFQVBUFQVBUFQUAAAAAAAhUFQVBUFQVBUJUFgAAAAAAAAAAAAAAAAAAAAEVUFgAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAABBUFgAAAAAAAAAAAAAAAAAEFQVBYAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAEAUAAAAAAAAAAAAAAEIUAAAAAAAAAAAAACAoAAAAAECAAAAdEc9VKAAAAALBUFAAAAAAAAAAAACgAgACwVBUFQtSgAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAARVQVAAAAAAAAAACAAAAAoAIAAAAAAAAAAAAAAAAAAAAQVBYAAAAAAAAAAAAAAAAAhUFQBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAQWFAAAAAAAAAAAAAAABAhYUAAAAAAAAAAAAAAAAAAAAABAgAAAL7EoACwVEVBQAAABSwVEVKAAAAAAAAAAAAAAAAAAAAAAAAVBUFQVBUFQVBUFSgAAAAAAAAAAAAAAAAhUVUFQWAAAAAAAAAEAAAABQAAAAAAIAAAAAAAAAAAAAAAAQVBUFQAAAAAAAAAAAAAACFQVBYAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAEFhQAAAAAAAAAAAAAAAAQAQBQAAAAAAAAAAAAAAAAAAAAAAECAAAoHqxLUFSgAAAACwVEVKABQAAFRFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAACAAAAAAAAAAAAEFQVBUFgAAAAAAAAAAAAAAACFQVBUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACWAUAAAAAAAAAAAAAAAEAAAAQUAAAAAAAAAAAAAAAAAAAAAAABAgAKAB6EoAAAFQVKAAAAAAVBUFAAAAAsFRFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAACAAAAAAAACFQVBUFQWAAAAAAAAAAAAAAAAAAAIVBUFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJYBQAAAAAAAAAAAAQAAAAAABBQAAAAAAAAAAAAAAAAAAAAAAAgAAAAB6RLQAAAAAAVBUoAAAAAAAsFQVKAAAAAAVBURUFQUAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAEFQVBUFQWAAAAAAAAAAAAAAAAAAAAAAAIVBUFgAAAAAAAAAAAAAAAAAAAAAAEFQVBUFQVBUVUFQVEVBUFQVBUFQVBUFQVBUFSgAAAAAAABBUFQVBUFQVFVBUFRFQVBQAAAAAAAAAAAAAAAJYBQAAAAAAAAAQAAAAAAAAABBQAAAAAAAAAQFAAAAAAAAAAACAAAAAAFEoFQVKAgAAKAABUFSgICgAAAAALBUFQUAAAAAAAAAACwVBURUFQVBUFQVBUVUFQVBUFQVBUFQVKACFQVBUFQVBUFQVBUFQVBUFgAAAAAAAAgAAAAAAAAAAAAAAAAAAAAABBUFgAAAAAAAAAAAAAAAAAAEFQVBUFQBQAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAAAAAAAAAAAVLAAAAAAAAAACWAUAAAAAEAAAAAAAAAAAAAARZQAAAAAAAQAAFAAAAAAAAAACAAAAAAAFEAAALC1BQgAAAAKAAsFQUIACgAAAAAALBUFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAhUFQVBUFQAAAAAAAAAAAAAAAAEFQVBUUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAssAAAAAAAAAAJYBQAQAAAAAAAAAAAAAAAAAAlEFAAAAABAAAAAUAAAAAAAAIAAAAAAAAUQAAAAAAsFQUAAAAAAAKBUFSgIAACgAAAAAAAAVBUFQVBQAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAhUFQVBUFQWAAAAAAAAAAAAAAAAAAAAQVBUFQBQAAAAAQAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALLAAAAAAAAAACWAAAAAAAAAAAAAAAAAAAAAACUQUAAEAAAAAABQAAAAAAAgAAAAAAAABRAAAAAAAAACwVBQAAAAAAAAoFQVBQAgAAAAKAAAAAAAAAAABUFQVBUFQVBUFQVBUFQVBUJUFQVBUFQVBUFQVBUFQVBUFgAAAAAAAAAAAAAAAAAAAAAAAAAAEFQVBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAEALKAAAAAAAAAAJYAAAAAAAAAAAAAAAAAAAAAAAJRAAAAAAAAAABQAAAAACVEFAAAAAAAAUQAAAAAAAAAAAAsFQVKAAAAAAAAAALBUFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACFQVBUFgAAAAAAAAAAAAAAAAAAAAAAAAEFQVBUFQVFVBUFQVBUFQVEVBUFQVBUoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsoAAAAAAAAAAlgAAAAAAAAAAAAAAAAAAAAAAAABFgAAAAAAAAAFAAAABACUQUAAAAAABURUoAAAAAAAAAAAAAABUFQUAAAAAAAAAAAAAFQVBUFSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBUFQVAAAAAAAAAAAAAAAAAAAAQVBUFRVQVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUFSwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsoAAAAAAAAAAAAAlEAAAAAAAAAAAAAAAAAAAAAAAlEWAAAAAAAAAAUAEAAAJRABQAAAAAAAFRFQVKAAAAAAAAAAAAAAAVBUFSgAAAAAAAAAAAAAAAAAFQVBUFQVBUFQVBUFQVBUoAAAAAIVBUFQVBUFQVBUFQVBUFQVBUAAAAAAAAAAAAAAAAAAAAhUFQVFVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsFQVBUFQVBURUFQUAAAAAAAAAAAAAAAAAAAAAAAAAACygAAAAAAAABBUFQAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAEWAUAAAAQUAAAAACxFQVKAAAAAAAAAAAAAAALBUFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUFQVFVBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAARRBQAAEABUFAAAAAAAAsRUFSgAAAUAEAAAAAAAAAAAVBUFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFQVBUFRVQAAAAAAAAAAAAAAABAAAAAAAAAAAAAAUAAAAAAAAAAAAEAAAAAABQAAAAAAAAAAAAAAAAAAAAAAACwUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAJYBQARBQAAFQUAAAAAAAAACxFQVKAABQAAAQAAAAAAAAAAAAAsFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAABQAAAAAAAAAAAAFEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEWAUEQUAAAABUFAAAAAAAAAAAAsRUFQUAAUAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAEWAEFgKAAAAAAsFSgAAAAAAAAAAAAACxFQVFVBQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAeRYsFQVKAoAAAACwVBQAAAAAAAAAAAAAAAAALBUFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAQHkWAAAAVBUoACgAAALCVBUoCgAAAAAAAAAAAAAAAAAALBUFQVBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAACAAAAAAAAAAAAAAAAQKACAAAAAAAAAAAAAAAAAAAAQHixZUoAAAAAAsFQUAKAAACALBUFSgKAAAAAAAAAAAAAAAAAAAAAAABUFQVBUFQVBUoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVBUFQVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAFQUAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAQKAAACAAAAAAAAAAAAAAAAAAJYeBYABUFAAAAAAAsFQVKAoAAAIAAsFQVBQoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwVBUFQVBUFSgAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAsFAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAEWKAAAAACAAAAAAAAAAAAAAAAJRzFgAAAFQUAAAAAAAACwVBUoCgAAgAAAAFQVBUFCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFQVKAAAAAAABQAAAQAAAAAAAAAAAAAAAABUoAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAACUsAAAAAACAAAAAAAoIAAAAAAABzFgAAAAAFQUAAAAAAAAAACwVBUoCgAgAAAAAAACwVBUFQVBQAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABFigAAAAAAAgAAAAKACAAAAAAAcxYAAAAAAAAsFSgAAAAAAAAAAACwVBUFAAAAAAAAAAAAAAAAAsFQVBUFQVBUFQVKAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFSwAAAAAAAAAAAAAAAAAAAAAAAAAAAAsFAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkWKAAAAAAACAAAAAoAAIAAAABzFgAAAAAAAAACwVKAAAAAAAAAAAAAAALBUFQUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwVBUFQVBUFQVBUFQVBUFQVBUFQVBUFACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJUQUAAAAAAAACAAAoAAAAIAABzHUACAAAAAAAAAAAKgoAAAAAAAAAAAAAAAAAFgqCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACoKgqCgBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAigAAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAUAAAAAAAAAAAAAAAUiiKgAAAAAAAAAABKIoiqiiLAAAAAAAAAAAAAIAiqgAAAAAAAAQAAFAAAABAAOYsCgAAgEBQAAAAAAAAFgqCgAAAAAAAAAAAAAAAAAAAWCoKgqCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqCoKFAAAAAAAAAAAAAAAAAAAAAAAAAAAACKAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAABQAAAAAAAAAAAABSKJSAAAAAAAAAAAAAAAAAAAAAAIoiqgAAAAAAAAgAACKqAAAAAAAABAAUAAAAEA5iwAKAAABAgFAAAAAAAAAAWCoKAAAAAAAAAAAAAAAAAAAAAAABYKgqCoKgqCoKAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoKgqCpQAAAAAAAAAAAAAAAAIoAAAAAAAAAAAAAAAAAAAAAAAAAAAUChAAAAAAAUAAAAAAAAAAAUigIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiqiwAAAACAAAAEoiygAAAAAAAQFAAAAAA5jrgIBQoAAAAECAAUAAAAAAAAABYKgoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqCoKgqCoKgqCoKgqCoKgqCgAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqCpQAAAAAAAAAAAAIoAAAAAAAAAAAAAAAAAAAAAAAAAAUAChAAAAAAUAAAAAAAAAAUlIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiqiwACAAAAAAEqoAAAAAAAAAAAAADmOuAAAAAUAAAAEACAAUAAAAAAAAAACoKlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqCoKgqCgAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqCgAAAAAAAACKAAAAAAAAAAAAAAAAAAAAAAAAAFAAAoQAAAAFAAAAAAAAAKAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABLAAAAAAAAACKqAAAAAAAAAAAA5peuAAAAAAAUAAAAEAACAAUAAAAAAAAAABYKgqUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoKAFAAAAAAAAAAAAAAAAAAAAAAAAAAAWWAAoAAAAAAIoAAAAAAAAAAAAAAAAAAAAAAAAUAAAChAAAAUAAAAAAAAUlIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASwAAAAAAAAAASiLKAAAAAAAAAA5DrioKAAAAAAAFAAAABAAAAgAFAAAAAAAAAAAAWCoKlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqUBQAAAAAAAAAAAAAAAAAAAAAAAAFlgAAAAKAAACKAAAAAAAAAAAAAAAAAAAAAAAFAAAAFAQAFAAAAAAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAABAAAAAAEsAAAAAAAAAAAAIqoAAAAAIACgOQ64AAqCgAAAAAAABQAAAQAAAAIABQAAAAAAAAAAAApYioKgoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqCpQFAAAAAAAAAAAAAAAAAAAAAAWWAAAAAAoAAWAAAAAAAAAAAAAAAAAAAAAAAAUAAABZQEBQAAAAAAABQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAQABLAAAAAAAAAAAAABKIsoAAAIAACuQ64AAAWCpQAAAAAAAAFAAABAAAAAAAgAFAAAAAAAAAAAACgFgqCoihAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYKgoUAAAAAAAAAAAAAAAAAABZYAAAAAAACllgAAAAAAAAAAAAAAAAAAAAAAFAAAAAogKAAAAAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAASkgAAAAAAAAAAAAAAEoiygAgAADkO+AAAAAFgqUAAAAAAAAABQAAAQAAAAAAIAABQAAAAAAAAAAAAAAoCoKgqEqJagqUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqUBQAAAAAAAAAAAAAAAAFlgAAAAAAACgAAAAAAAAAAAAAAAAAAAAABQAAAABQIACgAAAABSUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAASiLEAAAAAAAAAAAAAAASqggAADkO+AAAAAAAFgqUAAAAAAAAAABQAAAQAAAAAAAIAABQAAAAAAAAAAAAAAAAAAAoAAAABYioKgqCoKgqCoKgqCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACpQFAAAAAAAAAAAAAAAAWWAAAAAAABQAAAAAAAAAAAAAAAAAAAAAFAAAAAAUgAAKAAAAFAgAAAAAAAAAAAAAAAAAAAAAAAAAoiliiKIoiiKIoiiKIoikgAAAAAAAAUAAAAACLEAAAAAAAAAAAAAASwAAA5DvgAAAAAAAACoKAAAAAAAAAAAFAAAABAAAAAAAAAAgAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACliKgqCoKgoAAAAAAAAAAAAAAAAAAAAAKFAAAAAAAAAAAAAAAAWWAAAAAAAFlAAAAAAAAAAAAAAAAAAAAAUAAAAAAUCAAAoAAAUCAAAAAAAAAUEAAAAAAAAAAAKWKAAAAAAAAAAAAAAAAAAIoiiLEAAABQAAAAAEoixAAAAAAAUEAAAASiAAA5DvgAAAAAAAAAACoKAAAAAAAAAAAAFAAAABAAAAAAAAAAAgAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoKlAAAAAAAAAAAAAAAAAFlAUAAAAAAAAAAAAAABZYAAAAAAAWUAAAAAAAAAAAAAAAAAAAABQAAAABQIAAAACgBQIAAAAAAABQAQAAAAAAAAUillAAAAAAAAAAAAAAAAAAAAAAAAABKIogQAFAAAAAAikgAAAAAAUEAAAAgAAOQ74AAAAAAAAAAAAAqCgAAAAAAAAAAAABQAAAAAQAAAAAAAAAAIAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKgoAAAAAAAAAAAAAAAKFAAAAAAAAAAAAAAAWWAAAAAAAFlAAAAAAAAAAAAAUEAAAAABQAAAAAFIAAAAACigIAAAAAAABQAQAAAAAAApZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiLAAAAAAABKIsQAAAAAFABAAIsAAOSXvgAAAAAAAAAAAAAACoKAAAAAAAAAAAAAAFAAAAAABAAAAAAAAAAAAgAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqCpQAAAAAAAAAAAACpQFAAAAAAAAAAAAAAUgAAAAAABZQAAAAAAAAAAAFABAAAAAUAAAAABSAAAAAAFAAAAAAAAAFABAAAAAAClAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiKIAAAAAABKIEAAABQAAARLAADiO+KlAAAAAAAAAAAAAAAFgoAAAAAAAAAAAAAAAAUAAAAAAAEAAAAAAAAAAAACAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACoKAAAFABAAAAAAFlAUAAAAAAAAAAAAACiAAAAAAAFgoAAAAAAAAAAAUAEAAABQAAAAAFIAAAAAAAoAAAAAAAUAAEAAAAAFUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABKIAAAAAAACLEAAABQAAEpIADiO+AKlAAAAAAAAAAAAAAAFgoAAAAAAAAAAAAAAAAAAUAAAAAAAAEAAAAAAAAAAAACAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACpQAAFAABAAAAAKFAAAAAAAAAAAAAAogAAAAAAACgAAAAAAAAABQAAQAAAFAAAAAUAgAAAAAACgAAAAABQAAQAAAABRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEqIKAAAAAAASiBAAAUAACKSA4jvgACpQAAAAAAAAAAAAAAACpQAAAAAAAAAAAAAAAAAAAFAAAAAAAAABAAAAAAAAAAAAgAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqUABQAAAAAQAChQAAAAAAAAAAAABYAAAAAAAAAoAAAAAAAAAAUAAEAABQAAAABQIAAAAAAAAoAAAAAUAAEAAAAFUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAISiCgAAAAAAEogQAAFAAASjgO8wAAKAAAAAAAAAAAAAAAACpQAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAABAAAAAAAAAAgAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCgBQAAAAAAShQAAAAAAAAAAAAFlgAAAAAAAACgAAAAAAAABQAAAQAFAAAAAFAgAAAAAAAACgAAABQAAQAAABRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhKIKAAAAAAASiLEABQAAAOA7zAAAWCgAAAAAAAAAAAAAAAAWCgAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAQAAAAAAAAAAIABQAAAAAAAAAAAAAAAAAAAAAAAAFlAUAAAAAABYKAAAAAAAAAAAABZYAAAAAAAAAoAAAAAAAAAUAAEAABQAAAAFIAAAAAAAAAAWUAABQAAQAAABRQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBKIKAAAAAAAAiiBAUAADgO8wAAAFgoAAAAAAAAAAAAAAAAFgoAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAEAAAAAAAAACAUAAAAAAAAAAAAAAAAAAAAAABYKFAAAAAAAAAqUAAAAAAAAAAAWWAAAAAAAAAKAAAAAAAAFAAABAAUAAAABZQIAAAAAAAAAAWUABQAAAQAABRQAAAAAAAAAAAAAAABSKAgAAAAAAAAAABKIqoAAAAAAAAAAAAAAAAIAASiCgAAAAAAAAIsAAAOA7zAAAAAWCgAAAAAAAAAAAAAAAAAqUAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAQAAAAAAAIBQAAAAAAAAAAAAAAAAAAAAAKAFAAAAAAAAAqUAAAAAAAAAAogAAAAAAAACgAAAAAAABQAAAQAFAAAAFAgAAAAAAAAAABZQFAAABAAAFFAAAAAAAAAAAAAAAKJSAAAAAAAAAAAAAAAAAEoiygAAAAAAAAAAAAAAgABLKAAAAAAAAAAgAAOA7zAAAAAAqCgAAAAAAAAAAAAAAAAAWCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAQAAAAAIBQAAAAAAAAAAAAAAAAAAAAFlAUAAAAAAAAACpQAAAAAAAACiAAAAAAAAAKAAAAAAAAFAAABAUAAAABQCAAAAAAAAAAAFFAAABAAAFFAAAAAAAAAAAAAAFJSAAAAAAAAAAAAAAAAAAAAAEoiwCgAAAAAAAAAAAgAACLKAAAAAAAAASwAA4DvMAAAAAABYKlAAAAAAAAAAAAAAAAAAKgoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAEAAAACUAAAAAAAAAAAAAAAAAAABZQFAAAAAAAAAAAWUAAAAAAAAogAAAAAAAACgAAAAAABQAAAAQFAAAAFAgAAAAAAAAAABRQAAAAQAUBQAAAAAAAAAAAAAFIAAAAAAAAAAAAAAAAAAAAAAAAASiBQAsAAAAAAAACAAAAIKAAAAAAAAAgAOCXvMAAAAAAAAEqVQAAAAAAAAAAAAAAAAAFgqUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAQAAAJQAAAAAAAAAAAAAAAAAAFlAUAAAAAAAAAAACpQAAAAAACiAAAAAAAAAKAAAAAAAFAAAABAUAAABQCAAAAAAAAAAFFAAAABABQFAAAAAAAAAAAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAACLAFACwAAAAAAIAAAASygAAAAAAAAEsAM47yqVQAAAAAAAARYWgAAAAAAAAAAAAAAAAAAWCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAABAAAlAAAAAAAAAAAAAAAAAAAoAUAAAAAAAAAAACpQAAAAACiAAAAAAAAAKAAAAAAAFAAAAAAAAAAogAAAAAAAAAAUBQAAAAQUBQAAAAAAAAAAAAAFIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiwBQAsAAAAACAAAAAIKAAAAAAAASiAzjvICoWgAAAAAAABAKlUAAAAAAAAAAAAAAAAAACoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAABAgFAAAAAAAAAAAAAAAAAAoAUAAAAAAAAAAABZYCgAAAAKIAAAAAAAAAoAAAAAAUAAAAAAAAABZQIAAAAAAAAAAUUAAAAAVAUAAAAAAAAAAAAABSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIsAUAKBAAAAgAAAABLKAAAAAAAAAgM47yAAWFoAAAAAAAAQCoWgAAAAAAAAAAAAAAAAAAAqCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAACQFAAAAAAAAAAAAAAAAAqUBQAAAAAAAAAAAFlgAKAAAAogAAAAAAAABZQAAAAAFAAAAAAAAAAUgAAAAAAAAAAUBQAAAAFAAAAAAAAAAAAAABZQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASiBQAAAsAACAAAAAEogoAAAAAAABLDOO8gAAFhaAAAAAAAAEAWChQAAAAAAAAAAAAAAAAAAAFgqCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAgAAAAAAAAAAAAAAAABZQFAAAAAAAAAAAAWWAAAoAACiAAAAAAAAAFlAAAAAAUAAAAAAAAACiAAAAAAAAAAFFAAAAAWUAAAAAAAAAAAAAAAogAAAAAAAAAAAAAFAAAAAAAAAAAABAAAAAAAEsAUAAAALAgAAAAACCgAAAAAAAEsM47yAAAAWFoAAAAAAAAQACpVAAAAAAAAAAAAAAAAAAAAAAWCoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAACAAAAAAAAAAAAAAAAFgoUAAAAAAAAAAABZQIAACgAKIAAAAAAAAAWUAAAAABQAAAAAAAAFlAgAAAAAAAAAChQAAAAFlAAAAAAAAAAAAAAAloQAAAAAAAAAAFAAAAAAAAAAAAAAAAAAABAAAAIFAAAAABAAAAAAIKAAAAAAAASjMO8gAAAAFhaAAAAAAAAEAAqFoAAAAAAAAAAAAAAAAAAAAAAAAKgqCpQAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAACAAAAAAAAAAAAAAAKAFAAAAAAAAAAAAogAAAKAogAAAAAAAAACgAAAABQAAAAAAAAFlAgAAAAFBAAAFlAUAAAABZQAAAAAAAAAAAAAJQKEAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAQACBQAAAAAAQAAAACBQsAAAAAAACMw0yAAAAAAWChQAAAAAAAQABYKlUAAAAAAAAAAAAAAAAAAAAAAAAAAABYKgqCoKAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAACAAAAAAAAAAAAAAFlAUAAAAAAAAAAACiAAAAAqiAAAAAAAAAAKAAAAAFAAAAAAAAAWUCAAAAAUEAAAWVQAAAAAFlAAAAAAAAAAAAAUIAoQAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAABIFAAAAAABAAAAAIFACwAAAAAADMO8wQAAAAABYKFAAAAAAABAAAKlUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYKlAAAAAAAAAAAAAAAAUAAAAAAAAAAAAIAAAAAAAAAAAAAAoUAAAAAAAAAAACiAAAAAKAAAAAAAAAACpQAAAAFAAAAAAAAAWUCAAAAAUEAAAWVQAAAAAFlAAAAAAAAAAAAAlAAoQAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiwAAAAAAABAAAAIFAACwAAAAAIzDTMAEAAAAAAWChQAAAAAAAQAABYKFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCgAAAAAAAAAAAAAABQAAAAAAAAAAAAAgAAAAAAAAAAACpQFAAAAAAAAAAAWWAAAAAFlAAAAAAAAAAFlUEAAABQAAAAAgKAAWUCAAAAAUEAAAWVQAAAAAFlAAAAAAAAAAAAAlAAoQAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAASwAAAAAAABAAAAIFAACwAAAAADMO8wAAQAAAAABYKlUAAAAAAAAEAAAqVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKgoAAAAAAAAAAAAAAlAAACgAAAAAAAAAgAAAAAAAAAABZQFAAAAAAAAAAAWWAAAAAFlAAAAAAAAAAAWhAAAAUAAAAAICgAFlAgAAAAFBAAAFlUAAAAABZQICgAAAAAAAAAAlAAoQAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAASwAAAAAAABAAAAIFAAACwAAAADMO8wAAQAAAAAAACpVAAAAAAAABAAAFgqVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgqUAAAAAAAAAAAACAUAAAAAAAKAAAAACAAAAAAAAAAAKAFAAAAAAAAAAAogAAAACgAAAAAAAAABalQAAAFAAAAACAAoBZQIAAAABQQAABZVAAAAAAWUCAoAAAAAAAAAAJQAKEAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEsAAAAAAAAQAAACLAFAACwAAAADMO8wAAQAAAAAAAACoWgAAAAAAAABAAAKhaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYKAAAAAAAAAAAAAJQAAAAAAAAAAoAAIAAAAAAAAAAWUBQAAAAAAAAAAKlgAAAABYKAAAAAAAAAFWChAAAUAAAAAIAACllAgAAAAFBAAAFlUAAAAAACiAAoAAAAAAAAAJQAKlQAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAASwAAAAAAAABAAAEsAUAALAAAAAMw7zAABAAAAAAAAAAFgoUAAAAAAAAAEAAAqFoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKlAAAAAAAAAAAAAlAAAAAAAAAAAACgAgAAAAAAAACgBQAAAAAAAAAFlgAAAAACpQAAAAAAAAFAqVAAAUAAAAAIAAAWWggAAAAFABAAFlUAAAAAABZQIACgAAAAAAAAlAAWEoAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAABLAAAAAAAAAEAAASwBQAAsAAAAAzDvMAAEAAAAAAAAAAAAqVQAAAAAAAAAAQAACoWgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoKAAAAAAAAAAAIBQAAAAAAAAAAAAAAAAAAAAAFlAUAAAAAAAAAACiAAAAAFgoAAAAAAAAAVYKEAABQAAAAgAABYKAAAAAFABAAFlUAAAAAABYKIAACgAAAAAAAlAAAWEoAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAABLAAAAAAAAAEAAASwBQAAoEAAAAzDvMAAEAAAAAAAAAAAAAWChQAAAAAAAAAAQAACoWgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABVhKgoAAAAAAAAAgFAAAAAAAAAAAAAAAAAAAAAAoAUAAAAAAAAABZYAAAAAAWUAAAAAAAABQKlQAAFAAAACAAAAKlAAAAAUAAEAWChQAAAAAAFlAgAAKAAAAAACUAAABYSgAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEsAAAAAAAAAQAABLAFAAAACwAADMO8wAAQAAAAAAAAAAAAAACoWgAAAAAAAAAABAAAFgqVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUBYSoKAAAAAAAIBQAAAAAAAAAAAAAAAAAAAAFgoUAAAAAAAAABYKIAAAAAAqUAAAAAAABQAKEABQAAAAAgAAACpQAAAAFABAAKFAAAAAAAAqWAAAAAoAAAAAJQAAAFhKlAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAEsAUAAAAAALAMw7zAABAAAAAAAAAAAAAAAAFgqVQAAAAAAAAAAAAQAACoWgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFhKlAAAAAAgFAAAAAAAAAAAAAAAAAAAAAqUBQAAAAAAAAAKlgAAAAABYKAAAAAAAAFAWChAAUAAAAIAAAAAqUAAABQAAQBZVAAAAAAAAAogAAAAKAAAACUAAAAACoSgABQAAAAAAAAAAAAAAAAAAAAAAAABCwAAAAAAAAAAQAABLAFAAAAAAACzMO8wAAAQAAAAAAAAAAAAAAAABYKlUAAAAAAAAAAAAAEAAWCoWgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAASoKAAAAIBQAAAAAAAAAAAAAAAUAEAAAoAUAAAAAAAAACiAAAAAAFgoAAAAAAAUACpUABQAAAAAgAAAACoKAAAFAABAKlUAAAAAAABYKIAAAAACgAAAlAAAAAAAqEoAAUAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAABAAAEsAUAAAAAAADMNMgAAAQAAAAAAAAAAAAAAAAAABYKlUAAAAAAAAAAAAAAEAAqFoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAABYSpQAAIBQAAAAAAAAAAAAAAAUAAEAWChQAAAAAAAAAFiKAAAAAABZQAAAAAAAFAAqVAAUAAAAIAAAAAAWCgABQAAAQChQAAAAAAAFgogAAAAAAKAABQgAAAAAABYSoKlAUAAAAAAAAAAAAAAAAAAQsAAAAAAAAAAAAAAEAAASiBQAAAAAAMyXTIAAAEAAAAAAAAAAAAAAAAAAAAAWCpVAAAAAAAAAAAAAAAAWCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAWEqCgCAUAAAAAAAAAAAAAAFAAAABKlAUAAAAAAAAACiAAAAAAAKlAAAAAAAUABYKEBQAAAAAgAAAAABYKlAAUAAAEWUBQAAAAAAAAKlgAAAAAAAAKCUAAAAAAAAAAAEqFqCgAAAAAAAAAAAAELAAAAAAAAAAAAAAAABAAAAEogUAAAAADKNMaFAABAAAAAAAAAAAAAAAAAAAAAAAFgqVQAAAAAAAAAAAAAAAAFgqCoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAqEogFAAAAAAAAAAAAAABQAAAAFgqUAAAAAAAAAWCiAAAAAAAKlAAAAAAAUABYKEBQAAAAgAAAAAAACoKFAAAAWEoUAAAAAAAAACoKIAAAAAAABQAAAAAAAAAAAAAKgoAAAAAAABCoLAAAAAAAAAAAAAAAAAAAAABAAAEogUAAAADKNMVgoUAAEAAAAAAAAAAAAAAAAAAAAAAAAAqFoAAAAAAAAAAAAAAAAAAAFgqCpQAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAqJKlUAAAAAAAAAAAAAAFAAAAAAWCpQAAAAAAABZYAAAAAAAAqUAAAAABQAAFgoAAAAAAgAAAAAAABYKFAAAAWEoUAAAAAAAAABYKlgAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAEsAUAAADKNMQFgoUAAEAAAAAAAAAAAAAAAAAAAAAAAAAAqCpVAAAAAAAAAAAAAAAAAAAAAAqCoKlAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAIWCpQAAAAAAAAAAAAAFAAAAAAAWCpQAAAAAACpYAAAAAAAAqUAAAAABQAAFgoAAAAAgAAAAAAAABYKFAAAAWCgAAAAAAAAAAAWCpYAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAACBQAAAMo0xAAWChQAAQAAAAAAAAAAAAAAAAAAAAAAAAAABYKhaAAAAAAAAAAAAAAAAAAAAAAAACoKgqUAAAAAAAAAAAAAAAAAABQAAAAAAAhYKlAAAAAAAAAAAAAUAAAAAAABYKlAAAAAAKIAAAAAAAAqUAAAAABQAAFgoAAAAAgAAAAAAAABYKFAAAAWCgAAAAAAAAAAAAWCpYAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQACBQAAAMo0xAAAWChQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAACoKlUAAAAAAAAAAAAAAAAAAAAAAAAABYKgqCoKgqCgAAAAAAAAAAABQAAAAAAAAhYKlAAAAAAAAAAAAUAAAAAAAABYKlAAAAFgogAAAAAAABYKAAAAAFAAAAqUAAAACAAAAAAAAAFlAUAAABYKAAAAAAAAAAAAAFWIqEoAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAgUAAADKNMQAAAAKlUAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAWCoWgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqCgAAAAAAAAABQAAAAAAAAAhYKlAAAAAAAAAAAUAAAAAAAAACiAAoABZYAAAAAAAAAWCgAAABQAAAFgoAAAAAgAAAAFBAAAKlUAAAAACoKAAAAAAAAAAAAFCAFgqEqUAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQACBQAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAADg/9oACAEBAAEFAn/+/wD9/wD7pD//xAAUEQEAAAAAAAAAAAAAAAAAAADg/9oACAEDAQE/AX0h/8QAFBEBAAAAAAAAAAAAAAAAAAAA4P/aAAgBAgEBPwF9If/EABQQAQAAAAAAAAAAAAAAAAAAAOD/2gAIAQEABj8Cf/7/AP3/APukP//EABQQAQAAAAAAAAAAAAAAAAAAAOD/2gAIAQEAAT8hf/7/AP3/APukP//aAAwDAQACAAMAAAAQ5BBAAACBBNiAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAAAAAAABBBBBTPBBBBABBBBFBBBS/wD/AHzzy7jzzzz0AFMQAAAAAYIIIIJPT77775rz64MMNOcsMMMMJOAkAEEEEEHHX33323jzzzy4gAAAAAAAAAAAJMU0EAAAAEEAAAAAAAAAAAAAQwAAAAAAAMMMAAAAAAABH/zzzzzzzx7Dz77zzzzzwwAAAAAAAABCQgAAAAAAAAAEAAAAIEFsAAAAAAAAAAAAAARgAAAAAAAAAAAAAAAAAAAAAAAEEEEEGsEEEEAEEEEEEEEDL/7zzzyzjzzykAAFIQAAACMoIMIILDz7775f36oMMMMOcMMMMIMOAgEEEEEEFHX33323zzzzy44AAAAAAAAAAAAEDCEU0EAAEEAAAAAAAAAAABDAAwAAAAAAMMMMAAAADDT/AP8APPPPPPL+fPPvPPPPPDAAAAAAAAAEJCAAAAAAAAQAAAgQWwAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAAAAgggwwwQQawQQQQAQQQSQQQQAAMvvPPPPFffKQAAAAiAAAAw5wwggggsvvvl//AO0MMMMMNMYMMIMMMOEkEEEEEFXzz333zzzzzzzz44oAAAAAAAAAEAAABDAM8kEAAAAAAAAAAAAAAADCAwgAAAAMAMMAAAADDT/zzzzzzy/nz77zzzzywgAAAAAAAABCQAAAAAAAAAAEFsEAAAAAAAAAAAACAAAAAAAAAAAAAwwxzzzzzz333308sEMMMGMkEEEAEEFEkEEEAABL77zzyzT3wkAAAACYAAAIJMMIIIIJbz67/wD/APQwwwwwwlgQwgwwww4QQQQQQVPPPPafvPPPPPPPPPLgAAAAAAAQAAAAAAAAEBCAAAAAAAAAAAAAAAAAAMADAAAwAAAwgAAAEN//ADzzzzzxr7z7zzzzzwwAAAAAAAAABAgAAAAAAAMEUEAAAAAAAAAAABgAAAAAAAAAAwzzzzzzzzzzzz3333332sEEEEHAAwgEAEEGUEEEAAAJTzzzzz3zykAAAAAIIAAMIKcoIIIJb37z/wD/APbywwwwwg4iQAwwwww4yQQQQVPPPPLtPPvvPPPPPPPPzzwQAAAAAAAAAAAAAAEIBDAAAAAAAAAAAAAAAAAABCAAAAAAwwAAAAFfvPPPPPPDNvvPvPPPPLCAAAAAAAAAEBAAAAAAAQSwAAAAAAAAAAAGAAAAAAAAABPPPPPPPPPPPPPPPPfffffawQQQQQAQQUZQQQURQQQAAAAtPPPPLdPfSAAAAAJgggwggqgggggt/Pmvf/8A+sMMMMMIOgEEEMMMMMEEEEEHDzzzy7Tzzz7zzzzzzz33ysAAAAEAAAAAAAAAAAABDAAAAAAAAAAAAAAAAAADAcMAAAAAMMABXz7zzzzzzzxT777zzzzzwAAAAAAAAAACQAAAAAEGsAAAAAAAAAABgAAAAAAAABzzzzzzzzzzzzzzzzzz3333328EEEEEAEEFEEEEEGkEEAAAADzzzzznz20AAAAAIIIIMIKMIIIIILT75r33+8MMMMMMKYEEAEEMMMMkEEEEFHTzzz1/Tzzzz777zzzzysAAAAAAEEAAAAAAAAAAABAQgAAAAAAAAAAAAAAABAQAMMAAAAAMBDH7zzzzzzwzTz77zzzzywAAAAAAAAAACQAAAAEEMAAAAAAAAABgAAAAAAAABTzzzzzzzzzzzzzzzzzzzz333338sEEEEAEEFEkEEGEkEEAAALDzzzzzz3wkAAAABYIIIMJMMIIIIILz75//AN9/LDDDDDCTEBABBBDDDzNBBBBBw88888a8888888++++88vPJAAAAABBAAAAAAAAAAAgMIAAAAAAAAAAAAAAAAQgAADAAAAADAAx+8888888c0++88888sAAAAAAAAAAAgAAABBBAAAAAAAAEgAAAAAAAAAM8888888888888888888888999999JBBBBABBBVBBBBAkJAAAAAQ0888p889IAAAAAmCCDCCCiKCCCC39+6/wD/AP8A/LDDDDCDDmABBBBBBBDVBBBBB888888uew8888888888+/8AvrjyQAAAAQAAAAAAAAAAAMIDAAAAAAAAAAAAAAAJCAAAwwAAAAwAMfvPPPPPLOPPvPPPPLCAAAAAAAAAEAAAAQQQAAAAAABIAAAAAAAABHPPPPPPPPPPPPPPPPPPPPPPPPfffffawQQQQQQQQSQQQQAEBgAAAgAEPfLdPPPLgAAAAUygggggkhgggkv/APxf/wD/AP8A+8sMMMIMNMUEEEEEEEFEgEEEHTzzzzzzz7Dzzzzzzzzzz3zzz748kAAEAAAAAAAAAAAAABAAwgAAAAAAAAAAAADAQAAMAAAAEMBDf7zzzzzxzTzzzzzzwgAAAAAAAAAAAAFUEAAAAAASAAAAAAAARzzzzzzzzzzzzzzzjDDDDDDDDLb/AP8A/wD338EEEEEAEEFUEEEEAACoIAAIABX3y3zzzywgAAAEKcMIIIIJIIIJf/8Av3//AP8A/wD/ALgwwwwww06QQQQQQQUZAAQQUfPPPPPPPLmvPPPPPPPPPPffPPPvrjyQQQAAAAAAAAAAAAAAMBDAAAAAAAAAAAAEICAwAAAAAw0NfvPPPPPLNPPPPPPPLAAAAAAAAAAAAVQQAAAAAGAAAAAAADPPPPPPPPPPPOMPDDHPPPPPPffffb29f/8A/wDvJBBBBABBRJBBBAAAQCCACAAA888V8888uAAAADCnDCCCCCQICC3/AP7e/wD/AP8A/wD+4EMMMMMMOMkEEEEEEGgAAEEHTzzzzzzzyw7rTzzzzzzzzz3zzzzzww0kEEAAAAAAAAAAAAAABAgAAAAAAAAAAAACAgMAAAAAANHz7zzzzyzjzzzzzzywAAAAAAAAAAFUEAAAAACoAAAAABTzzzzzzzzzCxzzzzzzzzzzzzz333333/X33330wwwEAEEFEEEEEAAAYAAIAADX3xnzzzzz4IAAEIIoIIIIIIAAILf/APt7/wD/AP8A/wD7iAQwwwww0xQQQQQQQRAAAAQdvvPPPPPPPPPPsPPPPPPPPPPfPPPPPPPLDSQQAAAAAAAAAAAAAMBCAAAAAAAAAAAEDAQAAAAAAE/PvPPPPPGPPPPPPPLAAAAAAAAAAVQQQAAAAqgAAAAAFPPPPPPPPNPPPPPPPPPPPPPPPPPfffffbdfffffffffTQQQZQQQQAAAJAAAAAAfPPNPPPPPqgggAgowwgggggqggEv8A/wD9f/8A/wD/AP8A/wA4EIMMMMMNMUEEEEEGQAAAAHL7zzzzzzzzzzzw/vXzzzzzzz3zzzzzzzzyw0AAAAAAAAAAAAAAACAgAAAAMMAAAACAAMAAAAAALb7zzzzzxjzzzzzzywAAAAAEAAFUEEAAAAKoAAAAABTzzzzzzzjzzzzzzzzzzzzzzzzz3333331f3333333330EEEEUEEEAABIQAAAADX3xnzzzzz4IIIMJMsIIIIIKAIIL3/wD9/wD/AP8A/wD/AP7+oEAEMMMMMPMkEEEEFEgAAABLbz777zzzzzzzzz07vXzzzzz33zzzzzzzzzywwAAAAAAAAAAAAAACAAAAAAMMAAABAgMMAAAAABL7zzzzzxjzzzzzzywAAAAEEAFUEEEAAAKsAAAAABTzzzzzzyjzzzzzzzzzzzzzzzzz3333331f33333z3330EEEEBAUEAAAABAgAABHzy3TzzzzyoIIIIJIYIIIIJYEILf/wB9/wC//wD/AP8A/v7wQQAQQQwww1wQQQQQURAAAAAEvPPPPPPvvvPPPPPfDufPPPPPPffPPPPPPPPPDAAAAAAAAAAAAAAIAAAAAAAwwwAEDAAwAAAAAE9/vPPPPGPPPPPPPLAAAAQQQUSwQQQQAqwQAAAAFPPPPPPPKPPPPPPPPPPPPPPPPPPffffffV/fffffPfffQQQQQAAJAAAAAgAJQAAPPPLOPPPPPLyggwggsiggggowwEv/AP8A/wD79/8A/wD/AP8A+8gAEEEEEEFMUEEEEEEGgAAAABPzzzzzzzzzzz777z2vXzzzzzzzz3zzzzzzzzwwAAAAAAAAAAAAADAQAAAAAMMMAADAgMAAAAAAPX7zzzzxjzzzzzzywAAEEEMEEsEEEEKsEEAAABXzzzzzzyjzzzzzzzzzzzzzzzzz3333331f33333z3330EEEEAABAIAAAIABUEADzzzzxjzzzz/AOLCCCCCCmCCCSLDBR//AP8A/wD/AH9//wD7/wD/ALzQQQQQQQQUyQQQQQYAAAAAAEstPPPPPPPPPPPPPPvzn+9fPPPPPPfPPPPPPPPLDCAAAAAAAAAAAAEICAAAAAwAwAAICwAAAAAA/fvPPPPGPPPPPPPLAAQQQwQawQQQQ4wQQQAAFffPPPPPKPPPPPPPPPPPPPPPPPPffffffVffffffffffQQQQQAAAAgAAAgAFQQAPPPPPPHPPPPfviggggggkggglgww0f/8A/wD/AP7+v/8A7/8A/wD/AMkEEEEEEFEAAAEFEgAAAAAAAADLLzzzzzzzzzzzz3z764/vXzzzz3zzzzzzzzzzwwgAAAAAAAAAAACAgAAAMAMAABAcAAAAABHz7zzzzzz7zzzzzwgsEEMEGcEEEENEkEEEABf333zzzyz33zzzzzzzzzzzzzz3333332/33333333330EEEEAAAAIAAAIABUEADzzzzzzzzzz376sIIIIIIKgIJIMMMFf/AP8A/wD/AP8Ant//AL//AP8A/wC8kEEEEEFEgAAAFEwAAAAAAAAAABLLzzzzzzzzzzzzzzz765/HzzzzzzzzzzzzzzzwwAAAAAAAAAAACAgAMAAMAAAAsAAAAAND/wA888888+8888889DBDBBBLBBBDBRJBBBADz9998888Y998888888888889999999n99999999999hBBBBAAAACAAAAAARBAA88888888889++rCCCCCCCoCCCDDDBD/wD/AP8A/wD/AP8Au/8A/v8A/wD/AP8A+8kEEEEFEQAAAAGAgAAAAAAAAAAABLPzzzzzzzz3zzzzzz765/H3zzzzzzzzzzzzzwwAAAAAAAAAABAgAEMEAAAACcAAAAABD/zzzzzy/fzzzzz20sMEEEEcEEMEFEcEEAMEHf33zzzwznX3333333333333333u/wB99999899995BBBBAAAACCAACAAAoBAF88888888889++rCCCCCCCoCCCDDDBD/wD/AP8A/wD/AP8A/X/+/wD/AP8A/wD/AP8ABBBBBBBlAAAAAQEAAAAAAAAAAAAABTz88888889988888888uf188888888888888IAAAAAAAAAAAAAADDAAAAALAAAADAQ/88888/4/88889999AABBBRLDBBBBjJBDBBBT39888889N/z199999999999/9999999999995BBBBBAAAAYCAAAAAZABAd8888888888/wDvqwggggggqAgggwwwQ/8A/wD/AP8A/wD/AP1//v8A/wD/AP8A/wD/AAQQQQQQQYAAAAAAZAAAAAAAAAAAAAAAQ9fPPPPPPPPfPPPPPPPLO/ffPPPPPPPPPPPLAAAAAAAAAAECAAAAAAAAIAAAAAwANP8Azzzz/wA388888999tBABBBBnDBBBBRLBDBBBB3998888+/8AfbX+89/ffffe7/ffffffPffffYQQQQQAADEgAgAgAAIAARfPPPPPOHPPPfvvqwggggghgAghgwwwQ/8A/wD/AP8A/wD/AP1//v8A/wD/AP8A/wD/AAQQQQQQQVQAAAAAUQAAAAAAAAAAAAAAAF/PPPPPPPPPPfPPPPPPPPPPffPPPPPPPPPPAAAAAAAAAAAAAAAAAAAAFAAAAAwAFPPvPPP/ABT/AM8898999sBABBBBLDBBBBRBBDDBBB399988888+99999999999999998999995hBBBBAMSjBCCAAAAABBBAc8888882888/+++iCCCCCCaACCSDDDBD/wD/AP8A/wD/AP8A/X/+/wD/AP8A/wD/AP8ABBBBBBBBVAAAAABBAAAAAAAAAAAAAAAAW8888888888889888888888898888888888BAAAAAAAAAAAAAAAAAAAUAAAADAAU88888/8AFPP/ADz33zzz30gAAEEGcMEEEEsEEEMEFX333333zzzzz/8A99999999998999999xBBBBBIjDDDAAAACAEIgAAB8888886+889+++yCCCCCCaDACCjDDDDD/wD/AP8A/wD/AP8A/X/+/wD/AP8A/wD/AP8ABBBBBBBBVAAAAABBAAAAAAAAAAAAAAAAW8888888888888988888888888988888888BBAAAAAAAAAAAAAAAAAAUAAADDAAU88/88/8AFPP/ADzzX3333z0wEAEEFEcMEEGMkEEEMHP33333333333333/8A/wD/AP3HzzzzzzmEEEEEFkEEEAAAAAIBiAAAAFzzzz77qTzzz/7MMIIIIIIIEIAaMMMMMN//AP8A/wD/AP8Av/3/AP7/AP8A/wD/AP8A/wAEEEEEEEFUAAAAAEEAAAAAAAAAAAAAAABbzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwEAEAAAAAAAAAAAAAAAABQAAAAMABTzz/zz/wAU88889s0999989sBBBBBBhLBBBBjLBBBDDz399999999999997zhBBBBBBABBBBBBBFhBBAAAAAAAYAAAAB888960M88888zCCDCCCCCMgCACbDDDBHf/AP8A/wD/AP8A7/8Am/8Av/8A/wD/AP8A/wD/AAQQQQQQQVQAAAAAQQAAAAAAAAAAAAAAAFvPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPAQAQAAAAAAAAAAAAAAAAFAAAAAwAFPPPPPP/ABTzz/z33xnHX33zz0gEAEEFGMkEEEHGMsEEEMHPPPPPPPPPPMEEEEEEEAAEEEEEU1HEEEAAAAAIAASAAAAFzzzhzzzzzzzwIIIMIIIIjAAAIIKsMMF//wD/AP8A/wD/APv8nP8A7/8A/wD/AP8A/wD/APMEEEEEEEEEAAAAAEEAAAAAAAAAAAAAAABbzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwEAEAAAAAAAAAAAAAAAABQAAAAEABTzzz7z/wAU88/8x99999Z1999sBBBABBBkAABBBBBzHBDDBBBBBBBBBBBBBBBBAABBBBFJhBBBBBAAAAACAEQgAAAF888808888888rCCDCCCCaACCCCCWDBAG/wD/AP8A/wD/AP8A2e//APv/AP8A/wD/AP8A/wAwQQQQQQQQSYAAAAAARQAAAAAAAAAAAAAAAFvPPPPPPPPPPPvPPPPPPPPPPPPPPPPPPPPPAQAQAAAAAAAAAAAAAAAAFAAAAAAAFPPPP/P/ABTzz/wFHH33/wBt5199tJBBBAABgJBAABBBBBxDHNNBBBBBBAAAAABBBBBFJxBBBBBBAAAAACMQwAAAAAd888kc88888897CCDCCCCCqCCCCCKDACG//wD/AP8A/wC93/8A/wD/AP8A/wD/AP8A/vEEEEEEEEEEVgAAAAAEEWAAAAAAAAAAAAAAAAJzzzzzzzzzzz7zzzzzzzrzzzzzzzzzzzzzz4EAEAAAAAAAAAAAAAAAABQAAAAAABTzzz/z/wAU88/8JBBBBR3/APfXdffbSQQQQQEZAQQQAAQQQQQQUYDCQQQQQQQQQTScQQQQQQQAAAAADkAAAAAAAAXPPfZfPPPPPPO4gggwggghsgggggmgwwhv/wD/AP8A/wC//wD/AP8A/wD+/wD/AP8AzBBBBBBBBBBBJgAAABBBFYAAAAAAAAAAAAAAACO8888888888+888888886d8888888888888+rAABAAAAAAAAgAAAAAAAAQAAAAAAAU888/888U88/8BjJBBBBT3999d19/tNBBBBAQEJBBBAAAABBBBBBQwAFNJRxhBBBBBBAAAAAMOSwCCCAAAABN8991c8888888iCCCDCCCGSCCCCCCKDBCG/8Afff/AP8A3/8A/wD/AP8A/wD/APgBBBBBBBBBBBDZAABBBBBIgAAAAAAAAAAAAACOc8888888888+8888888886d8888888888888+6AAABAAAAAAAQAAAAAAAAAIAAAAAAA8888//wDOPPPP/AQwczQAQQQ8/ffXcf8A/wBtNBBBBRhNBBBBBBBBBBBBBBBBBBBBBFNNNJBRxzCAAAAACAAABN8995s88888886CCCCDCCLyCCCCCCCbBACG/wD/AP8A9/7v/wD/AP8A/wDv/wD+oEAEEEEEMMMMvEEEEEEEWAAAAAAAAAAAAI47zzzzzzzzzz777zzzzzzzz3qfzzzzzzzzzzzzz7zoEAAAEAAAAAASAAAAAAAAAQAAAAAAADzzzz/zyzzzz/wAAMEFMYgEEMHPX3213P8A99tNNBBBRxBNNNJBBBBBBBFNNJBxhBBBBBBAAAAAACCAAAEd988xt88888886iCAABCCHjDCCCCCCGgCCCd//wD/AH/O/wD/AP8A/wD/APv/AP8AwABBDDDDDDDDTBBBBBBBBIAAAAAAAACOO888888888+++888888888888yv88888888888988+86BAAAABAAAAAAIBAAAAAAAAIAAAAAAAU8888/88U888/8jIAAAABTEAADBBT1999tfz9999tNJBBBBBBBBBBBBBBBBBBBBBBAAAAAAACCAAEMc8888xN8888886ywAAAADCPTDCCCCCCCAiCAAf8A/wD/AJ3f/wD/AP8A/wD/AP7/AKwBADDDDDDDDDHRBBBBBBBBFgAAAAABG888888++++8888888888888862M888888888888889+886BAAAAABAAAAAYBAAAAAAAAEAAAAAAAA888888848888/8AQiIACAABTEAADBBT1999/vP719999tNNNNNNNBBBBBBAAAAAAAAAACCEMMM88888851c8884wgAAAAAAADPTiDCCCCCCCMwAACG/wD/AP8Al/8A/wD/AP8A/wD/AP8AsoAQwgwwwwwwwz0QQQQQQQQQSIAAAAAAQXvvvvPPPPPPPPPPPPPPPPMtrnPPPPPPPPPPPPPPPPv/ADz6MAAAAAAEAAAABgEAEAAAAAACAAAAAAABTzzzzzzzTzzzz/8AAAAAiKAAAAASGICABBTy889//wDX8ffffffffffff/8A/wD/AP8A/wD/AP8A777zzzzzzzzzzznUzzzzjAAAAAAAAAA9OIIMMIIIII5KIIIIJ/8A/wD9T/8A/wD/AP8A/wD/AOogQwwggwwwwwz0YQQQQQQQQQTYAAAAAAQRfPPPPPPPPPPPPPPPPOtrjPPPPPPPPPPPPPPPPPvvvPfOowAAAAAAAAQAAAGAQAAQAAAAAGAAAAAAAAPPPPPPPLPPPPPP/CAAAAAEBAAAAAEoiAgAAQ89PPPP/wD0/wCw088888888888888++++++8888884xtc8995xAAAAAAAAAMSiCCDDCCCCOSiCCCCCO/8A/eL/AP8A/wD/AP8A/wD/APIMMMMIMMMMM9GEEEEEEEEEEEVAAAAAEEEVzzzzzzzzzzzzzzzzzK7zzzzzzzzzzzzzzzz777zzzz/MEAAAAAAAAAEAAABkAAAAAAAAABgAAAAAAABzzzzzzzxzzzzzzzjywgAAAABAQgAAAACI4IAAABLLzzzz7/3308/7rDDTzzzzzz7777zzzzDC03333zHEAAAAAAAAAxKIIIIMMIII5KIIIIIII7/3zqb/AP8A/wD/AP8A/wDOMMMMMIMMMMM9EEEEEEEEEEEEEWAAEEEEEVzzzzzzzzzzzzzzzra5zzzzzzzzzzzzz7777zzzzzzrIAAAAAAAAAAAAAAAAaEAAAAEAAAABgAAAAAAAATzzzzzzyTzzzzzzyDzzzwwAAAAACAwAAAABAYgAAAABLLTzzzz777zzzzzzzwwwwwwwzzzzzzzzznGAAAAAAAAAAYrIIIIIMIIM9KIIIIIIII73z7rZ/8A/wD/AP8A7zDDDDDDDCDDDPQhBBBBBBBBBDDDHRBBBBBBBU888888888888y2uc88888888888+++888888888yiAAAAAAAAAAAAAAAACCLhAAAAABAAAAYABAAAAAAA8888888488888884AN5088++MBAAAAQEIAAAAAwEIAAAAAACyyy+++++8888888888888885xxAAAAAAAAACCOCyCCAADDCPLzDCCCCCCCCM8++6mf99997zDDDDDDDDCDHKQgABBBBBDDDDDDHJxBBBBBBBFc88888888yyuM88888888888+++888888888886yAAAAAAAAAAAAAAAAADGLhAAAAAABAAAAYABBAAAAAAc8888888c8888888AA/wD/AEx33H7780kAAACAwAAAAADAQwAAAAAAAAAADDDDDDDDDDDDHHEEEEEE0kAAADDDDCAAAAAEc8PKMMIIIIIIIIxz777ix3//APxjDDDDDDDDDCOAwBBABBDDDDDDDDPBxBBBBBBBBFc88888888z88888888+++++8888888888888+yyAAAAAAAAAAAAAAAACCAFThAAAAAAAABAAAYBBAAAAAAAc8888888s8888888oAAw+//AP8A3yxn/wD/APbTQQAkohCQAAAAEMADDAAAAAAAAAAAAAAAAAAADTQUcAAAAAAAAAAAADDg8oggwwggggggjDPvvPPMr/8A/wD5xDDDDDDDDDHLwBBBBADDDDDDDDPBxBBBBBBBBBBM8888888993O++++++8888888888888888+yyiAAAAAAAAAAAAAAAAACCAAKyAAAAAAAAAABAAEgBAABAAAAAc88888884c8888884AAAAA2+++++8s6+/wD/AP3w00EIJPEE0kAAAAADDAAAEEEEEEEHHHHAAAAAAAAAAAAAAAQ4LIIIIIMMIIIIIQwzzzz777rZ/wD986jDDDDDDDDDLhBBDDCCDDDDDHPBxBBBBBBBBBBBFc888889995sc88888888888888888886yygAAAAAAAAAAAAAAAAAACCCAAEagAAAAAAAAAAABAAIhAAAABAAAAc88888888c8888888AAAAKCCQyy2+++8s42+//wD/AHzww0sMMFHEEU00kEAAAAAAEMMMMMMMMIIIIIIIIY4pLIIIIIMMMIIMY4777777777rY/3z7rIMMMMMMMM89OMMMMMIMMMM4hGEEEEEEEEEEEEEEzzzz333333Gzzzzzzzzzzzzzzzzzz7LKAAAAAAAAAAAAAAAAAAAAIIIAAAA5IAAAAAAAAAAAAAAAREAAAAAAAAABzzz3zzzzyTzzzzzzyAAAAALIY4IIILLL777xzL777//AM888sMLDDDDBAAAAAAAAAAAAQwwwwgAAAAQwgAAAACDDDPPPP8A/wD777777777rQzz777KMMMMMM8PPMMMMMMMIIMM4hCAAEEEEEEEEEEEEEV333333333Gxzzzzzzzzzzzzzz7LLIAAAAAAAAAAAAAAAAAAAIIIIAAAAAQpKAAAAAAAAAAAAAAAAduAAAAAAAEAABzzz33zzzyTzzzzzzzgAAAAAYoIILLIYoIILLb77477L7777zzzzywwoIIMMIIIIAAAAAAAAAAAAAAAAQw44577777/8A++++++++6w0MM+++6yDDBBFNTzDDDDDDDDDCCOAwhAABBBBBBBBBDDPNN999999999xsc88888888886yyiAAAAAAAAAAAAAAAAACCCCCAAAAAAAAEOSwAAAAAAAAAAAAAAAACGagAAAAAAAABAEc89888888s88888888AAAAAACCyiOCCCCSiGKCCSy2+++OO6y2+++88888MMOCCCCCCCCCCGOOOOO+++++++/wD/AP8A+++++6w08MMe+++884wBDDDNRjDDDDDDDDDDGOQxBBBABBBBBDDDDPNd99999999999xsc88888888896yAAAAAAAAAAAAAACCCCCCAAAAAAAAAAAEOSwAAAAAAAAAAAAAAAAACCGagAAAAAAAAAAAE898889888888888888gAAAAAALDDCCSiHDDCCCSiGCCCCyy2+++OO+yy2++++88888888+++++++++/8A/wD/AP8A8888fPDDDPPPPPPPPvusowwQRCE4wwwwwwwwwwz0YQQQQQAQwwwwwzzXfffffffffffffcbHPPPPPPPfff8AOAAAAAAIIIIIIIAAAAAAAAAAAAAAAAA44LKAAAAAAAAAAAAAAAAAAAIIAZqAAAAAAAAAAAAFz33zzzz3zzzzzz3zzzygAAAAAAD288MMMEFKM8MMMIIKIYsIIIILLLb77777444444444444444444444577/wD/AP8A777777777777rCAAAAI5LMMMMMMMMMMMM9GEEMMMIIMMMM41333333333333333nWxzzz3333333HIIIIIAAAAAAAAAAAAAAAAAAAAAQ44JLLAAAAAAAAAAAAAAAAAAAAAIIIAA5IAAAAAAAAAAAAAB33zzzzzzzzzzzz33zzzgAAAAAABj77/200IAAMFGM8MMMMILIM8MMIIIIIJLLLLb7/wD+++++/wD/AP8A/wD/AP8A/wD/AL77777777777DDDDAAIIIY4LMMMMMMMMc88MPPMMMMMIIMMI4xzzz3333333333333HH03333333333nAAAAAAAAAAAAAAAAAAAAA444JLLCAAAAAAAAAAAAAAAAAAAAAAAAAIIIAAAYqAAAAAAAAAAAAAAARzzzzzzzz3zTzzz3z3zzgAAAAAAAQBzD777764wAAIINGE0sIIMEFLMM8sMMMMIIIIIIIILPPPPPPPPPPHHDDDDDDAAAIIIIIIIII4pLMMMEEc8PPOMMMMMMMMMMIIYwx33zz33333333333HX0033333333333nGAAAAAAAAAAAAAAQ4ILLLCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIIIAAAAAYrAAAAAAAAAAAAAAAATzzzzzzzzzz2Tzz3zzz3zyAAAAAAACAD767rb77776wwAIIIILAQgIIIAEEFHOMc8oIIIIMMMMMMMAAAAAAAAAAAAAAAAAAAAQwhDEEEEAAwvOMMMMMMMMMMMMc8xz3333zz33333333HX0033333333333333GAAAAAAAAAAAAE8pLKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIIIIIAAAAAAAAYrAAAAAAAAAAAAAAAAAZzzzzzzzzzzzynzz3zzzz3yAAAAAEABgAD7777477L77776wwAIIIIJKAQwIIAAAIIMEFHHCAAAww4444oIIIIIII4444wwBDCAAAAIY4pPMMMMMMMMMMMMMc1333333zz33/8A/wC89/TXffffffffffffffecYAAAAAAQQQQQQTw8oAAAAAAAAAAAAAAAAAAAAAAgggggggggAAAAAAAAAAAAjisIAAAAAAAAAAAAAAAAAhnPPPPPPPPPPPPPLffPPPPPPYAAAAQAABIAAAkstvvvvrusvvvvvrjCAgggggksIBDAggAAAAgggggggggggggggggggggggggghjik84wwwwwwwwwwwwwxzXfffff/AL77/wD7y2sMd99999999999999995xhABBBBBBBBBBPLSyAAACCCCCCCCCCCCCCCAAAAAAAAAAAAAAAAAAAAAAAAOOCwwAAAAAAAAAAAAAAAAAACCGe88888888888884k88888888pAAABAAAAoAAACOCCCDzy2+++Oey2++++OOCCCCCCCCCSwgAEMMIAAAAAACCCCCCCCCCOOOCDzzDDDDDDDDDDDDHPPPPP/wD/AP8A/wD/AL7rLbwwzzzz33333333333333nHHEEEEEEEEEEEE0lDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIY44444IILDCAAAAAAAAAAAAAAAAAAAAAAIIAZzzzzzzzzzzzzzzzRzzzzzzzzzykAAEAAABAAAAAMPM8IIIIMNPLL7768/rL7776444IIIIIIIIIIIIILLLDDDDDDDDCIIIIIIIIIY48//wD/AP8A/wD/AP8A/wD/AP8A/wD/AO88/LDDffffPPPffffffffffcccYQQQQQQQQQQQQQTSUMIAAAAAAAAAAAAAAAAAAAjjjiggggssMMMMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAggAABnPPPPPPPPPPPPPPNHPPPPPPPPPPPKQAQAAAAKAAAAAwww8xwwwwwwwww89vvv/zz/stvvvvvjjjjjjjjjggggggghjjjjjjjz3//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPP01333333zzz33333333nHHEEEEEEEEEEEEEEEEE0lDAAAAAAAAAAEEEEEEE88JLDCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIIIAAAAI7zzzzzzzzzzzzzzzpzzzzzzzzzzzzzyEAAAAAACgAAAE8sMMMNOM8MMMMMMMMPPf/AO+//wD7zz/ussstvvvvvvvv/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDvPP003333333zzz33333jDHGEEEEEEEEEEEEEEEEEEE0lDAAAAAEEEEEEEEEEEc8LDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIIIIAAAAAAI5zzzzzzzzzzzzzzzz7ZzzzzzzzzzzzzzyAAAAAAAACgAAEAEHGEc8MMMPGE8sMMMMMMNPPf/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPP/wD+888888//AP8A/wD/AP8A7zz39NNd99999988+++6ywwwAAAABBBBBBBBBBBBBBBBBNNNBxhBBBBBBBBBBBBHPKSwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACCCCCCCCAAAAAAAAAAACOc8888888888888888+6u88888888888884AAAAAAAAAAoABAAtNJBBBBxhPLDBBRxHPDDDDDDDTz3/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A7yywwwgBBBBAAAABBBBBBBBBBBBBNNNBRxxhBBBBBBBBBBBBFNJAyyCCCCCCCCCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABX8888888888888888++88q8888888888888gAAAAAAAAAAApBAAA89999NIABBBRxFNBBBBxhHPDDDDDDDzzz/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/ALzzxxxBBBBBBBBBBAAAABBBBBBBBBFNNJBRxxBBBBBBBBBBBBBBBBFNAQwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBX8888888888888++88899r888888888884AAAAAAAAAAAAEgAAAAc0888999MIAABBBBxhNJBBBBxxBHPPDDDDDDDDBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAAABBBBBBNNNJBRxxhBBBBBBBBBBBBBBBBBBBFNIQwAAAAAAAABBBBBBBBBBBDDPPOOOOMMMOOOOOOOOOOOPLBBBBBDDDOOOOOOMMMOOODDBBBBBBBBBBBBBBX8888888888++88888999r88888888886AAAAAAAAAAAAEgAAAAA88M49998899MIBAAABBBRhFNBBBBBBBRxxxhBDDPPPPPNNNNNNMMMIAEMMMMMMMMMIAAQwwwwAAABBBBBBBBBBBBBBBBBBBBBBBNJRwgABBBBBBBBBBBBBDDPPOOO8888888888888888888888888888s88888888888888888888888LBBBBBBBBBBX888888+++88888899999v08888888+8vAAAAAAAAAAAEgAAAAAA9999scx9999888sMBBAAABBBBxgEMIAAABBBBBBBBBBBBBBBBBBBBBBBBBBBBAAAAAAABBBBBBBBBBBBBBBBBBBBBFNNNBBxxhBBBBBBBBBBBDDPOOM88888888888888888888888888888888888888888888888888888888888888rBBBBBBBBBBX88+++8888888899999999b888888+899KAAAAAAAAAEgAAAAAAAx999999tdx99999988MIBBBAAAABBBBxwAEMMAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBBBBFNNNJBRxxxhBBBBBBBBBBBBBBDPOOO888888++++++++++++++++++++++888888888888888888888888888888888888888888rBBBBBBBBBBV8888888888899999999999a888+888999IAAAAAAAEgAAAAAAAABBx1999999tdx999999988MMABBBBBAAAAAAAABwwwwAAAEMMMMMMMMNNNNNNNNNNJBBBRxxxxhBBBBBBBBBBBBBBBBBBBBBNMMc+++8888888888888899999999999998888888888888888++++++++++++++++++88888888888++rBBBBBBBBBBV88888888899999999999999a+88889999/IAAAAAATIAAAAAAAABBBBRx9999999td51999999999tNNJBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBFNMMc8888888899999999999zzzzz++uOOMMMMMMMO+//wD+889/ffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPKQQQQQQQQQQVfPPPPPPPffffffffffffffffbdPPPffffffSAAAAAwUyAAAAAAADyQQQQQUcffffffffTXcdffffffffffffTTTSQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQTTTTfffPffffffffffffc88/wD44wwzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzwzv33333333333zzzzzzzzzzzzzzzzzzzzzzzzykEEEEEEEEEEEEFHz33333333333333333333313T333333304AAIEEFE4AAAAAAADAI8kEEEFHH/AN9999999Nd5x99999999999999999NNNNNNNNNNNJBBBBBFNNNNNNNNNNNNNN99999999999999999zz3+OMM8888888888888888888888888888888888888888888sMMMMMO+/z19999999999999999888888888pBBBBBBBBBNNN99999999999999999999999999d999999999vCABBBBBnAAAAAMAAAAAwiHJBBDDSy399999999tN9xx999999999999999999999999999999999999999999999999999zzz3+uMMc88888888888888888888888888888888888888888888888888888888888888e39999999999999999999999999999999999999999999999999999999999999p99999999999tIBBBBBBjIAAAAwMAAAAAAAwiPJBDCAQyz/8AffffffffTTXeccfffffffffffffffffffffffffffffffe8888//AK44wzzzzzzzzzzzzzzzz77777777777rLLDDDDDDDDDDDDT7777777zzzzzzzzzzzzzzzzzzzzzzzzyz3333333333333333333333333333333333333333333333333333333333332n3333333333330EEEEEEEcAAMAADAwAAAAAAAADCI8kMIAABDLPf8A9999999999tNNNNd999999999988888uOOOOOe++++++++++++++/wD/AP333/8AzzzyyygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQyy399988++++++888888888888889999999999999999999999999999999999999999999999999999999999999p9999999999999BBBBBBBBnABAAAAAQEAAAAAAAAAAAQiHPDCAAAAAAyyzz3/APfffffffffffffffffffffffffffffffffffff/APvPPPLLIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADP333333zzzzzz777777777773333333333333333333333333333333333333333333333333333333333332n3333333333330EEEEEEEEGcEEAAAAABCAgAAAAAAAAAAAADCIIwwAAAAAAAAAAAADDLLLLLLPPPPPPPPPPPLLLLLLLIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADLLPf333333zzzzzzzzzz3333333333333333333333333333333333333333333333333333333333332n3333333333330EEEEEEEEEEHyw0kAAAAACAwAAAAAAAAAAAAAAAADCAAwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABLf3333333333zzz3333333333333333333333333333333333333333333333333333333333332n3333333333330EEEEEEEEEEHzzzzw0kEAAABCEUkAAAAAAAAAAAAAAAAABDCAAwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADf3333333333313X33333333333333333333333333333333zzz33zzzzzz3333333333333332n3z33333333330EEEEEEEEEGm7rTzzzzyw0EAAAAHGE0kAAAAAAAAAAAAAAAAAAAABDDDAAAwwwwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQwwwwwwwwwwwwwwwAQQwwwwwwwwwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAABb333333333333313X3333333333333333333333333zzz333333333333333zzzz3333333332n333z333333332kEEEEEEEEEXzz57Tzzzzzyw0kAAAAEHCEU0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDDDDDDDDDDDDDDDDDDCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDDDDDCAAAAQwgAAAAAAAAAAAAAABb3333333333333323X333333333333333333333zz333333333333333333333333zzz3333333X3333z33333320EEEEEEEEFHzzzz57Tzzzzzzzyw0kAAAEEADDAE00AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDIckEMIIIIIAAABb333333333333333333333333333333333333zz333333333333333333333333333333zz3333j33333z3333330gEEEEEEEEHzzzzzz47Dzzzzzzzzzyw0kAAEEAAAABDCEE000EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAcEEEEEAAAIJb333333333333333333X333333333333333z333333333333333333333333333333333333z333T333333z33332wAEEEEEEEHzzzzzzzz67rzzzzzzzzzzzyw00EEEAAAAAAAAAADDDCEEU00000kEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsEEEEEEEABT33333333333333333233333333333333z3333333333333333333333333333333333333333zy3X333333z33330kEAEEEEEFLTzzzzzzzz65rTzzzzzzzzzzzzzyw00EEAAAAAAAAAAAAAAAAAAAAAAADDDDDDDDDDDDDDDGEEEEEEEEEEE0000000EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYEEEEEEEEBT333333333333333333333333333333z33333333333333333333333333333333333333333333zr33333333z332wEEEAEEEEABLzzzzzzzzzz57DzzzzzzzzzzzzzzzzywwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDAE00EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYEEEEEEEEFX33333333333333333333333333333z333333333333333nHMMMMMMMMMMMNPPHHX333333333333+/n3333333z330gEEEAEEEIAADL/wA88888888+uew8888888888888888888sMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwxFNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWBBBBBBBBBB199999999999999999999999999899999999999995xjDDDDDDDDDDDDDDDDDDDDDDzx99999999//AP7+ffffffffPfQQQQQAQQAgAAAMf/PPPPPPPPPPrnsPPPPPPPPPPPPPPPPPPPPPPPLDDDDDDAAAAAAAAAAAAQQQQQQQQQQQQQQQAAAAAAAAAAAAAAAAAAAAAAAAAAAEMMMIADDCAAAAAAAAAAAAAAAAFgQQQQQQQQQQfffffffffffffffffPffffffffPffffffffffecQwwwwwwwwwwwwwwwwwwwwwwwwwwwww8dfffff/wD/AP8A39fffffffPaAQQQQQAAwgAAAAMf/APzzzzzzzzzz657DzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzywwwwwwwwwwwwwwAAAAAAEEEEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAADCAQgAAAAAAAAAAABYEEEEEEEEEEFX33333333333333z33333333z3333333333mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMPHX3/8A/wD/AP8AvZ99999998IBBBBBAAABBAAAAA18/wD/ADzzzzzzzzz747rTzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzywwwwwEEEEAAAAAAAAAAAAAAAAAAAAAAAAAAAABCAwAAAAAAAABYEEEEEEEEEEEH3333333333333z333333333333333333EMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNf/8A/wD/AP8A/wD7+fffffffSQQQQSAAAAAQQAAAENfPP/8Azzzzzzzzzz7657rTzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzyw0EAAAAAAAAAAAAAAAAAAAAAAAAAAAAIMAAAAAABYEEEEEEEEEEEH333333333333z33333333333333333mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNf/8A/wD/AP8A/wD/AP8Af1999999NBBBRFAAAAAABAAAAQ1888//APPPPPPPPPPPvvrnutPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLCQAAAAAAAAAAAAAAAAAAAAAAAAAAgQQwgAAAFgQQQQQQQQQQQffffffffffffPfffefffPffffffffYwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwgggggwwwwww1//wD/AP8A/wD/AP8A/wD+/n33333+8kEAFE0AAAAAAEEAABDXzzzz/wD88888888888++8uO+y0888888888888888888888888888888888888888888888888888888sNJAAAAAAAAAAAAAAAAAAAAAAACBBBBDAAASBBBBBBBBBBBB9999999999999999s98999999995DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDCCCCCCCDDDX//AP8A/wD/AP8A/wD/AP8A/wDf1999/wD/AM0AAACEgAAAAAAAEAAADH3zzzzz/wD88888888888++88sM+zz/APPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLDQAAAAAAAAAAAAAAAAAAAAgQQQQQQgKwQQQQQQQQQQQfffffffffffPffffVvPfffffffYwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwggggggk//wD/AP8A/wD/AP8A/wD/AP8A/wD9/X3/AP8A/wAAAAAACQgAAAAAAAEEAABDH3zzzzz/AP8A/PPPPPPPPPPPvvvvPDDDfvusssMPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPCQAAAAAAAAAAAAAAAAAAgQQQQQQBgQQQQQQQQQQQQffffffffffPffffefv/AH33333mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMIIIIIJLf/AP8A/wD/AP8A/wD/AP8A/wD/AP8A2f8A/wD/AAAAAAAAEJCAAAAAAAAAQQAAEMffPPPPPPv/APzzzzzzzzzzzzzz777777zzzzzy4444447777rLDDDTzzzzzzzzzzzzzzzzzzzzzzzzzzwkAAAAAAAAAAAAAAAAAIEEEEEEFAEEEEEEEEEEEEH33333333z333333b/AP8AffffeQwwwwwwwwwwwwwwwwwwwwwwwzzwwssssssssggzzwwwwwwwggggggt//wD/AP8A/wD/AP8A/wD/AP8A/wBf/wD/AAAAAAAAAAEBAAAAAAAAAAQQAAAEMdfPPPPPPPP/APzzzzzzzzzzzzzzzzzzzzzz7777777777777777y44577DTzzzzzzzzzzzzzzzzzzzwAAAAAAAAAAAAAAAAAIEEEEEEGkEEEEEEEEEEEEH3333333z333333n//AP8AfffeQwwwwwwwwwgwwwwwwwwwwz0sggggggggggggggggggsohywwwggggggkt/8A/wD/AP8A/wC//wD/AP8A7/8A/wAAAAAAAAAAABAQAAAAAAAAAAEEAAAADHH3zzzzzzzz/wD/APPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPvrjONPPPPPPPPPPPPPPPPKQAAAAAAAAAAAAAAACwQQQQQQaQQQQQQQQQQQQQfffffffffffffeX/wD/AP8A/feQwwwwwwwwggwwwwwwwwy8ogggggggggggggggggggggggggkojwwggggggs//AP8A/wD/AP7/AP8A/wCv/wD/AAAAAAAAAAAAAAEBAAAAAAAAAAAAQQAAAAEMdfPPPPPPPPP/AP8A88888888888888888888888888888888888888888cw888888888888888AAAAAAAAAAAAAAAArBBBBBBBhBBBBBBBBBBBBA9999999999999/8A/wD/AP8A/cQwwwwwwwwggwwwwwwx0ogggggggggggggggggggggggggggggggkhiggggggkt/wD/AP8A/wD77/8A/wB//wAAAAAAAAAAAAAAABAQAAAAAAAAAAAAEEAAAAABDHXzzzzzzzzzz/8A/wDPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPDOPPPPffPPPPPPPCQAAAAAAAAAAAAAAIwQQQQQQQQQQQQQQQQQQQAffffffPffffff8A/wD/AP8A/wDjDDDDDDDDCCDDDDDDHSCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSiKCCCCCCS/wD/AP8A++++/X//AEiAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAQQAAAAAAEMcffPPPPPPPPPP/8AzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzxzTz3zz33zzzzykAAAAAAAAAAAAAAQEEEEEEEEUEEEEEEEEEEEAD3333z333332f/AP8A/wD/AP8Awwwwwwwwgggwwwww2ggggggggggggggggggggggggggggggggggggggggkCgggggggt//wD/AO+++7//AAkiAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAAQQAAAAAAAAMcffPPPPPPPPPP/8Azzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzxjz3zzz33zzzwAAAAAAAAAAAAABQEEEEEEEFUEEEEEEEEEEAFT3333333332X//AP8A/wD/AP8Awwwwwwwgggwwwwx4ggggggggggggggggggggggggggggggggggggggggggEigggggggkv/8A/wC+++7/AAgkiAAAAAAAAAAAAAAAECAAAAAAAAAAAAAAAAAAQQAAAAAAAAAMcdfPPPPPPPPP/wDzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzxjzzzzzzz3zwAAAAAAAAAAAAABIEEEEEEEFUEEEEEEEEEEEFT333z333333/8A/wD/AP8A/wD/AMMMMMMIIIMMMMNoIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIJIoIIIIIIJL/AP8A/vvvmgggkgAAAAAAAAAAAAAAAECAAAAAAAAAAAAAAAAAAAAQQAAAAAAAAAAEMdfPPPPPPPP/AP8A888888888888888888888888888888988888889AAAAAAAAAAAAAACBBBBBBBBVBBBBBBBBBABBc998999995f8A/wD/AP8A/wD/AP8Awwwwwgggwwwx4ggggggggggggggggggggggggggggggggggggggggggggggAkigggggggkt//vvvvggggpgAAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAQQAAAAAAAAAAAMcffPPPPPPPP/wDzzzzzzzzzzzzzzzzzzzzzzzzzznzzzzzzzywAAAAAAAAAAAACsEEEEEEEFUEEEEEEEEEEEH333333333f/wD/AP8A/wD/AP8A/wDrDDCCCDDDDHiCCCCCCCCCCCCCCCCCCMMMMMMMMMMICCCCCCCCCCCCCCCCCCCCSKCCCCCCCCy/++++CCCCCmAAAAAAAAAAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAABBAAAAAAAAAAAAAxx88888888/8APPPPPPPPPPPPPPPPPPPPPPPLPPPPPPPPPPCAAAAAAAAAAAKwQQQQQQQVQQQQQQQQQAQQfffPffffbf8A/wD/AP8A/wD/AP8A/wDrDCCCCDDDHiCCCCCCCCCCCCCCCGIwCCCCCCCCCCCCSgMCCCCCCCCCCCCCCCCCCSKCCCCCCCCC2+++ACCCCCkAAAAAAAAAAAAAAAAAQIAAAAAAAAAAAAAAAAAAAAAAAAABBBAAAAAAAAAAAAQx1888888/88888888888888888888888V8888888888IAAAAAAAAAADBBBBBBBBVBBBBBBBBABBE99999995f/wD/AP8A/wD/AP8A/wD/AOsIIIIMMMeIIIIIIIIIIIIIIIZCIIIIIIIIIIIIIIIIIJKQkIIIIIIIIIIIIAIIIQIIIIIIIIIL774AAIIIIIwAAAAAAAAAAAAAAAAACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEAAAAAAAAAAAADHXzzzz/AM888888888888888888888988888888888IAAAAAAAAABBBBBBBBBVBBBBBBBBBBBU9899999l//wD/AP8A/wD/AP8A/wD/AOIIIIMMMeIIIIIIIIIIIIIIJiIIIIIIIIIIIIIIIIIIIIIJKcEEIIIIIIIIIAIIIKQIIIIIIIIJb74AAIIIIIKAgAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEAAAAAAAAAAABDHzzzzzzzzzzzzzzzzzzzzzzzzyjzzzzzzzzzzzygAAAAAABQEEEEEEEEFUEEEEEEEAEEFT3z3333l/8A/wD/AP8A/wD/AP8A/wD4gggggwywggggggggggggghIgggggggggggggggggggggggggkyggQwgggggggggggigggggggggvviAAAgggggkSAAAAAAAAAAAAAAAAAAICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQAAAAAAAAAAAMffPPPPPPPPPPPPPPPPPPPPPKPPPPPPPPPPPPPCAAAAAAFAQQQQQQQQUQQQQQQQQAQQVPfffffZf/wD/AP8A/wD/AP8A/wD+IIIIIMNsIIIIIIIIIIIIIISIIIIIIIIIIIIIIIIIIIIIIIIIIIIIcIIEIIIIIIIIIIIQIIIIIIIIJb70gAIIIIIIIGQAAAAAAAAAAAAAAAAAACQgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEAAAAAAAAAAADH3zzzzzzzzzzzzzzzzzzzzzXzzzzzzzzzzzzwgAAAABQEEEEEEEEEEEEEEEEEEEEFTz33331/wD/AP8A/wD/AP8A/wD/AOwggggg2wggggggggggggghIggggggggggggggggggggggggggggggpwggQggggggggggiggggggggkvvfTAAgggggggUSAAAAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAMf8AzzzzzzzzzzzzzzzzzzxXzzzzzzzzzzzzysAAAABQEEEEEEEEEEEEEEEEAEEEFTz3332n/wD/AP8A/wD/AP8A/wD/AIgggggkwggggggggggggghoggggggggggggggggggggggggggggggggowggAwgggggggghAggggggggvvffbAAgggggggURAAAAAAAAAAAAAAAAAAAEBCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAN/PPPPPPPPPPPPPPPPPHfPPPPPPPPPPPPKgQAAAFAQQQQQQQQQaQQQQQQAQQQVPffffd//AP8A/wD/AP8A/wD/APsIIIIIaIIIIIIIIIIIIIIIgIIIIIIIIIIIIIIIIIMMMMMMIIIIIIIIIJIoIIIEIIIIIIIJIIIIIIIIIJT3332wIIIIIIIIEGEAAAAAAAAAAAAAAAAAAABCAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABLzzzzzzzzzzzzzzzzznzzzzzzzzzzzzyoEMAABQEEEEEEEEEGkEEEEEAEEEFT33331//wD/AP8A/wD/AP8A/wDiCCCCCKCCCCCCCCCCCCCCFCCCCCCCCCCCCDDCCCCCCCCCCCCCDDDCCCCCHCCCCCDCCCCCCCoCCCCCCCCU99999sCCCCCCCCBBRIAAAAAAAAAAAAAAAAAAAAAQgMAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAC0888888888888888s8888888888888oBBDAAUBBBBBBBBBBBBBBBBABBBBV9999p/wD/AP8A/wD/AP8A/wD/AMIIIIIKoIIIIIIIIIIIIIFYIIIIIIIIIMMIIIIIIIIIIIIIIIIIIIIMMIIIIIIIIIMIIIIIKkIIIIIIIJD333332wIIIIIIIIEFEQAAAAAAAAAAAAAAAAAAAAAAADAAwgAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABLzzzzzzzzzzzzzzxXzzzzzzzzzzzzwEEEMBQEEEEEEEEEFUEEEEEAEEEFX3332n/AP8A/wD/AO//AP8A+sIIIIIKoIIIIIIIIIIIIEJYIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIMMIIIIIIIIMIIIIKoEIIIIIIIL33333320IIIIIIIIEEGUgAAAAAAAAAAAAAAAAAAAAAAAAABDCAQwwAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABLTzzzzzzzzzzzzznzzzzzzzzzzzzwEEEEJAEEEEEEEEEFEEEEEEAEEEFX3332n/AP8A/wD/AO//AP8A+oIIIIIKoIIIIIIIIIIIIAJYIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIIIIIMIIIIKoIEIIIIIIH733333320IIIIIIIIEEFEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDDCAgAAAAAAAAAAAAAAEAAAAAAAAAAAAALTzzzzzzzzzzzzzzzzzzzzzzzzzwMEEEEIEEEEEEEEEEEkEEEEAEEEFX3332n/AP8A/wD/AO//AP8A+oIIIIIKgIIIIIIIIIIIIIJYIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIKIIIIIIIIMIIIKoIIMIIIIIP7733333320IIIIIIIIEEEGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCQAAAAAAAAAAAAAAEAAAAAAAAAAAAADLzzzzzzzzzzzx3zzzzzzzzzzzysEEEEGsEEEEEEEEEGAEEEEAEEEFX/332n/AP8A/wD/AO//AP8A+oIIIIIKgAIIIIIIIIIIIIJYIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIKoIIEIIIIID77733333320oIIIIIIIIEEFEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAwAAAAAAAAAAAAAEIIIIAAAAAAAAABLzzzzzzzzzzyjzzzzzzzzzzzyoEEEEGEEEEEEEEEEFQEEEEAEEEFX/332n/AP8A/wD/AO//AP8A+oIIIIIKgIIIIIIIIIIIIIJYIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIKoIIIIIIIID777333333330oIIIIIIIIEEEGEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgAAAAAAAAAAAAMAAAAAIIIAAAAABLTzzzzzzzzzzXzzzzzzzzzzzwEEEEFEEEEEEEEEEEAkEEEAEEEFX//AN9p/wD/AP8A/wDv/wD/APqCCCCCCgCACCCCCCCCCCCCWCCCCCDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCDCCCCjCCCBCCCCA+++9999999999OCCCCCCCCCBBBREAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQkAAAAAAAAAAAAAAAAAAAAACCCAAAC08888888885888888888888LBBBBBlBBBBBBBBBAEBBBABBBBV//wD/AGn/AP8A/wD/AO//AP8A+oIIIIIJYIIAIIIIIIIIIIJIoIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIEIIIIL777333333333328IIIIIIIIIAEEFEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgAAAAAAAAAAAAAAAAAAAAAAAIIADLzzzzzzzzzXzzzzzzzzzzyoEEEEFEkEEEEEEEEAEkEEAEEEFH//AP8A6f8A/wD/AP8A77//APqCCCCCCCoCCACCCCCCCCCCCHCCCCDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCXCCCBCCCCC+++9999999999999KCCCCCCCCCABBBRMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhNAAAAAAAAAAADAAAAAAAAAAAACCS888888885888888888888BBBBBBFBBBBBBBBBBEBBBBBBBB//wD/AO//AP8A/wD/AO+//wD6ggggggghAgggAggggggggggpwgggwgggggggggggggggggggggggggggggggggggggggwgglwgggAwgggvvvvfffffffffffffbwggggggggggAQQURAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUITQAAAAAAAAAwAAAAAAAAAAAAAEvPPPPPPPNfPPPPPPPPPPKwQQQQQaQQQQQQQQQASQQQAQQQd/8A/wD/AG//AP8A/wDvvv8A+8IIIIIIIKAIIIAIIIIIIIIIIKcIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIJcIIIIIEMIL77733333333333333304IIIIIIIIIIIEEFGEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBCE0AAAAAAAMAAAAAAAAAAAAAADTzzzzzyzzzzzzzzzzzywEEEEEFEkEEEEEEEAFQEEAEEEFX/AP8A/wD9v/8A/wD/AL7/AP8AwgggggggkigggggAggggQggggpygwgggggggggggggggggggggggggggghogggggggggwgglwgggggggQvvvvffffffffffffffffbSggggggggggggAQQcRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQAEJSQAAAAAwAAAAAAAAAAAAAANfffPPPHfPPPPPPPPPPCwQQQQQRQQQQQQQQQQZAQQQQQQf8A/wD/AP8A9v8A/wD/AL77/wDqCCCCCCCCSCCCCCACCCCCCCCCCSHDDCCCCCCCCCCCCCCCCCCCCCCCCCCGCCCCCCCCCCDCCCXCCCCCCCCB+++8999999999999999999tICCCCCCCCCCCCABBRhMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAxFAAAADAAAAAAAAAAAAAAA1889888188888888888DBBBBBBlBBBBBBBABBJBABBBBV/8A/wD/AP8A3/8A/wD+++//ACggggggggpAggggggAggwggggggkhwwwgggggggggggggggggggggghogggggggggggwgglyggggggggtvvvvfffffffffffffffffffbSAggggggggggggggQURAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAEJSAAAwAAAAAAAAAAAAAANfPPPfLPPPPPPPPPPPLgQQQQQQYQQQQQQQQAUCQQAQQQd//wD/AP8A/wC/f/7777/8IIIIIIIIKAIIIIIIIAAMAIIIIIIJKM8sIIIIIIIIIIIIIIIIIIIZoIIIIIIIIIIIIIIIIJMoIIIIIIJr77733333333333333333333320gAIIIIIIIIIIIIIIKAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAACE0AMAAAAAAAAAAAAABDzzzzz1nzzzzzzzzzzwMEEEEEFEkEEEEEEAEEAEAEEEFX/8A/wD/AP8A/v7/APvvvv6wggggggggkigggggggggAggggggggggkswhggggggggggggghkogggggggggggggggwwggkyggggggv8Ab773333333333333333333333320gAAAIIIIIIIIIIIILKIQwAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAADAUMAAAAAAAAAAAAABHzzzzzyzjzzzzzzzzywEEEEEEFEkEEEEEEEEGQEEEEEH/8A/wD/AP8A/wD/AN/b77768IIIIIIIIIJIQIIIIIIIIIIIIIIIIIIIIIJI4IIIIIIIIY5LIIIIIIIIIIIIIIIIIIIIMIIJMoIIIIL+/b7733333333333333333333333330wAAAAAIIIIIIIIIIIIILKIwgAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAABAcgAAAAAAAAAAAABHzzzzzzyzjzzzzzzzyoEEEEEEFEkEEEEEAEEGQAEEEFH//AP8A/wD/AP8A/wC/b77768IIIIIIIIIIKAoIIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIMIIIcIIIIL/APv2++999999999999999999999999999NIAAAAAAAAACCCCCCCCCCCSyCMIAAAAAAAAAAAAAAAAAAAABAAAAAAAASmIAAAAAAAAAAAAR88888888s48888888LBBBBBBBRJBBBBBABBBkABBBBX/wD/AP8A/wD/AP8A/v2++++uCCCCCCCCCCCCkKCCCCCCDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCDCCCKCCCC/wD/AO/b7733333333333333333333333333320wAAAAAAAAAAAAAAAAAIIIIIJLIAwgAAAAAAAAAAAAAAAAAEAAAAAAABKIgAAAAAAAAAADXzzzzzzzzyzjzzzzzwMEEEEEEFEkEEEEEAEEGAAEEEHf/wD/AP8A/wD/AP8A+/b77764IIIIIIIIIIIJKEsIIIIIIMIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIKoIIIL/AP8A/wC/b777333333333333333333333333333300gAAAAAAAAAAAAAAAAAAAAAAAABCAAwwwwAAAAAAAAAAAEAAAAAAAAAKIgAAAAAAAAADXzzzzzzzzzyxjzzzywEEEEEEEEGUEEEEEEEEFEkEEEH/wD/AP8A/wD/AP8A/wD7+++++uCCCCCCCCCCCCCAiPCCCCCCDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCqCCCC/wD/AP8A/wD2vvvvvvfffffffffffffffffffffffffffbTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEDAAAAAAAAAAQAAAAAAAAAAoiAAAAAAAAANfPPPPPPPPPPN/vPPKgQQQQQQQQZQQQQQAQQQRQQQQUf/wD/AP8A/v8A/wD/AHvvvvvvjgggggggggggggAkohywgggwwgggggggggggggggggggggggggggggggggggggggggggqggggv/EAB0RAQACAgMBAQAAAAAAAAAAABEAAUBQECAwYHD/2gAIAQMBAT8Q4PA0h6GQ4z6nDwex0cF7EMY5fEh8zfpfhfDxflfL3eb9b875ZeiOWMehDHOXwIaevCtPeivyvhl4rzfrfDHHvux4vMfA+PPib6X63vTo9zT3qL9mPN4V83h3H1vh4v1vq+zHtepe16a+a0t+t6+vevcwziupDRHg83pr5rZmPfreQY5jGjO7yaS+a1BpHi8e/O+HAOrgMe5oiHZ5NFfNam/S/C+Hi/K+Xu835vF+d9L0d9GPW9Gdnk0F818rfrfL6GGYh2ehqnQ3zWkYxjGPreHeVe3Id3k0R3c++a0hqb9GXqXKO7GPBoTu5t812rPPdjkX5XrnKPFjwb95vwuV8pXnfq4J1cB8TRupvwuVob0lx4vyvJvitMcPgaI8DQX4Xor9b8n1vHuPN7U8zQnDqni9FfrfjfNS8i/RwGXpzzNAeBpb8XJv1vxvzuVzflfDqnreQcMfA0Tsb4e16i/O5XN+V+16B0LHsaa9XfNbi5XN+V81j3HFdGx0N8151oq4vq9L5fN0lyvW+azL9zqwyCHi8GceBqb7V0IbGvW+azLwDHfE8ngzq86xXKNE+1cX53n3g3oTyeDT153p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";
/* Config sfondi caricati dall'admin (URL pubblici Supabase per tema/dimensione).
   null = usa i wallpaper incorporati WP_LIGHT/WP_DARK. */
let BG_CONF = null;
function Bg(){return null;}

/* HTML grezzo (icone glass) reso in modo sicuro */
function Raw({ html, className, style }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ============================ ICONE LINE (dock/topbar) ================ */
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2.2l2.1 11a1.4 1.4 0 0 0 1.4 1.1h7.8a1.4 1.4 0 0 0 1.4-1.1L20 7H6.2" /></svg>
);
const HomeI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></svg>);
const SearchI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const CatsI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="3" rx="1.4" /><rect width="7" height="7" x="14" y="14" rx="1.4" /><rect width="7" height="7" x="3" y="14" rx="1.4" /></svg>);
const HeartI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>);
const OrdersI = () => (<svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h4" /></svg>);

/* ============================ CARD ==================================== */
function Card({ p, liked, onLike, onOpen, onEdit }) {
  const c0 = p.cols[0];
  return (
    <div className="card in" onClick={onOpen}>
      <div className="ph">
        <img src={colImg(c0)} alt={p.title + (p.category ? " · " + p.category : "")} loading="lazy" decoding="async" />
        <button className="lk" onClick={(e) => { e.stopPropagation(); onLike(p.id); }}>
          <span className={"heart" + (liked ? " liked" : "")}><HeartI /></span>
        </button>
        <div className="cnt"><HeartI /> {p.likeCount}</div>
        {onEdit && <button className="cedit" onClick={(e) => { e.stopPropagation(); onEdit(p); }} aria-label="Modifica"><Pencil /></button>}
      </div>
      <div className="cbody">
        <div className="cardcat"><Raw html={glassIcon(p.categoryIcon, 14)} />{p.categoryName}</div>
        <div className="ct">{p.title}</div>
        <div className="mat">{p.material}</div>
        <div className="cp">{eur(p.price)}</div>
        <button className="configbtn" onClick={(e) => { e.stopPropagation(); onOpen(); }}>Configura</button>
      </div>
    </div>
  );
}

/* ============================ APP ===================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [prints, setPrints] = useState([]);
  const [cats, setCats] = useState([]);
  const [likes, setLikes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("home");
  const [notifOpen, setNotifOpen] = useState(false);
  const [orderFocus, setOrderFocus] = useState(null);
  const [notifSeen, setNotifSeen] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_seen") || "[]"); } catch (e) { return []; } });
  const [notifCleared, setNotifCleared] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_cleared") || "[]"); } catch (e) { return []; } });
  const [detailId, setDetailId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [authGate, setAuthGate] = useState(null);
  const [invId, setInvId] = useState(null);
  const [orderDone, setOrderDone] = useState(false);
  const [editing, setEditing] = useState(null); // {} nuovo, {id..} modifica, null chiuso
  const [editingCat, setEditingCat] = useState(null);
  const [theme, setTheme] = useState("auto"); // "light" | "dark" | "auto" (dispositivo)
  const [toasts, setToasts] = useState([]);
  const [q, setQ] = useState("");

  const isAdmin = user?.is_admin;
  const toast = (m) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, m }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  /* ---- tema ---- */
  const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const applyTheme = (t) => {
    const dark = t === "dark" || (t === "auto" && mq && mq.matches);
    document.body.classList.toggle("dark", !!dark);
  };

  const syncBackstop = () => {
    try {
      const dark = document.body.classList.contains("dark");
      const base = dark ? "#2D2420" : "#EFE7DD";
      // Backstop tinta unita su <html>; il body resta trasparente.
      document.documentElement.style.background = base;
      document.body.style.background = "transparent";
      document.body.style.backgroundImage = "none";
      // Wallpaper su un elemento FISSO figlio diretto di <body>: non e' dentro
      // l'albero React (#root), quindi nessun transform di un antenato puo'
      // "rompere" il position:fixed -> resta fermo mentre scorre il contenuto.
      let bg = document.getElementById("appbg");
      if (!bg) {
        bg = document.createElement("div");
        bg.id = "appbg";
        bg.setAttribute("aria-hidden", "true");
        document.body.insertBefore(bg, document.body.firstChild);
      }
      // Si estende oltre il fondo del viewport (height 118vh) per coprire il
      // "gap" della barra dinamica di iOS: niente piu' striscia chiara in basso.
      bg.style.cssText =
        "position:fixed;top:0;left:0;right:0;height:118vh;z-index:0;pointer-events:none;" +
        "background-size:cover;background-position:center center;background-repeat:no-repeat;";
      applyWallpaper(bg, dark);
      // Solleva il contenuto sopra lo sfondo fisso (niente z-index negativo,
      // che in certi compositing finiva dietro al canvas).
      const r = document.getElementById("root");
      if (r) { r.style.position = "relative"; r.style.zIndex = "1"; }
    } catch (e) {}
  };

  // Sceglie lo sfondo (custom caricato vs incorporato) in base a tema e larghezza
  // (mobile vs pc) e lo applica all'elemento fisso, con fallback se non carica.
  const applyWallpaper = (bg, dark) => {
    if (!bg) bg = document.getElementById("appbg");
    if (!bg) return;
    const fallback = "url(\"" + (dark ? WP_DARK : WP_LIGHT) + "\")";
    let url = null;
    if (BG_CONF) {
      const set = dark ? BG_CONF.dark : BG_CONF.light;
      if (set) {
        const mobile = window.innerWidth <= 820;
        url = mobile ? (set.mobile || set.pc) : (set.pc || set.mobile);
      }
    }
    if (!bg.style.backgroundImage) bg.style.backgroundImage = fallback;
    if (url) {
      const probe = new Image();
      probe.onload = () => { const b = document.getElementById("appbg"); if (b) b.style.backgroundImage = "url(\"" + url + "\")"; };
      probe.onerror = () => { const b = document.getElementById("appbg"); if (b) b.style.backgroundImage = fallback; };
      probe.src = url;
    } else {
      bg.style.backgroundImage = fallback;
    }
  };

  // Carica la config sfondi da Supabase Storage (percorsi fissi nel bucket "prints").
  const loadBackgrounds = async () => {
    try {
      const { data, error } = await supabase.storage.from("prints").list("backgrounds");
      if (error || !data) return;
      const conf = { light: {}, dark: {} };
      let any = false;
      for (const f of data) {
        const m = /^(light|dark)-(pc|mobile)\.webp$/.exec(f.name);
        if (!m) continue;
        const v = f.updated_at ? new Date(f.updated_at).getTime() : Date.now();
        const pub = supabase.storage.from("prints").getPublicUrl("backgrounds/" + f.name).data.publicUrl;
        conf[m[1]][m[2]] = pub + "?v=" + v;
        any = true;
      }
      BG_CONF = any ? conf : null;
      applyWallpaper(null, document.body.classList.contains("dark"));
    } catch (e) {}
  };

  // Admin: genera versioni WebP (pc + mobile) e le carica a percorsi fissi.
  const onUploadBg = async (file, mode) => {
    try {
      const pc = await makeWebp(file, 2560, 0.82);
      const mobile = await makeWebp(file, 1280, 0.8);
      for (const pair of [["pc", pc], ["mobile", mobile]]) {
        const path = "backgrounds/" + mode + "-" + pair[0] + ".webp";
        const { error } = await supabase.storage.from("prints").upload(path, pair[1], { contentType: "image/webp", upsert: true });
        if (error) throw error;
      }
      await loadBackgrounds();
      toast("Sfondo " + (mode === "dark" ? "scuro" : "chiaro") + " aggiornato");
    } catch (e) {
      toast("Errore upload sfondo");
      throw e;
    }
  };
  useEffect(() => { applyTheme(theme); syncBackstop(); }, [theme]);
  useEffect(() => { document.body.removeAttribute("data-bg"); }, []);
  useEffect(() => { loadBackgrounds(); }, []);
  useEffect(() => {
    let t;
    const onR = () => { clearTimeout(t); t = setTimeout(() => applyWallpaper(null, document.body.classList.contains("dark")), 200); };
    window.addEventListener("resize", onR);
    return () => { window.removeEventListener("resize", onR); clearTimeout(t); };
  }, []);

  // Disabilita lo zoom (pinch su iOS, ctrl+rotella e ctrl +/- su desktop, doppio tap).
  useEffect(() => {
    const noGesture = (e) => e.preventDefault();
    const noWheelZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };
    const noKeyZoom = (e) => { if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault(); };
    let lastTouch = 0;
    const noDblTap = (e) => { const now = Date.now(); if (now - lastTouch < 320) e.preventDefault(); lastTouch = now; };
    document.addEventListener("gesturestart", noGesture);
    document.addEventListener("gesturechange", noGesture);
    document.addEventListener("gestureend", noGesture);
    window.addEventListener("wheel", noWheelZoom, { passive: false });
    window.addEventListener("keydown", noKeyZoom);
    document.addEventListener("touchend", noDblTap, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", noGesture);
      document.removeEventListener("gesturechange", noGesture);
      document.removeEventListener("gestureend", noGesture);
      window.removeEventListener("wheel", noWheelZoom);
      window.removeEventListener("keydown", noKeyZoom);
      document.removeEventListener("touchend", noDblTap);
    };
  }, []);

  // Effetto morbido a molla quando si arriva a battuta (sopra o sotto) scrollando.
  // Trasla solo <main.wrap>: dock, topbar e sfondo (#appbg) restano fermi.
  // Risolve <main.wrap> in modo lazy: puo' montare dopo (boot/login iniziale).
  useEffect(() => {
    const MAX = 72;
    let offset = 0, raf = null, settleTO = null;
    const getWrap = () => document.querySelector("main.wrap");
    const atTop = () => window.scrollY <= 0;
    const atBottom = () => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    const apply = () => { const w = getWrap(); if (w) w.style.transform = offset ? "translateY(" + offset.toFixed(1) + "px)" : ""; };
    const spring = () => {
      offset *= 0.82;
      if (Math.abs(offset) < 0.4) { offset = 0; apply(); raf = null; return; }
      apply();
      raf = requestAnimationFrame(spring);
    };
    const release = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(spring); };
    const resist = (add) => {
      const next = offset + add;
      const r = 1 - Math.min(Math.abs(next) / (MAX * 2.2), 0.86);
      offset = Math.max(-MAX, Math.min(MAX, offset + add * r));
    };
    const onWheel = (e) => {
      if (e.ctrlKey) return;
      const dy = e.deltaY;
      if ((atTop() && dy < 0) || (atBottom() && dy > 0)) {
        resist(-dy * 0.32);
        apply();
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        clearTimeout(settleTO);
        settleTO = setTimeout(release, 70);
      } else if (offset) { release(); }
    };
    // Solo desktop (rotella): su mobile lo scroll resta nativo (momentum + rimbalzo iOS).
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(settleTO);
      const w = getWrap(); if (w) w.style.transform = "";
    };
  }, []);
  useEffect(() => {
    if (!mq) return;
    const h = () => { if (theme === "auto") { applyTheme("auto"); syncBackstop(); } };
    mq.addEventListener && mq.addEventListener("change", h);
    return () => { mq.removeEventListener && mq.removeEventListener("change", h); };
  }, [theme]);

  /* ---- carrello locale ---- */
  useEffect(() => {
    try { const s = localStorage.getItem("strato_cart"); if (s) setCart(JSON.parse(s) || []); } catch (e) {}
  }, []);
  const saveCart = (c) => { setCart(c); try { localStorage.setItem("strato_cart", JSON.stringify(c)); } catch (e) {} };
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.qty * c.price, 0);

  /* ---- caricamento dati ---- */
  const loadPrints = async () => {
    const { data } = await supabase
      .from("prints")
      .select("*, print_colors(*), categories(name,icon)")
      .order("created_at", { ascending: false });
    setPrints((data || []).map(mapPrint));
  };
  const loadCats = async () => {
    const { data } = await supabase.from("categories").select("*").order("position", { ascending: true });
    setCats(data || []);
  };
  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    setOrders((data || []).map((o) => ({
      id: o.id, who: o.customer_name || "Cliente", avatar: o.customer_avatar || "",
      status: o.status, total: Number(o.total) || 0, date: o.created_at,
      items: (o.order_items || []).map((it) => ({
        t: it.title, col: it.color_name, base: Number(it.base_price) || 0,
        adds: it.adds || [], opt: it.opt || "", price: Number(it.unit_price) || 0,
        qty: it.qty || 1, img: it.image_url || "",
      })),
    })));
  };

  const bootstrap = async (session) => {
    await Promise.all([loadPrints(), loadCats()]);
    if (!session) { setUser(null); setLikes([]); setOrders([]); return; }
    const au = session.user;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", au.id).maybeSingle();
    if (prof?.pref_theme) setTheme(prof.pref_theme);
    const meta = au.user_metadata || {};
    setUser({
      id: au.id,
      name: prof?.full_name || meta.full_name || meta.name || (au.email ? au.email.split("@")[0] : "Utente"),
      avatar: prof?.avatar_url || meta.avatar_url || meta.picture || "",
      is_admin: !!prof?.is_admin,
    });
    const { data: l } = await supabase.from("likes").select("print_id").eq("user_id", au.id);
    setLikes((l || []).map((r) => r.print_id));
    await loadOrders();
  };

  useEffect(() => {
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await bootstrap(session);
      setReady(true);
      const { data } = supabase.auth.onAuthStateChange((_e, sess) => { bootstrap(sess); });
      sub = data.subscription;
    })();
    return () => { sub && sub.unsubscribe(); };
  }, []);

  // parallax + scrim su scroll
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const sy = window.scrollY || 0;
        document.documentElement.style.setProperty("--par", String(sy));
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [tab, detailId]);

  const changeColorPhoto = async (printId, colorId, file) => {
    if (!file) return;
    try {
      const blob = await compressImage(file);
      const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".jpg";
      const up = await supabase.storage.from("prints").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const url = supabase.storage.from("prints").getPublicUrl(path).data.publicUrl;
      const pr = prints.find((p) => p.id === printId);
      const col = pr && pr.cols.find((c) => c.id === colorId);
      const cur = col && col.imgs ? col.imgs.slice(0, 5) : [];
      const next = [...cur, url].slice(0, 5);
      await supabase.from("print_colors").update({ images: next, image_url: next[0] }).eq("id", colorId);
      await loadPrints();
      toast("Foto aggiunta");
    } catch (e) { toast("Errore upload foto"); }
  };

  const loginGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };
  const logout = async () => { await supabase.auth.signOut(); setTab("home"); };

  const savePrefs = async (patch) => {
    if (!user) return;
    await supabase.from("profiles").update(patch).eq("id", user.id);
  };
  const pickTheme = (t) => { setTheme(t); savePrefs({ pref_theme: t }); };

  const toggleLike = async (id) => {
    if (!user) { setAuthGate("per salvare i preferiti"); return; }
    const liked = likes.includes(id);
    setLikes(liked ? likes.filter((x) => x !== id) : [...likes, id]);
    setPrints((prev) => prev.map((p) => p.id === id ? { ...p, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) } : p));
    if (liked) await supabase.from("likes").delete().eq("user_id", user.id).eq("print_id", id);
    else await supabase.from("likes").insert({ user_id: user.id, print_id: id });
  };

  /* ---- carrello ---- */
  const addToCart = (line) => {
    const ex = cart.find((x) => x.key === line.key);
    let next;
    if (ex) next = cart.map((x) => x.key === line.key ? { ...x, qty: x.qty + line.qty } : x);
    else next = [...cart, line];
    saveCart(next);
    toast(line.t + " ×" + line.qty + " nel carrello");
  };
  const cartStep = (i, d) => {
    const next = cart.map((c, j) => j === i ? { ...c, qty: c.qty + d } : c).filter((c) => c.qty > 0);
    saveCart(next);
  };
  const placeOrder = async () => {
    if (!user) { setCartOpen(false); setAuthGate("per inviare la richiesta d'ordine"); return; }
    if (!cart.length) return;
    const { data: ord, error } = await supabase.from("orders").insert({
      user_id: user.id, customer_name: user.name, customer_avatar: user.avatar || "",
      status: "pending", total: cartTotal,
    }).select().single();
    if (error) { toast("Errore invio ordine"); return; }
    const rows = cart.map((c) => ({
      order_id: ord.id, print_id: c.pid || null, title: c.t, color_name: c.col,
      base_price: c.base, adds: c.adds || [], opt: c.opt || "", unit_price: c.price, qty: c.qty, image_url: c.img || "",
    }));
    const { error: e2 } = await supabase.from("order_items").insert(rows);
    if (e2) { toast("Errore righe ordine"); return; }
    saveCart([]);
    setCartOpen(false);
    await loadOrders();
    setTab("orders");
    setOrderDone(true);
  };
  const setOrderStatus = async (id, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast("Errore aggiornamento"); return; }
    await loadOrders();
    toast(status === "confirmed" ? "Ordine confermato" : "Richiesta rifiutata");
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Eliminare definitivamente questo ordine rifiutato? L'azione è irreversibile.")) return;
    const r1 = await supabase.from("order_items").delete().eq("order_id", id);
    if (r1.error) { toast("Errore: " + r1.error.message); return; }
    const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id");
    if (error) { toast("Errore: " + error.message); return; }
    if (!data || data.length === 0) { toast("Eliminazione bloccata: manca una policy DELETE per gli admin (RLS)."); return; }
    await loadOrders();
    toast("Ordine eliminato");
  };

  /* ---- navigazione ---- */
  const open = (t) => {
    if ((t === "orders" || t === "profile" || t === "liked") && !user) { setAuthGate(t === "orders" ? "per vedere i tuoi ordini" : (t === "liked" ? "per vedere i tuoi preferiti" : "per accedere al profilo")); return; }
    setDetailId(null); setTab(t); window.scrollTo(0, 0);
  };

  const allNotifs = orders
    .filter((o) => isAdmin ? o.status === "pending" : (o.status === "confirmed" || o.status === "rejected"))
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .map((o) => ({
      id: o.id, status: o.status, date: o.date,
      title: isAdmin ? "Nuova richiesta" : (o.status === "confirmed" ? "Ordine confermato" : "Ordine non accettato"),
      body: (o.items[0] ? o.items[0].t : "Ordine") + " · " + eur(o.total) + (isAdmin ? " · " + o.who : ""),
    }));
  const notifSig = (n) => n.id + ":" + n.status;
  const notifs = allNotifs.filter((n) => !notifCleared.includes(notifSig(n)));
  const unread = notifs.filter((n) => !notifSeen.includes(notifSig(n))).length;
  const markNotifsSeen = () => { const all = notifs.map(notifSig); setNotifSeen((prev) => { const m = [...new Set([...prev, ...all])]; try { localStorage.setItem("strato_notif_seen", JSON.stringify(m)); } catch (e) {} return m; }); };
  const clearNotifs = () => { const sigs = notifs.map(notifSig); setNotifCleared((prev) => { const m = [...new Set([...prev, ...sigs])]; try { localStorage.setItem("strato_notif_cleared", JSON.stringify(m)); } catch (e) {} return m; }); };
  const openNotifs = () => { setNotifOpen(true); markNotifsSeen(); };
  const onNotifClick = (id) => { setNotifOpen(false); setTab("orders"); setOrderFocus(id); window.scrollTo(0, 0); };
  const openDetail = (id) => { setDetailId(id); };
  const byId = (id) => prints.find((p) => p.id === id);

  if (!ready) {
    return (<><style>{CSS}</style><Bg /><Raw html={GRADS_SVG} /><div className="boot">Strato…</div></>);
  }

  const adminEdit = isAdmin ? (prod) => { setDetailId(null); setEditing(prod); } : undefined;
  const deletePrint = async (id) => {
    try {
      await supabase.from("print_colors").delete().eq("print_id", id);
      const { error } = await supabase.from("prints").delete().eq("id", id);
      if (error) throw error;
      await Promise.all([loadPrints(), loadCats()]);
      setEditing(null); setDetailId(null);
      toast("Prodotto eliminato");
    } catch (e) { toast("Errore eliminazione"); }
  };
  const saveCategory = async (data) => {
    try {
      if (editingCat && editingCat.id) await supabase.from("categories").update(data).eq("id", editingCat.id);
      else await supabase.from("categories").insert({ ...data, position: cats.length });
      await loadCats(); setEditingCat(null); toast("Categoria salvata");
    } catch (e) { toast("Errore categoria"); }
  };
  const deleteCategory = async (id) => {
    try {
      await supabase.from("categories").delete().eq("id", id);
      await loadCats(); setEditingCat(null); toast("Categoria eliminata");
    } catch (e) { toast("Errore eliminazione"); }
  };
  const liked = (id) => likes.includes(id);
  const detail = detailId ? byId(detailId) : null;
  const inv = invId ? orders.find((o) => o.id === invId) : null;

  return (
    <>
      <style>{CSS}</style>
      <Bg />
      <Raw html={GRADS_SVG} />

      <div className="topscrim" aria-hidden="true" />
      <header className="topbar">
        {tab !== "home"
          ? <button className="tb-btn left tb-back" onClick={() => open("home")} aria-label="Home"><ChevronLeft /></button>
          : <div className="tb-spacer" />}
        <div className="brand2"><span className="mk"><Box /></span>Strato</div>
        <div className="tb-right">
          {user && (
            <button className="tb-btn bell" onClick={openNotifs} aria-label="Notifiche">
              <Bell />{unread > 0 && <span className="belldot" />}
            </button>
          )}
          {user ? (
            <button className="tb-btn right" onClick={() => open("profile")} aria-label="Profilo">
              <img className="av" src={user.avatar || avatarURI(user.name)} alt={"Profilo di " + user.name} />
            </button>
          ) : (
            <button className="tb-btn right tb-login" onClick={() => setAuthGate("per continuare")} aria-label="Accedi"><User /></button>
          )}
        </div>
      </header>

      <main className="wrap">
        {tab === "home" && (
          <Home prints={prints} liked={liked} onLike={toggleLike} onOpen={openDetail} onEdit={adminEdit} />
        )}
        {tab === "search" && (
          <Screen title="Esplora" icon={<SearchI />} action={isAdmin ? <button className="tb-back addnew" onClick={() => setEditingCat({})} aria-label="Nuova categoria"><Plus /></button> : null}>
            <input className="searchbox" placeholder="Cerca per nome, materiale, categoria…" value={q} onChange={(e) => setQ(e.target.value)} />
            {!q.trim() && (
              <>
                <h3 className="osec">Categorie</h3>
                {cats.length === 0 && <p className="empty">Nessuna categoria.{isAdmin ? " Tocca + per aggiungerne." : ""}</p>}
                <div className="catgrid">
                  {cats.map((c) => (
                    <button key={c.id} className="cat glass" onClick={() => setQ(c.name)}>
                      {isAdmin && <span className="cedit catedit2" onClick={(e) => { e.stopPropagation(); setEditingCat(c); }}><Pencil /></span>}
                      <span className="ci"><Raw html={glassIcon(c.icon, 50)} /></span>
                      <span className="catn">{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {q.trim() && (
              <>
                <Grid>
                  {prints.filter((p) => matchQ(p, q)).map((p) => (
                    <Card key={p.id} p={p} liked={liked(p.id)} onLike={toggleLike} onOpen={() => openDetail(p.id)} onEdit={adminEdit} />
                  ))}
                </Grid>
                {prints.filter((p) => matchQ(p, q)).length === 0 && <p className="empty">Nessun risultato.</p>}
              </>
            )}
          </Screen>
        )}
        {tab === "liked" && (
          <Liked likedPrints={prints.filter((p) => liked(p.id))} onOpen={openDetail} onLike={toggleLike} onEdit={adminEdit} />
        )}
        {tab === "orders" && (
          <OrdersTab orders={orders} isAdmin={isAdmin} onOpenOrder={(id) => setInvId(id)}
            onConfirm={(id) => setOrderStatus(id, "confirmed")} onReject={(id) => setOrderStatus(id, "rejected")}
            onDelete={deleteOrder}
            orderFocus={orderFocus} clearFocus={() => setOrderFocus(null)} />
        )}
        {tab === "profile" && user && (
          <Profile user={user} theme={theme} onTheme={pickTheme} onLogout={logout}
            isAdmin={isAdmin} onNewProduct={() => setEditing({})} onUploadBg={onUploadBg}
            likedPrints={prints.filter((p) => liked(p.id))} onOpenProduct={openDetail} onLike={toggleLike} onEditProduct={adminEdit} />
        )}
      </main>

      {/* DOCK */}
      <div className="dockwrap">
        <div className="dock dock5">
          <button className={"dnav home" + (tab === "home" ? " act" : "")} onClick={() => open("home")} aria-label="Home"><HomeI /></button>
          <button className={"dnav search" + (tab === "search" ? " act" : "")} onClick={() => open("search")} aria-label="Esplora"><SearchI /></button>
          <button className={"dnav liked" + (tab === "liked" ? " act" : "")} onClick={() => open("liked")} aria-label="Piaciuti"><HeartI /></button>
          <button className="dnav cart" onClick={() => setCartOpen(true)} aria-label={"Carrello" + (cartCount > 0 ? " (" + cartCount + ")" : "")}><CartIcon />{cartCount > 0 && <span className="cartbadge">{cartCount}</span>}</button>
          <button className={"dnav orders" + (tab === "orders" ? " act" : "")} onClick={() => open("orders")} aria-label="I miei ordini"><OrdersI />{orders.some((o) => o.status === "pending") && isAdmin && <span className="orddot" />}</button>
        </div>
      </div>

      {orderDone && <OrderDoneModal onDone={() => setOrderDone(false)} />}

      {authGate && <AuthGate reason={authGate} onGoogle={loginGoogle} onClose={() => setAuthGate(null)} />}

      {detail && (
        <Detail
          key={detail.id} p={detail} cats={cats} prints={prints}
          onClose={() => setDetailId(null)} onOpen={openDetail}
          onAdd={addToCart} isAdmin={isAdmin} onEdit={adminEdit} onColorPhoto={changeColorPhoto}
          onSaveAddons={async (patch) => { await supabase.from("prints").update(patch).eq("id", detail.id); await loadPrints(); toast("Prezzi aggiornati"); }}
        />
      )}

      {notifOpen && (
        <NotifSheet notifs={notifs} onClose={() => setNotifOpen(false)} onItemClick={onNotifClick} onClear={clearNotifs} />
      )}

      {cartOpen && (
        <CartSheet cart={cart} total={cartTotal} onClose={() => setCartOpen(false)} onStep={cartStep} onConfirm={placeOrder} />
      )}

      {inv && (
        <InvoiceSheet o={inv} isAdmin={isAdmin} onClose={() => setInvId(null)} />
      )}

      {editing && (
        <AdminProduct
          editing={editing.id ? editing : null} cats={cats}
          onClose={() => setEditing(null)}
          onSaved={async () => { await Promise.all([loadPrints(), loadCats()]); setEditing(null); toast("Salvato"); }}
          onDelete={deletePrint}
          user={user} toast={toast}
        />
      )}

      {editingCat && (
        <CategoryEditor cat={editingCat.id ? editingCat : null} onClose={() => setEditingCat(null)} onSave={saveCategory} onDelete={deleteCategory} />
      )}

      <div id="toast">{toasts.map((t) => <div className="tt" key={t.id}>{t.m}</div>)}</div>
    </>
  );
}

function matchQ(p, q) {
  if (!q) return true;
  const s = (p.title + " " + p.material + " " + p.categoryName).toLowerCase();
  return s.includes(q.toLowerCase());
}

function Box() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>);
}

/* ============================ SCHERMATE ============================== */
function Screen({ title, icon, children, heart, action }) {
  return (
    <section className="screen on">
      <div className="titlerow px">
        <h2 className="title">{icon && <span className={"ticon" + (heart ? " heartred" : "")}>{icon}</span>}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }) { return <div className="grid">{children}</div>; }

function Home({ prints, liked, onLike, onOpen, onEdit }) {
  // Una sola tile in evidenza: articolo casuale, nuovo ad ogni refresh del sito.
  const hero = useMemo(() => (prints.length ? prints[Math.floor(Math.random() * prints.length)] : null), [prints.length]);
  return (
    <section className="screen on">
      <div className="px">
        <div className="kick">OGGETTI DA ABITARE</div>
        <h1 className="hero">Design contemporaneo, plasmato strato dopo strato.</h1>
      </div>
      {hero && (
        <div className="herocard" key={hero.id} onClick={() => onOpen(hero.id)}>
          <img src={colImg(hero.cols[0])} alt={hero.title} loading="lazy" decoding="async" />
          <button className="lk" onClick={(e) => { e.stopPropagation(); onLike(hero.id); }} aria-label="Mi piace">
            <span className={"heart" + (liked(hero.id) ? " liked" : "")}><HeartI /></span>
          </button>
          <div className="herotag"><div className="ht">{hero.title}</div><div className="hp">{eur(hero.price)}</div></div>
          {onEdit && <button className="cedit hero" onClick={(e) => { e.stopPropagation(); onEdit(hero); }} aria-label="Modifica"><Pencil /></button>}
        </div>
      )}
      <h2 className="title px">Catalogo</h2>
      {prints.length === 0 && <p className="empty">Nessun prodotto ancora.</p>}
      <Grid>
        {prints.map((p) => <Card key={p.id} p={p} liked={liked(p.id)} onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} />)}
      </Grid>
    </section>
  );
}

/* ---- DETTAGLIO ---- */
function Detail({ p, prints, onClose, onOpen, onAdd, isAdmin, onSaveAddons, onEdit, onColorPhoto }) {
  const [ci, setCi] = useState(0);
  const [qty, setQty] = useState(1);
  const [cable, setCable] = useState("Normale");
  const photoInput = useRef(null);
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const [bulb, setBulb] = useState(1);
  const [holder, setHolder] = useState(1);
  const [editP, setEditP] = useState(false);
  const [ad, setAd] = useState(p.addons);

  const c = p.cols[ci] || p.cols[0];
  const adds = [];
  if (p.isElectrical) {
    if (cable === "Intrecciato") adds.push({ label: "Cavo intrecciato", amt: Number(ad.braided) || 0 });
    if (bulb) adds.push({ label: "Lampadina", amt: Number(ad.bulb) || 0 });
    if (holder) adds.push({ label: "Portalampada", amt: Number(ad.holder) || 0 });
  }
  const unit = p.price + adds.reduce((s, x) => s + x.amt, 0);
  const optLabel = p.isElectrical
    ? "Cavo " + cable.toLowerCase() + " · " + (bulb ? "con" : "senza") + " lampadina · " + (holder ? "con" : "senza") + " portalampada"
    : "";

  const doAdd = (e) => {
    if (e && e.currentTarget) confetti(e.currentTarget);
    onAdd({
      key: p.id + (optLabel ? "|" + optLabel : ""),
      pid: p.id, t: p.title, col: "", opt: optLabel, base: p.price, adds, price: unit,
      qty, img: c.img || "",
    });
  };
  const saveAddons = () => { onSaveAddons({ addon_braided: Number(ad.braided) || 0, addon_bulb: Number(ad.bulb) || 0, addon_holder: Number(ad.holder) || 0 }); setEditP(false); };

  return (
    <div className={"ipick on detailpop" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label={"Dettaglio prodotto: " + p.title} onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap">
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi"><ChevronDown /></button>
        <div className="sheet detailsheet">
        {isAdmin && onEdit && <button className="dedit detailedit" onClick={() => onEdit(p)} aria-label="Modifica"><Pencil /></button>}
        <div className="dgrid">
          <div className="dphoto">
            <div className="dgallery">
              {(c.imgs && c.imgs.length ? c.imgs : [colImg(c)]).map((src, gi) => (
                <img key={gi} className="dimg" src={src || colImg(c)} alt="" />
              ))}
            </div>
            {c.imgs && c.imgs.length > 1 && (
              <div className="gdots">{c.imgs.map((_, gi) => <span key={gi} className="gdot" />)}</div>
            )}
            {isAdmin && onColorPhoto && (
              <>
                <button className="dphotobtn" onClick={() => photoInput.current && photoInput.current.click()} aria-label="Aggiungi foto"><Camera /></button>
                <input ref={photoInput} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { onColorPhoto(p.id, c.id, e.target.files[0]); e.target.value = ""; }} />
              </>
            )}
          </div>
          <div className="dopts">
            {p.categoryName && <div className="dkick">{p.categoryName}</div>}
            <div className="dttl">{p.title}</div>
            <div className="dpricerow">
              <span className="dprice">{eur(p.price)}</span>
              {p.material && <span className="dmat">{p.material}</span>}
            </div>
            {p.desc && <p className="ddesc">{p.desc}</p>}
            <div className="dlabel dcolor">Colori</div>
            <div className="dswatches readonly">
              {p.cols.map((cc, k) => (
                <div key={k} className="dswbox ro">
                  <span className="dsw" style={{ background: "linear-gradient(135deg," + cc.a + " 0%," + cc.a + " 50%," + cc.b + " 50%," + cc.b + " 100%)" }} />
                  <span className="dswn">{cc.name}</span>
                </div>
              ))}
            </div>
            {p.isElectrical && (
              <div>
                <div className="dlabel">Cavo</div>
                <div className="seg">
                  <button className={cable === "Normale" ? "on" : ""} onClick={() => setCable("Normale")}>Normale <i>incluso</i></button>
                  {p.allowBraided && <button className={cable === "Intrecciato" ? "on" : ""} onClick={() => setCable("Intrecciato")}>Intrecciato <i>+{eur(ad.braided)}</i></button>}
                </div>
                <div className="dlabel">Lampadina</div>
                <div className="seg">
                  <button className={!bulb ? "on" : ""} onClick={() => setBulb(0)}>No</button>
                  <button className={bulb ? "on" : ""} onClick={() => setBulb(1)}>Sì <i>+{eur(ad.bulb)}</i></button>
                </div>
                <div className="dlabel">Portalampada</div>
                <div className="seg">
                  <button className={!holder ? "on" : ""} onClick={() => setHolder(0)}>No</button>
                  <button className={holder ? "on" : ""} onClick={() => setHolder(1)}>Sì <i>+{eur(ad.holder)}</i></button>
                </div>
                {isAdmin && (
                  <>
                    <button className="elecedit" onClick={() => setEditP(!editP)}>✎ Prezzi aggiunte (admin)</button>
                    {editP && (
                      <div className="elecprices">
                        <div className="epp"><span>Cavo intrecciato</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.braided} onChange={(e) => setAd({ ...ad, braided: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Lampadina</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.bulb} onChange={(e) => setAd({ ...ad, bulb: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Portalampada</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.holder} onChange={(e) => setAd({ ...ad, holder: e.target.value })} /> €</span></div>
                        <button className="saveaddons" onClick={saveAddons}>Salva prezzi</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="dbuy">
            <div className="dlabel dctr">Quantità</div>
            <div className="qstep dqty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(Math.min(99, qty + 1))}>+</button></div>
            <button className="dadd2" onClick={doAdd}><CartIcon /> {eur(unit * qty)}</button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

/* ---- CARRELLO ---- */
function CartSheet({ cart, total, onClose, onStep, onConfirm }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Carrello" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap">
        <button className="sheetclose" onClick={doClose}><ChevronDown /></button>
        <div className="sheet">
          <h4><CartIcon /> Carrello</h4>
          <div className="cartitems">
            {cart.length === 0 && <div className="cempty">Il carrello è vuoto.</div>}
            {cart.map((c, i) => (
              <div className="crow" key={c.key}>
                <img src={c.img || gimg(c.a || "#cfc4b4", c.b || "#9a8d79")} alt="" />
                <div className="cinfo">
                  <div className="cn">{c.t}</div>
                  <div className="cp">{c.col}{c.opt ? " · " + c.opt : ""}</div>
                  <div className="cprice">{eur(c.price)} · tot {eur(c.price * c.qty)}</div>
                </div>
                <div className="qstep csmall"><button onClick={() => onStep(i, -1)}>−</button><span>{c.qty}</span><button onClick={() => onStep(i, 1)}>+</button></div>
              </div>
            ))}
          </div>
          <div className="cttot"><span>Totale</span><span>{eur(total)}</span></div>
          {cart.length > 0 && <button className="qsend" onClick={onConfirm}><Check /> Conferma ordine</button>}
        </div>
      </div>
    </div>
  );
}

/* ---- ORDINI ---- */
function OrdersScreen({ orders, isAdmin, onOpen, onConfirm, onReject }) {
  const pend = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status === "confirmed");
  const oTitle = (o) => o.items.length > 1 ? o.items.length + " articoli" : (o.items[0] ? o.items[0].t : "Ordine");
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><OrdersI /></span>Ordini</h2>
      {pend.length > 0 && <h3 className="osec">In attesa</h3>}
      {pend.map((o) => (
        <div className="banner glass" key={o.id}>
          {isAdmin && <img className="bnav" src={o.avatar || avatarURI(o.who)} alt="" />}
          <div className="txt" onClick={() => onOpen(o.id)} style={{ cursor: "pointer" }}>
            <b>{isAdmin ? "Nuova richiesta" : "La tua richiesta"}</b> · {oTitle(o)} · {eur(o.total)}{isAdmin ? " da " + o.who : ""}<br />
            <span style={{ color: "var(--soft)", fontSize: "12.5px" }}>Tocca per il dettaglio{isAdmin ? " · conferma per avvisare il cliente" : ""}</span>
          </div>
          <span className="badge bp">In attesa di conferma</span>
          {isAdmin && <button className="btnY" onClick={() => onConfirm(o.id)}>Conferma</button>}
          {isAdmin && <button className="btnN" onClick={() => onReject(o.id)}>Rifiuta</button>}
        </div>
      ))}
      <h3 className="osec">Effettuati</h3>
      {done.length === 0 && <p className="empty">Nessun ordine effettuato.</p>}
      {done.map((o) => (
        <div className="ord glass" key={o.id} onClick={() => onOpen(o.id)}>
          <img src={o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79")} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{oTitle(o)}</div>
            <div className="s">{isAdmin ? o.who + " · " : ""}{eur(o.total)}{o.date ? " · " + fmtDate(o.date) : ""}</div>
          </div>
          <span className="badge bc">Confermato</span>
        </div>
      ))}
    </section>
  );
}

/* ---- RIEPILOGO ORDINE ---- */
function OrderDoneModal({ onDone }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setClosing(true), 3600);
    const t2 = setTimeout(onDone, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className={"odone" + (closing ? " out" : "")} role="dialog" aria-modal="true" aria-label="Ordine inviato" onClick={() => { setClosing(true); setTimeout(onDone, 380); }}>
      <div className="odcard">
        <div className="odicon"><Check /></div>
        <div className="odt">Ordine inviato</div>
        <div className="ods">Il tuo acquisto è in attesa di conferma. Ti avviseremo appena verrà accettato.</div>
      </div>
    </div>
  );
}

function AuthGate({ reason, onGoogle, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="odone" role="dialog" aria-modal="true" aria-label="Accedi per continuare" onClick={(e) => { if (e.target.classList.contains("odone")) onClose(); }}>
      <div className="odcard authcard">
        <div className="odicon"><User /></div>
        <div className="odt">Accedi per continuare</div>
        <div className="ods">Ti serve un account {reason}. Bastano pochi secondi.</div>
        <button className="gbtn authgbtn" onClick={onGoogle}><GoogleIcon /> Continua con Google</button>
        <button className="authlater" onClick={onClose}>Più tardi</button>
      </div>
    </div>
  );
}

function InvoiceSheet({ o, isAdmin, onClose }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Dettaglio ordine" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap">
        <button className="sheetclose" onClick={doClose}><ChevronDown /></button>
        <div className="sheet inv">
          <div className="invhead">
            {isAdmin && <img className="invav" src={o.avatar || avatarURI(o.who)} alt="" />}
            <div className="invwho">
              <div className="invtt">{isAdmin ? o.who : "Il tuo ordine"}</div>
              <div className="invmeta"><span className={"badge " + (o.status === "confirmed" ? "bc" : "bp")}>{o.status === "confirmed" ? "Confermato" : "In attesa di conferma"}</span>{o.date ? " · " + fmtDate(o.date) : ""}</div>
            </div>
          </div>
          <div className="invitems">
            {o.items.map((it, i) => {
              const base = it.base != null ? it.base : it.price;
              const adds = it.adds || [];
              return (
                <div className="iitem" key={i}>
                  <div className="iline"><img className="ithumb" src={it.img || gimg("#cfc4b4", "#9a8d79")} alt="" /><b className="iname">{it.t}{it.col ? " · " + it.col : ""}</b><span className="ix">×{it.qty}</span></div>
                  <div className="ibd"><span>Base</span><span>{eur(base)}</span></div>
                  {adds.map((a, k) => <div className="ibd" key={k}><span>+ {a.label}</span><span>+{eur(a.amt)}</span></div>)}
                  {adds.length > 0 && <div className="ibd ifin"><span>Prezzo unitario</span><span>{eur(it.price)}</span></div>}
                  <div className="ibd isub"><span>Subtotale{it.qty > 1 ? " (×" + it.qty + ")" : ""}</span><span>{eur(it.price * it.qty)}</span></div>
                </div>
              );
            })}
          </div>
          <div className="cttot invtotrow"><span>Totale</span><span className="invtot">{eur(o.total)}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ---- PIACIUTI ---- */
function Liked({ likedPrints, onOpen, onLike, onEdit }) {
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><HeartI /></span>Piaciuti</h2>
      {likedPrints.length === 0 && <p className="empty">Non hai ancora messo mi piace a nulla.</p>}
      {likedPrints.length > 0 && (
        <Grid>{likedPrints.map((p) => <Card key={p.id} p={p} liked onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} />)}</Grid>
      )}
    </section>
  );
}

/* ---- PROFILO ---- */
function OrdersTab({ orders, isAdmin, onOpenOrder, onConfirm, onReject, onDelete, orderFocus, clearFocus }) {
  const orderRefs = useRef({});
  useEffect(() => {
    if (orderFocus && orderRefs.current[orderFocus]) {
      orderRefs.current[orderFocus].scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => clearFocus && clearFocus(), 2600);
      return () => clearTimeout(t);
    }
  }, [orderFocus]);
  const oTitle = (o) => o.items.length > 1 ? o.items.length + " articoli" : (o.items[0] ? o.items[0].t : "Ordine");
  const pend = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status === "confirmed");
  const rej = orders.filter((o) => o.status === "rejected");
  const setRef = (id) => (el) => { orderRefs.current[id] = el; };
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><OrdersI /></span>I miei ordini</h2>
      {orders.length === 0 && <p className="empty">Nessun ordine ancora.</p>}
      {pend.length > 0 && <h3 className="osec">In attesa</h3>}
      {pend.map((o) => (
        <div className={"banner glass" + (orderFocus === o.id ? " ofocus" : "")} key={o.id} ref={setRef(o.id)}>
          {isAdmin && <img className="bnav" src={o.avatar || avatarURI(o.who)} alt="" />}
          <div className="txt" onClick={() => onOpenOrder(o.id)} style={{ cursor: "pointer" }}>
            <b>{isAdmin ? "Nuova richiesta" : "La tua richiesta"}</b> · {oTitle(o)} · {eur(o.total)}{isAdmin ? " da " + o.who : ""}<br />
            <span style={{ color: "var(--soft)", fontSize: "12.5px" }}>Tocca per il dettaglio{isAdmin ? " · conferma per avvisare il cliente" : ""}</span>
          </div>
          {isAdmin && <button className="btnY" onClick={() => onConfirm(o.id)}>Conferma</button>}
          {isAdmin && <button className="btnN" onClick={() => onReject(o.id)}>Rifiuta</button>}
        </div>
      ))}
      {done.length > 0 && <h3 className="osec">Effettuati</h3>}
      {done.map((o) => (
        <div className={"ord glass" + (orderFocus === o.id ? " ofocus" : "")} key={o.id} ref={setRef(o.id)} onClick={() => onOpenOrder(o.id)}>
          <img src={o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79")} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{oTitle(o)}</div>
            <div className="s">{isAdmin ? o.who + " · " : ""}{eur(o.total)}{o.date ? " · " + fmtDate(o.date) : ""}</div>
          </div>
          <span className="badge bc">Confermato</span>
        </div>
      ))}
      {rej.length > 0 && <h3 className="osec">Non accettati</h3>}
      {rej.map((o) => (
        <div className={"ord glass" + (orderFocus === o.id ? " ofocus" : "")} key={o.id} ref={setRef(o.id)} onClick={() => onOpenOrder(o.id)}>
          <img src={o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79")} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{oTitle(o)}</div>
            <div className="s">{isAdmin ? o.who + " · " : ""}{eur(o.total)}{o.date ? " · " + fmtDate(o.date) : ""}</div>
          </div>
          <span className="badge br">Rifiutato</span>
          {isAdmin && <button className="orddel" onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} aria-label="Elimina ordine"><Trash /></button>}
        </div>
      ))}
    </section>
  );
}

function Profile({ user, theme, onTheme, onLogout, isAdmin, onNewProduct, onUploadBg, likedPrints, onOpenProduct, onLike, onEditProduct }) {
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><User /></span>Profilo</h2>
      <div className="pcard glass">
        <img className="pav" src={user.avatar || avatarURI(user.name)} alt="" />
        <div><div className="pname">{user.name}</div><div className="prole">{isAdmin ? "Amministratore" : "Cliente"}</div></div>
      </div>
      {isAdmin && <button className="qsend" style={{ marginTop: 14 }} onClick={onNewProduct}><Plus /> Nuovo prodotto</button>}
      {isAdmin && <BgUploader onUpload={onUploadBg} />}
      <div className="psec">Tema</div>
      <div className="prefrow">
        <div className="themeseg compact">
          {[["light", "Luce", <Sun key="s" />], ["dark", "Buio", <Moon key="m" />], ["auto", "Automatico", <AutoI key="a" />]].map(([t, label, icon]) => (
            <button key={t} className={"segbtn" + (theme === t ? " on" : "")} onClick={() => onTheme(t)} aria-pressed={theme === t} aria-label={label}>
              <span className="segico">{icon}</span><span className="seglbl">{label}</span>
            </button>
          ))}
        </div>
        <button className="logout side" onClick={onLogout} aria-label="Esci"><LogOut /><span>Esci</span></button>
      </div>
    </section>
  );
}
/* ---- ADMIN: caricamento sfondo (chiaro/scuro) ---- */
function BgUploader({ onUpload }) {
  const [busy, setBusy] = useState("");
  const pick = async (mode, file) => {
    if (!file || busy) return;
    setBusy(mode);
    try { await onUpload(file, mode); } catch (e) {}
    setBusy("");
  };
  return (
    <>
      <div className="psec">Sfondo app</div>
      <div className="bgup">
        <label className={"bgupbtn" + (busy === "light" ? " busy" : "")}>
          <span className="bgupi"><Sun /></span>
          <span className="bgupt">Sfondo chiaro</span>
          <span className="bgups">{busy === "light" ? "Carico…" : "Carica immagine"}</span>
          <input type="file" accept="image/*" onChange={(e) => pick("light", e.target.files[0])} disabled={!!busy} />
        </label>
        <label className={"bgupbtn dark" + (busy === "dark" ? " busy" : "")}>
          <span className="bgupi"><Moon /></span>
          <span className="bgupt">Sfondo scuro</span>
          <span className="bgups">{busy === "dark" ? "Carico…" : "Carica immagine"}</span>
          <input type="file" accept="image/*" onChange={(e) => pick("dark", e.target.files[0])} disabled={!!busy} />
        </label>
      </div>
      <p className="bgnote">Carica un'immagine ad alta risoluzione: vengono generate in automatico versioni WebP leggere ottimizzate per smartphone e PC.</p>
    </>
  );
}

/* ---- LOGIN (solo Google) ---- */
function Login({ onGoogle }) {
  return (
    <div className="loginwrap">
      <div className="loginbox glass">
        <div className="brand2 big"><span className="mk"><Box /></span>Strato</div>
        <p className="lsub">Oggetti di design per la casa</p>
        <button className="gbtn" onClick={onGoogle}><GoogleIcon /> Continua con Google</button>
      </div>
    </div>
  );
}
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-17z" /><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.3-4.6 2.1-8.2 2.1-6.4 0-11.7-3.8-13.6-9.3l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
);

/* ---- ADMIN: editor prodotto (con colori) ---- */
function AdminProduct({ editing, cats, onClose, onSaved, onDelete, user, toast }) {
  const [f, setF] = useState(editing ? {
    title: editing.title, price: editing.price, material: editing.material, desc: editing.desc,
    category_id: editing.category_id || "", is_electrical: editing.isElectrical,
    addon_braided: editing.addons.braided, addon_bulb: editing.addons.bulb, addon_holder: editing.addons.holder,
    allow_braided: editing.allowBraided !== false, featured: !!editing.featured,
  } : { title: "", price: "", material: "", desc: "", category_id: "", is_electrical: false, addon_braided: 6, addon_bulb: 5, addon_holder: 8, allow_braided: true, featured: false });
  const [colors, setColors] = useState(editing ? editing.cols.map((c) => ({ name: c.name, color_a: c.a, color_b: c.b, imgs: (c.imgs || []).map((u) => ({ url: u, file: null, preview: u })) })) : [{ name: "Naturale", color_a: "#cfc4b4", color_b: "#9a8d79", imgs: [] }]);
  const [busy, setBusy] = useState(false);

  const upd = (k, v) => setF({ ...f, [k]: v });
  const updCol = (i, k, v) => setColors(colors.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const addCol = () => setColors([...colors, { name: "", color_a: "#cccccc", color_b: "#999999", imgs: [] }]);
  const delCol = (i) => setColors(colors.filter((_, j) => j !== i));
  const addColImage = async (i, file) => {
    if (!file) return;
    const blob = await compressImage(file);
    setColors((cs) => cs.map((c, j) => j === i ? { ...c, imgs: [...(c.imgs || []), { url: "", file: blob, preview: URL.createObjectURL(blob) }].slice(0, 5) } : c));
  };
  const delColImage = (i, j) => setColors((cs) => cs.map((c, k) => k === i ? { ...c, imgs: (c.imgs || []).filter((_, m) => m !== j) } : c));

  const uploadOne = async (blob) => {
    const path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".jpg";
    const { error } = await supabase.storage.from("prints").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return supabase.storage.from("prints").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!f.title || !f.price) { toast("Titolo e prezzo obbligatori"); return; }
    setBusy(true);
    try {
      const payload = {
        title: f.title, price: Number(f.price) || 0, material: f.material, description: f.desc,
        category_id: f.category_id || null, is_electrical: !!f.is_electrical, allow_braided: !!f.allow_braided, featured: !!f.featured,
        addon_braided: Number(f.addon_braided) || 0, addon_bulb: Number(f.addon_bulb) || 0, addon_holder: Number(f.addon_holder) || 0,
      };
      let printId = editing ? editing.id : null;
      if (editing) {
        await supabase.from("prints").update(payload).eq("id", editing.id);
      } else {
        const { data, error } = await supabase.from("prints").insert({ ...payload, created_by: user.id, images: [] }).select().single();
        if (error) throw error;
        printId = data.id;
      }
      // colori: rimpiazza in blocco
      await supabase.from("print_colors").delete().eq("print_id", printId);
      let pos = 0;
      for (const c of colors) {
        const urls = [];
        for (const im of (c.imgs || []).slice(0, 5)) {
          if (im.url) urls.push(im.url);
          else if (im.file) urls.push(await uploadOne(im.file));
        }
        await supabase.from("print_colors").insert({
          print_id: printId, name: c.name || "Colore", color_a: c.color_a, color_b: c.color_b,
          images: urls, image_url: urls[0] || null, position: pos++,
        });
      }
      await onSaved();
    } catch (e) {
      toast("Errore salvataggio prodotto");
      setBusy(false);
    }
  };

  return (
    <div className="ipick on">
      <div className="sheet admin">
        <button className="sheetclose" onClick={onClose}><ChevronDown /></button>
        <h4><Pencil /> {editing ? "Modifica prodotto" : "Nuovo prodotto"}</h4>
        <div className="afield"><label>Titolo</label><input value={f.title} onChange={(e) => upd("title", e.target.value)} /></div>
        <div className="afrow">
          <div className="afield"><label>Prezzo (€)</label><input type="number" step="0.5" value={f.price} onChange={(e) => upd("price", e.target.value)} /></div>
          <div className="afield"><label>Materiale</label><input value={f.material} onChange={(e) => upd("material", e.target.value)} /></div>
        </div>
        <div className="afield"><label>Categoria</label>
          <select value={f.category_id} onChange={(e) => upd("category_id", e.target.value)}>
            <option value="">— nessuna —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="afield"><label>Descrizione</label><textarea rows="2" value={f.desc} onChange={(e) => upd("desc", e.target.value)} /></div>
        <label className="achk"><input type="checkbox" checked={f.featured} onChange={(e) => upd("featured", e.target.checked)} /> Mostra nel carosello in evidenza</label>
        <label className="achk"><input type="checkbox" checked={f.is_electrical} onChange={(e) => upd("is_electrical", e.target.checked)} /> Articolo a corrente (aggiunte elettriche)</label>
        {f.is_electrical && (
          <>
            <label className="achk"><input type="checkbox" checked={f.allow_braided} onChange={(e) => upd("allow_braided", e.target.checked)} /> Permetti cavo intrecciato (altrimenti solo Normale)</label>
            <div className="afrow3">
              {f.allow_braided && <div className="afield"><label>Cavo intrecciato +€</label><input type="number" step="0.5" value={f.addon_braided} onChange={(e) => upd("addon_braided", e.target.value)} /></div>}
              <div className="afield"><label>Lampadina +€</label><input type="number" step="0.5" value={f.addon_bulb} onChange={(e) => upd("addon_bulb", e.target.value)} /></div>
              <div className="afield"><label>Portalampada +€</label><input type="number" step="0.5" value={f.addon_holder} onChange={(e) => upd("addon_holder", e.target.value)} /></div>
            </div>
          </>
        )}
        <div className="psec">Colori / foto (max 5 per colore)</div>
        {colors.map((c, i) => (
          <div className="colrow2" key={i}>
            <div className="colhead">
              <input className="colname" placeholder="Nome colore" value={c.name} onChange={(e) => updCol(i, "name", e.target.value)} />
              <input type="color" value={c.color_a} onChange={(e) => updCol(i, "color_a", e.target.value)} aria-label="Colore 1" />
              <input type="color" value={c.color_b} onChange={(e) => updCol(i, "color_b", e.target.value)} aria-label="Colore 2" />
              {colors.length > 1 && <button className="coldel" onClick={() => delCol(i)} aria-label="Rimuovi colore"><Trash2 /></button>}
            </div>
            <div className="colphotos">
              {(c.imgs || []).map((im, j) => (
                <div className="colph" key={j}>
                  <img src={im.preview || im.url || gimg(c.color_a, c.color_b)} alt="" />
                  <button className="colphdel" onClick={() => delColImage(i, j)} aria-label="Rimuovi foto">×</button>
                  {j === 0 && <span className="colphmain">Principale</span>}
                </div>
              ))}
              {(c.imgs || []).length < 5 && (
                <label className="coladd"><Plus /><input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { addColImage(i, e.target.files[0]); e.target.value = ""; }} /></label>
              )}
            </div>
            <div className="colhint">{(c.imgs || []).length}/5 foto · la prima è la principale</div>
          </div>
        ))}
        <button className="addcolor" onClick={addCol}><Plus /> Aggiungi colore</button>
        <button className="qsend" disabled={busy} onClick={save}>{busy ? "Salvataggio…" : "Salva prodotto"}</button>
        {editing && onDelete && (
          <button className="delbtn" onClick={() => { if (window.confirm("Eliminare definitivamente questo prodotto? L'azione è irreversibile.")) onDelete(editing.id); }}><Trash2 /> Elimina prodotto</button>
        )}
      </div>
    </div>
  );
}

function NotifSheet({ notifs, onClose, onItemClick, onClear }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  return (
    <div className={"ipick top on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Notifiche" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap">
        <div className="sheet">
          <div className="notifhead">
            <h4><Bell /> Notifiche</h4>
            {notifs.length > 0 && <button className="notifclear" onClick={onClear}><Trash /> Elimina tutte</button>}
          </div>
          <div className="cartitems">
            {notifs.length === 0 && <div className="cempty">Nessuna notifica per ora.</div>}
            {notifs.map((n) => (
              <button className="notifrow" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
                <span className={"notifdot s-" + n.status} />
                <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
                <span className="notifarrow">›</span>
              </button>
            ))}
          </div>
        </div>
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi"><ChevronUp /></button>
      </div>
    </div>
  );
}

function CategoryEditor({ cat, onClose, onSave, onDelete }) {
  const [name, setName] = useState(cat ? cat.name : "");
  const [icon, setIcon] = useState(cat ? cat.icon : "vaso");
  const [busy, setBusy] = useState(false);
  return (
    <div className="ipick on">
      <div className="sheet admin">
        <button className="sheetclose" onClick={onClose}><ChevronDown /></button>
        <h4><span className="ticon"><CatsI /></span> {cat ? "Modifica categoria" : "Nuova categoria"}</h4>
        <div className="afield"><label>Nome</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Lampade" /></div>
        <div className="psec">Icona</div>
        {ICON_GROUPS.map((g) => (
          <div key={g.t}>
            <div className="iggroup">{g.t}</div>
            <div className="ig">
              {g.keys.map((k) => (
                <button key={k} className={"ib" + (icon === k ? " on" : "")} onClick={() => setIcon(k)}><Raw html={glassIcon(k, 30)} /></button>
              ))}
            </div>
          </div>
        ))}
        <button className="qsend" disabled={busy || !name.trim()} onClick={async () => { setBusy(true); await onSave({ name: name.trim(), icon }); }}>{cat ? "Salva" : "Crea categoria"}</button>
        {cat && <button className="delbtn" onClick={() => { if (window.confirm("Eliminare la categoria? Gli articoli resteranno senza categoria.")) onDelete(cat.id); }}><Trash2 /> Elimina categoria</button>}
      </div>
    </div>
  );
}

const Sun = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>);
const Moon = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.2A8 8 0 0 1 9.8 4 7.2 7.2 0 1 0 20 14.2z" /></svg>);
const AutoI = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.4" /><path d="M12 3.6a8.4 8.4 0 0 0 0 16.8z" fill="currentColor" stroke="none" /></svg>);
const Bell = () => (<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.6 7.6-2.6 7.6h17.2S18 14.5 18 8.5" /><path d="M13.6 21a2 2 0 0 1-3.2 0" /></svg>);
const Trash = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>);

/* icone lucide minimali (inline per non dipendere troppo) */
const ChevronLeft = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>);
const ChevronDown = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const ChevronUp = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>);
const Check = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
const User = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
const LogOut = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
const Plus = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
const Pencil = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
const Trash2 = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
const Upload = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>);
const Camera = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
