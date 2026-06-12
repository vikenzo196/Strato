import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

/* ============================ STILE (Liquid Glass) ===================== */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root{
    --text:#2b2620; --soft:rgba(43,38,32,.66); --faint:rgba(43,38,32,.42);
    --glass:rgba(255,255,255,.22); --glass2:rgba(255,255,255,.38);
    --strokeSoft:rgba(255,255,255,.5); --hi:rgba(255,255,255,.5); --glassDock:rgba(249,246,241,.82);
    --shadow:0 14px 44px rgba(60,40,30,.22); --txtShadow:rgba(70,45,30,.32);
    --shx:0px; --shy:14px; --shblur:44px; --shcol:rgba(60,40,30,.22); --hlx:32%; --hly:10%;
    --b1:#edc9b2; --b2:#bcd1ad; --b3:#eab9a6; --b4:#cdbce0; --bg:#ece2d6; --heart:#d9624e;
    --card:rgba(255,255,255,.5);
  }
  body.dark{
    --text:#f1ece5; --soft:rgba(241,236,229,.7); --faint:rgba(241,236,229,.42);
    --glass:rgba(255,255,255,.10); --glass2:rgba(255,255,255,.18);
    --strokeSoft:rgba(255,255,255,.18); --hi:rgba(255,255,255,.2); --glassDock:rgba(26,23,20,.76);
    --shadow:0 16px 48px rgba(0,0,0,.55); --txtShadow:rgba(0,0,0,.55);
    --shy:16px; --shblur:48px; --shcol:rgba(0,0,0,.55);
    --b1:#6a4f3a; --b2:#3f5140; --b3:#6b463b; --b4:#473b5e; --bg:#1a1714; --heart:#ec8b78;
    --card:rgba(40,36,31,.54);
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  .bgttl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:17px;color:var(--text);margin:18px 2px 8px}
  .bgpick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
  .bgsw{border:1px solid var(--strokeSoft);border-radius:16px;padding:8px;cursor:pointer;background:var(--glass2);display:flex;flex-direction:column;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--text);transition:box-shadow .15s, transform .12s;box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.10)}
  .bgsw:active{transform:scale(.97)}
  .bgsw .sw{width:100%;height:40px;border-radius:11px;border:1px solid var(--strokeSoft)}
  .bgsw.act{box-shadow:inset 0 1px 0 var(--hi), 0 0 0 2px var(--text)}
  html,body{margin:0;min-height:100%;}
  body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--text);background:var(--bg);overflow-x:hidden;}

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

  .wrap{max-width:760px;margin:0 auto;padding:66px 16px 140px;}

  .eyebrow{margin:14px 4px 0;color:var(--soft);font-weight:600;font-size:12.5px;letter-spacing:1.4px;text-transform:uppercase;}
  h1.hero{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:33px;letter-spacing:-1px;line-height:1.12;margin:8px 4px 16px;}
  h2.title{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:27px;letter-spacing:-.5px;margin:10px 4px 16px;display:flex;align-items:center;gap:10px;}
  .ticon{width:28px;height:28px;flex:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.5))}

  .heroCard{border-radius:30px;overflow:hidden;position:relative;aspect-ratio:3/2;}
  .heroCard>img{width:100%;height:100%;object-fit:cover;display:block;}
  .chip{position:absolute;left:14px;bottom:14px;padding:10px 14px;border-radius:18px;}
  .chip .t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:18px}
  .chip .p{font-size:13px;color:var(--soft)}
  .dots{position:absolute;bottom:18px;right:18px;display:flex;gap:6px}
  .dots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.6)} .dots i.on{width:18px;background:#fff}

  .sec{display:flex;align-items:center;justify-content:space-between;margin:30px 4px 14px}
  .sec h2{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:22px;margin:0}

  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
  .card{border-radius:26px;overflow:hidden;display:flex;flex-direction:column;background:var(--card);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:0 10px 26px var(--shcol)}
  .card::before{display:none}
  .card .ph{position:relative;aspect-ratio:1}
  .card .ph img{width:100%;height:100%;object-fit:cover;display:block}
  .lk{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.62);box-shadow:0 3px 10px rgba(0,0,0,.22);transition:transform .15s}
  .card .cnt{position:absolute;bottom:10px;left:10px;display:flex;align-items:center;gap:4px;font-size:11px;color:#fff;background:rgba(0,0,0,.5);padding:3px 8px;border-radius:20px}
  .card .body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:9px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .row .t{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:17px}
  .row .p{font-weight:700;white-space:nowrap}
  .mat{font-size:12.5px;color:var(--soft)}
  .qstep{display:flex;align-items:center;gap:8px}
  .qstep button{width:38px;height:38px;border-radius:12px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;font-weight:600;cursor:pointer;display:grid;place-items:center}
  .qstep span{min-width:26px;text-align:center;font-weight:700;font-size:17px;color:var(--text)}
  .qsend{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:16px;border:1px solid var(--strokeSoft);background:linear-gradient(135deg,#bb8b72,#8c6856);color:#fff;font-weight:600;font-size:15px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 22px var(--shcol);transition:transform .12s}
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
  .cat{position:relative;border-radius:22px;padding:24px 14px 18px;display:flex;flex-direction:column;align-items:center;gap:14px;cursor:pointer;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:21px;text-align:center}
  .cat .ci{position:relative;display:grid;place-items:center}
  .cat .ci .gico{width:57px;height:57px}
  .catedit{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 4px 12px rgba(0,0,0,.2)}
  .catedit:active{transform:scale(.92)}
  .catedit svg{width:18px;height:18px}
  .gico{display:block;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.6px .6px rgba(255,255,255,.55))}
  .cathint{margin:16px 4px 14px;color:var(--soft,#9a8d7d);font-size:13px}
  .ipick{position:fixed;inset:0;z-index:85;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .28s ease, background .28s ease, visibility .28s}
  .ipick.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.4)}
  .ipick .sheet{width:100%;max-width:520px;max-height:86vh;overflow-y:auto;background:var(--glassDock);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border-top-left-radius:24px;border-top-right-radius:24px;border:1px solid var(--strokeSoft);box-shadow:0 -12px 40px rgba(0,0,0,.32);padding:16px 18px calc(26px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
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
  .wmk{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#bb8b72,#8c6856);display:grid;place-items:center;color:#fff;margin:0 auto 14px;box-shadow:0 10px 24px var(--txtShadow),inset 0 1px 0 rgba(255,255,255,.6)}
  .wttl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:23px;text-align:center;color:var(--text);margin:0 0 5px}
  .wsub{text-align:center;color:var(--soft);font-size:14px;margin:0 0 18px;line-height:1.45}
  .wlabel{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.06em;text-transform:uppercase;margin:0 2px 10px}
  .themes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .thopt{border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:18px;padding:15px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--text);font-weight:600;font-size:13px;transition:box-shadow .15s, transform .12s;box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.10)}
  .thopt:active{transform:scale(.96)}
  .thopt.on{box-shadow:inset 0 1px 0 var(--hi), 0 0 0 2px var(--text)}
  .thopt .gico{width:28px;height:28px}
  .wgo{width:100%;border:1px solid var(--strokeSoft);border-radius:16px;padding:14px;background:linear-gradient(135deg,#bb8b72,#8c6856);color:#fff;font-weight:600;font-size:16px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 26px var(--shcol)}
  .ipick h4{margin:4px 0 14px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:18px;color:var(--text);display:flex;align-items:center;gap:10px}
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
    box-shadow:var(--shx) var(--shy) var(--shblur) var(--shcol), inset 0 1px 0 var(--hi), 0 0 0 .5px rgba(0,0,0,.05)}
  .dnav{position:relative;width:53px;height:53px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:17px;padding:0;transition:background .2s, box-shadow .2s}
  .dnav svg{width:26px;height:26px;display:block;opacity:.95;transition:opacity .2s, filter .2s;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.55))}
  .dnav.act{background:var(--glass2);box-shadow:inset 0 1px 0 var(--hi), 0 1px 6px rgba(0,0,0,.12)}
  .dnav.act svg{opacity:1}
  .dnav:not(.act) svg{stroke:var(--text);fill:none}
  .tb-spacer{width:44px;height:1px}
  .fab{position:fixed;right:14px;bottom:96px;z-index:73;display:flex;flex-direction:column;gap:12px}
  .fbtn{position:relative;width:52px;height:52px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);display:grid;place-items:center;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 8px 22px rgba(0,0,0,.22);transition:transform .12s}
  .fbtn:active{transform:scale(.93)}
  .fbtn svg{width:25px;height:25px;stroke:var(--text);fill:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.32)) drop-shadow(0 -.8px .8px rgba(255,255,255,.5))}
  .fbtn.act{box-shadow:inset 0 1px 0 var(--hi),0 0 0 2px var(--text),0 8px 22px rgba(0,0,0,.22)}
  .fbtn .dot{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:5px;background:var(--heart);border:1.5px solid var(--glassDock)}
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
  .topbar .brand2{justify-self:center;display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:21px;letter-spacing:-.5px;color:var(--text);text-shadow:0 2px 10px var(--txtShadow)}
  .topbar .brand2 .mk{width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#bb8b72,#8c6856);display:grid;place-items:center;color:#fff;box-shadow:0 6px 16px var(--txtShadow), inset 0 1px 0 rgba(255,255,255,.6)}
  .tb-btn{width:40px;height:40px;border:none;background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:13px;transition:background .2s}
  .tb-btn.left{justify-self:start}
  .tb-btn.right{justify-self:end}
  .tb-btn svg{width:25px;height:25px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35)) drop-shadow(0 -0.8px .8px rgba(255,255,255,.6))}
  .tb-btn .av{width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;border:1.5px solid var(--strokeSoft);box-shadow:0 2px 8px rgba(0,0,0,.28)}
  .tb-btn.act{background:var(--glass2)}
  .tb-btn.right.act .av{box-shadow:0 0 0 2px var(--glass2),0 2px 8px rgba(0,0,0,.28)}
  .tb-right{justify-self:end;display:flex;align-items:center;gap:4px}
  .tb-btn.cart{position:relative}
  .cbadge{position:absolute;top:6px;right:6px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--heart);color:#fff;font-size:10px;font-weight:700;display:none;place-items:center;border:1.5px solid var(--glassDock)}
  .tb-btn.orders{position:relative}
  .tb-btn.orders .dot{position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:5px;background:var(--heart);border:1.5px solid var(--bg)}
  .addcart{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-weight:600;font-size:13.5px;cursor:pointer;transition:transform .12s}
  .addcart:active{transform:scale(.97)}
  .addcart svg{width:22px;height:22px;display:block}
  .detail{position:fixed;inset:0;z-index:70;background:var(--bg);overflow-y:auto;display:none}
  .detail.on{display:block}
  .dwrap{max-width:620px;margin:0 auto;padding:6px 16px 120px}
  .dback{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:12px 0;background:linear-gradient(to bottom,var(--bg) 70%,transparent)}
  .dback button{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);font-size:20px;cursor:pointer;display:grid;place-items:center}
  .dbt{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;color:var(--text)}
  .dimg{width:100%;aspect-ratio:1;border-radius:24px;object-fit:cover;border:1px solid var(--strokeSoft);box-shadow:0 18px 50px var(--shcol)}
  .dttl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:26px;color:var(--text);margin:16px 2px 2px}
  .dprice{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:20px;color:var(--text);margin:0 2px}
  .dmat{color:var(--soft);font-size:14px;margin:4px 2px 0}
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
  .dbuy{grid-area:buy;display:flex;flex-direction:column}
  .dopts .dttl{margin-top:0}
  .dbuy .dlabel.dctr{text-align:center;margin:2px 0 9px}
  .dbuy .dqty{justify-content:center}
  .seg{display:flex;gap:6px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:13px;padding:4px;max-width:360px}
  .seg button{flex:1;border:none;background:transparent;color:var(--soft);font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:13.5px;padding:9px 6px;border-radius:9px;cursor:pointer;transition:background .15s,color .15s}
  .seg button.on{background:var(--glassDock);color:var(--text);box-shadow:inset 0 1px 0 var(--hi),0 2px 7px rgba(0,0,0,.12)}
  .seg button i{font-style:normal;font-weight:600;font-size:11px;opacity:.65;margin-left:3px}
  .elecedit{margin-top:14px;background:none;border:none;color:var(--soft);font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:12.5px;cursor:pointer;padding:2px 0}
  .elecprices{margin-top:8px;background:var(--glass2);border:1px solid var(--strokeSoft);border-radius:13px;padding:6px 12px}
  .epp{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;font-size:13.5px;color:var(--text);border-bottom:1px solid var(--strokeSoft)}
  .epp:last-child{border-bottom:none}
  .epp .eur{display:flex;align-items:center;gap:4px;color:var(--soft);font-weight:600}
  .epp .eur input{width:62px;text-align:right;border:1px solid var(--strokeSoft);background:var(--glassDock);color:var(--text);border-radius:9px;padding:6px 8px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:600;font-size:14px}
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
  .invtt{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
  .bnav{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:none;align-self:flex-start}
  .dreco{margin-top:30px}
  .dreco h3{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:20px;color:var(--text);margin:0 2px 14px}
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
  .cttot{display:flex;justify-content:space-between;align-items:center;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:19px;color:var(--text);margin:14px 2px 12px;padding-top:14px;border-top:1px solid var(--strokeSoft)}
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
  .osec{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--soft);margin:4px 4px 12px}
  .ord{display:flex;gap:12px;align-items:center;border-radius:20px;padding:10px;margin-bottom:10px}
  .ord img{width:56px;height:56px;border-radius:14px;object-fit:cover}
  .ord .t{font-weight:600} .ord .s{font-size:12.5px;color:var(--soft)}
  .badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:20px;white-space:nowrap}
  .bp{background:rgba(210,150,40,.18);color:#b07c1e} .bc{background:rgba(46,125,79,.18);color:#2e7d4f}
  body.dark .bp{color:#e3b261} body.dark .bc{color:#7fc79b}

  /* PROFILO */
  .pcard{border-radius:26px;padding:22px;display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .pcard .pav{width:68px;height:68px;border-radius:50%;border:2px solid rgba(255,255,255,.6)}
  .pcard .nm{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:24px}
  .pcard .em{font-size:13.5px;color:var(--soft)}
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .stat{border-radius:20px;padding:16px} .stat .n{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:28px;font-weight:600} .stat .l{font-size:13px;color:var(--soft)}
  .logout{width:100%;border-radius:16px;padding:14px;border:1px solid var(--strokeSoft);background:transparent;color:var(--heart);font-weight:600;font-size:15px;cursor:pointer}

  .note{text-align:center;color:var(--faint);font-size:12.5px;margin:26px 0 0}
  .screen{display:none} .screen.on{display:block;animation:scrIn .4s ease both}
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
.wrap{max-width:680px;margin:0 auto;padding:62px 0 132px}
.wrap .grid{padding:0 18px}
.grid{grid-template-columns:repeat(2,1fr);gap:12px}
.grid .card{opacity:1}
.px{padding-left:18px;padding-right:18px}
.kick{font-size:13px;font-weight:700;letter-spacing:1.5px;color:var(--soft);margin:8px 0 2px}
.hero{font-size:40px;line-height:1.04;font-weight:800;color:var(--text);margin:0 0 18px}
.herocard{position:relative;margin:0 18px 18px;border-radius:26px;overflow:hidden;box-shadow:0 var(--shy,12px) var(--shblur,42px) var(--shcol,rgba(120,80,55,.12));cursor:pointer;aspect-ratio:16/11}
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
.osec{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--soft);margin:4px 20px 12px}
.qsend{display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 36px);margin:8px 18px 0;padding:15px;border-radius:17px;border:none;background:linear-gradient(135deg,var(--b3,#e0a890),#c2715f);color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;cursor:pointer;box-shadow:0 8px 22px rgba(120,60,40,.3)}
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
.loginbox{padding:34px 28px;border-radius:26px;text-align:center;max-width:360px;width:100%}
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
.dbacklbl{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:18px;color:var(--text)}
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
.fab{bottom:calc(96px + env(safe-area-inset-bottom))}
#toast{bottom:calc(120px + env(safe-area-inset-bottom))}
.sheet{padding-bottom:calc(18px + env(safe-area-inset-bottom))}

/* ---- card: tile piu' compatta, testo piu' leggibile ---- */
.card{min-width:0}
.card .ph{aspect-ratio:1.1}
.cbody{padding:10px 11px 11px;display:flex;flex-direction:column;gap:6px;min-width:0}
.cbody .cardcat{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:11.5px;font-weight:600;color:var(--soft);min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cbody .cardcat .gico{width:14px;height:14px;flex:none}
.cbody .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cbody .ct{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:15px;color:var(--text);line-height:1.15;min-width:0}
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
.tb-back{width:40px;height:40px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);display:grid;place-items:center;color:var(--text);cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 4px 12px rgba(0,0,0,.18)}
.tb-back svg{width:22px;height:22px;stroke:var(--text)}
.tb-btn.cart{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 var(--hi),0 4px 12px rgba(0,0,0,.18)}
.tb-btn.cart svg{width:23px;height:23px;stroke:var(--text);fill:none}
.tb-btn.cart .cbadge{display:grid}
.tb-right{gap:10px}

/* ---- parallasse leggera su scroll (solo immagine hero) ---- */
.herocard img{transform:scale(1.08) translateY(calc(var(--par,0) * -0.015px));transition:transform .05s linear}

/* ---- scrim sfumato in alto (home, primi ~125px) allo scroll ---- */
.topscrim{position:fixed;top:0;left:0;right:0;height:calc(125px + env(safe-area-inset-top));z-index:49;pointer-events:none;background:linear-gradient(180deg,var(--scrim) 0%,var(--scrim2) 52%,transparent 100%);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);-webkit-mask:linear-gradient(180deg,#000 0%,#000 52%,transparent 100%);mask:linear-gradient(180deg,#000 0%,#000 52%,transparent 100%);opacity:min(1,calc(var(--par,0) / 60));transition:opacity .08s linear}
:root{--scrim:rgba(236,226,214,.9);--scrim2:rgba(236,226,214,.5)}
body.dark{--scrim:rgba(26,23,20,.9);--scrim2:rgba(26,23,20,.5)}

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

/* ---- carosello in evidenza (scorrevole) ---- */
.herorow{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 18px 4px;margin-bottom:18px;-webkit-overflow-scrolling:touch}
.herorow .herocard{flex:0 0 86%;scroll-snap-align:center;margin:0}
.herorow.single .herocard{flex:0 0 100%}

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
.sheet.detailsheet{position:relative;background:var(--sheetbg);-webkit-backdrop-filter:none;backdrop-filter:none;max-height:calc(100vh - 96px - env(safe-area-inset-top));max-height:calc(100dvh - 96px - env(safe-area-inset-top));padding-top:14px;border:1px solid var(--strokeSoft);box-shadow:0 -16px 50px rgba(0,0,0,.4)}
.detailsheet .detailedit{position:absolute;top:12px;right:16px;margin:0;z-index:4}
.detailsheet .dgrid{margin-top:6px}
.detailsheet .dreco{margin-top:26px}

/* ================= DESIGN SYSTEM — premium warm (light/dark auto) ============= */
:root{
  --text:#2D2621; --soft:#6E6257; --faint:rgba(110,98,87,.55);
  --glass:rgba(255,255,255,.45); --glass2:rgba(255,255,255,.58);
  --strokeSoft:rgba(191,107,74,.12); --hi:rgba(255,255,255,.5); --glassDock:rgba(247,242,235,.70);
  --bg:#F7F2EB; --bg2:#F1E8DC;
  --accent:#BF6B4A; --accent2:#D6B89B; --accentDark:#9C5C43;
  --icon:#8A7C70; --heart:#BF6B4A; --success:#6E8B69; --warning:#C89C5B;
  --txtShadow:rgba(70,45,30,.14); --shcol:rgba(120,80,55,.12); --shblur:42px; --shy:12px;
  --card:rgba(255,255,255,.5); --sheetbg:#F7F2EB;
  --scrim:rgba(247,242,235,.9); --scrim2:rgba(247,242,235,.5);
}
body.dark{
  --text:#F2E5D5; --soft:#B9A897; --faint:rgba(185,168,151,.5);
  --glass:rgba(255,255,255,.05); --glass2:rgba(255,255,255,.085);
  --strokeSoft:rgba(209,124,86,.14); --hi:rgba(255,255,255,.1); --glassDock:rgba(24,20,17,.72);
  --bg:#181411; --bg2:#231D19;
  --accent:#D17C56; --accent2:#B69A82; --accentDark:#B69A82;
  --icon:#8A7C70; --heart:#D17C56; --success:#7A9774; --warning:#D1A366;
  --txtShadow:rgba(0,0,0,.5); --shcol:rgba(0,0,0,.5);
  --card:rgba(40,32,26,.5); --sheetbg:#231D19;
  --scrim:rgba(24,20,17,.9); --scrim2:rgba(24,20,17,.5);
}

/* ======================= SFONDO — wallpaper frosted raster ==================
   Lo sfondo e' un'IMMAGINE (JPEG frosted 4k, vedi WP_LIGHT/WP_DARK + syncBackstop)
   applicata sul <body> con background-attachment:SCROLL (NON fixed): scorre col
   contenuto come parte del normale rendering del documento. Niente layer ancorato
   al viewport = niente ridisegno parziale = niente "rettangolo"/linea netta.
   L'<html> porta solo la tinta unita di base come backstop (overscroll/bordi).
   Qui nel CSS restano solo le transizioni di tema. */

/* Layer wallpaper: elemento FISSO a tutto viewport. Copre sempre lo schermo a
   qualsiasi scroll (niente gap di copertura) ed e' un raster unico (niente seam).
   L'immagine viene impostata da syncBackstop in base al tema. */
.appbg{position:fixed;inset:0;z-index:-1;pointer-events:none;
 background-position:center center;background-size:cover;background-repeat:no-repeat;}

/* ---- vetro: frosted ceramic ---- */
.glass{-webkit-backdrop-filter:blur(26px) saturate(125%);backdrop-filter:blur(26px) saturate(125%)}

/* ---- icone monocromatiche (famiglia terracotta) ---- */
.gico{stroke:var(--accent);fill:rgba(191,107,74,.10)}
body.dark .gico{fill:rgba(209,124,86,.12)}
.dock .dnav svg{stroke:var(--icon)!important;fill:none}
.dock .dnav.act svg{stroke:var(--accent)!important}
.heart.liked svg{stroke:var(--heart)!important;fill:rgba(191,107,74,.16)!important}
body.dark .heart.liked svg{fill:rgba(209,124,86,.18)!important}
.title .ticon.heartred svg,.heartred svg{stroke:var(--heart)!important;fill:rgba(191,107,74,.14)!important}

/* ---- micro-interazioni: morbide, senza rimbalzo ---- */
button{transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s ease,background .22s ease}
button:active{transform:scale(.97)}
.card,.cat,.herocard{transition:transform .24s cubic-bezier(.4,0,.2,1)}
.card:active,.cat:active,.herocard:active{transform:scale(.985)}

/* ---- dock sempre ancorata al bordo visibile (no jitter con barra Safari) ---- */
.dockwrap{position:fixed;bottom:calc(18px + env(safe-area-inset-bottom) + var(--vvb,0px))}

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
.cbody .ct{font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:700;font-size:16px;line-height:1.18;color:var(--text);margin:0 0 4px;min-width:0}
.cbody .mat{font-size:11.5px;color:var(--soft);margin:0 0 9px}
.cbody .cp{font-weight:700;font-size:16.5px;color:var(--text);margin:0 0 13px;letter-spacing:.01em}
.configbtn{width:100%;padding:11px;border-radius:13px;border:1px solid rgba(191,107,74,.26);background:linear-gradient(180deg,rgba(191,107,74,.15),rgba(191,107,74,.09));color:var(--accent);font-family:inherit;font-weight:700;font-size:13px;letter-spacing:.02em;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi),0 5px 14px rgba(191,107,74,.13);transition:background .28s ease,box-shadow .28s ease,transform .2s cubic-bezier(.4,0,.2,1)}
.configbtn:hover{background:linear-gradient(180deg,rgba(191,107,74,.22),rgba(191,107,74,.13))}
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

/* ---- dock a 4 (Home/Esplora/Carrello/Profilo) ---- */
.dock.dock4{gap:4px}
.dnav.cart{position:relative}
.dnav.cart svg{stroke:var(--icon)}
.cartdot{position:absolute;top:7px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock)}
.dnav.profile svg{stroke:var(--icon)}
.dnav.profile.act svg{stroke:var(--accent)}

/* ---- campanella notifiche (topbar) ---- */
.tb-btn.bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 var(--hi),0 4px 12px var(--shcol);color:var(--text)}
.tb-btn.bell svg{width:22px;height:22px;stroke:var(--text);fill:none}
.belldot{position:absolute;top:9px;right:10px;width:9px;height:9px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock);box-shadow:0 0 8px rgba(191,107,74,.5)}

/* ---- foglio notifiche ---- */
.sheet.notifsheet{background:var(--sheetbg);max-height:calc(100vh - 120px - env(safe-area-inset-top));max-height:calc(100dvh - 120px - env(safe-area-inset-top))}
.notifrow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);margin-bottom:9px;cursor:pointer;color:var(--text);font-family:inherit;transition:background .25s ease,transform .2s ease}
.notifrow:active{transform:scale(.985)}
.notifdot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px rgba(191,107,74,.35)}
.notifdot.s-pending{background:var(--warning)}
.notifdot.s-confirmed{background:var(--success)}
.notifdot.s-rejected{background:#b06a52}
.notiftxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.notiftxt b{font-size:14px;font-weight:700;color:var(--text)}
.notifb{font-size:12.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notifarrow{color:var(--faint);font-size:22px;line-height:1;flex:none}

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
@keyframes ofocusPulse{0%{box-shadow:0 0 0 0 rgba(191,107,74,0)}22%{box-shadow:0 0 0 3px rgba(191,107,74,.55),0 8px 24px rgba(191,107,74,.2)}100%{box-shadow:0 0 0 0 rgba(191,107,74,0)}}
.badge.br{background:rgba(176,106,82,.16);color:#b06a52}

/* ---- dock: tab ordini ---- */
.dnav.orders{position:relative}
.dnav.orders svg{stroke:var(--icon)}
.dnav.orders.act svg{stroke:var(--accent)}
.dnav.orders .orddot{position:absolute;top:7px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--accent);border:1.6px solid var(--glassDock)}

/* ---- detail: colori in sola lettura ---- */
.dswatches.readonly{pointer-events:none}
.dswbox.ro{cursor:default}
.dcolnote{font-size:12px;color:var(--soft);margin:6px 2px 4px;line-height:1.45}
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

/* mappa una riga "prints" (con join print_colors + categories) */
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
const WP_LIGHT = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAsHCAoIBwsKCQoMDAsNEBsSEA8PECEYGRQbJyMpKScjJiUsMT81LC47LyUmNko3O0FDRkdGKjRNUkxEUj9FRkP/2wBDAQwMDBAOECASEiBDLSYtQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0P/wgARCAWgCgADASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAECAwb/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAH0JOe7LCgSgAAAAQqUAAJQAAAAAAAAAAAAABYLAAFAAAAAAAAAAAAAFgKIoiwKEollJQAAAAAAAAAAUBCkKAQAUAAAAAAAAQAKAAAAAAALAAACogAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACKCCkKACFEURRLCgAlACKUCAsoEFQBAAAAAAAAAAAAAAACwAyFAAEKQoAEsFQoAJQAlAAAAAAAAAABYAFgsCwKgUAAAAAAAAAAAAFQFJYFQWUgLAUAAAAAACwAAAFIsFCKJYKgoAAAAAAAAQAKAAAAAAALAAAIAAFIAAAAABYCwAAAAAFIAAAAAAAAAAAAAAAACWCpQBLCgAhSVCpQQpBYBRFUgFEolBKIsAQAAAAAAAAAAAAAAFAyAAlABCkKCUABCglAAAAAAAAAAAAABZRAsAAoSgAAAAAAAAAAAUiiVBULApAUAlAAAAAAAAAABZQgsCgIFQoAAAAAAAAsWAsAAAKgAAWUhSCALAAAsAAAAAAAAAAAAAAUlgAAAAAAAAAAAAAAAAigBAVCpQAgKJQlCVBUKAFJQCUCBQQAQAAACwAAAAAAAAUAADJCyhKAACCkKQpCgECgAAAAAAAAAAABYLAAFIBQAAAAAAAAAAALAsKBLAsCwpCxSWUAAAAAAsAAAAsKCKJQEKAAAAAAAAALAAAAAFgAAAsAIssAAAAAALAAAAAAFIAAAAAAAAAAAAAAAAAAAAAAACVCkKQqUlCKEsKgKJQAECxaQFIoJRLCgiwBAAAAAAAAAAAUAAADIAAAJZQAlAAJQAAAAAAAAAAAKEAAAAACgAAAAAAAAAAAALABYCwUCCwFgoAAAAAAAAAAKlIUlgoJQAAAAAAAACwAAAAAAAsAAgsLAAAAsBYAAAALAAAAAAWBYLAAAAWAUgAAAAAAAAAAAAAAEoARRFACUllABCgEKAFILKJZSKEsALLAEAAAAAsAAAAFAAAAAyAAAAAAAAAAAAAAAAAAAUgAABSAAWUlAAAAAAAAAAAACxSWAoIFCAVCywVCgAAAAAAAWAUELFEolAlAAAAAAAAosQAAAAAAogAgUgBaiiFJQAlCKJZSKIUggAAsALALAACwCwAAAAAAAAAAAAAAAAAAASglCCkKQUIBUFQpCxSUJZVSgCLBUKCUIsAQAUgAAAAFgBQAAAABTAAAAAAAAAAAAAAAAAACwAKEUlgAKAAAAAAAAAAAAABQgKJQILLCwBSUAAAAAALAAAAFEsKAABLCgAAAAAACgSwAACwWAAFsECCylAABFCUEKAAlABCpRKEolgsIAAAsAAAsAAAAAAAAAAAAAAAAAAAAEpUEoEsFBKJULFEUSiWCkLFUCKACUSwoEsAQAAAAAAAFsAAAAADIAAAAAAAAAAAAAAAFgWAsLFIAsACgAAAAAAAAAAAAABYBQlIoiwFJUBSUAAAAAACwWAABZSUAEollJQAAAAAAFslgAAAAABbCBbJQAlCKAEoAASgAAQoIUAJRLCxQCKIsgUllIAAAAAABYALAAAAAAAAAAAAAABUpAJZRKJUBRFJZSVCgAllVKIohSKEohSLAEAAFIAAAAFAAAAAAyAAAAAAAAAAABYFQFIUIAAFgAKJQAAAAASgAAAAAAUgLLCyiVAsLLBUCiUAAAAAAAAAAAKCUCUiglAoIAAAACgQABYLAAWFLILKUQAAAAAAAlAACUhQAlBCglAAABFCAsAgAAsFgAAAAAFIAAAAAAAAAAAAAAFlEAlQWCgigBKCUlAhaBAoIUEBQlIsAQAAAAAAFAAAAAAyAAAAAAAAUgFgAWUlQAsAAAUhSKAACUAAAAAAAAAAAsoiwsUJSWUlQKIUlAAAAAAAAAAAUlgssKlAJUKKCAAAAAoEWAACwCxQgKKIpBBQEFAQpBQAJQQoAAAAAAAABCgAAAiiWWIAAAAAUgAAAAAAAAAAAAAAAAAUCWVJQlACKACUSgAlWUJQllJUFQqCgSiBAAAAAAAUACwAAAMgAqUgAAAABSFJYACwAAssABRKAAACUAAAAAAAAAAWAogFQKEBUCiAqUlAAAAAAAAAAUAAllJQJaACAAAAoAVIABYAUICiiVEoJQlAQoCUAAAASgABLCgAAAAAAAAAAAASiLIAAAAAAFIAAUgCwAAAAAAAAAAABQQCUCUAlgKIoASwUVLCyiVCgIKQoIEAAAAAFIFAAAAAAkCwCwAAqABYBSAqAUgCiALAsKAlAAAAAAAAAAAAACglIsBSAqAoICwUAAAAAAAAAABRApBQAIqgCAAAAoAELAAFCAApQBJQEKlAACUlAAQoJQASgISgAAACWUllAAAAAAoQoJQiwCAAAFgAAAAAsAAAAAAAAAAAAFABBCgAlCUEoAJRFUQoEoAllBBQiwBAAAAACxQFgLAACwMgsAUSwFCBZSFJYCwAsoihKAAAAAAAAAAAAAAAAAACwqAAUIFgFJUKAAAAAAAAAAAsKQUCUlCFoIAAAACgASwAUIAChQEAAAigAAlAJQiwoAAEUlBKAAACUCAJZRLCgAllCUAAlKEFCLCwgUlgAAALAAsAFgAAAAAAAAAAABQSVCpRKBCgJQgsolhbFJUFlIolAQsUQAQAAAAAAFAAAALDKiAsUiiAsUllIoigAAAAAAAAAAAAAAAAAAAAUgLKEsCwLCoFCWABQAAAAAAAAAAqUiwoAEsCqCAABCigAAQsAUICllIoBACUAAAAlAAACUBBQAlAAQoAEoAASgAISgAAAgoACCyyqCLAILAAAUiwAAAAsAAAAAAAAAAAFAlRKQWUELKCUSiUJULBagUJUFgUJZRKIELAAAAAAFAAAAFMUAAAAAAAAEoAAAAAAAAAAFIAAAAAAsFgpCxSWUIKQsAAUhQAAAAAAAAAABQSgAAAloIAAACgARYAUIAsKAWChJQigAAAABKAAJQEKAAAAQoAAAAAAEoAAlISgAAAAAAKASwsWIUllICwABRAWBYAAAAAAAAAAAUAlSKEBYLKCUlQoEUgWwLKEsKgqUJSKIEAAAAAABQAAAAIAAQoAAAAACUAAAAAAAAAAAAAAAAUICkBSAsollICxSUAAAAAAAAAAABalIAQFBClAIAAACgAQAFCAoAUllQAAgqCgSwsoASgCWUAJQAACUJQEFAACUACUlQoABCgACAJQAigAgooCCCwAAFIABYAALAAAAAAAAAAABQQlAIsFBFEUAIFFAAlQoEUlCUIEAAAAAABQFgAAAgAAEoAAAAAAAAAAAAAAAAAAAAAqUlCLCoLAoEAoShLCgAAAAAAAAAAFqUiWBQICyqAIAACgAAQFsIAWKVAoBAJZQBKBCygQoBCgAAAAEKACKJQAAEKABKAAAAAACUJQIAAAlAAAKAiogAAABQgAAAAAAAAAAAAABUsKlRKACUSwUCUAllVKJQRRFAAJZSBAAAAAAAUAAAACAAAAAAAAAAAAAAAAAAAAAAAAFJYCwKJZRFJQlQWCygAAAAAAAAAAWoUJYSiUAEqggAAAKAABAUIClgLBQlEEKCUAACUAAAShKABCgAEKACUCUJQlAAJQAlAlAAAAAJYFAIAEKlAJQAJaSiCAAAACwAAAAAAAAAAAAABQAQlJZSVBUKBKEoSglUlEsFlEoRQQBAACwAAAsVYAAAACAAAAAAAAAAAAAAAAAAAALAoQLKJYCwqBZSWUhSAsUAAAAAAAAAAAFoISgQLCipZQIAAACgAQAJRSCgAKElAAAlAAAAAAAAJQAAAAAlAAAQqUSwpCgJQgoJUKlABCgSgCWUACAAJZQAABFqLAIAAAWAAAAsAAAAAAAAAAUARLKACUllCUAJQBLFsUJQQoCUEAQAAAAAAFAAAAAgAAAAAAAAAAAAAAAABSUBCwLFJYLFIUiiAWABZSUAAJQAAAAAAAClCWWCUSwKCWgAgAAKAAFSBbCAoAUgFRKAlAJQAAAAAASglAAJQJQAAAAAAAAAAAAAACUCUAlCUBCgAACJQlBLCgAlloCCBSAALAAAAAAAAAAAAAAAFlEAEKgoEoEKgsoSllQpCpRKIUAgQCwAAAAAUAAAACAAAAAAAAAAAAAAAAFIUlACWAUihFBBUCiLCygAAACUAAAAAAAosgoShKJUqpSUAgAAKAABAUICgBSLChEoAEKBKAEoAAAAAigQoAAAAAAAAAAAAAAAABCkFAAlJQJSWUAARQIASgACUJSosAgAAAAsAAAAAAAAAAAAAUESwoBCgAJRKCUilIKlIUAJSWAEAAAAAABQABRAAgAAAAAAAAAAAACwFIBYLFJQlCWUllBCwALKAAEoAAASgAAAAAKFJSBBUFAlqFAgAAKAAAsVIFsICiwKAQQoEoEKACUACUlAlJQAAAAAAAAAAAAAAAAAAAAAAAAlAAAAQqUAEFAIllAAAEWkoggAsAAAAFgAAAAAAAAAASlSxFBAqUAgKAQUJRUoELFJQSglIEAAAAAABQAAAAIAAAAAAAAAAsBSAWCyhLBYFgsollIUIBQCUAAAAAACwAAAAChSVIpCgSgSqlAAgAAKAABAFiUKWAAUBABCgJQlAABBQASwoABCgAAAAAAAAAAAAAAAAAAAAAEKAQpCglAAAlJQEiywUAAAoBLAWIABZSAAAAAAAAAAAAAEVRJQAQKBKECgASlSwoACCgSwBAAAAAAAUAAAACAAAAAAAUICxSVCpRAWAUhRAWCkKQsUAAAAAAAAAAAAAACigIlAQUEWpZQIAACgAACxAAUAAAUBAAAAAEolCUEoAEKAAAAAAAAAAAAAAAAAAAAAAAAAAAAlEoJQAABKAEolIRQBKAqLCkAgAAAAAAAAAAAAAAAAgqUhRLCoKQpCoBQARaBFCUEFQWEAAAAAAABQFgAAAEALFAICywVAUiiLBULKIUlQqUhQQKJQAAAAAAACggAAAAAKKEsigAlCKoCUAgAAKAAABAAUAAUllQBAoACUAAAAAAAAlBKAAAAAAAAAAAAAAAAAAAAAAAAEoAAASgAlAAAAAgCUAJSgAIIsAAAABUAAAAAAAAAAEUlABKEoJQlAJQRSUWKCUJSWCywBAAAAAAAAUAAAACVCyiFIsCwWUQCiKECyhLCygCUAAAAAAAAAoAIWAAAAAKFJSJZRKCUCiCygIAACgAAARYAAUAURSWVAAAAEoJQAAAAAAQoAAAAAAAAAAAAAAAAAAAAAAAAAAAEsKCUJQlAAAABKAgCWUACgJQggAAAAAAAAAAAAAAAAlICyglCCywoEURRKUCUAJQlQBAAAAAAACxQAAAAAJYLKJUFCUJQlACUAAAAAAAAAAAAoAAIAAAACgBSKglCUJSWKoCBQCAAAoAAAEAABbAFIoBACUSgAQoAAAEolQoBCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKAAAlAAAJQACAJQACgCUggACwABSAAAAAAAAAAAEFlEoAIKQLCxQAFlQqUShLAAEAAAAAAWFAAAAAAAAAAAAAAAAAAAAAAAACgAAgAAAAAKAFIqBCkKQKoQsoACAAAoAAAEAALAFsABUSgAJQAABKAAJQlQpCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKBKAAJQIKIAAAEqgJSLIAWAABYAAAAAAAAAAAJQEKAAAlCUlCWVQJQAAEAQAAAAAABYUAAAAAAAAAAAAAAAAAAAKAAACAAAFgAACrAAKIWEoJQAlpFAEoCAAAoAAAAVEsAACxQFlARLCpQAgoEoAAAAAlAlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCgAlQoCUAAAlAAlglJQCgABAIAALAAAAAAAAAAAABKABBQgKBKJQASlJSVCgIAQAAAAAAAFAFIAsAAAAAoAAAAAAAAAAIAAAAAAAACgACiUgBLCoLKBKWUlAAIAAACgAAAQCoAAAUolEAAJQAAAAACUAAAEoASgBKAAAAAAAAAAAAAAAAAAAAAAAAAAAABCpQBKAJQAAEKAAlglAAoAlEAIAAAKEAKCAAAAAAAAEohQBLAollEUlQspQAIsKQBAAAAAAAAUAAAACwAAAAAAAAAALAFICwAAAAAAosAAACoiwoIsKlCCikoILKAgAAAKAAAALEAAAABSgEELKJZQBLCgAASgABLCglABLCygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEoAlABKABCgEiglKSglIAAIWUhSAACgAgAAAAAAAgWURSUIsKQUAJZRLFsoAIAQAAsAAAAAUAAAAAAAAAAAAAAAAUgALAACgAACwAKEWIoEKQoAEqoUllAEoCAAAAoAAAAEAAAFIBZVihKQAAAAlBCgAAJQQoAAAAJQAAAJQAAAAAAAAAAAAAAAAAAAAAAAAABKCUhSUAAAEoEKAAgoiUoAQsAsAAgAAAKACAAAAAABCywoJUKAQsoIKlEUlFAShLAEAAAAAAABQAAAAAAAAAAAoAAAAAAAAAAoiwUhLBZRAqUllAACKqUARSUAAgAAAKAAAABAACwAAFJYVRJQSgCUAAAEoAAJQlAAAAAJQASgAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUJQAAAAAAAASgIChCwAAAAgAAWoAAIAAAAAASiUAAEsFCUEoIFFAlCABAAAAAAALBQAAAAAAAAAAALKJQiiUIoEKAACWUhSWUSwoACUlBKqVBQSgQoAAAgAAKAAAAABAFgAAAAWBZQABKAAAJQJQAAAQoAAJZQQoAABCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAABKACUASgAABKCUAJYEqggCwAACAFgsAKACAAAAAAEUlgpCoKlCUlCVCxQFAEAASwAAAAAAUAAAAAAAAAAAAEApFoAEoiiUAEsLLBQEKiqAgsoAJSKAEoABAUIAACgAJQAABAAAAAAAAAKAAAAACVCgJSWCpSUAAJQAAAAlCKBCpQAAAAAAAAAAAAAAAAAAAAAAAAABKAAAAJQASgAlAAJQAEFgLCwAAAAgAsAoUgAgAAAAAQUIUAQLAsolAgWFoIAEAAAAAAABQAAAAAACwFIAAEAAAsq2KBCxSWUEKlJULKEsLLAoAShKJQABAAAAUICgAAAAAAQACwAAAAAAAFlAAAAAAAAAAAAAAEoigAABLCpQQqUAAAAAAAAAAAAAAAAAAAAAAAAAlAAgoCCgSgBKAAAAAEsLAAsAAAUggAKAFIAIAAAACgJUgoAAQKgUJQBZULABAAAAAAAUABYAAAAAAAAQAAAAACyrUolCUAAAAAEoABAAAAAAAAUAAAAAAAEAAAAAAAFIsAAChFEsKAAAAAACKAIoigQsoJQAAgoJQAAAAIKAAAAAAAAAAAAAAAAAAAAAABLCygABFAAAAAACUEFQsABYALAAACABagAAAAgAAAKACIoIFACUAEpQCAEAAAAAAABQAAAAAAAAAQAAAAAAACigAAAAAAAAAAAAAAAAUAAAAAAAEAAAsAAUgAAAAFQAAUAACUASwoCUAEKAACKEoAAAlAQpCgSgABFAAAAAAAAAAAAAAAAAAABCgEKACUAAAABCgAASgCAWAUgALAAFIIALKWAAAAIAAACgAhFBCpQgsolCFWABFgAAAAAABQAAAAAAAAAQAAAAAAFAAAosAAAAAAAAAAAAAABQAAAABUgAAFgsAAAAAAAAAsAAALAoJQSgAlEUJQAAACUEURQABKAACUASgAQoAAAAAAAAAAAAAAAAABCgEKAAAAAAlAAAEoAEKQsACwAFgsAAACwgKAAAAACAAAoAAlgQFCCgigFSiABAAAABSABQAAAAAAAAQAAAAAFAAAAAAAosAAAAAAAAAAAABQAACwBAAAAAAAAAAAACwAFIAAAAAUJQCUBCgASwpCgEKAAlJQSiUAAAEoAllBCgJQAAAAAAAAAAAAAAAAQUEoASggoAAAIoAlCUAABAUgBSAAAAAAFIAsAAAAAgAKAAEKSFlACUigFIKgBAAAAAAAUAAAAAAAAEAAAABQAAAAAAAAAKLAAAAAAAAAAAAAAAAAAFgAALAUgAAAAAAAAAAAACwAAoEoAAAEKAABFJQAEFAAAAAABKABCgEKlAAAAAAAABCgAEKAAAAACWUSgAgoAAEoAAAIAAAAAAAACwAAAAAWAAIACgAAABIqURQlJRYsLALEAAAAABQAAAAAAAAAQAAFAAAAAAAAAAAAAAosAAAAAAAAFIAAAAAAAAAsAABSVAAAAACwCwAAAsAAAAACgELKJZQABKAEoEKAAAACWCgRQAAQsoAAAAAlAAAAAAAAAAAABKBCkKCKBCglAAAAAQpCwAAAAAAAAABSAAAAAACAoAAAAIRQACVFFEAEAAAAALFAAFIACwAAAQAAFAAAAAAAAAAAAAAAAAoslAAAACwAACwAsAAAAAAAAAABYACwWAAUQALLAAAAAAAsAAFBKAAAAAACUAEKAAABLCgAAAAASgAAAAABFIoAlAQUAEolBKAAAAACUIKAlAABCwAABSAAAAAAAAsBYAAAAAgKAAAAAEipRFJUWggoJAAAAAAUAAAAAAAAEABQBCgAAAAAAAAAAAAAAAAAosAWAAAoiwAAAsCwAAFgFIAAAAAAAAAAsFgAAAAAAAAAAAAoABCgAAAAASgBKCUASwoAACUAAEKgpCkFABKJQEFBKABCgASwoBCglAAAlAAAACCwAFQAAAAAAAALAAogAAAAAAAAAAAJZYASxaKSkiwCAAAAAUAAAAAAAESgFAAAAAAAAAAAAAAAAAAILFCUJSA0LAAAAAAAAAAAFgAAAAAWAAABYAAAAAAAABSAAAAAAsUJQAAAABKAAACURQABLCgAhRKAAEoASiUAAAAAAABCgAAAlAABAoAAAEoEKgqUgLAAAAAAAAAsCywAAAAAAAAAAAAARYhQCFtSkAQAgAAAFAAAAAAABAAUACUAAAAAAAAAABCkLAqBQEFlICoFBKEsNCwAAAAAAsAAAAALAAAAAAAAAAAAFIAsFgAAAAAAAALCglAACUAAAAEsKAQoAAAAAAAEoAAAAAAAAEKCUAAAABCpQAAAAAAAQsUgLLAABYACwAAAAsAUgAAAAAAAAAAAAAEqBCihAoIAgABYCxQAAAAAAQAFAAAAAAAAAAAAAEFlEoSwsAsKlJQllIogBRKEsKg0LAAAACwAALAAACwAAAAAAAAAABSFIAUgALAAWAAAABZQlJUKlEoAJQAAlAJQAJQACUAAAAAAAJQAlQoAABCgEFCWCkLKCUAAAAAAEKgAssAAAAACwWAAAAAAAAAAAAAAAAAAACUgKEKQoEogAgUgAUAAAAAElAAFAAAAAAAAAAIKQVAAsLKEAUiwVCoKlJYLAAsCwFgFIUosAAAAAWAABYAAALAAAAAAAAAAAAAAAALAACwAAKQoJQAAlCUJQAAASgABKAAAJQASgAAAAlAAJQEKgoAEoSgAAAQoAEoSggsAsAAAAFgAAAAAAAAAAAAAAAAAAAAAAAJQQKJUKgACAAAUAAAAEAABQAAAAAAAAAACUEKQqUgFCAVCoKCFEUJSFCURRKJZQQqCwFlNQsFIBYAAAAAAAAAAAFgAAAAWAAAAAAACwAAAALKCUAAAAAAAAAlQoCUAlAAACLCgSgAAACUAABCgASgQsoAAlBKAACUQBSAAWUgAAAAALALAAAAAAAAAAAAAAAAAAAQssKgoAAJYLCBSBQAAAAAQAAFAAAAAAAAAAEAFQsUSiFEsBSKEUQCwoIUhSAWCoAFgWCwFgsADQsLAAACwAAAAALLCywAWAUgAFgALAAAAAAAAABYACglACUAJQQoAAACUAJRKJQlAACUEoAAARQAlCUlAACUBCkFQoBCglAQqABYAAAAAAAACwAFIAAAAAAAAAAAAAAAAAQKEoAAELFEogAgFAACgAkAlAAFAAAAAAAEKgqBYBSWUJSFCBULLAAsKgqCwAAAAAAAAAAAAAANFsgALAAWAsFgAsAAsLAAAAAAAWCywALAsACwAAAAAAoAACUAAEKCUAJQJQAAAACUCCgJQBKJQAAAAShKCUAlABKACURSAAAFIsAAAAAFgAAAAAAAAAAAAAAAAAAAASwpCyggqAUJQgpAIBQCygAQIAABQAAAAAAABCwBRLCgIKBFIUiwVCwALAAAAAAAAAAAAAAAAAAA0LLAAAAsAAAAAAACwAAAAABSFIAAAAAAAAABYKAQpCgAlAAAQoBCgAASgBKEUAAAAELKACUlAlAAACCwAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAASiWUlBLCxQQpBZRACAUAKBAAgAAFAAAAAAEKQsURQCWUlCLACywUEUILAAAAAAAAAAAAAAAAAAAAAAA0LBSAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAUJQCUABCgAIKQqUAJQCKCUAAELKAAIoASgAAAgqAAAsAAAAAACwFIAUgBRAAAAAAAAAAAAAAAAAAAIBSUAJQlAAlEsLLCxSCUAKBAAAAgFAAAAAAEKQWUQLLCyglEsLALAsFgWAAAAAAAAAAAAAAAAAAAAAAAAAADVLAEoiwsogBSLCwAAAAAAAAAAAFgAALAAsACwAAAAoAJQlAlAAAAAJZQAACWUAlABFBCkKAgsCwAABSAAAAsACwAAALAAAAAAAAAAAAAAAAAAAAAAJQQoEsKgsoASwpCkLKCCwlCgRYAAAAgFAAAlAAQpCkLLCyiWAsCiWURRFJYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANpbAAAEUAiiLBYAABSFIAAAUgCwFIAAAAAAsALAAAAoJQAAAAAAAlQVCgAIKgqCoLAsBYAABSAAAAWAABYAAALAAAsAAAAAAAAAAAAAAAAAAAAAgUJUKQUJQllJZQQssKAgVFABAAAAAhKUAAAAAQssQsWyggsoSiVCxRAWCwAAAAAAAAAAAAAAAAAAAJQAAAEKAAAAAAADcqwAAQpBULKAEoiiWAAAAAAAACoAAAAABSAWAAAAAAABYLAWBYKgqAAAAAAABYAAAAAAAAAFgAAAAAAAAsAAAAAAAAAAAAAAAAAAAAlACUSwVCygQqUiiWUAJRLAAAAAAAAJQAAAAAEsQpUsLAWCywWBYFgWCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANiwQpCgAECgAAlIAAAAAAACwAFgAAWAAAAAAAABQgLAAAAAAAAWBYFgAAAAAAsAAAUgAABSAAAAAAAAAAAAAAAAAAAAAAAAAEFAAQsUJRKJUKlEUJQAAgsAAAAAAIBQAAACUSkAixaBKJUKQqUlQssLAAAAAAAAAAAAAlAAAAAAAAAAAAgqCoKgqCoKgsCoKgsoIKADYsAAJQABFAAAIsACiAAFJYACwAAAAAAAAAFECyiFIAsAACwAAAAAAAAFIAAsAABSAAAAAAAsAAAAAAAAAAAAAAAAAAAAAQoIUShKCCgEFCFCUEKCWCoALAAAAAACAUAAABALEBVQqABUFgqCxQgAAAAAAAAAAAAAAAAAASgAQqABUFlIAAABYAFCAsAABYAKgAsDpKsJQCUAAEsKAABAAAsAAAAAAAAACywAAAAAqACwBSLABYAAAAAAAAAAACwFIABYAAALAFIAAACwAAAAAAAAAAAAAAAACUAAllAJZSUCUlQsCyiFABCwAAAAAAAAlAAAACkJLKIFVCywpBZSLCwALAAAAAAAAAAAAAAAAAAEKgsoQCwWBYAACwssAAFCWUlgAAsUQBSLAUIFgssOgsASgQUJQlBFEoAQAAAAAALAAAAAAAAALAAAAAAAAAAAAAsAACwAAAAAsAUgAFgAWAAAAAAAAAAAAAAAAAAAAAQoEoQKQoAAEoSwLCglQWUlgAsAAAAUgAAlAAAChEsIsFUCUlgsABYKgqAAAAAAAAAAABLCgAAAAIAFQqAAUiwsUllJYALFIUgCwAAAAAAWUgCiAAAsBYOgslQsoAAlCUEUAJYgoACwAFgAAsAAACwCwAAAAAAAAAAAAAALAAAAAACywWAsAAACwqAAAAAAAAAAAAAAAAAAAQsBULAsoAlQoAJQlgWUSglJQSwsAAAAAAAAAJQAAAoEEgVZYAKgUICglgAAAAAAAAAAJQAACUBCpSAsCwLAsACywFJYLAAAWAAAAAAAAAAAAAAAAAAADoLACUAAASoAAgoAAAAAAAAUgCwAAFIACwAAAAAAAAAAAAAAAAAABSAAAFIsAAAAAAAAAAAAAAAAAACUhQgqUJSWCgAhSWCgllIolBKCAAAAAAAAAAJQAAoEAIhUVQQCiAqCywAAAAAAAAAAAAAAAAJRAAALAUhSAsABYAAAAAAAAAAAAAAAAAAAAAAAAAN0sJQQogABKEAKAAAsAUiwLACwAAAAALAAFIAsAAFgAAAFIABYAALAAAAAsAAAsLAAAAAAAAAAAAAAAAAJRFACURRKJQEKlCUIChApCglCAAAAALAAAAAJQAoAEAJYRVgKQKIBZRFIAAAAAAAAAAAAAAQsUSwAKIAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAN0sCEUAAAEoAAUhSAAAALAAAAAsAAAAAAAAFgAWAAACwAAAAAAABSAAAAAAAAAAAAAAAAAAAEKAQUEoSiKJQSwFEUAEFABLCkAAAAAAAAAAAlACkpAAEqIFWUiglJYBRLAAAAAAAAAAAAAAAQsAsFQWCwAAAALAAAAAAAAAAAAAAAAAAJQQpCkKgpCgAAAAAAA6JUAAAShCgABSAAAAAAsAAsABRAAAAAAAAAAAWABYFgAAAAAAAAWAAAAAAAAAAAAAAAAAACWUigQoBCyglEBQSiUBCyiUEsAAAAAFgAAAAACUKABAACWCFLBUKgLBUFgAAAAAAsAlJQAAAAJQQsUlgAWBYBSAAAAAAAAAAAAAIKAQoBCgAAJQAlBCgJQAABKCUJQAAlAN0QAlBAKWAAAAAAAAUgAAABSAAAAAAAALAAUgBSAKIAAAAAUgAAAAAAAAAAAAAAAAAAACUJQBKAEoihKEoJSUEoEKAgsACwACwAAAAAEKJQoEAAELFhBagWUhSWUELAAAAAAAAASgAAAQqUgLAqACwCwAAAAAAAAAAAAEKAAAAQqUAAIKABKEsKABKEoJQAAAAAAlBCyjoRLKoQLAAAsFgAAAAALACkAAAACwLCwAFgAAAAAAAAACAAAAoAAAAAAAAAAAAAAAAAAQpCxRLCwKCAoCCoKlCCpQgqAAAAAAAAAAAAAJQoEAAEKlhKVKBAUlCLCwAAAAAAAAAAAAAAIUgLAFIUgAAAAAAAAAAABCgAAASgAAAAAAQsUIKgqCoKgAqCpQgqCoLFBCgRRKAOgsiwsABYAAFgAAAAAAAAAAAAAAsAAIAALAAAAAAAAKAAAAAAAAAAAAAAAAAAAEFCUIolAgoEsFABFEUQFlBCwAAAAAAAAAAAAUAEAASwqAWUgWBYLLAAAAAAAAAAlAAAAACACpSKJQllICwAAAAAAAAAEoAJQACUAJQAEKgqAUgABSAWAAAAsBSAAAAFIABYKgsUA3YsAWAAAUgAAAAAAAABSACAAFgFIABYAAAAAFgACgAAAAAAAAAAAAAAAAAAABCyhKEoELAssKlAJQSiKABBUKgWAAAAAAAAAAAACUAAAACWEFWCpSKEAEBQAAAAAAAAAABCxRAAqAolgWAAAAAAAAAABKAJQAAlBKJYLFCAAAAAAAABZSAsUgCwFIAAUgAAALAAWAADoLAAABSAALAAAAAIAAAAAAAAAAAAAALAUQoAAAAAAAAAAAAAAAAAAIACkoEKQpCwKlCBQhRLCywoEABYLAAAAAAAAAAAAAAAAAAASyClJRALCoAQFAAAAAAAJQAAAQqAURSFIBYKgAAAAAAAAAAASglAACCoLAAWAAAAAAAACwALAAALAAABYAAACwsAAsAAAOgsFIAAAAAAWIAABYABSAALAsKQAAAALAAAKAAAAAAAAAAAAAAAAACAABKsoAlQsoELKAJZQAQKCCxQCAAAAAAAAAAAAAAAAAAAAliFlWAFIsAAQAFAAAAAAAAJQAAlICwKgAVAAAAAAAAAlCUJRKAAABCoAAAAAAALAAAsAsAALALAAAAAAAsAFgAAWAABYAAAOgsFIAAAIAAAAAAAAAAAAsUQLAFIAAKAAAAAAAAAAAAAAACAAAAABKssFQsolAQFJQlCUABCgJQlJZSAAAAAAAAAAAAAAAAAAASwsqIVYAoSiABAUAAAAAAAAlAABAUgAACwAAAAAAAAEKCUAAAAEsACwAALBYAAAAABSAWCwAAAAAAAFgAAAAAAAAAAAAAA6CxYFgCAAALAAAAAAAAWAAAAAAAKAAAAAAAAAAAAACAAAAAAAAoQpCgAAAAlQAoJSAEsqpQgsAAAAAAAAAAAAAAAAAAAASCxSiLCywWKCQAFAAAAAAAAAAlAgLCxSAsCywAAAAAAAAAAAJQBLCoLALCwFgAAsABYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgsCAAAABSWACwAAAAAAAAAAAoAAAAAAAAAAIAAAAAAAAAACkoRQBKBBYKCKEsLLIsolgWWksFQsAAAAAAICgAAAAAAgKAAAAEColRaCLBSoECAUAAAAAAAAAAAQAWCwAALAAAAAAAASglAAABBYAAAFgsAsFgsAAAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgQABYALALCwAAACwFIAABYAAoAAAAAAAIAAAAAAAAAAAAAAEpUKAAlAJQAJSKhKCUAChCkAAAAAAgqoAAACywAAAAAAAEKlhLAFqBYAoJAAUAAAAAAAAAAAgsBULLAUlgsAAAAAAAAAAAAQsAUiwsBYBSAAAKIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoVIAAUhSAWAAABZSAAAAsAKAAAACAAAAAAAAAAAAAAAAAEqkUAllCUAiiUJZYJQlCUlAlAqVCwBSAAACAAoAAAAAAICgAAABCxYilllJULLKWECAAUAAAAAAAAAAQWAAAAoQAAAAAAAJZQBKACUQAAAAAAABSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6BCwAsCoAAAALAAAAACgAAgAAAAAAAAAAAAAAAAAAAKAlCLCoFAQqUlIShLCpSWUASqllCAAAAAIsAAKAAAAACAAoAAAAQKiWFsolQWWoECAUAAAAAAAAAAAQLAACwFQAAAAAAAAAAAAEAALAAAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADrFSAWAAAsAAALAAAACggAAAAAAAAAAAAAAAAAAAAASqlEUAJQgCKCKEsKlCUAlAKILAWACwAgCwAAoAAAAAIACgAABCoipSFUCWCyywAIBQAAAAAABCgAAJQgWAUlgWAAAAAAAQoAEUASwqAAUgAAFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6BAAFgAAAAAALAAAAAACUAAAAAAAAAAAAAAAAApKJYKCKEUCEUAEFQqCyhFAEqkAAAAAIAAACgALAACACUCgABCywsWIApSUllJYsCAAUAAAAAAlCUAAELKJYCwLACwAAAAAAEoASiUEoECwAAAAAsAAAAAAAAAAAAAAAAAAAAAgqUARSVBQJSWUIKQWAsKgqUEKAQoAAAAAOgQAAUgFgWBYAAAAAAAAAAAAAAAAAAAAAAAAABKUACUCJZSVCgASwpBQihKIUEqkAAAAgAAAAKAAAACAAAoAAAliALCxVAgAsCAAUAAAAAAABKAAEsAFQLBUKgAAAAAEFQoABCgSwsBYAAACwAAAAAAAAAAAAAAAAAAEKQoAJUFCUICpRKJULKBCwKCKBCywoIsFACWUAAAA6BAAALAWAAAAAAAAAAAAAAAAAAAAAAAAAABKoCUJYgCpQlJZQACKBBQiiFAqWAAACwgAAAAKAAACAAAAoAABCFgLBRZYCwsLAgAFAAAAAAAAAAELAWAABYAAAAAAAAAJQAAQAABSAAAAAAAAAAAAAAAAAAAILFCUJSLCwKAAQoACBUKQsCwBSUAAAAEoEKCVBUFAQoOgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQqWpULFiVCkKlEolAAAQsolCVAolSrAAACAAAAAAoAAAIAAACgABBYgUllIpZYLABAAAUAAAAAAACUACUIFgsCwBRAAAAAAAAAASgQFIAAAAAAAAAAAAAAAAAAAAABFCUlAQsoAELApCwFlAJQlQsollEolBLBULFCUAShKCUAEBQBKOgQsALAAAAAAAAAAAAAAAAAAAAAAAAAAACkqAJZRKEUAJQQsUELKBCywsUlKIAAAgAAAAAsoAAAIAAACgAAEIKBAVZZQCBAAAAUAAAAAAlACUAQAFgAAsAAAAAAAAlAJQECwLAAUgAAAAAAAAAAAAAAABCglAAgqUAAlAQoAJZQlEsBQABKJZQQoCBQAAlQAoEoJSUIollEo6LEAWAAAAAsAAAAAAAAAAAAAAAAAAAAAABCglCUAEUlQLCywWUJQACVCpaEAAAgAAAAAAKAAACAAAAoABKhAoJQixVlIKCQAAFAAAAAAAAAShAsABYFgsAAAAAABKJQAAEBRAFIAAAAAAAAAAAAAAAAAlAJZSWUlCKJQJQQoCUEFlCCoFgqCoFgqACoFgsoRSUCCpQlAAJUCwqAUSw6hAAFQAAAsCUAAAAAAAAAAAAAAAAAAAABCyglJUKAQoJUFlJYKlBCkKBKEKAACFgAALAAAKAAACAAAAoAACVIqCwKhagWKCQAAFAAAAAAAAAAAgLKJYAALAAAAAAAJQlEoAQAAAALAAASgAAAAAAAAAAAQpCkLKEsFgVCyiAqUJQgLAAAAAAAAAAAABYKgKECxQgsollCCglQoOgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAgsoAQCwsoEKlEsKlEUQFCUJSoAAIsAAAAAAAKAACAAAAAoABKiKIBULFVLCwsCAAAUAAAAAAAAABKJYABSAWAAAAAAAAAAlBAsABSAAAAAAAAAAAAAAAARQAgoAIoAllACCyiVCywAAAAAAWAAAAAAAAACpSUCUJQgsoAJSFOgQAAAAAUgAAAAAAAAAAAAAAAAAAAAJQAELKABCkKAQFIoASgAAigALCAAAAAAAoAAAIJQAAKAAEKSLAqUBYsCqgkAAABQAAAAAAAABAAohSAAAAAAAAAAAAlQAAWACwAAAAAAAAAAAAAABBQEFlBCkKAlEoJSUJYAAAAAAAAAAAAAAAFgAAAsUEFlIoSwsUIFDoEAAWAAAAAAAAAAAAAAAAAAAAAAAAAlCCyggqURQlEsLFIoiglJUKlJSoAAIAAAAAAACgAAgAAAAKAAJYllJYLLChZULLLAgAAFAAAAAAAAlAAQAWUiwLAAAAAAAAlJQlCVCywAAAAAAAAAAAAAAAAAASwsoSwsUlAQKAABCpSVAAAAAABYAAAAAAAAAAAAAALAsoAAEKQoOixAAAAFgALAAAAAAAAAAAAAAAAAAAAAAlBCgShFEoAAllJQJQlAIsoAAIAWAAAAAAKAACAAAAAoACWWCCgRSKVCrBFiAAAUAAAAAAAAAAgAAAsAAAAAAAAAACUBAAAAACwAAAAAAAAAAAAJQJQCUBCgSgBKCUSwAAAAALAAAAAAAAAAAsAAAAAKQsUJQgsolADoEAFEAsCwAAAAAAAAAAAAAAAAAAAAAAllIoAJQBKAEUiwVCkKAAQssoAAIAAAAAAACgAAgAAAAKAAioJRAWUBZZaSxAgAAFAAAAAAAAAlCLABZSAAAAAAAAAAIKACWAAAAAUgAAAAAAAAAAAAEoRQQssKCUEoIKgpCywAAAWAAAAAAAAAAAAAAsAAAAACgAlACUlD/8QAFBABAAAAAAAAAAAAAAAAAAAA4P/aAAgBAQABBQJ//oQH/8QAFBEBAAAAAAAAAAAAAAAAAAAA0P/aAAgBAwEBPwFhA//EABQRAQAAAAAAAAAAAAAAAAAAAND/2gAIAQIBAT8BYQP/xAAUEAEAAAAAAAAAAAAAAAAAAADg/9oACAEBAAY/An/+hAf/xAAiEAACAgEEAgMBAAAAAAAAAAABQYCQoBExcLBQYAAgMED/2gAIAQEAAT8hiachFwHGSssILafp9+NT4xWREjf93HwZ9G1rGn028QfFCLTmmZ5CyzTEiMxD1qKoucH3NU/3CoozzVd459eBgJRnp89fjvBHjFkQLM6HTwrBbUhdaitOAn7wuBVjiCEattcuVL9Z3evuYuwHJG3WMHxWsAXVK6CnEhWsCCJ92FFStEdVjrvPA2uAi+hDfF65UNf4o1OXceUf/9oADAMBAAIAAwAAABAdcNMMMOMdsMMsMNdN/f8A377/AH//AO9//sMMsMN/8/8A7/8A/wC/PPfNOuZIZIKLb7776IYYIb6JLooaIIKP933333333X130/8A/wD/AP8Af/8A/wD/AP8A/wC/udsMN8M8OeMNuMMtsPM8cMPtttcMOMPIL5Iab/8A/r3/AP8A/wD/AP8A/wD/AP8A/f8ADDDHHDDXnDDjDjH7f/rXfv73v/vffPjDTDLD3b7Lf/jn7vnr/fjCGCyD+2+++62iyuOCmCWueCmH399999t95199/wD/APv/AP8A/wD/APv3/wD/AP8A/wC/6w7x4xy5wxywx70y7yw1ww+5yxx7+2jukoktv++7/wD/AP77/wD9/wD/AP8Avgwyxxxx4wxw4ww310//ANt9+f8A/rff/wA0ww4wx97+39/+8553x+w4igpg3vvvvvqjngjpkigkuhisnbdfffTffaef/wB//wDf/wD/AP8A/wD/AP8A/wD/AP8A/wC7/wCvcPcteMOPMN/cMvMN+csM/OOOecMIoKI6J7//AP8A/wB/f/f+/v8A+6+2HTTDDPHHHLnzLfjLb3nrLLf/AL3/APv+OMMMMP8AHffv/wB9w199x26yjgg1/nvtvtgsohggphhmoggjfffffbfffXf1/wD/AP8A/wC9/wD/AN//APv/AP8A/wC//wD/APyw0012099w4w56w5xxy481z84wx9husilgtr3/AP8A/wD/AP8A/wC+/vtvvgwww6wyww435y201y943x83/wD/AP8A/wAMMMMMP/8A/wD/AP8A/wB/794z370ogwy/vtprviurgohjgmkiipnfffffffdff93/AP8A/fv/AP8A/wDf/wD/AP8A/vvf/wD/AO/v8/sMOstMMscdsutMNtsMusMcMcMI5KrJb5b9f/8A/wD3/wD/AP8Avtvvruy1yzwyx4+12x3057+6+/8A/wD7/wD64wwwwx0//wD/AP7/AG78z4/515gg4w3vrrruhmkoikkligogrFfdffffcff+7+ceYQYcacef/wD/AHff3/8A39//AP8A/wD/AOu8cP8AbnrbbrjXbLPHHj/nnHbjqSC2mCi2/wD+/wD+/wD/AL/vvvvvup9//wCeNd/uOPffP9f9/f8Azbv/AMwwwww0137/AP8A/wD+z84z13+4wigww3nvvvslggglgogokhhhNXffdbffHf8AWEEFkkUEEkEUlFG1/wDv/f8A/wDf/wDf/wD/AP8ALTjHHnDrHLj3LSfDXjTnbbTvHaCyCKWCW/8A+3//AP8A/wDmttvvvn+787y1+23y391/37792/8Af/MMMOMMd+e/+ff/APv7Lz37n7iCjDTO+2uu+qiCSqiKCCa+25t999998e5hBhxBRBBRBBFB5BJVZJx37r//AN//AP8A/v8A3/z082x0+5xxyy4kw605+265ww6ksuskutv/AP8Azv8A/wB+7rb7774vcte9v/8Av3Tvvn77P/8A7/8AOsMMMMNdtf8A/wD7+/10591584xgq6w7vvvvvgoisihGogokvPffbXfbNtIQQQQQQQSQQSeRaRQYQQQWTdf/AP8A3v8A/wD/AP8A+/8A+8s+ssMNtdO+cKMOe8PMNMuM4J4Loborb/8A/wD9/wDP77777579/wD/AP8A/wDf7/v/AK5/3/8A/vvMMMsMMMef/wD/AP8At9PdsuufPuMIIMMfb7777q5YoKYCI4KoJj23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77zAKIaJigKY5gQSzX3zzzzgEEEEGFGGFEEUEEFXXWGX33XklGX3G3km3HlVkkEElEkEEFEFHNsNMHUX/wD/AP8A/wD/AG5yxx+w448zy+1zxxz+wxgmihpq7+//AP8A/wD/AL67774b5oP9efvPedPucvsfKIILIJIMMVr7r77bzBYIKLACAIaoSRBz33zzzikF0EEkEEEEEEEGFEXn1XUXnVXn13X33H3n32VW2FEEEFEEkEEEEMuMOEEH9/8A/wD/AOdtvcd8NcvutuMNNMssONuLIoq5b/8A3v8A33/7vvvnvp0+9963883010wogggggghgxTPruvvvvOIqkigDECnikDJJPbffPOGKQQQQUSQQQQQQRQQeaRRebcfbYUdbTQbUdfXZeZXXaVQYYYQQQQUQw6w0QYf/AP8A/wD/AP8AzTLbHPnnjjL/AEyz1w220gogopv/AP8A/wD/AP8A/wBnvnvvvr054444goggkgikiggomhfPPvnrvvPOMiiirADNAgqhCDDPfffHOMAQSUQRQQQQUZQRQQSebSeTeVfYZbdVQeXYaXafZcdUaRQQQSQQQYQQw4wwQSf/AP8Af/7/AFxww447474x60wzx92wwpiklrv/APf/AP8A/wA77777774IKoaJIIIKoIoIoqoYQzz577777jzjIYYbARAA6JIBDwz333XxzyUEEkEEFEEGGUUEEEF31nm0n3XHH2Xln2klk2W122Hml0EEEEUFEEGE0MMcMVEne+//APv/AI44w1ww3yw4xwwwyy46gogghv8Au/8A/v8A77nvvvvvvgkjhhigggggkgBLHPnvvrvuvDPMOkigiGAEAgpsAANDOVffdPKAVSQTQUQQQQQYSQQQQddXWaQYWebdfZfeeUUSTfdbXeRSRQQZQSQQQcQSy4wQQRf/AP8A3/v7TLDHTPHnDTDHj/DTjDSKmCO//wD77/8A/wD+26+2++y+AIQIAMIYcM8ee++u++++c88wiCWOSEogAaCiKUI8899N998whBBJBBBBBBhBBBRBRBRB5FdR5tNdxhR9tJh9tB551tdVlZZFJBRBhBBFBBLLDBBJd/8A/wD/ADfpjTjDjLLTDT7DXzrbnSCC2G//AH/73+3/AL77775777777777757rZ777777zTzzzLYLYo4BAxAIYYIhAwRzX3333zAEVGkFUEEFEEFUGEFVEEEHF0k0k3mFFk0XVGU22V121lXWVEkEGFEGEFEEUEcOFEn33+vv/AP8AaSww1y8w4z6249x4w61kgjt/+9/+/wDv777776r7757777777r7p75zzzzTzBrIYYIJDigBQKY6oRQTBz3X33n2jBEEEEEkUEEEkWEEEEGEEEEm0HVHn0kW3EmnVFXFnH1Vm3H2XFEnmEEEFUUEE0OEGV3X3/wD/AP8An1+sdcuuOdcOcMdM8tuIJJb/AH//AP8A/wD/AOvvvnvmvvvvvvPMPPPPPPPLMNIlqniqggjCAGJCLhivkEAAHPffdffebIYUQYQQQUQQSSQQQQQYQUQQQZeUXdaafdWUeeRcfYWZfXWZcQQQYYQQQQQQQQUQwRXffff3/wDn21cMMOsMNOMMNeONM+IKL7//AL//AP8A/wDe+++++W++2++ySiyiyGCCCq6qWCCKiQkgQEAEQqKmQ4EoQs99tt999tpBBRBBBhJBBBFBBBpFBBhFJBF1lptlV1JV9B1tdN1ZVZJxh1ZRhBRBJBRBBBRJBLFB9199/wD73/fby0y0ww27xzyy452wghvv3/8A/wD/AP8A776777777777LM8YIJLKIJZaIYwAxAAjABAhFQqIIAgDQCz333333X330EEEEEGUEm0mEEGEEEEGHEUkFV2nXnH03E0UX1UlmW23V01UmFEEEEGEFEEkEGEEW3V3333/AL3959TDD7zjHj7DffTjPuC+/wD/AN/P9/8A+++++++u266yDjDDQwEYoEIkQUUwAQUkIhRF1MGIAQIQsc999d9999919pBBBJBBBBBBBBBBRxBBBVJFJBdpNp5hFJ1d9dtpxlxh9tRphBhBNBNBRBRBBBBBVd9d995v/wDfefY+40ywQZ8ww3z44wpnv/8Av/f/AP8Avvrvvvuvtupw4y40w1EJIAADABGBFRQaYZTTQNKBBKBDPffffbffedffcWVQQQQQQQcQcdRUSQQTQYQQQQTbXdTVbZedTfbaVTfedcbUQQVUQQWQQQQQQSRZXfbfXfdf/wDn333lvsMsEkPM+MOMNII7/wD/AP3/AP8A/wDvrttvuvtog08www4wx6feZYQdQSYUSQSbZQWAICAAJHPfffXfefffffZffYQQSQVQSQRQQQcUQQQYRRQUQQWXYdUSdRdRUcfXRVedbcRQRQQYQQQQRQQQUQfbeffXfef/APW333kufeNXkNscs9OPr7+/+/8A/wD3/vvvnrvrnogw54ww6wlgogSYVeYQSWTRadaUaKDBJHOffdbXffffffffdfffXQYUQSWSQQQQYWWQQUQQWQUQZQQfaYUbeffVWfdYccQRQZQQQQQQSQQQUQRRXfXfbXffdX/fffffQ6y0SYSx+zw8wkvv/wD/AP8A+/1nvvvvvvsqwz8xw5hgghglggQQaQUQUUYcYbUODHBPfffffbffffffdfefffffeSQYRQQVRQRQQSYUYQQQUQaRQSQYcVSZTWffdYUcUQRYUQUTQQQQcQYYQRRafefffffdefdffdVSw4UUZR6wy8wjjv7/AP8Av/8A+vvvvvivskxwww5glsgjgkgkipZQSTSeRQSXXffefffdbffdefffffffffffffdffQUQQQZQQQWYQRYQQQQQQUQRQRSYUYcQYYQRQQRQQQQQQaUQTQQQUQQQTfdffffffdfffffaeR72cUUQRy2y4tnt/wD/AP8A/wD77776777LJMNMIYIIoKIIoIIIIKJVEnEHElV3n333333331X33mX3n3313X331333330kVGlEFEFEUEEEEG0FkEEVEEEEEGEEEEEEEEEEEEFEUUHEUGEEEEEUV3313333333n333mGUuGFUEGNsMObpr/AP8A/wD/AH2u+6++e+ijDDGiCCCKGiiCaCCCCCKKlxtdt9d9919d9999999999t91t95d9V99999919dhRBBBBBBJBFBJBBVBBBhBBRBBBBBBZxBhFlBRhRBBBBBJNBJBBFd99599599999dt9xhZzhZFJBBHLbmC8//AP3/AN/5777657KZMMJJZIIYIIIIIIKoKIIIopK32333HX33l13323n3333333333W33333X3333330EEUEEEEEFEFEkFUEEEkEEU0UWEFGEWFEEUEFUEUGEEEkEEEE132X33333333X3H3kkFF2kUEEEGsNYBHX/wD/AP8A/wC6+q+++qHTKCCCCCCCGiKSCCiGCCCOaKK+999999999999t99999t999t999999955999999ZJBBBBBRBBBJZBBVBB5RBBRBRhBBBBBBBFBBBFhBBdBBBBRFNJ9d99999999dV99hxBhNFNJFxxb7D4RB9/wD/AP8A+ue+6++yDTCGCiSCCSCSCCCiGGeOiGq+OiSW9999999199999d99999999999591t9t9999991BhBBhBBBBVBFBBBBBBBBRBBBBBBBBFBhBBFBFJBBBBBBBFZ9V99l919999d59ltVBBFFNFhNJBTHBFxN//AP79vvvvssowyggihggogioggghqklntioqsvukljvffffdffdfffXfffffffXffYefeffXfbfffdaSZSUQSQQSQYQSQQYQQQQQQQYQZQQQRQRYbRUSQQQQQQRTfVfffffZZfffffceSZaeUcRUYUSQYxRRQUff+/wD7777LaOcMIIIJIJIKoII6ab7ZJ7raY4q575567rr33333233233313333333333333333X31330UGkEGGGEEEFEEFEEEGEFEEEEEkEGFU0EFFEEEEUEFFE13X3332X33333333mllVkEEmWEEEkEEkXGU33//AP8Arvuupww8gkiggghghgoihhivovpjgumiuimkqhjnqnefbfffffffffffbffffbfffffffXffffUSQQQQQQQQQZQSQYQQQdQUQQQQYQQRQQURUQQYUQQSWeffaffffffXdffedYaRRTUUSWVQTQcRVTQQQbX+/vrvksg04wggooggkggghvpmkulusmntguuvqjurqlrltvdfffXfffffVVfZeffbbdfffbfffffbfcSQSQSRQQQQSQSUYYQQYUQQQWQSSYQQYRRZQRQYRTfbffXfXfffdfeffdQYYSUQZQZQQYfYRcUQQRWUff8A777zgMusMYoIIKZYJY467qoro6Zb7Y457b67ra67777ZbZ7n31323W3033V33333321X3XX3X333330EEEkEEUGEGEkEEEEGE0EkFGEEEEFFEkGEFEEln333nX333323233nGkmFEF1GFH2UlGEFUVE03kk0X/77RynMMOYoIIJaIYIZ7pYI4JrraZ7577657776777Zp777bb71333133333330333333nn33333333320EUUEGEEEUEUEEFEFFkEEEEVEEmEkEEE1333333133233233X3EkFElkkEHEEFUVkXEFGmFVkUWl3/AO+89pzDHCCCCGCCGGaaCqi2+WiaOe++66y++2+m++u+2++6e++O9599999999999999999999999d999995JBhBFBBNFJBJBxJBBFRBBxBRBBBNN991999999159595dx9FVBBFBFZFFlBtpxBN5hBhhBJVVZ++8d19xDCGCCCKCGGqeWSKWe22uu+a2a++6+O+ueq666mCy2ySyCyyhBR1R951d99999999991t99191919999BBhhJBBBBBpJBBpBhBZFFBNdd9951999d9d99td99991VJllBNxRVhFZVl5BJFBVNRBVFFRNW89tt9hHCaGKqKGGGWSu2yqaau+6u++u+uuu2+yiqiCCiCCSiCCCCCCCJBBBZBx1t9955919591599999919d999BhBBBBBBBllBBNNNNddt9959999t99t999d99d9555BJZphRBlRBRJpBhhNhlFhhppFVBNk45195hDyCCiKCGX2SOSSmaeqe+6u+e++++q+ySCCCCCCiCCKGCSSCCCCCRBBFFlRBRxt99999999N9999959t9999999tdttNN9999999t9999t9999l99999999d195xBdxBJZRBFBFRBJBJBJVlRFJxpBJV91t99xxiCWCCCSXyWeuWuuuue+6+a++uOaCCCCCCCCCCCCCCCiCCCCCCCCCCJFFBBFxBRJ99d99999d9t99t99t99999h9d9999999ttt999999dt959995199d999951VRBBBpJFFhhRNhhFhBFZJRlJZJBBNd99999jiGCCCqTD2CSmGKmWa6e2+++qu6SiCiCCCCCCCCCCCOOOOOOOeOOSOCCBBBJBBZBBF19x99Zt919999999995dR5919919999999959919959999999Z99995xhFRBpRBpZBFhRhFB5RRNBFh5JFBtNxd999dxnCCCCCe3+mO+muOaO++u+++62yCCCCCCCCCSCGO+mq++++u+i+e++u+O+eRJBhBBVBBBd99d999999999V99999N9d519t999999999991599t999d59999d5tNhBtBNh5ZJRVhBJBBpBphJldR5BFd9d9t995WaSCCgfT+mWGq2e+e++Oe+2yiCCSCCCCCCGOSe2uu++2W++iqu++ae626OuWBBRFhhhZRBd999999d999995991991999999999199199999d599t9t99999hFpBFRZhZJVBBBBFBRdFBBBRV1Blpt9N919595CSCiQFfeiKue+uOO2+22eq6qCCCWCCKCCO+mO+62aqu+a6+2++++++q+y+++euBlRBBhhZBL999d9t99d999d1999999999999991999999Vt19991N999x9tBNhB9BtVVddhFdldRBlBBhtpRJhVd95999991iKyaURH6u+Oi+Cuy2+O+O6yCCKCCKiGK+eeee+W6ue++u66337bPLrvf7n73zf8AugQSQQQUww/ffbfffffafVffeffXffffffffdffffeefffefffedfdcZUSScRaUVSZUSQQSeTSSbQQebQacYUTfffWffffcYiogBQT5onsvjltpttvvvskggkgohginvvtuuvnvrutu7wy+/ijrprvvrjvkgsqhvkoSRQww03/ffdXeddfXfffffXfefdffbfffeffbffXfffXXffdXeccUUdbRSURRaReUaWQSWUYRSSTcXRQYdbeffdfffbQghAAQS2vhsvqmvpttvluogggggghmlvsvvtvvvuv8Af9u66p6Lo4pr6rbaqZ4L6777rZ6ENsMMMX33nn3333W3333X3333333232333133133333n333H3UVUkUE3UmGEFVEUEWFFHGFXlkEWEFUX333333n32WJIBGkFP6rIq7pL7r7rrboIIKIIIIZ7aa57777ZP+uPoL757p7raLIIIIsccc8cMMIrIJb4sMMNN333n31333133X3l33333333X3232233333333232GWEGUWGFW1WHlEHEGnEUEVEl2FGEVGFX332323333nlLAQEFEs7aY7aa7b5Z77JoqJIIIooZq7667r7q8PfK67bJ6bK4McMcMMMsMscMsMMNMssMMsOMMsf2333333X3n3333n33333333X3n3n3H33333n3F0UUkFGVVmV3EGUGkkEkkFEFHFFEmFEUE13133H33X33UZyEEGVt46rqoZ7rprZrIoJIIIIYr54757br6vNJ746roLIcNMMMcsMM8MNNcMNNMsMMMMMMsdMdEXX33W333333X0X3333XV323333333333/8A/wD/AGFEk3WGWG2FUEGVWFVEWVlV0H0E00k0k03m3l33Xn323nHIAVEEUtJIbqLZ747767IIIIIIIILr57rr77PMYabK7LJIcMMMNMcMMMMMds8o44744o445oYJpIIHV3233233333333333333133/AP8A9/8A/wD/AP8A/wD51RR1pl5BhhlBFRBhdhhFhhxhNBVhBZZdpFd99999999t91EEFBBVN6OuuW++uuOu+eCKCCCSCO+Kyiq+aLiOymCyiDTDLDDjDjDHPP7/AP8Av+//AP8A1+//AP8A/wC//wC85oK32333n333333333n3/wD/AL+//wC//wD/AP8A+/fnkEEEkHGGFHEkE1E0G0WEVFFEV1UkGFHEEWU22n3n33X333mFGEGEEEt64rJ6vpr677rIIIYIIZp747K67vea65o6IcNsOMMONO9s/wD/AP7/AP8A/wD6/wBv/fv+/v8Af/8A3/7/AP8A999959919999/wD/AP8A/wD9/wD/AP8A/wD+/wD37V5FZlhhZFFBBBBtBdZBDbBRFFFdJNh5VVBd9td19999959999xBBBVRBXyKe2O/uu+6+2+CKCCCmOqa6+uO2CymaeiSDHDTLDDPPf8A7/8Af/f/AP8A/wB/9/8A/wB//wD+/wD/AP8Ad/8A3/8A/wD3n333333v/wD/AL/6/wD/AH3H/wD/AP8A3/8A8YQXTQdUeUcSUVRSTUa0wxUQZURUQaQRcTWQffbffffZbfXXfeRQQQTUb6vutvv83nvvlngggigiivnjvpvvtrqlokiyy0wwwxjv/wD/AP8A/wD9/wD/AH9//wB+f/8A/wD/AP8A3/v/AP7/AP8Av/8A/wD3n333/wD/AP8A+/vf/wD/AO/233+//wD3kXmEUkEEGlmG3EGNONMduVWVGEXmGGEEUEkmn333333333H33mEGEVEFVPr7JL79a77756YIIoKIbr777b7LZr675IcOMMMMJb/f/wD3v/8A/wD/AP7/AL3/AP8A/wB888488/8AtvPfPff/AP8A/wD223//AP8A3/8A/wD/AP8A/wDv/wD/AP8A/wD9ZYbQQaQQTcWUTaww4zw044RRQQQQQZfQYw1STXfWfffffffffddRQQUUQR9stlrP+7tuuvvpggggqjtmvnlvtlussogwwwywljn937//AN/+/wD/AP8A/vPftc9NNcNcuMcdcdMcMs/vt/8A9/8A/wD/AP7v/f8A/wC//wD/AP8A/wD/AJWQReTWRQRTQ8163w07y30wUWQURbQcVV076VZXffeffX9ffdffdQwQQURRc5gtoPZxvvvvnvggggghvrnvvmqusgiikkywwghrv/8A+9/e9/8A/wD/ANeeNdcMMMMc8NvMdPNsO8sccfdvfuP/AP8A7/393/8A/wD37/8A/wC/N0WEklmE0eMMutduPd8tNscOWUEEkGEEnNMsMEUX33333/H3331XGFEmEUkUtf467z/+777b5YIIIIII56Zbq5q45YaKIMMMIIZ7vd+/u/8A/wA//wDsPPOsMuvu9scsNN8c/sOcs9MM8cssMMvv/wD77/v/AP8A+v8A/wD/ANfkEUWFO8scNdcscc8MNPMMttFkGkkHGGsssuMsGV1n333/APt999d1xHhRBhhFbyqmUtrfu+++W6CCCCCGu+++ye++Km66DrDSCKe//wD/AP8A/wD+/wD/ADHTvDTHjjLPHfLLrTXDTTDLXzDrXHLHjbzD/wB/1z//AP8A/f8A/wD/AP5VJDDzTbvzDDjTPT7jDzTHTBBh1NhFJjTXLrDRpN9999/f/wDXffbaYywQURQRc7kpqPe/pvuvrqhgggghtvvnpugvvtkogwwgghv/AN//AP8A/wD+/vMPuMtMcMeuOtOOcstdNMsNOc8vNMdcNMMMMutu+/8A/wB//wD9/wD/AP7Rwww56xy14x4z8w+xz9634xSWQSTfw81yyw4wTXbfXf8A9/8A99l95xDLBZ1BFPL6CuV9/wBvrrrisghgggijrurrtjsvvuhww2gljv8Av/8A/n//AM060x+8w15x0ww64zzxy4800www0050xw1040132/8A/wDv7/8A/wD/AP37rDHrDjjzDDTDXbPnrbHDznhRtBxZDbDHnPTbDRdt9t9//wD3/dfWcY4y5cQdVW/8iqrd3+vlvruoiigghkrttvntrvhtgkw0okht/wD/AP8A/wB/udMeOMNMesNttudMMcsO8sNueMus8e/c8sfMdNMcMMP/AP8A+/777/8A/NMPPMM+OsMOteNMcOutcMsMWEEkOucMNcePNPsUX3339/8A/wD/AH323UMM8lFEEv8A3aC+t/8A+uvvvqgggkgglvptpjqnnpghpwwhgln7/wD/AP3/AO8x60wwx9024864x85xww544/y050x3w8x1w94w6w107/8A/wD/AH7/AP8A/wD14y0yy8w05x1wx062w0xz00QYb/yy6ww8x48+wbbffX//AP8A/wDfffYzy8yQQQX794rtmX6/uvpvuhgggghnrvvruqunigggw4ggnv8A/v8A/wD/APMONM8MOssNOONcM9ssvd8MMcMM+cd9/uMMMMNMcOeeMcP/AP8A/wD/AP8A/wD8vMvcMMMOseuNdsMdfMM8NcmVucctOMMMdOOfOV333+//AP3/ANfffYwwwwQQRb+68rnv/wCur7566qIIKJIo6557o5oa47IMMMpIbv8A/wD/AP8A/wC489y0102yx6zyww2y4x0wx3x36w450604152yw00ywx+w0/8Af9//AP8A/wCsPdfMNcsssfOONMtdMONcOFMOtNsMsdsdMdduEn33/v8A/H/1955vLDDBRBBfzH6qC/8A6z/vuvvogigignvrvvmqinmqgwywoht9/wDv/wD/AK3xx409y7xyxyxw4wzyww4xww6y1+ww06xwz4ww5/w0y48609/7/wD/AP8A9x61zyw161w02002ww64wywxw44w25916yww5yRfff8A/wD/AP8Au/132kMMMMEEFN8OPary/d/b4b77oJIIJJ576657qZ4qKNOMIIbtvv8A/wD/AP8AHHTDTzbT3bDDLDrrjzjLHDLHrPPvPHvP/PvTbjPLLDDn3P7X/wD/AOf/AP8A3+x724wz6492/wB+cOMfuessdMucMcOeu8sccNN333++/wD3/wD/AHX2EMMMMEEEGc9846z/APnue+2++iCCCCC+Su++eiCqSqDLKSCf/wD/AP8Af/vXTrjjD/rnj/zHHHTXvnT/ACyz9/8A9f8Af/8A/wD/AP8A/wC8/N9s9Os8OcP/AP8A/wD/AP8A+18440x56zy67yzwx4x57wz0w390xy1y23444bff33/+/wD/AP8Affaw4y2wQYU8/wCdpZ1f/wD+q22q6CiCCCSu+6+u++SKqDDCiKG3/r/7/wC8z4x4x0zy1642wzww8w6wz051/wDv/v8A/vv/AP8A/wD/AP8A/wDLjLLPbDL7/wD/AP8A/wD++8y0006570wyx89yyxz104wx0wxxwx+8w0wwzffX/wD/AP8A37/ffaQywywYYRR3ywtsO77/AP4b54YoIIKIb7Lr776aKKKIOMIKb/8Avvf/APxwxwz7y30w6+x4x6xxwy0y47//APf/AP8A/wCv/wD/AP8A/wD/AL7/AP8AbHrzXbPj/wD/AO//AP8A/wB+MNsudMNsPeOvOsMcM+ss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";
const WP_DARK = "data:image/jpeg;base64,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AABKARZQAAAAAQFAAAAJQlEsFlgKQAAAAAAAAAAAAAAAAAAIAAAAAlCWAAFQALAKQpAAAAAAAAAAAAAAAAIpAAAAAAAAAAAJYbjOwAAFlECwLAoAAAAAAAAABQCWUAAlAAgqUEFAAlAABCoAAAAAAAAAAAQBKqCLLBUqoAAAAAEoECwsAAAAAAAAACLAEBQQAAAAQoAAEAKAAAAAAAAAAEFgqUhSAAAAAAAAAAAAAAAAASgAAEAAAASiUEoiwAqABYFgALAsAAAAAAAAAAAAAIsAAAAAAAAAAEsNxnYAAAoQLAKSgAAAAAAAWAABQigACWFBKhSFlEsFlABAspFCAAAAAABYAAAAIAlVLLEWFlVFCAAAAAAlEAAAAAAAAAAShKQIAAAAAAAlhQSglEoRRFlAAAAAAAAJQIFgsFihAWAAAAAAAAAAAIAACgAAAAgAAAAAAAEUQAABYWKQApAAAAAAAAASgAIWUQAAAAAAAAAAGwzsAABYBSAqUJQAAAAAAAABYKQLBYLKEUlCAoEoQKCUEBQEAAAAAAAAAAAAQBChYlgsKKIAAAAAABAssAAAAAAAAAAIAEAsAAAAAAQVCpQAAgsoiygAAAAAAAEoRSAUJYCwssKlIAUgAAAAAAAQAAAAFABAAAAAAAAIoiiAWAAAAAAAAAAAABKAAAAIsAFgAAAAAAA2GdgAAAALAWAoQVKAAAAAAAAAVBYoBAFhUFlCKRQQUACAAAAAAAAAAAACAACVUQqUspKgAAAAAABAKgAAAAAAAAAIWACAAAAAAAAJQAQWKJYWUSykFAAAAAAAASglhYAFlEoRYLBYBYWAAAAAAAACAAAAAAoAIAAAAAAAlEWAAAAAApAAAAAAAAAAAAQAAAAAAAAGwzsAAAAABYAKgFBCgAAAAAsAAAABYFgsCxSVCygQVAAAAAAAAAAAAAAEAEqywsIUqWAAAAAAAQpABYCwFIAAAAABKJQQAQAAAAAAAAQoAAEoSgQCgAAAAAAAAEsLAAFICpSWBUFgFEsLLAAAAAAAAEAAAABQAAQCUAAAAEoIBSLAAAAUgAAAAABCgAAASiAAAALAAADYZ2AAAAAAABZYWKEFSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlVBUpLKksQVUUJYAAAAAAAJYAALAAAAAAAAQUECCkAAAAAAAAAlCKEoiiWFikFAAAAAAAAAJRKCWAoikAKJRFBAsogAAAAAAAAAAgAAKAAAACAAAAJYVCioQAAAWAAAAAAAlAABKAIAAAAAAAAGyXOwAAAAAAAAKgpCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAABClQsWIpEUQpYLAAAAAAAAAgBRAWAAAAAABKBCwQAAAAAAAAACWUEKQqBZRFEsAoAAAAAAAAACWUlCWAsCgQFIsCwsUQAAAAAAAAAAAQAFAAAAABAAABFABACwAsAAAAAAAAAQsoAASwLAAAAAAADUZ3UoAAAAAAAAAKSwVKSwVKAAAAAAAAAAAAAAAAAAAAAAAAAIFQKEUkWAtSwAAAAAJQIVAABUAAAAAAAAAACWAqQAAAAAAAAAVKRKgoEFIVKCAUAAAAAAAAAIVAUQoikURRAWWFikWAAAAAAAAAAAAIACgAAASgCAAACKBYFggABYFgAAAAAAAAAlACWAAAAAAAAGozsACoKAAAAAAABYBRFEBQIKAAAAAAAAAAAAAAAAAAAAlCUIACxFQpKpACwAAAAABAsLAAAAAAAAAAASgAQsELFABAAAAAAoIllJUFABKABKAAAAAAAAAAASiWCxSLCghSVBZSWUSwAsAAAAAAAAAAAEABQAAAAAQAAAFgFgssQsLAAAAAAAAAAAAAAEAAABSAAAA1GdgABQsEFSkoAAAAAAWAKIpAFgsFIVKEFAAAAAAAAAAAAlhYoikUJRAiyggFWAAAAAAAIWAAAAAAAAAAAAAAAQWAAACAAAAAEFBKAEoJQARQAAAAAAAAAAAAgsCwACkAsFgWWACyksAAAAAAAAAAAAIACgAAAAAgAAALFgBYIABYFgAAAAAAAAAAAJRALAAAAAABqJsIAACgCyFgoAAoIAAAAsAAolQVAsKgsBQEKAAAAAgpCwLAFAIEqACooAAAAAAAAAAgAAFJYAAAAAAAAEoAAlgAABAAAACCgigQoABKAAAAAAAAAAAAAAJSAWAollJZRFICglQAAAAAAAAAAAAAABAUAAAAAAEAAAgVYCwLEWAAAAAAAAABKBCgllAEsAAAAAAAANSZ3RQAQAAFACxLBUoFABAAAACwVKRQIWWACwWBYBYAWKRRAAAWAAAAACAABQAAAAAhUACwLAKQAAAAAAAEoAAEFgAAAgAAABKCFlAEoRYUEFAAAABAAAUAAAAIWBZYFhYFQCksFgAAAAAAAAAAAAAAAAAAAAAAAAAAgAEUsqFgACpAALAAAAAAAAAASgAEqAAFikAAAABqibohKoAAIACgALCAKQqKoEqAAAAAAAAAAAAAAAAAAAAAQAAKAAAAAAIKgqAUgAALAAAAAAAAAAAEAAAAQAAQoEoAAAAlgsKACAAAAAAAoAAAABFEBUCwVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQWxSALAAEAAABQQAAAAAAAlEoSwAAAAAAAAA0E0sLUqJYKAKAAAAAAEABQoSgQAAAAAAAAFABAAAAIAAFAAAAAAACFQAAAAAAAAAAAAEolAAAhUolgAAACAAShKEspKABKEVYAAQAWAAAAUAAAAAABFgKSwALAsAAAAAAAAAAAAAAAAAAAAAAAAEoAAAAgirAAWFQLAsIAsAAKACAAAAAAAAJQgAACkAAAAABoWagAAFgqUJQAFBAAUAAAWJYAqoKgqUCAAAAAAAoAAQoQAAAAQoEoJQQsAAAAAAAAAAAQoBBQAAQLAsAAAAEBQEpJQlACWUAIAAAAAAAAoAAAAAAAAlJYLFJQILAAAAAAAAAAAAAAEKAAAAAAAAAAAAAABFEABZSAAsCwLLEABQAAAQAAAAAAAAQAAAAAAAAAA0E0ABYAACwVKAAAAAAAAoJYQKQCxaAKIFIVCVBQEFSghQAAACFAIVBZYAWAAAAAAAAAAAAAlABBYAAAAAAAAAhZYlABFhUCwAAAAAAABQAAAAAAAAEUQpCkKEAAAAAAAAAAAAAAAAAAAAAAAAAAAAhUAACoAAAAAFgCVACgAAAgAAAAAEoAJYAAAAAAAAAAJRoJoAAACwLAsACoKlAEoAAAAAAAAsACwLAsABYLAWAAUgAAAAFgsAAAAAAAAAlAAEoAEKgsAAAAAAAAAQoEVCUQKgAAAAAAAACgAAAAAAgAAShSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKgAKIUlgAAAAAFIAsRYUAAAAAEAAEKFBABCgiwAAAAAAAAAAINZZNUgqFAQUAAAApAVBUolCUAAEoAAAAAAAAAAAAABYAAAAAAAAAAAAAAhZQIUhYAAAAAAAAAAABAsJUFQAAAAAAABQAAAAAQAAAS1KCURYFCAqCoWAAAAAAAAAAAAAAAAAAAAAAAAIVBUpACkABYAACwAAALAWAAAAAAAAIAACgAAgACAAAAAAAAAAAAB2JqoLKABCgAAAAAAAAWCoLApCgJQlAAAAAAAAAAAABCgAAAAASgAAgqCwFgAAAAAAAAAAAAELFQFlgsEAAAAAACgAAAgAAAAKAIKlJYFgKIolgAAAAAAAAAAAAAAAAAAAAAAAIKgqCoBSAAsAAACoAAAAAAAAAAAAAAAAQFAJQAElAAQsAAAAAAAAAAAADsTQApLABUoikoAAAAAAAAAAAWBUFQVBQEoILBUFIWWFIVKEoAIUAAhUFILBYAAAAAAFgAAAAAAAACBQlgACAAAAAAAAAAAAAEtEFlhYpAAWKJRKBKEFgAAAAAAAAAAAAAAAAAAAEFQLBYApAAALBYCoAAAFEWCwAKgBYAAAAAAAAAAAAACUAAAghYApApYgAAAAAAAEoShLBoJoAAAAACwFgqUJQAAAAAAAAAAAAAAsACwAAAAAAAAAAAAAWAAAAAAAAAAAAAAAgsAEAAAAAAAAAAAAChCxRLCwCwsUQALAqABYAAAAAAAAAAAAAAACCoKgsBYABRKIAoQCwsABUBSAALAAAAAAAAAAAAAAAAAAAAAAAAAAEQAUAAEAAAAAAASgCFEo6E0WFQUhQAAAAAALBUolhUoIUAAAAAAAAAFgAAAAAAAAAAAAAAAAAACFAAASgABBSFgAgAAAAAAAAAAUAQUgAKSwACiUQAAAAAAAAAAAAAAAAAAAAhYAFlhYAAAAABYAKgAKQApAAAFgAAAAAAAAAAAAAAAAIUAAABKAEoAQgAKAACLAAAAAAAlgoAEpLKdCaAsBUFgqUAAAAAAAAAWCwKgWUAJQAlCCkKAlAACCgEKAgoCUEKQoCUEKlAJUKQqCpQQAWCwLAAAAABAAAAAABKqCwFCWAUghQlgWKsCwAAAAAAAAAAAAAAAAACCoAFgsUgFgAsAAAAAsLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQAAAALAEAAABQQAAlJQShKBDsTQAAFgWKJQgVKEoAAAAAAAAAAAAsFgVAsFgVKCFlhQCFIWUShKAgKCFSkoECwWAqCwWAAAAAACAAACFQUBKEFQWWChFgsACxQAAAAAAAAAAAAAAAAAAAAhYFgFgAAAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAhQAIoAlAAgAAAABZYAAgAKAACAAACCgBAdiaAAAAAWCwFgsBQJQQpCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAISkFQsBYFlJYFgAsCwqwAAAAAAAAAAAAAAAAABCgAAEKgqUIALFIBYALAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQoABCxSAAAAAAFIAEBQAAARFAJQJVlRLAA7SzQAAAAAAAAAAFlgsoAIVBQAAAAAAAAAAAAAAAAAAAAAAAAAAAACFSiWIWCykKICoWWChLAFAAAAAAAAAAAAAAAAAAAASgAIUhYogLAAqApAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIUAABKAAAAEoAIUBAAAAAAAAAAAAAAAASolgsoItlgWIAB0JpYFgpCoKQoAAAAAAFgAWAUhSKACUIKlAAAAAAAAAAAAAAAABCgIKRLLAsKlEBYAAFgsBYLAACgAgAAKAAAAAAAAAEKAAAQoCCpSLAAAAACoFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQAAABKACCgASgAAAAQoABCwAAAAAFgAAAAAAAAAAASkBZZQlEUQQADoSgAAoACwVBUoSgAAAAACwALBYApLAKSwAVKShChBUFQLAoCFSkAqFgWAABYAIAAAAAAAAAAFEoAAAAAAAAAAAIUCWFQALKQAApAALAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEoAAACFAAIUAEoAACFAAAAAAIUAhYAAAAAAAAApAAAAAAAAAAAACFSkWAIAB0JQAAALAAAFIACoKlUAAAAQoAAAAAAAAAAAAAAQAAAAAAAAAAAAAAKAAAAAAAAASgAAAQqBYFgAAAAssFgAAFIBYAAAAAAAAAAAAAAAAAAAAEoAAEKAlAAJQAAAASgAABKAEoSgCWUAAAAAASgAAAQsAAAAAAUgAAAAAAAAAAAAAEsLKAEsCwLAEABekoAAAAEABQFhAAAFgVBQEoCgAgAAAAAAAAAAAAAAAAAAAAAAAUAAAAAASghSFQVBUoQKgAWAAAAACwLABYAFgAAAAAAAAAAAAAAAAASgAAAAAAABKAAAAEUAASgABKAAAACWFIVKAAAAAAAAAJQQAAAAAAAAWKQAAFgAAAAAAAAAAJQlCUEoBCkKQICgUACwVBUoAAAAAAAABUQAABUFQVKAAAAAAAAAAAAAAAAEoASgUIVBUFQWBUFgLAsCwWAsAApLAAAAsAFgAAAAAAAAAAAAAAAAASgAAIKAAAAAABKAJQBKEoEoAAAAAAlCUASgIWUCFAAAAAigABKAACFAIWUJYAAAFhYAAAABYAAAAAAAAAAAAEFASkUAEolACUQApAUAAAAFihBUoAAAShKAAAALAAAAEALAWAtSwWKQpACiKSwFgKRRACksCwCkBYAAAFgAAAWAABYAAAAAAAAAAAAAAAAAACUAASgAlAAABKAEoShBUFgVABUACyksCwLBYAFgLBSFIUEqFQLBUFQAWWACwLBUFQVBUFSgCUAAAAAJRAAAAAAAAACkAAAAAAAAAAAAAICgBAspFAgAAABQAAAAAAALBUFSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABKASgShBUFQWAsAAAAAAAAAACwAAAAACkAAAAAAAABYAAAAAAACwAAAUAAAAAACWAAAApCkAAAAAAAAAAAAAAAABKCUIoShKSgIAAAAAUhQAAAAAAAAAAWBUFSgAAAhZQAIUBBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASgAAABKAABBUCwAAACkAAAAAAAAAAAAAAAAAAAKQAAACwAAAAAAAALAABYAAAAAAACglAAAhQSglEAAAAAsAAAAAAAAApAAAAAAAAAARQAAgAAAAAWKQFAAAAAAAAAAAAAsAFQVBUoABKACUAAACFSkoACFAAAAAAABKAAAAAEoCFAAlAhZQAlAhQACFQVBYAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAABYAAFgAAAAAAAAAALAUAAEoAAAlEAAAAAAAAAAAAAsAAAAAAAAAAEoSwWUJRFEAAAABUCwVKAAAAAAAAAAAAAAAAAAALBUFQVBUFShKAJQlAAAABKAACFAASgAAhQAAACFQVAsFgAWBYAABYWWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAAAALKAAAEolAACUIAAAAAAAAAAAAAAAAAAAAAAAAAABKRYAAAAAALAsFQVAUEoAAAAAAAAAAAKQAAAAAAAABYAACkAAAKQAAApFgAAsAAAAAAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAsCwLKEFgAAALAAAAAAAAAAAAAAAAAAAAAAAABFEoAEpFgAAAAAAAAAsCwLKAAAAAAAAAAAAAAAAAAAAAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIVKCFQVBQAAAAAAAAAAAAAAAAAAAAAAAAAFgAAAABYAAAAAAAAAAABYAAAAAFgAAAWAogAAAAAAAAWAAAAAAAAAAAAAAgWUQAAAAAAAACwAAALAsFigABBUoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASgBKACFIUAEoJYUCUJQlEoEFAlhSCglACUShLKACFlBKSoUAAAAAAAAAAAAAAAAAAFgAAAAAAALAAAAAAAAKQAAAAAAAAAFgWAAAAAAAAAAAAAAAAAAAAAAIWWFAAlCURYAAAAAAAAAAAAAAAALBUFQLAUAARQlABKAAAAACFASghSFShKAEoAIUBKAEFiksoABLKJYUhQAEpCghQAAEFlhSCgAlEWChAUAhQAASgAASkUQoihKJQSgEoCFQUhSFAAAAAAAAAAAAAAWAAAAAAAAApAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAigEqFlCWBYSwlQKKSgAAAAAAAAAAAAAAAAAAFQVAKCFSgEoEFlACBQARQAIUBKEolBBQEpLBUCykoCCgSghQJRFEoJQiksFAIUBKEoiiWFgLKEoABFCAqFAQUgoJQAlACUAARYVBZRKBAKCFAAAAAAAAAAAAWAAAAAAAAABYAAAALABYACwAAAAAAAAAAAACkAAAAAAAAAAAAAASkUEoAIUEBAiwWKEApFAKAAAAAAAAAAAAAAAAAAKQACwAAVBUFQVBUFQLBUChKhQCFgUACBUoILBYCoVAsFIVBYFQLBUFQVAsFQLBYFQVBYFQVBUCwVBUogFhUoAIUhQSgIUhZQigCUEBRLKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAAAAAAAAAAAAAAAsAAAAAAAAAAEoIoAlCWBYFHIQACoBSWBYBSWCpVAAAAABAUAAAAAAAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAWAACwFgWBZSWUELFAJUFlCBQAAAAAAAAAAAAsAsAAAAAAAAAAAAAAAAAAAAAAAAABSAsAUgAAAAAAAAAAAAAAAAAJZQQoABCBAAAAAKlEsLFEsLFJUFlCFqCgAABAAAAUAAAAAAAAAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAgoJQiiWBQAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAAAAAABCoLFJZSUAOQgAAAAAAFgWBYpKEKEFSksogLBSLUoACAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAALBUoAAigEoAAAAAAAAAAAAAAAAAAAWAAAAAAAAAAAAAAAAAWApAAAAAAAAAAAFgAAAAAAAAAAAlhZQlhUpFHIQAAAAAAAACoAKQssKCALAUlBFEUlQWCoKQoAAAAAAAAAAAAAAAAAAAAAAAAAAJQAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAFlEUELLBZRLCgAAAAAAAAAAAAAAAAAAAAWABYAAAAAACiKAgAAlAAAAJQiqiwKIAAAAAAAIACgAAAAAAAJQAIFlOQgAAAAAAAAAAAACwCksFgWKShFgoRYWWCoLBYoIUAhUFSgAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQJQBFEoEFAAAAAAAAAAAAAAsAAAAAAAAAAACwFEWRQAAEoBKACUJQABKAAAACUJVRYAAABAAAAUAAAAAlEKAAShyEAAAAJQAAAAAAAAABYAALAUICpSWAAoiwKIAsFgAssFQpAsCiLBQlQVCpQlACCoKlACUJQQqCoKAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVBUKAQqCkKAlAAAAAAAAAAAABSAAAAAALAAsBSUgACUAAEsKAABKAJQllAAAAAAAAAAIqosAgAAAAsoAAAABKEsKCVCBAAAAAAAAAAAAAAAAAAAFgWCwFlEsLKEBQRSFIoRSUEAAoSggWBYCwAsCpSAVBQRSFEAABYLAWCwChAqCoKhalAAAAAAAAAAAAAAAAAAAAAAAAAAKQqUASgBAssKQoAAAAAAAAAABSAAAAAAAAFAhLCygAAAQoAAAJQEKBKAAJUKQoAABCgSwoAJQQLAAFJYAAAoAAABKJQA4sJQAAAAAAAAAAAAAAAAAAAAAAWAsCoLBSFIWUSyksoikBYCykKQCoWKEpLBYFihBUpALKRYFBAoQFlhYpLKQolCWApKgBUqgAAAAAAAAAAAAAAAAAAAAAAAUAhYFAlBKAQoAAAAAAAAAAAAAAABYAACwUQAAAAIUAAACUIoAAiiUAAAAAsoAAAAgAAEAAAsAAAAAUAAAEAJVcBLAqCgAAAAAAAAAAAAAAAAAAAAAAAWACoKgKEBUFQKACUihAAVBZSUCAoSiWAolQsCwCwsBULAsoSiWUJRLBZSVACpQQqFoAAAAAAAAAAAAAAAAAAABSVBQJRKACUgLFAAAAAAAAAAAAAAAAACgIAAAAAEKAACUAAAAAAAABCgAAEKAFAAAiwoIEAAAAWAAAAAKAACAOLLZAAFhUFAASgAAAAhQAAAAAAAAAAAAAAAAAAAAAAWAsAAAAFQAWAKSwKhYCwAAUEAspCkAsFlhZRFhUBYWAWCoFhUpLBQoAAAAAAAAAAAAAAAACyksFlAhSFBAVKJQAAAAAAAAAAAEBQAApFBLAAhUoAAAAAAAASgAAAAAAAAAAAAAEoAoABKJRFgWIAAsAAAAAAAAAHAsWACkLFECpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAKgAsCpRAApCywFIUgCiWABQJSWUEWgAAAAAAAAAAAAAAAqBQAAIKlJQEFAAAAAAAAAAAIACgAFAIlAAAAFABAAAAAEoBQAAAAAAAAAAAAAEpJQBSUEKACKIEAAABQQAAAADgWACiWFgWAsCwVKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAKQpKAgspKhUpLBSFSqAAAAAAAAAAAAAAABQASgihBQACFlhQAAAAAAAAABABZQpFAQSgEoAAoIAAAAlAKAAAAAAAAAAAAAAAAAAAAIUAAACUQIAAAClgCAAAcxbEsFgsAUhSAAAWCoKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwKgFJZVSklQAWUlQqUBQAAAAAAAAAAAAAAKQVCgAAQFQsoAAAAAAAAAACAAAoqACUlAAlUQoQAlAAAUAAAAAAAAAAAAAAAAAAAAAAAAABLCgAlCLEAABQAQADgagQAAAAsApFgAsFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKSwpYFEKSyoIAUKAAAAAAAAAAAAAABUpFhZYUCUEpFhZRKAAAAAAAAAQAAAsBQAAACgEqAShKAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAIUEoShFCWIAWKAAACcDUAsWECwAAFlIAUhSFCBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsVSUlgWCxRLEoUAAAAAAAAAAAAAACxQACAWUShKJUKAAAAAAAAIAALAACpQAAFABAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlAAAAIAEBQAAOBrIABZCwACksABYFgAAsFSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqywFCWBYAUAAAAAAAAAAAAAAAFABKhUCgAAASgAAAAAAQAAAAABQAAoAIAACgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQlCUAEpFECAoAHA1kAACxYgBSWUQLALACxSAqCpQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFFECyhFJZQlAAAAAAAAAAAAAAKgpCgllEoSiWUAAAAAAACAAAAALAApChRCgBAAUAAAAAAAAAAAAsAAAABSLAAAAAAAAAAAAAAAAAAAAACKIsAAOBrIAACwCxFhYAogAAWKRYFgsCwUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqkFiiKIFlgoSgAAAAAAAAAAAAAKRRCggsoAASgAAAAAAQAAAAAKQFCgAJSAAoAAAAAAAAAAAFgAACkAAUQCwWKRRAAAAAAAAAAAAAAAAAARQBFgBwLkKAAAACAAABSKECwBSWAACoKABFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABVlgqUlgssCggsUllAAAAAAAAAAAAFlEsKQsolCKAJUKAAAAAIAAALAAAApQABChAUAAAAAAAAAAogLAAAsUgCwALAsALAAAAAAAAAAAAAAAAASgCUAJZRAA4FyAFAAABAApAAAWAAWAApAAVBUoAAAAAAAAAAAAAAAAAABKAAAAAAAAAAAAAAAAAAAAAAAAAALYFSiWFgAWAKJQSgAAAAAAAAAACyiUJRKgoCFSghQAAAABAAAAAAAqkpKAAICgAAAAAAAAAAFgAAAAAAABUAFgA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DHHDDDDTLDDDHDzDnDHTn3beiq++yMACDBRl9555JBBBR/8Avvioiipgtv8A+8sMssGW1HElW3m32wAADDZr77q7bz767poYKcPNfNuc88MMMMMMMMMMMNv/AP8A3/8A+88MMMtcsOdMMMNPP/8A/wD/AP8A3P33/Pv/AF937x1+wwwwwww6wwww4wwxw5www191y6nvvtnjwIQwQdfbUbURQQUt/vvrmgkl/t/3/wA+McMMOF2m2nmyX2gAAABBTb7L75b7/fu/a669Nfev99vsMsMMNMOMMMPPPv8A/wD/AP8A3fTTnTnDDrDLjnT3/wD/AP8Ar/v/AL674/8APt8PMMMMMMMM88//APv7/wD/AP8AvPjLDD3/ABjmvttv/wAlEEFHnl3k2EEEQJb7774YIMtO/wD/AL/6YwwwwddeSeLPLAAAAEAAEPuvvpvr/wCd/wD/AO7y622x9z8+6/5zww0wwwwx48//AP8A/wD7wy000x8y1446w99//wDv/f8ArDvvP73fDDTDDDDP/wD/AP8Ar/8A/wD/AP8A7/6wwwwgggtvtvsr/wC0kEEGX2nW20kMIIr7774ZIOMNf/8A/wD/AMEENM8Pk0XzzzygIIAAAAAAAB7575//APf/AM/3/wA/+d9eM89NPusuMMMcsNeP/wD/AP8A/wD/AIwz1wy0w20yy128/wC/+899e+ddc+sMtMMMN++//wD7/wD/AP8A/wD/AP8A/wD784wwggkvllvvs/8A0EEEH3W102ksMIL777744pPsv/8A/wD/AM0kUEMNFU0XFzjgwgIIAAAAABAb7bb5p/8A/vv/AP8A/u9vOftPct/d8MMMOMMOPPf/AP8A/wD98sMMNssNdMsdMv8A/bnvvLfHXzLDDDjDDf8A/wD/APv/AP8A/wD/AP8A/v8A3/8A7ww4wkgkquuvvm/zQQQdZfdVXYUwwhsvvvvsqg459/8A/wD3vJBRBBBRdl90088MACCCCCAAABQAy+++/wD++/8Av/8Aff8A352869w/7wwwxwwww0//AP8A/wDzy08wxyw4xw870/8A+vu/dN9MOMMMMe//AP8A/wD/AP8A/wD+/f8A/wD/AP8A/wD/AP8ArDDDCSK+SSz89/11pBB1999BdqSKCCC2++PLDTPTT3/7/wDzQQQQQQYOXfPPPBNDAggggggggwQcNvsn7++//wD/AP7/ADz6x1xw1/50www0yww9+/8A/wDvLDjzzDDPHPHX/v8A5204z4wwww139/3/AP8A/wC/+++6408w88//AP8A/LDjCCCKum//AJff/fQQVefZabTSikgoisvrgwwwwyx/f/8A/wD/ADYQSUUdOPefOLDPLDDAgikggggwwwcklvv/AP8Af/3/AP8Af+++Pe+8d9d8MMMMMPP/AP8A/wD8sNMMsccdvOf98+u+fO8MssMf/wD/AP8A/wDz7nLLLDjD7zHTDL//AO51jjihgljri2/XXdaQUVfdd+XfGgggghuvugxwyyy33ff/AP8A/tBBBBBkQUY888c8s88YICCCCCCDDDXDDyyr/wD73/7/APf++8t/s/8A/PLDDDDD3/8A/wD/APPHDHnjH7zb/wD+/wB+u/MMMMdv/wD/AP8AftOus8MMMMOMcsMsOv8A/wD/AP764IILp4ffH3Xn0kFV33X/AD/+iCSCCWe+DDjLnHbDT11//wD+7SUQQdBCHPPPPGHLMOPBDAggggg00w5ww0//AP8A3/8A/wDv/wD/AB48x+52wwwxww89/wD/AP8A7wy9w5w05/8Af+/eu/NMMMMP/wD/AP8A+/dMMMecdMcssNdMMP8A/wD/APr74JIIIJ7/AP1999hBB199d/LGuGCCCS++6rDDTDDLD199999/pBBBBQQsU4+++6848888ssCCCCCCDDDDDDTX/wDz/wC/vv8A/bf3XrHHnDDDDDDb/wD/AP8AvrDzDHDX/fv/AK333www0w//AP8A/wD+w6ww4wzyx4wywwxz/wD/AP8A3vvgghg00f15TfaaQQURdXfPn1sjoggtv/qx04yxwww3/ffffffQAQQRLCOPLPqvqvvtuqHKBAigkgggwwww0409/wA/++//AHnv3v3jrHnDDDDD3/8A/wD+9MMOMNdf/wD77Pv7jDDDj/8A/wDf/wDzbDDXDnHTvTDPrzf/AP8A/wC++eCiCDDRr3RxZ95BhBR999+++2CiiKK//vrHDnLXDjTjz19999tAABRE0sYM088+W6uyae+7RlMMGCCDDDDDDDDDz/8A/wDdv/v99v8A7/TvLjDHT/8A/wD/APvDjDDDz/vzv7/LLDnDDzf/AP8A+8fe9NuP8NN8ON+Mf/8A/v8Avvuggggw3e73cfbaQQQQXVffvnsvuiggvv8A8suNMOMecsMM9PX3n30iAABBjyCzRQjyi777rr55/wDX19sADDDDDDDDDzz/AL//AP8A/wD/AP8Azv3v3TDDDD3/AL//AO/MMMMPPfP/APv37PLbDbT37/v/AD2w/wDc9NvM8MN//wD/AP8A7674KKJMMMU+WmW20kEEEH2Xz75pL7IIIZ7/APvTTDDDDTDPbXTr9999tMAAEgUc8Qg0sc0c8u+2+m2//wD3fbSAgwwwwwww09//AP8A/wD+/wB/f8susMMMMP8A/wD/AP8ArDDTDDD2/wC/5/z+xwwww893/wD/AP8A773250x5/wD/AP8A9/vvrgghggwxVX4bffeQQQRRfbdOvtuttikonv8A/wDHDDDXjHDDDTTH99999pAAYAUc848Isks4UUuu+++++/d199ICCDDjDDDDTP73/wD/APu8efOf+cMMMNP/AP8A/wDcsecIMNPb79/9ds8sMMMNf/8A/wD7/wD/AP8A/wD/AP8A/wB//wC+e+6iCKCEMIpvxxV9dBBBBBX98u+yOW2yCOC/7/7DTDTLDDTbLbXb999999AAAAQgU4Y84QwMoc+qe++e++8t9ZgCCCCDDDDDXO7P/wD/AN//ALTXz77DDLDf/wD/AP8A/DjLKCCCD2u//wDzxywwwww7/wD/AP3/AP8A/wD/AP8A/wD/AP8A7b77KIIIpyRrNt21333kEEEEP3l6757r76JIZ/8A/wD4zy0yww6xxz621/dfffdQAAAAKILNMBONNGHHruuvnvnvPPfaAgggggwwwxvv/wDf9/8A/jn/AO/6x0ww19//AP8A/XHH+KCCCCS++/v7vLvLTLDzz/8A/wD+/wD/AO854zyxyggoggnjos9+bfffeQcRTffTfct3nuvogglu/wDvMMMtcsMGOeM8csf233n30ABQAQzDhjDDxRjTy77774b7bxD3WAIIIKIMMMMb55//AP337P733/LDDTDX/wD/AP8A/DDP2++OCCCCeu+/v6bfjPDDLDDjDDDDDLDDCCCCCCKKO+3nFF9dt95BBF1d998n7uy6qCSCGf2+PnTLDrBDrnjDTDF999999gAAAgQsY0A4kooU8c+e+2u+m+ccddsCCCCCDDDDC+uX3f8A/wC//NvtMMMMMMf/AP8A+/41w/vvvOjiogsvvvn3umv97xyzw0gggpigghgglmmskv6x/WfdXbYQTXfffffPr9uvtgggjnvvo0+40wzw4w40wzfbffbfeYAABARLLPOPLHFPKLPPvvtvutPPLOfaAgggggwwwwNvn/8A99+8de9NuMMMMNP+/wD/AP04xwFnlsPNrgggMvvvunvspptz34xsgkgkjhnnugvz/wA3323333kEEE333m31u/qp6IJIIK776tMNM88PMcMMX33333332gAAEEEjyzCihjwCTzzZrb47bzzzzzy2AIIIIIIMMMH67be//wD/AP8Acf8An/THDrDX/wD/AP8A/DzTGAQ2+6486uKAAyym2+uKyGW+uee2+ay+++W+++u3/wD/AH3nGEEU3223n3d1i7LIKIII577reOtsMsdMOPcP33333f8A7xBBBJEcU0cM4sc8++y++ew888w8c48wACCCCCCCDBJyme+7/wD7/wBNe8+8sMMsMOf/APb3rXXHMCQAAy+k48e+GMASCy22++2++62+++i+m2u+/f8A9bdYQYQTTTefffVfeTOsggggghvvvg9z1w0wwww73ff/AP8A/v8A/wCkEEEEFhyTSTT776rzzzzyhxjTzzziAIIIIYIIIIEEF5r7b7//AP7CnzzffDDDLTX/AP8A/wD/AD448/bCVYQANPFOMPvvOCAggggkoostNMnsvr9+9ccYQQQQRTfffdffWVWZMoikgghilvuum0w4464wyzXff39//wD/AJBBBBBBQ04s8ts84s088888848oAgCCCCCCCCCiGAEBEu+2Ouv/AL/1vp43zwwwww03/wD/AL/7nDHj5999tJJBAxZ88486u8MMICCCCCCCAAAEBBBBBFBRJFd9951lxVBBxmDGiCCeee++63myTjjDrDP3/wD/AP8A/wD8YQQQRcYQSLGIDXPJNNPLHOPNPIEBgghggggggoAAAAAGHvqvvnnl/wDqppY8sfcMMMMMf/8A/wD+y52ww+cfXffbSQQQURfQcMX+/wCzzhwQ00E0kUEEEGUEU1X13312FGWFEMMMJII577777LJIIZcMPc+//wD/AP8A/wD7pBBBFBFBBBw555N8sc0888cc4wQCCGCCCCAAAAAAAAEM++m+++++2/N0Kuuz7PjDDDjDX/8A/wD/APjDDTDTBFFxxddd9NJBRBBlZt591d9ddd9tdt9599999tZ11dFVN9TrBBSCGOe+++++yG6GCbLfP/8A/wD9f/8A7xhJBhBBDDDF59999888s8c44wgCCCCCCEAAAAAAAAAEM+y6u+++++681o+eK66rr7HCDDHD3/8A/wD/ALTrDDDPXFlBNH5x159NJRRBBZZ5RdB1lpx59x15dx11phhxhBxBBBFQEGe++++++6yiGCOvPP8A9/8A/wD/AP8AHGFEUEMMMMmFHXF2WVzTyzySxAKJIAAAAAAAAAAAAAQwj7r75776777yzTCL4pb7q/eMIIIMMN//AP8A/wD+MNMOsMP01MMUEEcsVHn32010UEkkGHFGEEFEFHGEUEEEEEFEEE01+/8A++++626qOiSGbCuf/wD/AO//APxBBhDLDDDBBNJttxxt8808wU9wAAAAAAAAAAAAgAAMMOO6++e+++O++8884+aiG2Kq6GfCCKCDjDHf/wD/AP8A73LjHDDDz/5v/LbhBDDLdB51199dNNNBJFtNFVFJJBFDDHPHvf8A/wD777prKaIIKIJIbJb7+/8A/wD884wwyy4wyTVWffWUYSTXPPNPcfcAAAAAAAAAAEADDLnuvvvrnpvvvsNLPJPELuuvsmvmvoqggkgggx3+/t//APsMeNsOOO8OPPOv/wDfvLJDzDDBZJ1x9/8A/fdfdffffffffffffca8uigihggggosggjnv/wD/ADzDDLDDDjDBFZVd1Zd9dN9t9d5d9B4AAAAAAAAMMMeu+6S+ye2e+k4880888840uOWyOWKa6WQAgCCCCCCDf+++/wD+5353y0w+0/tzxwgz89//AO8tcscPNPUXFmHXV3PffPPPO+teMoII6oIIYIIIoII4Z7//AH7jDjDDDDBBNF95t95R9199l1l9919wgAAAAAAAEe+We++88808k848488808486Sm2W62ay+SoocgCCCKCKCP/APvvv7/1x/6y14wy6/vnprigggg08/8A/wDvfPrDLDLPHjpBRtBHTfCKGGCKGKCmGOKG+uee++yyDTDDHDjFNdht5/jvtVdtt1599d99gAAAABBBsM8sY8s8c88880c88888888m+SO+66WmSyaK8sIwCCCCCCCCKG++++2/7DLiDXjLjTTH2eq+eaSeKaCSCCSy++//AP8Ae98u54oZYIYZKKIboYqI656a57777paMMMMd8Ms89ePe/wDt599915l99Z5BhhhBBBBBEcc088888s888884408+emmaq2+ummuOeam4cIwwoACCGCCaCSCG+++++W+73aGSTjDDHjD/AAtuvjvpnrnoihhggksnsvvvrvvvvvvtvvvvvvvvvvvvvvuuhgjgjx537677/wB9133X1n33n23mFGFEEEEUEEEQwgzxjyzxjyTzBprpIq4K75qrYZZrbooQijgDjAxzAAIIIIIIIYIIZr7777r7q4spoYqNsOMqd/8AKCCCCy226+++WqCGOCCCCCCCWyyyyyy+y6y626y22SiCGCGKX3r7fnXjv999919t995xxhRBBBFBhBhBEEYcs8k599c4mi6WWem+agM8wsggkooYsk4YAAA4EwwGCCCKCCCCKCGAM+++++++++qCKWGCrXrGW3/f+uuGOGCCyy+22u+u66yCKOKCCCCKCCCCCCiCCCCGCOHX3Lfv/wD7373/AP339/eHFGGEEEEEEUEEEUE0nX333302zjThhiSxRxAAzQxRjyyRzwjCDDBCADjCAIJII4IJIIIIIYAARz777767777oYIIIKYJMKopp/wD/AJ/9/vvrjiigggsltqtrnsrurvioujjjrohivpnnvtnv/wD/AL7/AD5//wD/AJ5RBRBJBBBBhBFBVN9p99599t19844oYgQcM4I8IwQgQwgQAACCCCCCCiCCCGCCGCCiCCGCCCCAAEAEc++++++++6+iWqGCKGWCCCGK2/8A/wDcN/ft/wD/AO//AM8oIIIJbLLqLbrL767bL77/AL//AH799+9793/80cQYQQQQQQUQQQRTbbffffVbffefbMPEOMNKHQafQYMAAggggkgghgiggoggggkgggkgkkgqggggAAEAAABHuvvvvuvvvvMKlipigooklkglttv/AP4kEFGH9/31/wD/AP3zwywggwwwwwwww4w04880888889040QQQQQQSRRTTSTZfdfffffbbfXfXfeaZeRXcWVdIMAAAAIAAAAAAAAIAAAAMAAIAAIAAAAFBCAAAAAAAAAEDPvvvvvvvmvvvHJqppijggjgkkkiguuv/AL73200kEEHGHHXn0/8A/wDzzywwwwwwwwwwwwwwwwywywRTTTXTXbbbXbfebfffbfXdfceUbWVaeeYSUEIAIAABIAACAAACAEAIICAAAAAAEEAIBEBAAAAAGAACAABABUVfvvtnvvvvtPPPPKhhhikkgjgisgikgkvuvsdfffWTSQQQSaQZXXYfdff/AOffm1nn3lm3XnH3m23n13331333133V3X1GlXV3H21VWV3GgABAACABAAEEkEkgwxwzw76qyyxzxywQQGQywwzxb664wwwwgFEEEEEFH777777zzzjz3204YKJIoQIIboI6rIb7776U1HH333200kEEEEkHFHG32k12V3H3XH33nnXnnX333HnlmkHXE32UkXGEW2WEHHGEEEEEEEkGEgwwxy77777777776777777r777777775777777767774EEEEEEFX77zjjzzzzz3332hIKIoDACJJooqIb77774UUFkHHX3333100kEEEVEEUF2FGFGWX22EVnGG11HF21VHXGFWFEFGEEEEEGEEEEGEEEwyzzzzjzzzzzzzzzzzzzzzzzjzjzyzyz777777767757777777qFEEEUGFHzzzyyzzz333333m4ISASGUgILIIJr77775n0HEEGUXHH333323000kEGEFEEEEUmEEUEEEEEEEGEEEEEGEUEFEVEFEUEEUwxzzxzzzzzzz333333jzzDDDDDDzzyzzzzzzzzzyzzxzzhzzzzzzzzzzyzEEEkEEFHzzzzzz3333332330wAAUGE0CK5JHD57764y0kEEEEU0mHHHX3333333200000kkFFEEEEEkEEUEEkEEUEEEEU02131xz33VX333zDjDzBLKJJpIJaIIIIIKIYoqKIILD3333333zzzzzzzzzTzzzzzzykEEElEEFF3z333332333333330hmEEEEAIAEnR7757b66ww3EkEFAUm2HHHX3n333333333X33n333n333nH32333333333331zzTTDIIIa4III4oIqIqIJIYIoJ4aKo6ILpJoJIqIa4pbLD33333333323333333222k133323333333333323330kUEUkUEkDGEEnL74JL77776yykEAAAAUXEkknVHXHX3333333X3333333333zzTjDDTSiICSQQByAgiAAAAACAKIYoY44IILJAAAQBASCQJKLYIoopaIoJzX33331333333333333X33333X333Xl33333333130HElUkUEEEEEF1H7wIILL7767776yxgAI4pBCAAEEFmFGEUVEmFDFSCCigggSQCBEEgBADAgAgAYYIKJYJJJKI4JYaJIJKKoIZIqYIJBkUEABDgBwSgAADBR3333333233333333n333333333113333333333330FEk0k2GkkVUEFFHQIIIIJLL75777b776w467IILJIIoIAAAAQAgRQggAgAQAoI5qoIKpYYIIroYIII5YaIJLaL4IYIIKIIIrLpopIoKIY4QSCEEkQAAATjT333X33333333n333333333333333233333333333kFE1EG0EWEFkGVFXW8+KoJIILLL777777b77777447oYoKI5IJ4ILIIYIopI4Iq46qIaIoYJLKJJq4IYIoppZ6ooILJ6YI4aJIJIJIILY5KI7obEEFGWFWmDX33X333333333X333231323333333333333n33330VEEEmXEEEnEkEUH3+ds/vMIIJIIKLL577b77b7777r76r7444444646KYIZ4IJ4oa56Y64Y54644464654Y5444644p7YoIYYKIYZJoJI7KoIIAkFlEWEEEX333X3333333333333331333331333333333332n1FEU0kEFEGFkFFXXH+/wDP7vv7vKCCCCCTyy+u++++++W+++++6+++++++++2+++++++u+++++++2++++++26+++++++++++eu++eukooEYAkqOiAFBBxBFBJFBRd1999599999t99999999999999959d59999999tBpJhNBpJJBpFBBF3vvj/wDy121256zjgkggww00sssvvvvvvrvvuvvvvvvvvvvvvvvvrvvvvvvvvvvuvvvvvvvvvvvvvvvvvvvvvvvvgQTQYMLIIRWaRQYRWUQXfffffdffffffffffffffefbfffffXffffffffbSRYSSUSYZRTWaYQU233/8A/wD/AH324+zy637xiggww0w50www04ww0sgoossssssssvsutvsuuuutvtvvruvvrvvvvvvvrvvuvrvvvrvvjCQQWQYEAYYQQRQUUdWRffffffXffffffXffffffXffdefffffffffffdffQQQQURQQQVUVScQw8+703+9+x/wAdcP8A37jbbnvPHDDDDDDDLDjDDDDDDDDDTDDDDDDDjDDLTHDDDDDmyy+++++++++++++++++++++8pZFVpVBFdFJBpZBBRlh99999999t9t999999xxDDDLDDDDjx1x9999999/8AzQRSURVYQYQTaQwww9/63/33+/8A+/u99uPePdee9scMc8sMMOMMMMMMsMIIIIIIIIIIIoYIIoIIIIqIIJLJLLLLLLL77777777677wFEHGE0FVlEWkEVUkFXH233333X3333323HcMMMsOMNNMMOMMMMNNHX333/wD/AP0SUQQRWeQQYQwwww29/wC//f8Af/73v/8A34/y7/8APfP/AHv/AF5x989455yywzzywyyxz3wwhhgggggggggggghgggighgsssvvvvvuuvJZQRTRQSQYQReRceYUaVeffffffdfdeYww4ww1www0w46wwwwwwwwww8df/AP8A/wDxfcVYUUVQZQwwwwww09//AP8A/vbvf3/7vvfrXTfjb7zbjf8A80z779/3y/542+3/AP8AvfvfzfPPOaCCCCCCCKiCaCCGCCCCC+0++++cFJBRBdVFBJBBJBVBBBlZ999999995DXTDDDHDDDDjHDTDDnHDDDHDXDDjff77v8A/wCmEGUVmEG8MMMMMMMNO/8A/wD/AP8A/wB2/wC8/wD3fvnvHHTrrb/fr7/nbLvfbPL/AK98z4/126+01+5/ygghhgghggggggkgkghPdfPvvARXQUSQeUcQSeRYRQTQfffffXffbQwwwwxwwww02ww20wwwwwoggggwww//AP8Av/8A/wD+20EEsNH988MMMMMMNNPN/wDf/vz3/wD/APuv++/88/N+efMMvN/+euM/NO/Od9/d+d9NOsteuf8ALHOiSCKCKCKCCCCCiU999984lhJRBJ9ZBRBBBlNBFRR999999xDDDDDDHDDDjDDDDDDDDHDDDHTCCCC2C/8A/wD/APv/AP8A/wDNBBHLr/8A9zwwywwwwxw09x+7/wD+9+f/AP8A++/+/wD/AP7/AH6//wD/APP/AH+7537/AP8AD/r7/vXT3P3f3n3LvCCSCCCGaCGCCU99998ptRFFB9JRVJphBRJZ1hd/9995xLDHLDDDDDDDDLDDDDDDDDDDDDDDjCCCKS23/wD7/wD/AP8A/wD+9sP+/wDHbfLDDDDDLDDDDz7/AD9//wDf9/8Avv8A533/APuf/wD/AP8A/wD/AP8AMf8A/wD+79z/AN8t/wDHX77/AM7/AOMusYoZIIYIIYIJT233302EEE0mEWEVGEUUFkEGH/8A999hDjDDDCCDDDDDDTCGGSG6C+GSOmOOKTjCKGCCy/8A/wD/AO//AP8A/Mv/AP7XffvvLDDDDDDDDDDDTzn3bfr/AP8A9vd//wD/AH/99+3+/wDf/f8A3f8A3+//AP8A3/8A7/8AvuMeucu8coIIKKIJIIIJR33n30EGFk0EEVUGVUU0lkEH3/8A15xDLDjDCDDDDDTGCiuWGq2umGqOKWC6CGOCGCCCCS//AP8A/wC2/wD142173++//wD+88MMMMMMMMMMMMPPPO//AP8A/wD/APr/AP8AOv8Av7//AP8Av/8A/v8A/wD/AH/7/wD/AM/98/upOf8ArnLCCCiCCCCCCU99999FlBBBdlRBBB5hBRtNd/8A/wD3MMuMMoYMMsMcabIaZ4oboJ7rL7Z6ZLLraa6o4IJYIKLf/wD++/Lz9/8A/wD/APv73/vDDHDDDDDDDDDDDDDDTz337/8A/wD/AP8A/wD/AP8A+/8A/wD3z/3/AH//APf/AP8A9/7/APu7bLqsf8JIIIIIYIqpz33330nVUFEnVGEWEkEkkF3/AP8A/wC/MMMMIIsOOMJZ55a5LYbJYbLbLKrpKLZII7J57IoYKKLJf/b765MVFt9//wDr/wC++z4wwwwwwwwwwwwwwwwww0899/8A/wD/AP8Au/v+/wDv/v8A/wD/AP8A/wDc/wD/AP8A/wDz/aKuuaXCKGCCSCCCK999t99ZBB9pRRlBBBZhBJN//wD9/wD8sMMIIMsMc5LYpb7ZoKpp75bbabbqpKpr6or7YpI4oIIIL7/774qlHXe//u//AH3/AP7ywwwwwwwwwwwwwwwwwwwwxw88/wD/AP8A/wD8/wD/AL+99/3/AP8A3r//AH6//wB/q7Jbb4IIIIIYoIKL333130EGU2EEEEkGEUFF3/8A/wD/AP8A/DDCCDDTGe+m2yiqqGWqG+aeuee2OeKeKGeS6eG6yCSSSCKy/wDvvqaXdW/+6339/wBv88sMMMMMMOMMMMMMMMMMMMMMMMNOPP8A/f8A/wD9+/8A/f3/AP8A/wD3/wD5/wB//wC6eSaqaCiCCiCCS999999NFBpRRpBBJJBVFf8A/wD/AP8A3/xwhggwxhvonivsmprmntvvvvutvvrvjtssunvrisqggggggstvvtdaWbe93+3/AP8Ab33vvDDDjDDDDDDDDDDDDDDDDDDDDDDDzz3/AN/6/wD/AH//AO9//wD9/f8Af/6OaaeWiiCKKCCiI959td95x5FpBBJRVFFxF/8A/wD/AP8A2/wggkwxvsqvtqrmrtvvnvvuvvsvrmsvntosqurotrqngggggsgtvm/ffUfP/wD/AP7zff7v/wDzww2wwwxwwwwwwwwwwwwwwwwwwwwwx89/79z99/8A/wD/AP8A/wD/ALz+rirlsjmqggggghPfdeffaVRUYcQZUSUQTX+//wDf/wD/AMgghgykvnvivgnpnsvnvvmvtvttvnvvvvitmusstsvpjgkgogqnvkj5WabVv+//AP8Af/3/AO//AM8sMMMMMMMMMMMMMMMMMsOMMMMMMMMMOPfv8f8Av/8A+/8A/wD7/f8AnilnvnukigogggPeffffaUUZYRSRUSQQXf8A/wD/AP8A/wD6KiCDGuaey2eCyW++2++++++++O+e+6+66+Kjqu2eyGauCCCSCCC+iS9Rt5Fu+/8A/wD++vv/AP8A/wDe8sMMMMMMMMMMMMMMMMMMMMMMMMMMMNMOf++//wD/AP8A+/v/AP8A2poovtuoqgIgglPdfffffSWUTZXYQRUcf/8A/wD/AP8A/sIYpobZJrrq4qqZrr75bb77777brq77a7747r7uL5qpop4YIIIIILYqpJ2E12kLrt//AP7fX/3/AD+77ywwwwwwwwwwwwwwwwwwwwwwwwwwwww8++//APfv/wD/AP3/APZ4K7opr7YAAIZT33X332kWEEEGVkUUl3//AP8A/wD/APqCCiCei2e+CGOm2++qe6++++6+e+e+e++m+Km2L7T2auaqaiCCCCKWCCCSdh1J9ua67/8A/wD/AP8A/wD99/8A/nPLDDDDDDDDDDDDDDDDDDDDDDDDTDDT3/8A7+7/AP8A/wD3+prqsinktgASAlPfffffaaYaSRSbQSQVf7//AP8A/wC0gggivgolvklounuvvvtutrv3/wD/AP8A+3//AP8Aq6m++b3rm2uuyCSCiiCCiCCGSd9Vlx22+/Pzf7/3z/7/AP8A/vee88sMMMMONMMMMMMMMMMMMMMMMMMPO9/P/f8A/wC9+quunonugoISQFPfdefffeZWaRQRaUafe9//AL//AKCCKCC+mWW2eKeH++++++//AP8A+9O//wD3/wB959//AOr5esvdaZr4ooIoIIIAYKIJCkWlUUybb/8Av/37/wD/AP8A/wD95+99/wD++888cMMMMMMMMMMMMMMMMMMMNN/+dv8A/wB/33vrvqtutggUSUPffffffSUQQUYcWQVVX/8A/wC//wCggggksgpukrpqn1vvvuv28/8A+/8A/Xz33/8A2/8A+/v8utd9976LJMIIKIoEAIIIJBE32VVSrLb/APv/AH//AP8Af/8A9/8Adv8Af/8A/wD/ADfvLDDDDDDHDDDDDDDDDDDT3T77733/AOvhqtlrqtgQSUffdffffaUYRQRSWwURf/8A/wC/vqC2CCW62G2KGmm3W+++uf73/wD/ANv/APX/AK39+/8A+/8A/wC/3275suvgwggghiQQgggggMccXeSTmvr/AN9/vfP/AP8A/wCt/uf+f/v/AP8A3/zwwwwwwwwwwwwwwww0ww0+797/AP8A2aSaiemOWABBB1999999th1BBBBDhhd//wD9v/6ggggltnrqvptjp3vvvuv/AP8A/wDz/wD99v8A7r3f/v8A7+775+5yvtog04gggiQQgggggggHUYXcQJttu/8A89//APf/AJ97/wD/AP3/AP4//wD/ALnLDDDjTDDDjDDDLDTDHDzv/wC8/wD+5J7aZb74AEkFX3233n310UEFGkMOF3//AP8Av/7oggkgtrgromtlv/vvvvu2/wD/APv/AP5//wD/AP8A/wDu/c//AHf33PuWaKLDCCCiBBCiKCCCCCA9h5tp5A2++7f/AP8Avs/9/wD/AP8A/f8A/wD/AP8A/vf/ADwwwwwwwwwwww0wwwwww/8A/v8A/Oi+2GeyqyBBlFV959999tBBVBFRHv1//wD9vv8AoIYIIKK7IrIbKoePZ657ef8Af/fv/wC//wD9d/f8/wD/AD9759/+8uogyxgghgRVgghhgoggkENYZWTecOlrv/8A/wDf/wD7/wB//u//AP8A/wD/AP77/wD9z0wwww4wwwwwwwxww865/wD/ADamaOG6e2IRBBB9999999RBVRVBjbD3/wD/AL7+8IKIIJLYaK7p4p9vf7rrf/8A3/3/AP8A/f8A/f8A3/8A/e/++eteeM5KocMNMIZEEIIIIIIIIYIIDGWF2mXnDSrb7/8Afbf/AP8A/wD/AP8A/wDTv/8A/wC8f8fe8MsNMMMMMMMMMMMNP65f98Lr55ppaIEEEEH3333n31FEmEENNNf/AP8Auvv6ghigggjosvrqro479vvv/wCff/8A/wD96++//wD/AP8A7+3x39+x3lqkww4wwlQQGhggmgggigiggKbSfedQbfMNvn/39/6/1/8Ac/8A7/8A/wD/APr/AH3997ywwwwwwwwwwwww9uvv9vuusuvriBQQYVffffffaWRQeRQ1z01//vvr4gggggssvqtnlq98y2/vvv8A/vP/AP8A89//AP8Af/f/AJ16w5z32msg4wwww6SSAgggijgggggigghoWTeWXRUdcTPP+/8A+vO//wD/AO//AP8A/Xvfn/8A/wBf/wDLDDDDDDLDDDDCu+6yue+ym+ymRBBBB1999599JBhBBDHXXH3/AHvv6homgggghvulohmx+wz599vv1+9//wD/APLf3/vfnvvbzL3WGqmPjLDD8hFGGCGCKSSCCCSCKiCCH19xZ9VN91dZ19/3z/8A/wD9/wD/AH5//wC//wD/AP8Av/vc8MMMMMMMMsPL7Lr766r67J4gEFEGHX3333310UEEEMMPdtPa774oIIIYIYI6Y7657OfNcvO9+/P++/8A/wD3/wDfv9+sOPd8MP8A/ammDDDD8kJBCCCGCCCSCKSCCGCiKCSnrflZNthtJp5t95t//wD/APu/f/8A/P3L/v7f/wD/AOsMcMOMMMMPL5767777oprohGkGkHW333331kG0UdeOMONPb674KJIIIIJJKobIKpe9uvueMds+/Nvt/vPN+vc/sOPdvMM+P6oIMMPzywUGAJIIoIIIIIIoIIIYKIJJN/8APP8A2x83aRVbWYdfd/8Avvf9+9//AH//AP2/97zywwwwwww0vmvuvvvillogQQQUQdecffbfbSbSQy1xyx6/vvvikgggikggggnnplh713/+49z5756z602+/wBu8sfcv+s/MKroMMNzzzwkEEgIIKKIII4JJIIIIIIJIaLvc+//ADTTzTnr/wA7005+/wDvf9v/AL/v/n3/AP8A/wDvDDDDDDD2+++++2uoMuiBhBBBBx9t9999p5hJnbziDTT++++OCSCCiCCaLCi+umyzL7XnDTbvTTbLnLTH/PrPn/H3f/2iqTHj/8QAFBEBAAAAAAAAAAAAAAAAAAAA0P/aAAgBAwEBPxBhA//EABQRAQAA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";
function Bg(){return <div className="appbg" aria-hidden="true" />;}

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
        <img src={colImg(c0)} alt="" />
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
  const [detailId, setDetailId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [invId, setInvId] = useState(null);
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
  // tieni la dock ancorata al bordo visibile (compensa la barra di Safari)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const gap = document.documentElement.clientHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty("--vvb", Math.max(0, Math.round(gap)) + "px");
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  const syncBackstop = () => {
    try {
      const dark = document.body.classList.contains("dark");
      const root = document.documentElement;
      const base = dark ? "#181411" : "#F7F2EB";
      // Backstop tinta unita su <html> e <body> (overscroll/bordi).
      root.style.background = base;
      document.body.style.background = base;
      document.body.style.backgroundImage = "none";
      // Wallpaper sull'elemento FISSO .appbg (sempre a tutto viewport).
      const bg = document.querySelector(".appbg");
      if (bg) bg.style.backgroundImage = "url(" + (dark ? WP_DARK : WP_LIGHT) + ")";
    } catch (e) {}
  };
  useEffect(() => { applyTheme(theme); syncBackstop(); }, [theme]);
  useEffect(() => { document.body.removeAttribute("data-bg"); }, []);
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
    if (!user) { toast("Accedi per mettere mi piace"); return; }
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
    if (!user) { toast("Accedi per ordinare"); return; }
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
    toast("Ordine inviato · in attesa di conferma");
  };
  const setOrderStatus = async (id, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast("Errore aggiornamento"); return; }
    await loadOrders();
    toast(status === "confirmed" ? "Ordine confermato" : "Richiesta rifiutata");
  };

  /* ---- navigazione ---- */
  const open = (t) => { setDetailId(null); setTab(t); window.scrollTo(0, 0); };

  const notifs = orders
    .filter((o) => isAdmin ? o.status === "pending" : (o.status === "confirmed" || o.status === "rejected"))
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .map((o) => ({
      id: o.id, status: o.status, date: o.date,
      title: isAdmin ? "Nuova richiesta" : (o.status === "confirmed" ? "Ordine confermato" : "Ordine non accettato"),
      body: (o.items[0] ? o.items[0].t : "Ordine") + " · " + eur(o.total) + (isAdmin ? " · " + o.who : ""),
    }));
  const notifSig = (n) => n.id + ":" + n.status;
  const unread = notifs.filter((n) => !notifSeen.includes(notifSig(n))).length;
  const markNotifsSeen = () => { const all = notifs.map(notifSig); setNotifSeen(all); try { localStorage.setItem("strato_notif_seen", JSON.stringify(all)); } catch (e) {} };
  const openNotifs = () => { setNotifOpen(true); markNotifsSeen(); };
  const onNotifClick = (id) => { setNotifOpen(false); setTab("orders"); setOrderFocus(id); window.scrollTo(0, 0); };
  const openDetail = (id) => { setDetailId(id); };
  const byId = (id) => prints.find((p) => p.id === id);

  if (!ready) {
    return (<><style>{CSS}</style><Bg /><Raw html={GRADS_SVG} /><div className="boot">Strato…</div></>);
  }
  if (!user) {
    return (<><style>{CSS}</style><Bg /><Raw html={GRADS_SVG} /><Login onGoogle={loginGoogle} /></>);
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
          <button className="tb-btn bell" onClick={openNotifs} aria-label="Notifiche">
            <Bell />{unread > 0 && <span className="belldot" />}
          </button>
          <button className="tb-btn right" onClick={() => open("profile")}>
            <img className="av" src={user.avatar || avatarURI(user.name)} alt="" />
          </button>
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
        {tab === "orders" && (
          <OrdersTab orders={orders} isAdmin={isAdmin} onOpenOrder={(id) => setInvId(id)}
            onConfirm={(id) => setOrderStatus(id, "confirmed")} onReject={(id) => setOrderStatus(id, "rejected")}
            orderFocus={orderFocus} clearFocus={() => setOrderFocus(null)} />
        )}
        {tab === "profile" && (
          <Profile user={user} theme={theme} onTheme={pickTheme} onLogout={logout}
            isAdmin={isAdmin} onNewProduct={() => setEditing({})}
            likedPrints={prints.filter((p) => liked(p.id))} onOpenProduct={openDetail} onLike={toggleLike} onEditProduct={adminEdit} />
        )}
      </main>

      {/* DOCK */}
      <div className="dockwrap">
        <div className="dock dock4">
          <button className={"dnav home" + (tab === "home" ? " act" : "")} onClick={() => open("home")} aria-label="Home"><HomeI /></button>
          <button className={"dnav search" + (tab === "search" ? " act" : "")} onClick={() => open("search")} aria-label="Esplora"><SearchI /></button>
          <button className="dnav cart" onClick={() => setCartOpen(true)} aria-label="Carrello"><CartIcon />{cartCount > 0 && <span className="cartdot" />}</button>
          <button className={"dnav orders" + (tab === "orders" ? " act" : "")} onClick={() => open("orders")} aria-label="I miei ordini"><OrdersI />{orders.some((o) => o.status === "pending") && isAdmin && <span className="orddot" />}</button>
        </div>
      </div>

      {detail && (
        <Detail
          key={detail.id} p={detail} cats={cats} prints={prints}
          onClose={() => setDetailId(null)} onOpen={openDetail}
          onAdd={addToCart} isAdmin={isAdmin} onEdit={adminEdit} onColorPhoto={changeColorPhoto}
          onSaveAddons={async (patch) => { await supabase.from("prints").update(patch).eq("id", detail.id); await loadPrints(); toast("Prezzi aggiornati"); }}
        />
      )}

      {notifOpen && (
        <NotifSheet notifs={notifs} onClose={() => setNotifOpen(false)} onItemClick={onNotifClick} />
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
  const featured = prints.filter((p) => p.featured);
  const heroes = featured.length ? featured : (prints[0] ? [prints[0]] : []);
  return (
    <section className="screen on">
      <div className="px">
        <div className="kick">ULTIME CREAZIONI</div>
        <h1 className="hero">Stampe fresche di piatto.</h1>
      </div>
      {heroes.length > 0 && (
        <div className={"herorow" + (heroes.length === 1 ? " single" : "")}>
          {heroes.map((h) => (
            <div className="herocard" key={h.id} onClick={() => onOpen(h.id)}>
              <img src={colImg(h.cols[0])} alt="" />
              <button className="lk" onClick={(e) => { e.stopPropagation(); onLike(h.id); }} aria-label="Mi piace">
                <span className={"heart" + (liked(h.id) ? " liked" : "")}><HeartI /></span>
              </button>
              <div className="herotag"><div className="ht">{h.title}</div><div className="hp">{eur(h.price)}</div></div>
              {onEdit && <button className="cedit hero" onClick={(e) => { e.stopPropagation(); onEdit(h); }} aria-label="Modifica"><Pencil /></button>}
            </div>
          ))}
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

  const reco = prints.filter((x) => x.id !== p.id).sort((a, b) => b.likeCount - a.likeCount).slice(0, 3);

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
    <div className={"ipick on detailpop" + (closing ? " closing" : "")} onClick={(e) => { if (e.target.classList.contains("ipick")) doClose(); }}>
      <div className="sheet detailsheet">
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi"><ChevronDown /></button>
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
            <div className="dttl">{p.title}</div>
            <div className="dprice">{eur(p.price)}</div>
            <div className="dmat">{p.material}</div>
            <div className="dlabel dcolor">Colori disponibili</div>
            <div className="dswatches readonly">
              {p.cols.map((cc, k) => (
                <div key={k} className="dswbox ro">
                  <span className="dsw" style={{ background: "linear-gradient(135deg," + cc.a + " 0%," + cc.a + " 50%," + cc.b + " 50%," + cc.b + " 100%)" }} />
                  <span className="dswn">{cc.name}</span>
                </div>
              ))}
            </div>
            <p className="dcolnote">Il colore finale verrà impostato dall'artigiano.</p>
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
            <button className="dadd2" onClick={doAdd}><CartIcon /> Aggiungi · {eur(unit * qty)}</button>
          </div>
        </div>
        {reco.length > 0 && (
          <div className="dreco">
            <h3>Può interessarti anche</h3>
            <Grid>{reco.map((rp) => <Card key={rp.id} p={rp} liked={false} onLike={() => { }} onOpen={() => onOpen(rp.id)} onEdit={onEdit} />)}</Grid>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- CARRELLO ---- */
function CartSheet({ cart, total, onClose, onStep, onConfirm }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} onClick={(e) => { if (e.target.classList.contains("ipick")) doClose(); }}>
      <div className="sheet">
        <button className="sheetclose" onClick={doClose}><ChevronDown /></button>
        <h4><CartIcon /> Carrello</h4>
        <div className="cartitems">
          {cart.length === 0 && <div className="cempty">Il carrello è vuoto</div>}
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
function InvoiceSheet({ o, isAdmin, onClose }) {
  return (
    <div className="ipick on" onClick={(e) => { if (e.target.classList.contains("ipick")) onClose(); }}>
      <div className="sheet inv">
        <button className="sheetclose" onClick={onClose}><ChevronDown /></button>
        <div className="invhead">
          {isAdmin && <img className="invav" src={o.avatar || avatarURI(o.who)} alt="" />}
          <div className="invwho">
            <div className="invtt">{isAdmin ? o.who : "Il tuo ordine"}</div>
            <div className="invmeta">{o.status === "confirmed" ? "Confermato" : "In attesa"}{o.date ? " · " + fmtDate(o.date) : ""}</div>
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
  );
}

/* ---- PROFILO ---- */
function OrdersTab({ orders, isAdmin, onOpenOrder, onConfirm, onReject, orderFocus, clearFocus }) {
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
        </div>
      ))}
    </section>
  );
}

function Profile({ user, theme, onTheme, onLogout, isAdmin, onNewProduct, likedPrints, onOpenProduct, onLike, onEditProduct }) {
  return (
    <section className="screen on">
      <h2 className="title px"><span className="ticon"><User /></span>Profilo</h2>
      <div className="pcard glass">
        <img className="pav" src={user.avatar || avatarURI(user.name)} alt="" />
        <div><div className="pname">{user.name}</div><div className="prole">{isAdmin ? "Amministratore" : "Cliente"}</div></div>
      </div>
      {isAdmin && <button className="qsend" style={{ marginTop: 14 }} onClick={onNewProduct}><Plus /> Nuovo prodotto</button>}
      {likedPrints && likedPrints.length > 0 && (
        <>
          <div className="psec">Preferiti</div>
          <Grid>{likedPrints.map((p) => <Card key={p.id} p={p} liked onLike={onLike} onOpen={() => onOpenProduct(p.id)} onEdit={onEditProduct} />)}</Grid>
        </>
      )}
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
/* ---- LOGIN (solo Google) ---- */
function Login({ onGoogle }) {
  return (
    <div className="loginwrap">
      <div className="loginbox glass">
        <div className="brand2 big"><span className="mk"><Box /></span>Strato</div>
        <p className="lsub">Stampe 3D su misura</p>
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

function NotifSheet({ notifs, onClose, onItemClick }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 320); };
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} onClick={(e) => { if (e.target.classList.contains("ipick")) doClose(); }}>
      <div className="sheet notifsheet">
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi"><ChevronDown /></button>
        <h4><span className="ticon"><Bell /></span> Notifiche</h4>
        {notifs.length === 0 && <p className="empty">Nessuna notifica per ora.</p>}
        {notifs.map((n) => (
          <button className="notifrow" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
            <span className={"notifdot s-" + n.status} />
            <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
            <span className="notifarrow">›</span>
          </button>
        ))}
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

/* icone lucide minimali (inline per non dipendere troppo) */
const ChevronLeft = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>);
const ChevronDown = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const Check = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>);
const User = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
const LogOut = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
const Plus = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
const Pencil = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
const Trash2 = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>);
const Upload = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>);
const Camera = () => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
