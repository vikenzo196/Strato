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
.herocard{position:relative;margin:0 18px 18px;border-radius:26px;overflow:hidden;box-shadow:var(--shadow);cursor:pointer;aspect-ratio:16/11}
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

/* ======================= SFONDO — dipinto sul canvas radice (html) =========
   Lo sfondo NON e' piu' un elemento fisso: il gradiente viene applicato
   direttamente all'elemento <html> (vedi syncBackstop in JS), con
   background-attachment:fixed. E' il canvas radice, quindi:
   - i pannelli con backdrop-filter lo leggono in modo affidabile (niente
     "rettangolo"/seam da layer fisso che si ridisegna a meta');
   - copertura piena garantita su PC e smartphone, chiaro e scuro.
   Qui restano solo le transizioni di tema. */

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

/* Lo sfondo e' dipinto sul canvas radice (<html>) da syncBackstop. */
const BG_LIGHT =
  "radial-gradient(circle 80vmax at 8% 2%,rgba(191,107,74,.14),rgba(191,107,74,0) 100%)," +
  "radial-gradient(circle 76vmax at 96% 8%,rgba(214,184,155,.24),rgba(214,184,155,0) 100%)," +
  "radial-gradient(circle 80vmax at 88% 100%,rgba(156,92,67,.13),rgba(156,92,67,0) 100%)," +
  "radial-gradient(circle 74vmax at 2% 96%,rgba(214,184,155,.16),rgba(214,184,155,0) 100%)," +
  "radial-gradient(circle 66vmax at 50% 16%,rgba(255,255,255,.20),rgba(255,255,255,0) 100%)," +
  "#F7F2EB";
const BG_DARK =
  "radial-gradient(circle 58vmax at 10% 4%,rgba(209,124,86,.17),rgba(209,124,86,0) 100%)," +
  "radial-gradient(circle 52vmax at 94% 8%,rgba(201,169,140,.10),rgba(201,169,140,0) 100%)," +
  "radial-gradient(circle 58vmax at 90% 99%,rgba(209,124,86,.14),rgba(209,124,86,0) 100%)," +
  "radial-gradient(circle 52vmax at 4% 97%,rgba(156,92,67,.11),rgba(156,92,67,0) 100%)," +
  "radial-gradient(circle 46vmax at 50% 12%,rgba(232,201,168,.045),rgba(232,201,168,0) 100%)," +
  "#181411";
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
      root.style.background = dark ? BG_DARK : BG_LIGHT;
      root.style.backgroundAttachment = "fixed";
      root.style.backgroundRepeat = "no-repeat";
      // il body resta trasparente: lascia vedere il canvas radice
      document.body.style.background = "transparent";
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
