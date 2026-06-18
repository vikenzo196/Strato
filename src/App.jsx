import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function canUseWebPush() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

function urlB64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function sameAppServerKey(existing, current) {
  if (!existing) return null; // alcuni browser non espongono la chiave: non possiamo confrontare
  const a = new Uint8Array(existing);
  if (a.length !== current.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== current[i]) return false;
  return true;
}

async function getPushRegistration() {
  return (await navigator.serviceWorker.getRegistration("/sw.js"))
    || (await navigator.serviceWorker.getRegistration())
    || null;
}

// Stato corrente delle notifiche, riflesso anche dopo refresh pagina.
async function checkPushStatus() {
  const supported = canUseWebPush();
  if (!supported) return { supported: false, permission: "unsupported", subscribed: false };
  const permission = Notification.permission;
  let subscribed = false;
  try {
    const reg = await getPushRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    subscribed = !!sub;
  } catch (_) {}
  return { supported, permission, subscribed };
}

async function enablePushNotifications(supabaseClient, userId) {
  if (!canUseWebPush()) throw new Error("push-not-supported");
  if (!VAPID_PUBLIC_KEY) throw new Error("missing-vapid-public-key");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "push-denied" : "push-dismissed");

  const appKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
  const reg = await navigator.serviceWorker.register("/sw.js");
  let sub = await reg.pushManager.getSubscription();

  // Subscription legata a una VAPID key diversa (chiavi rigenerate): la rimuoviamo
  // e ne creiamo una nuova, così il push server non la rifiuta.
  if (sub && sameAppServerKey(sub.options?.applicationServerKey, appKey) === false) {
    const oldEndpoint = sub.endpoint;
    try { await sub.unsubscribe(); } catch (_) {}
    try { await supabaseClient.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", oldEndpoint); } catch (_) {}
    sub = null;
  }

  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  }

  const { error } = await supabaseClient
    .from("push_subscriptions")
    .upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
  return true;
}

// Disattiva SOLO la subscription del dispositivo corrente (non quelle di altri device).
async function disablePushNotifications(supabaseClient, userId) {
  if (!canUseWebPush()) return false;
  try {
    const reg = await getPushRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      const endpoint = sub.endpoint;
      try { await supabaseClient.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint); } catch (_) {}
      try { await sub.unsubscribe(); } catch (_) {}
    }
  } catch (_) {}
  return false;
}


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
    --glass:rgba(199,125,107,.08); --glass2:rgba(199,125,107,.13);
    --strokeSoft:rgba(199,125,107,.22); --hi:rgba(255,240,220,.18); --glassDock:rgba(45,36,32,.78);
    --shadow:0 16px 48px rgba(0,0,0,.55); --txtShadow:rgba(0,0,0,.55);
    --shy:16px; --shblur:48px; --shcol:rgba(0,0,0,.55);
    --b1:#4A382C; --b2:#5A4030; --b3:#6B463B; --b4:#7A4A38; --bg:#2D2420; --heart:#E0917B;
    --card:rgba(51,39,35,.56);
    --accent:#C77D6B; --accent2:#B7795E; --accentDeep:#A65435; --sand:#7A5A42; --clay:#8A6A4E; --terra:#B7795E;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  .bgttl{font-family:'Inter',system-ui,sans-serif;font-weight:600;font-size:17px;color:var(--text);margin:18px 2px 8px}
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
  h1.hero{font-family:'Inter',system-ui,sans-serif;font-weight:800;font-size:33px;letter-spacing:-1px;line-height:1.12;margin:8px 4px 16px;text-shadow:0 2px 8px rgba(166,84,53,.14);}
  h2.title{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:27px;letter-spacing:-.5px;margin:10px 4px 16px;display:flex;align-items:center;gap:10px;}
  .ticon{width:28px;height:28px;flex:none;filter:drop-shadow(0 1px 1px rgba(74,35,18,.22)) drop-shadow(0 -0.6px .6px rgba(255,240,220,.4))}

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
  .lk{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;border:1px solid rgba(235,218,198,.72);background:rgba(243,233,218,.84);box-shadow:var(--elev1);transition:transform .15s}
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
  .gico{display:block;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 1.5px rgba(80,45,25,.28)) drop-shadow(0 -.5px .6px rgba(255,248,238,.60))}
  .cathint{margin:16px 4px 14px;color:var(--soft,#9a8d7d);font-size:13px}
  .ipick{position:fixed;inset:0;z-index:85;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0);visibility:hidden;opacity:0;pointer-events:none;transition:opacity .28s ease, background .28s ease, visibility .28s}
  .ipick.on{visibility:visible;opacity:1;pointer-events:auto;background:rgba(0,0,0,.4)}
  .ipick .sheet{width:100%;max-width:520px;max-height:calc(100dvh - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom));overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:var(--glassDock);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border-radius:28px;border:1px solid var(--strokeSoft);box-shadow:0 8px 36px rgba(43,33,27,.30),0 2px 6px rgba(43,33,27,.14);padding:16px 18px 20px;transform:translateY(100%);transition:transform .36s cubic-bezier(.2,.8,.2,1)}
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
  .dockwrap{position:fixed;left:0;right:0;bottom:8px;z-index:72;display:flex;justify-content:center;pointer-events:none}
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
  .pcard .pav{width:68px;height:68px;border-radius:50%;border:2px solid rgba(217,194,163,.7)}
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
.kick{font-size:13px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin:10px 0 2px}
.hero{font-size:40px;line-height:1.04;font-weight:800;color:var(--text);margin:0 0 18px}
/* Hero text area: tono identitario viene dal kick terracotta e dallo sfondo Strato — no overlay aggiuntivo */
.herocard{position:relative;margin:0 18px 18px;border-radius:26px;overflow:hidden;box-shadow:var(--elev3);cursor:pointer;aspect-ratio:16/11}
.herocard img{width:100%;height:100%;object-fit:cover;display:block}
.herotag{position:absolute;left:14px;bottom:14px;background:rgba(244,236,224,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(199,125,107,.22);border-radius:15px;padding:9px 13px}
body.dark .herotag{background:rgba(51,39,35,.84);border-color:rgba(199,125,107,.28)}
.herotag .ht{font-weight:700;color:var(--text)}
.herotag .hp{font-size:13px;color:var(--soft)}
.searchbox{width:calc(100% - 36px);margin:0 18px 16px;padding:13px 16px;border-radius:15px;border:1px solid rgba(199,125,107,.22);background:rgba(244,236,222,.55);color:var(--text);font-family:inherit;font-size:15px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
body.dark .searchbox{background:rgba(199,125,107,.09);border-color:rgba(199,125,107,.24)}
.empty{color:var(--faint);font-size:14px;padding:6px 18px}
/* ---- PIACIUTI: empty state editoriale ---- */
.liked-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:54vh;padding:0 36px;text-align:center;animation:likedEmptyIn .3s cubic-bezier(.22,1,.36,1) both}
@keyframes likedEmptyIn{from{opacity:0;filter:blur(4px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}
.liked-empty-mark{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:rgba(199,125,107,.12);border:1.5px solid rgba(199,125,107,.22);margin:0 auto 32px;box-shadow:0 4px 18px rgba(199,125,107,.14)}
.liked-empty-mark svg{width:24px;height:24px;stroke:#C77D6B;fill:rgba(199,125,107,.18)}
.liked-empty-title{font-family:'Inter',system-ui,sans-serif;font-size:28px;font-weight:800;letter-spacing:-.6px;line-height:1.1;color:var(--text);margin:0 0 18px}
.liked-empty-sub{font-family:'Inter',system-ui,sans-serif;font-size:15px;font-weight:400;line-height:1.6;color:var(--soft);margin:0;letter-spacing:.01em}
/* ---- PWA INSTALL MODAL ---- */
.pwa-overlay{position:fixed;inset:0;z-index:300;background:rgba(45,36,32,.48);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:pwaFade .3s cubic-bezier(.22,1,.36,1) both}
@keyframes pwaFade{from{opacity:0}to{opacity:1}}
.pwa-sheet{width:100%;max-width:500px;background:var(--sheetbg);border-radius:32px 32px 0 0;padding:24px 24px calc(28px + env(safe-area-inset-bottom));animation:pwaUp .32s cubic-bezier(.22,1,.36,1) both;box-shadow:0 -6px 48px rgba(45,36,32,.24);border-top:1px solid rgba(199,125,107,.14)}
@keyframes pwaUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
.pwa-pill{width:36px;height:4px;border-radius:2px;background:rgba(199,125,107,.22);margin:0 auto 22px}
.pwa-icon{width:68px;height:68px;border-radius:18px;display:block;margin:0 auto 18px;box-shadow:0 8px 24px rgba(45,36,32,.20)}
.pwa-title{font-family:'Inter',system-ui,sans-serif;font-size:21px;font-weight:800;text-align:center;color:var(--text);letter-spacing:-.45px;line-height:1.2;margin:0 0 8px}
.pwa-sub{font-size:14px;text-align:center;color:var(--soft);line-height:1.58;margin:0 0 18px;padding:0 4px}
.pwa-benefits{list-style:none;padding:12px 14px;margin:0 0 20px;display:flex;flex-direction:column;gap:10px;background:rgba(217,194,163,.22);border-radius:18px;border:1px solid rgba(199,125,107,.12)}
.pwa-benefit{display:flex;align-items:center;gap:11px;font-size:13.5px;color:var(--soft)}
.pwa-bico{width:26px;height:26px;border-radius:50%;background:rgba(199,125,107,.14);display:grid;place-items:center;flex:none;border:1px solid rgba(199,125,107,.18)}
.pwa-bico svg{width:13px;height:13px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pwa-btn-p{width:100%;padding:15px;border-radius:16px;border:none;background:linear-gradient(135deg,#C77D6B,#A65435);color:#fff;font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 6px 20px rgba(166,84,53,.30);transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .18s;letter-spacing:-.1px}
.pwa-btn-p:active{transform:scale(.97);box-shadow:0 3px 10px rgba(166,84,53,.18)}
.pwa-btn-later{width:100%;padding:12px;border:none;background:transparent;color:var(--soft);font-family:'Inter',system-ui,sans-serif;font-weight:500;font-size:15px;cursor:pointer;margin-top:6px}
.pwa-steps{display:flex;flex-direction:column;gap:14px;margin:0 0 20px}
.pwa-step{display:flex;align-items:flex-start;gap:13px}
.pwa-snum{width:26px;height:26px;border-radius:50%;background:rgba(199,125,107,.14);border:1.5px solid rgba(199,125,107,.28);display:grid;place-items:center;flex:none;font-size:12px;font-weight:700;color:var(--accent)}
.pwa-stxt{padding-top:3px;font-size:14px;color:var(--soft);line-height:1.5}
.pwa-stxt strong{color:var(--text);font-weight:600}
.pwa-share-ico{display:inline-block;vertical-align:middle;margin:0 2px;width:16px;height:16px;stroke:var(--accent);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
/* Profile App row */
.pwa-prow{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;margin:0 18px;border-radius:16px;background:var(--glass2);border:1px solid var(--strokeSoft);cursor:pointer;transition:opacity .15s}
.pwa-prow.installed{cursor:default;opacity:.8}
.pwa-prowl{display:flex;align-items:center;gap:12px}
.pwa-prow-ico{width:40px;height:40px;border-radius:11px;box-shadow:0 3px 10px rgba(45,36,32,.16)}
.pwa-prowt{font-weight:700;font-size:15px;color:var(--text)}
.pwa-prows{font-size:12.5px;color:var(--soft);margin-top:2px}
.pwa-prow-check svg{width:20px;height:20px;stroke:var(--accent);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.pwa-prow-arr{opacity:.35;display:flex}
.push-prow{margin-top:10px}
.push-prow.busy{pointer-events:none;opacity:.72}
.push-prow.disabled{cursor:not-allowed;opacity:.58}
.push-prow-ico{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none;color:var(--accent);background:rgba(199,125,107,.12);border:1px solid rgba(199,125,107,.18);box-shadow:inset 0 1px 0 var(--hi)}
.push-prow-ico svg{width:21px;height:21px}
.pwa-prow:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(199,125,107,.28), inset 0 1px 0 var(--hi)}
.catgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:0 18px}
.cat{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 12px 18px;border-radius:22px;text-align:center;cursor:pointer;background:rgba(217,194,163,.30);border:1px solid rgba(199,125,107,.16);box-shadow:0 2px 8px rgba(140,90,55,.08),inset 0 1px 0 rgba(255,243,228,.5)}
body.dark .cat{background:rgba(199,125,107,.09);border-color:rgba(199,125,107,.20);box-shadow:0 2px 8px rgba(0,0,0,.2),inset 0 1px 0 rgba(199,125,107,.08)}
.cat .ci{display:grid;place-items:center}
.cat .ci .gico{width:54px;height:54px}
.cat .catn{font-weight:700;font-size:18px;color:var(--text)}
.heartred svg{stroke:#F0231A;fill:rgba(240,35,26,.18)}
.cempty{text-align:center;color:var(--soft);padding:42px 0 16px;font-size:19px;font-weight:600}
.osec{font-family:'Inter',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:var(--accent);margin:4px 20px 12px}
.qsend{display:flex;align-items:center;justify-content:center;gap:9px;width:calc(100% - 36px);margin:8px 18px 0;padding:15px;border-radius:17px;border:none;background:linear-gradient(135deg,var(--b3,#e0a890),#c2715f);color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;cursor:pointer;box-shadow:0 2px 6px rgba(120,60,40,.16), 0 14px 32px rgba(120,60,40,.24)}
.qsend:disabled{opacity:.6}
.invtot{font-size:30px;font-weight:800;color:var(--text)}
.invtotrow{align-items:baseline}
/* profilo */
.pcard{display:flex;align-items:center;gap:14px;margin:0 18px;padding:16px;border-radius:20px;background:rgba(217,194,163,.32);border:1px solid rgba(199,125,107,.18);box-shadow:0 4px 16px rgba(140,90,55,.10)}
body.dark .pcard{background:rgba(90,64,48,.28);border-color:rgba(199,125,107,.22)}
.pav{width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid var(--strokeSoft)}
.pname{font-weight:700;font-size:18px;color:var(--text)}
.prole{font-size:13px;color:var(--soft)}
.psec{font-weight:700;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:var(--soft);margin:18px 20px 10px}
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
.adminProductView{padding-bottom:calc(90px + env(safe-area-inset-bottom, 0px))}
.adminProductCard{margin:0 14px;padding:18px;border-radius:30px;overflow:visible}
.adminProductHead{margin-bottom:12px}
.adminProductTitle{display:flex;align-items:center;gap:10px;margin:4px 0 12px;color:var(--text);font-size:28px;line-height:1.05;letter-spacing:-.62px}
.adminProductTitle svg{width:22px;height:22px;color:var(--accent)}
.adminProductCard .qsend,.adminProductCard .delbtn{width:100%;margin:12px 0 0}
.adminProductCard .addcolor{width:100%;justify-content:center;margin:4px 0 12px}
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
  .sheet{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.dockwrap{bottom:calc(8px + env(safe-area-inset-bottom))}
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
.tb-btn.cart .cbadge{display:none!important}
.tb-right{gap:10px}

/* ---- parallasse leggera su scroll (solo immagine hero) ---- */
.herocard img{transform:scale(1.08);transition:none}

/* ---- topbar: frosted glass trasparente e corto allo scroll ----
   Non colora la status bar: sfoca soltanto ciò che passa sotto. */
.topscrim{position:fixed;top:0;left:0;right:0;height:calc(72px + env(safe-area-inset-top,0px));z-index:49;pointer-events:none;background:rgba(128,128,128,.001);-webkit-backdrop-filter:blur(15px) saturate(128%);backdrop-filter:blur(15px) saturate(128%);-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 56%,rgba(0,0,0,.58) 78%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 56%,rgba(0,0,0,.58) 78%,transparent 100%);opacity:min(.96,calc(var(--par,0) / 84));transition:opacity .14s linear}

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
.iggroup{font-size:11.5px;font-weight:700;color:var(--soft);text-transform:uppercase;letter-spacing:.08em;margin:18px 2px 9px;opacity:.7}
.ig{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
/* Tile icona: stato default */
.ib{aspect-ratio:1;border:1px solid var(--strokeSoft);background:var(--glass2);border-radius:14px;display:grid;place-items:center;cursor:pointer;color:var(--text);transition:background .2s,box-shadow .2s,transform .15s}
.ib:active{transform:scale(.93)}
/* Selected: bordo terracotta caldo, niente nero */
.ib.on{background:var(--card);border-color:rgba(199,125,107,.45);box-shadow:inset 0 1px 0 var(--hi),0 0 0 1.5px rgba(199,125,107,.38),0 4px 12px var(--shcol)}
body.dark .ib.on{border-color:rgba(209,124,86,.50);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 1.5px rgba(209,124,86,.40)}
/* Focus: ring a contrasto separato dallo stile selected */
.ib:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

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
.ipick.top .sheet{border-radius:28px;box-shadow:0 8px 36px rgba(43,33,27,.30),0 2px 6px rgba(43,33,27,.14);transform:translateY(-100%);padding:16px 18px 20px}
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
  --card:rgba(244,236,222,.62); --sheetbg:#F3EDE4;
  --scrim:rgba(247,242,235,.9); --scrim2:rgba(247,242,235,.5);
  --app-bg-solid:#eadccf;
  --app-bg-gradient:
    radial-gradient(circle at 18% 8%, rgba(188,139,103,.16), transparent 34%),
    radial-gradient(circle at 88% 18%, rgba(151,134,105,.12), transparent 32%),
    linear-gradient(180deg,#f3eadf 0%,#eadccf 48%,#dfcfbf 100%);
  --sheet-scrim:rgba(43,33,27,.64);
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
  --app-bg-solid:#312720;
  --app-bg-gradient:
    radial-gradient(circle at 18% 8%, rgba(154,101,72,.18), transparent 34%),
    radial-gradient(circle at 86% 16%, rgba(119,103,82,.14), transparent 34%),
    linear-gradient(180deg,#241b18 0%,#1d1716 52%,#171211 100%);
  --sheet-scrim:rgba(17,13,12,.74);
}

/* ======================= SFONDO — canvas unico Strato ==================
   Il canvas non deve avere un punto in cui “finisce” e ricomincia.
   Il colore base vive su html/body; il gradiente atmosferico è un solo layer fixed
   viewport-sized. #root e le viste restano trasparenti: nessun blocco di pagina può
   scorrere sopra un background diverso. */
html,
body{
  min-height:100%;
  background-color:var(--app-bg-solid)!important;
  background-image:none!important;
}
body{
  overflow-x:hidden;
}
#root{
  position:relative;
  z-index:1;
  min-height:100%;
  background:transparent!important;
}
#appbg{
  position:fixed;
  inset:0;
  width:100vw;
  height:100vh;
  min-height:100vh;
  z-index:0;
  pointer-events:none;
  background-color:var(--app-bg-solid);
  background-image:var(--app-bg-gradient);
  background-size:100vw 100vh;
  background-position:center center;
  background-repeat:no-repeat;
  transform:translateZ(0);
  will-change:auto;
}
@supports (height:100dvh){
  #appbg{height:100dvh;min-height:100dvh;background-size:100vw 100dvh}
}
@supports (height:100lvh){
  #appbg{height:100lvh;min-height:100lvh;background-size:100vw 100lvh}
}
.wrap,
.screen,
.appview{
  background:transparent!important;
}

/* ---- vetro: frosted ceramic — Earth Tone ---- */
.glass{background:rgba(239,231,221,.38);-webkit-backdrop-filter:blur(26px) saturate(125%);backdrop-filter:blur(26px) saturate(125%);border:1px solid rgba(199,125,107,.12)}
body.dark .glass{background:rgba(199,125,107,.07);border-color:rgba(199,125,107,.16)}

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
.dockwrap{position:fixed;bottom:calc(8px + env(safe-area-inset-bottom))}

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
.cbody{padding:14px 14px 15px;display:flex;flex-direction:column;gap:0;min-width:0;background:linear-gradient(180deg,rgba(217,194,163,.18) 0%,rgba(239,231,221,.08) 100%)}
body.dark .cbody{background:linear-gradient(180deg,rgba(90,64,48,.22) 0%,rgba(59,43,37,.08) 100%)}
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
.cartbadge{display:none!important}
/* Hard kill legacy numeric cart badges: Strato usa solo il punto materico. */
.dnav.cart .cbadge,
.dnav.cart .cartbadge,
.tb-btn.cart .cbadge,
.tb-btn.cart .cartbadge{display:none!important}

.dnav.profile svg{stroke:var(--icon)}
.dnav.profile.act svg{stroke:var(--accent)}

/* ---- campanella notifiche (topbar) ---- */
.tb-btn.bell{position:relative;width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glassDock);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 var(--hi), var(--elev1);color:var(--text)}
.tb-btn.bell svg{width:22px;height:22px;stroke:var(--text);fill:none}

/* Badge v2 — punto frosted matte, definito in CSS vettoriale */
.softdot{
  position:absolute;
  width:8px;
  height:8px;
  border-radius:50%;
  pointer-events:none;
  background:
    linear-gradient(145deg, rgba(206,132,105,.74), rgba(155,96,73,.62)),
    rgba(196,122,94,.42);
  border:1px solid rgba(255,244,235,.38);
  -webkit-backdrop-filter:blur(10px) saturate(135%);
  backdrop-filter:blur(10px) saturate(135%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 1px rgba(92,58,44,.10),
    0 1px 4px rgba(90,55,42,.18);
  transform:translateZ(0);
}
.cartdot{top:10px;right:12px}
.belldot{top:8px;right:9px}
body.dark .softdot{
  background:
    linear-gradient(145deg, rgba(207,132,101,.66), rgba(137,82,62,.56)),
    rgba(184,105,78,.34);
  border-color:rgba(255,235,220,.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 1px rgba(0,0,0,.16),
    0 1px 5px rgba(0,0,0,.26);
}

/* ---- foglio notifiche ---- */

.notifrow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px;border-radius:15px;border:1px solid var(--strokeSoft);background:var(--glass2);margin-bottom:9px;cursor:pointer;color:var(--text);font-family:inherit;transition:background .25s ease,transform .2s ease}
.notifrow:active{transform:scale(.985)}
.notifdot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 8px rgba(199,125,107,.35)}
.notifdot.s-pending{background:var(--warning)}
.notifdot.s-confirmed{background:var(--success)}
.notifdot.s-rejected{background:#b06a52}
.notifdot.s-completed{background:#7f8f6c}
.notiftxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.notiftxt b{font-size:14px;font-weight:700;color:var(--text)}
.notifb{font-size:12.5px;color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notifarrow{color:var(--faint);font-size:22px;line-height:1;flex:none}
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

/* ===================== PROFILO — premium ===================== */
@keyframes profIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.profilePage .title{margin-bottom:20px}
.profileHero,.profilePage .profileSection,.profileLogoutWrap{animation:profIn .5s cubic-bezier(.22,1,.36,1) both}
.profilePage .profileSection:nth-of-type(1){animation-delay:.04s}
.profilePage .profileSection:nth-of-type(2){animation-delay:.09s}
.profilePage .profileSection:nth-of-type(3){animation-delay:.14s}
.profileLogoutWrap{animation-delay:.18s}
.profileHero{display:flex;align-items:center;gap:18px;margin:0 18px;padding:22px;border-radius:26px;background:var(--card);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi),0 10px 30px var(--shcol)}
.profileAvatar{width:74px;height:74px;border-radius:50%;object-fit:cover;flex:none;border:1px solid var(--strokeSoft);box-shadow:0 4px 14px var(--shcol)}
.profileIdentity{min-width:0;display:flex;flex-direction:column;gap:7px}
.profileName{font-weight:700;font-size:21px;letter-spacing:-.3px;line-height:1.12;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.profileRolePill{align-self:flex-start;display:inline-flex;align-items:center;padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.04em;color:var(--accent2);background:rgba(199,125,107,.12);border:1px solid rgba(199,125,107,.24)}
body.dark .profileRolePill{color:var(--accent);background:rgba(199,125,107,.15);border-color:rgba(199,125,107,.30)}
.profileMicrocopy{margin:1px 0 0;font-size:13px;line-height:1.45;color:var(--soft)}
.profileSection{margin-top:26px}
.profileSectionTitle{margin:0 22px 12px;font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--soft)}
.profileAdminCard{margin:0 18px;padding:8px;border-radius:22px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi)}
.profileAdminActions{display:flex;flex-direction:column;gap:6px}
.profileSubtleButton{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:13px;border-radius:16px;border:1px solid transparent;background:transparent;color:var(--text);font-family:inherit;cursor:pointer;transition:background .25s cubic-bezier(.22,1,.36,1),transform .18s}
.profileSubtleButton:hover{background:var(--glass)}
.profileSubtleButton:active{transform:scale(.985)}
.profileSubtleIcon{flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 4px 12px var(--shcol)}
.profileSubtleIcon svg{width:19px;height:19px}
.profileSubtleText{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.profileSubtleT{font-weight:600;font-size:15px;color:var(--text)}
.profileSubtleS{font-size:12.5px;color:var(--soft)}
.profileSubtleArr{flex:none;display:flex;color:var(--soft);opacity:.5}
.profileSubtleArr svg{width:18px;height:18px}
.profilePage .themeseg{margin:0 18px;gap:4px;padding:5px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi)}
.profilePage .segbtn{transition:background .3s cubic-bezier(.22,1,.36,1),color .3s,box-shadow .3s,transform .18s}
.profilePage .segbtn.on{background:var(--card);color:var(--accent);box-shadow:0 2px 8px var(--shcol),inset 0 1px 0 var(--hi)}
.profilePage .segbtn:active{transform:scale(.97)}
.profilePage .pwa-prow{box-shadow:inset 0 1px 0 var(--hi);margin-bottom:0}
.profileLogoutWrap{display:flex;justify-content:center;margin:34px 18px 4px}
.profileLogout{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:14px;border:1px solid var(--strokeSoft);background:transparent;color:var(--soft);font-family:inherit;font-weight:500;font-size:14px;cursor:pointer;transition:background .25s,color .25s,transform .18s}
.profileLogout svg{width:17px;height:17px}
.profileLogout:hover{background:var(--glass);color:var(--text)}
.profileLogout:active{transform:scale(.985)}
.profilePage button:focus-visible,.profilePage .pwa-prow:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
@media(prefers-reduced-motion:reduce){
  .profileHero,.profilePage .profileSection,.profileLogoutWrap{animation:none!important}
  .profilePage .segbtn,.profileSubtleButton,.profileLogout{transition:none!important}
}

/* ===================== NOTIFICHE — push-row + toggle switch ===================== */
.push-row{display:flex;align-items:center;gap:14px;padding:13px 16px;margin:0 18px;border-radius:18px;background:var(--glass2);border:1px solid var(--strokeSoft);box-shadow:inset 0 1px 0 var(--hi);transition:opacity .25s}
.push-row--denied{opacity:.6}
.push-row--busy{opacity:.75;pointer-events:none}
.push-row-ico{flex:none;display:flex;color:var(--accent);opacity:.85}
.push-row-ico svg{width:20px;height:20px}
.push-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.push-row-title{font-size:15px;font-weight:600;color:var(--text);line-height:1.2}
.push-row-sub{font-size:12.5px;font-weight:400;color:var(--soft);line-height:1.4}

/* Toggle switch */
.push-toggle{flex:none;position:relative;width:46px;height:27px;border-radius:999px;border:none;padding:0;cursor:pointer;background:var(--bg2);box-shadow:inset 0 0 0 1.5px var(--strokeSoft);transition:background .3s cubic-bezier(.22,1,.36,1),box-shadow .3s cubic-bezier(.22,1,.36,1),transform .15s cubic-bezier(.22,1,.36,1)}
.push-toggle--on{background:var(--accent);box-shadow:inset 0 0 0 1.5px transparent,0 2px 8px var(--shcol)}
.push-toggle--busy{opacity:.55;cursor:default}
.push-toggle:disabled{cursor:default}
.push-toggle:active:not(:disabled){transform:scale(.955)}
.push-toggle-knob{position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s cubic-bezier(.22,1,.36,1)}
.push-toggle--on .push-toggle-knob{transform:translateX(19px);box-shadow:0 2px 6px rgba(0,0,0,.22)}
.push-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

/* Dark overrides */
body.dark .push-toggle{background:var(--bg2)}
body.dark .push-toggle--on{background:var(--accent)}
body.dark .push-toggle-knob{background:rgba(255,255,255,.92)}

/* Reduced motion */
@media (prefers-reduced-motion:reduce){
  .push-toggle,.push-toggle-knob,.push-row{transition:none!important}
}

/* ===================== PIACIUTI — redesign premium ===================== */

/* Sottotitolo condizionale */
.liked-page-sub{margin:-6px 0 18px;font-size:14px;font-weight:400;color:var(--soft);line-height:1.45;font-style:italic}

/* Griglia wrapper: respiro leggermente aumentato */
.liked-grid-wrap{padding:0 18px}
.liked-grid-wrap .grid{gap:16px}

/* Card variante liked: più editoriale */
.liked-card{border-radius:24px}
/* dark mode: bordo caldo appena più leggibile */
body.dark .liked-card{box-shadow:inset 0 0 0 1px rgba(199,125,107,.14),var(--elev2)}

/* Categoria: più raffinata */
.liked-card .cbody .cardcat{font-size:9.5px;letter-spacing:.12em;color:var(--soft);opacity:.75}

/* Materiale: più morbido */
.liked-card .cbody .mat{font-size:11px;color:var(--soft);opacity:.8}

/* Prezzo: visibile ma meno dominante */
.liked-card .cbody .cp{font-size:15px;font-weight:600;letter-spacing:.005em;color:var(--text);opacity:.85;margin-bottom:12px}

/* CTA editoriale "Dettagli" */
.liked-configbtn{
  width:100%;padding:10px;border-radius:12px;
  border:1px solid rgba(199,125,107,.28);
  background:transparent;
  color:var(--accent2);
  font-family:inherit;font-weight:600;font-size:12.5px;letter-spacing:.03em;
  cursor:pointer;
  transition:background .24s cubic-bezier(.22,1,.36,1),transform .16s cubic-bezier(.22,1,.36,1),box-shadow .24s;
}
.liked-configbtn:hover{background:rgba(199,125,107,.08)}
.liked-configbtn:active{transform:scale(.985)}
.liked-configbtn:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .liked-configbtn{border-color:rgba(199,125,107,.30);color:var(--accent)}
body.dark .liked-configbtn:hover{background:rgba(199,125,107,.10)}

/* Focus ring caldo su card e pulsante like */
.liked-card:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
.liked-card .lk:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}

/* Stagger ingresso card piaciuti */
@keyframes likedCardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.liked-grid-wrap .card.in{animation:likedCardIn .42s cubic-bezier(.22,1,.36,1) both}
.liked-grid-wrap .card:nth-child(1){animation-delay:0ms}
.liked-grid-wrap .card:nth-child(2){animation-delay:40ms}
.liked-grid-wrap .card:nth-child(3){animation-delay:80ms}
.liked-grid-wrap .card:nth-child(4){animation-delay:120ms}
.liked-grid-wrap .card:nth-child(5){animation-delay:160ms}
.liked-grid-wrap .card:nth-child(6){animation-delay:200ms}
.liked-grid-wrap .card:nth-child(n+7){animation-delay:220ms}

/* Bottom spacer dock */
.liked-bottom-spacer{height:calc(80px + env(safe-area-inset-bottom, 0px))}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .liked-grid-wrap .card.in{animation:none!important;opacity:1!important;transform:none!important}
  .liked-configbtn{transition:none!important}
}

/* ===================== ORDINI — premium redesign ===================== */

.ordersPage{padding-bottom:0}
.ordersHero{margin:0 0 18px}
.ordersHero .title{margin-bottom:4px!important}
.ordersSubtitle{margin:0;color:var(--soft);font-size:15px;font-weight:400;line-height:1.45;letter-spacing:-.08px}
.ordersList{display:flex;flex-direction:column;gap:16px;margin-top:18px}

/* Card ordine: meno dashboard, più richiesta editoriale */
.orderCard{display:flex;align-items:center;gap:15px;border-radius:25px;padding:17px 16px;margin:0 14px;min-height:100px;cursor:pointer;transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .25s cubic-bezier(.22,1,.36,1),background-color .3s,border-color .3s}
.orderCard:active{transform:scale(.985)}
.orderCard:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

.orderThumb{flex:none;width:64px;height:64px;border-radius:18px;object-fit:cover;align-self:center;box-shadow:0 4px 14px rgba(72,50,32,.12),inset 0 1px 0 rgba(255,255,255,.25);border:1px solid var(--strokeSoft);background:var(--glass2)}
.orderAvatar{flex:none;width:46px;height:46px;border-radius:50%;object-fit:cover;align-self:center;border:1px solid var(--strokeSoft);box-shadow:0 3px 12px rgba(72,50,32,.13)}

.orderBody{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;padding-top:0;align-self:center}
.orderTitle{font-weight:750;font-size:16px;letter-spacing:-.22px;line-height:1.18;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orderMeta{font-size:12.8px;font-weight:450;color:var(--soft);line-height:1.38;white-space:normal;display:flex;flex-direction:column;gap:2px}
.orderMeta strong{font-weight:650;color:var(--text)}
.orderNote{margin:2px 0 0;font-size:12.5px;line-height:1.45;color:var(--soft);font-weight:400;max-width:96%}
.orderCta{display:none}

.orderSide{flex:none;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:8px;align-self:stretch;min-width:78px;padding-top:0}
.ostat{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;border:1px solid transparent}
.ostat--confirmed{background:rgba(199,125,107,.16);color:#9E553F;border-color:rgba(199,125,107,.34)}
body.dark .ostat--confirmed{background:rgba(199,125,107,.18);color:#D99A82;border-color:rgba(199,125,107,.36)}
.ostat--pending{background:rgba(184,154,119,.16);color:#7D654B;border-color:rgba(184,154,119,.30)}
body.dark .ostat--pending{background:rgba(184,154,119,.18);color:#CDB79A;border-color:rgba(184,154,119,.34)}
.ostat--rejected{background:rgba(126,104,92,.14);color:#715A4E;border-color:rgba(126,104,92,.28)}
body.dark .ostat--rejected{background:rgba(126,104,92,.20);color:#C6AA9C;border-color:rgba(126,104,92,.36)}
.ostat--completed{background:rgba(127,143,108,.16);color:#647252;border-color:rgba(127,143,108,.32)}
body.dark .ostat--completed{background:rgba(127,143,108,.20);color:#B7C6A3;border-color:rgba(127,143,108,.38)}

.orderAdminActions{display:flex;flex-direction:column;gap:6px;margin-top:2px;align-items:flex-end}
.orderCompleteBtn{border:1px solid rgba(127,143,108,.32);border-radius:12px;padding:7px 10px;background:rgba(127,143,108,.13);color:#647252;font-family:inherit;font-weight:750;font-size:12px;cursor:pointer;white-space:nowrap}
body.dark .orderCompleteBtn{background:rgba(127,143,108,.18);border-color:rgba(127,143,108,.38);color:#B7C6A3}
.orderCard--pend .orderSide{min-width:88px}


.orderFilters{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;margin:18px 14px 0;padding:4px 2px 6px}
.orderFilters::-webkit-scrollbar{display:none}
.orderFilter{flex:none;display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-family:inherit;font-size:12.5px;font-weight:700;letter-spacing:.01em;cursor:pointer;box-shadow:inset 0 1px 0 var(--hi);transition:background .22s ease,color .22s ease,border-color .22s ease,transform .14s ease}
.orderFilter:active{transform:scale(.97)}
.orderFilter.on{background:rgba(199,125,107,.15);border-color:rgba(199,125,107,.30);color:var(--accent)}
body.dark .orderFilter.on{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.34);color:#D99A82}
.orderFilter em{font-style:normal;min-width:19px;height:19px;padding:0 6px;border-radius:999px;background:rgba(126,104,92,.10);color:var(--soft);display:inline-grid;place-items:center;font-size:11px;font-weight:760}
.orderFilter.on em{background:rgba(199,125,107,.18);color:var(--accent)}
body.dark .orderFilter em{background:rgba(255,255,255,.06)}
body.dark .orderFilter.on em{background:rgba(199,125,107,.20);color:#D99A82}
.ordersFilterEmpty{margin:28px 22px 0;color:var(--soft);font-size:14px;line-height:1.45;text-align:center}
.orderArchivedHint{font-size:11px;font-weight:720;color:var(--soft);opacity:.72}

.ordersEmpty{min-height:calc(100vh - 360px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 28px 42px;gap:16px}
.ordersEmptyIcon{width:60px;height:60px;border-radius:50%;background:rgba(199,125,107,.08);border:1px solid rgba(199,125,107,.20);display:grid;place-items:center;color:var(--accent);opacity:.76}
.ordersEmptyIcon svg{width:27px;height:27px;stroke:var(--accent)}
.ordersEmptyText{font-size:15px;font-weight:430;color:var(--soft);line-height:1.5;margin:0;max-width:280px}
.ordersExploreCta{margin-top:2px;padding:12px 28px;border-radius:15px;border:1px solid rgba(199,125,107,.28);background:rgba(199,125,107,.13);color:var(--accent);font-family:inherit;font-weight:750;font-size:14px;cursor:pointer;transition:background .25s,transform .15s,box-shadow .25s,border-color .25s}
.ordersExploreCta:hover{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.36)}
.ordersExploreCta:active{transform:scale(.985)}
.ordersExploreCta:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .ordersExploreCta{background:rgba(199,125,107,.18);border-color:rgba(199,125,107,.34);color:#d9957d}
body.dark .ordersExploreCta:hover{background:rgba(199,125,107,.24)}

.ordersBottomSpacer{height:calc(80px + env(safe-area-inset-bottom, 0px))}
.orderCard.in{animation:itemIn .45s cubic-bezier(.22,1,.36,1) both}

@media(max-width:390px){
  .orderCard{gap:12px;padding:15px 13px;min-height:96px}
  .orderThumb{width:58px;height:58px;border-radius:16px}
  .orderSide{min-width:68px;gap:8px}
  .ostat{font-size:10px;padding:4px 8px}
}
@media(prefers-reduced-motion:reduce){
  .orderCard{transition:none!important;animation:none!important}
  .ordersExploreCta{transition:none!important}
}


/* ===================== DETTAGLIO ORDINE — vista interna, no sheet ===================== */
.orderDetailPage{padding-bottom:calc(88px + env(safe-area-inset-bottom, 0px))}
.orderDetailHero{margin:0 0 16px}
.orderDetailTitle{margin:0;color:var(--text);font-size:28px;font-weight:760;letter-spacing:-.62px;line-height:1.05}
.orderDetailSubtitle{display:none}
.orderDetailCard{margin:0 14px;border-radius:30px;padding:18px;border:1px solid var(--strokeSoft);box-shadow:0 12px 34px rgba(72,50,32,.11),inset 0 1px 0 var(--hi)}
body.dark .orderDetailCard{box-shadow:0 14px 38px rgba(0,0,0,.25),inset 0 1px 0 var(--hi)}
.orderDetailHead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--strokeSoft)}
.orderDetailIdentity{display:flex;align-items:center;gap:12px;min-width:0}
.orderDetailIdentityText{min-width:0}
.orderDetailName{font-family:'Inter',system-ui,sans-serif;font-weight:760;font-size:20px;letter-spacing:-.35px;line-height:1.08;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.orderDetailDate{margin-top:5px;font-size:13.5px;line-height:1.35;color:var(--soft);font-weight:430}
.orderDetailStatus{justify-self:end;align-self:center;display:flex;align-items:center;min-height:48px}
.orderDetailStatus .ostat{padding:7px 11px;font-size:10.5px}
.orderDetailCard .invav{width:50px;height:50px}
.orderDetailCard .invitems{margin-top:0}
.orderDetailItem{padding:6px 0 18px;margin-bottom:4px;border-bottom:1px solid var(--strokeSoft)}
.orderDetailItem:last-child{margin-bottom:0}
.orderDetailItemTop{display:grid;grid-template-columns:94px minmax(0,1fr);gap:14px;align-items:start;margin-bottom:0}
.orderDetailThumb{width:94px;height:94px;border-radius:22px;object-fit:cover;border:1px solid var(--strokeSoft);box-shadow:0 8px 22px rgba(72,50,32,.14),inset 0 1px 0 rgba(255,255,255,.22);background:var(--glass2)}
body.dark .orderDetailThumb{box-shadow:0 10px 26px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.08)}
.orderDetailProduct{min-width:0}
.orderDetailProductLine{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.orderDetailProductName{font-size:22px;font-weight:780;letter-spacing:-.35px;line-height:1.12;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:normal;max-width:100%}
.orderDetailQty{flex:none;font-size:13.5px;font-weight:650;color:var(--soft)}
.orderDetailProductMeta{margin-top:8px;display:flex;flex-direction:column;gap:3px;font-size:13.5px;line-height:1.35;color:var(--soft);font-weight:430}
.orderDetailProductMeta strong{color:var(--text);font-weight:650}
.orderDetailOptions{margin-top:12px;display:flex;flex-direction:column;gap:7px;color:var(--soft);font-size:13.2px;line-height:1.35}
.orderOptionRow{display:grid;grid-template-columns:22px minmax(0,1fr);align-items:center;gap:8px;min-height:22px}
.orderOptionIcon{width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:var(--accent);background:rgba(199,125,107,.10);border:1px solid rgba(199,125,107,.16)}
.orderOptionIcon svg{width:14px;height:14px;stroke:currentColor}
.orderOptionDot{width:5px;height:5px;border-radius:999px;background:currentColor;display:block;opacity:.8}
.orderDetailItemPrice{display:block;margin-top:14px;padding:0;border:0;background:transparent;color:var(--text);font-size:17px;font-weight:760;letter-spacing:-.2px;box-shadow:none}
body.dark .orderOptionIcon{background:rgba(199,125,107,.13);border-color:rgba(199,125,107,.24);color:#D99A82}
body.dark .orderDetailItemPrice{background:transparent;border-color:transparent;box-shadow:none}
.orderDetailConfig{display:none}
.orderDetailCard .ibd{display:none}
.orderDetailCard .ibd span:first-child{color:var(--soft)}
.orderDetailCard .isub{display:none}
.orderDetailCard .invtotrow{margin-top:16px;padding-top:16px;border-top:1px solid var(--strokeSoft)}
.orderDetailCard .invtot{font-size:31px;letter-spacing:-.62px}

.orderDanger{margin:14px 14px 0}
.orderDangerBtn{width:100%;border:1px solid rgba(126,104,92,.22);background:rgba(126,104,92,.08);color:var(--soft);border-radius:18px;padding:13px 16px;font-family:inherit;font-size:13px;font-weight:720;cursor:pointer;transition:background .22s ease,transform .14s ease,color .22s ease,border-color .22s ease}
.orderDangerBtn:active{transform:scale(.985)}
.orderDangerBtn:hover{background:rgba(126,104,92,.12);border-color:rgba(126,104,92,.30);color:var(--text)}
.orderDangerConfirm{border:1px solid rgba(126,104,92,.26);background:var(--glass2);border-radius:22px;padding:15px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:inset 0 1px 0 var(--hi)}
.orderDangerConfirm b{display:block;font-size:13.5px;color:var(--text);letter-spacing:-.1px;margin-bottom:3px}
.orderDangerConfirm span{display:block;font-size:12.5px;color:var(--soft);line-height:1.35}
.orderDangerActions{display:flex;gap:8px;align-items:center;flex:none}
.orderDangerCancel,.orderDangerDelete{border-radius:14px;padding:10px 12px;font-family:inherit;font-weight:760;font-size:12.5px;cursor:pointer;transition:transform .14s ease,background .22s ease}
.orderDangerCancel{border:1px solid var(--strokeSoft);background:var(--glass);color:var(--soft)}
.orderDangerDelete{border:1px solid rgba(99,68,51,.32);background:rgba(99,68,51,.13);color:#634433}
.orderDangerCancel:active,.orderDangerDelete:active{transform:scale(.96)}
body.dark .orderDangerDelete{background:rgba(192,153,127,.14);border-color:rgba(192,153,127,.30);color:#D8B89F}
@media(max-width:390px){.orderDangerConfirm{align-items:stretch;flex-direction:column}.orderDangerActions{justify-content:flex-end}}

.orderDetailNote{margin:14px 14px 0;padding:14px 16px;border-radius:22px;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--soft);font-size:13.5px;line-height:1.45}
@media(max-width:390px){
  .orderDetailCard{margin:0 10px;padding:15px;border-radius:27px}
  .orderDetailHead{gap:10px}
  .orderDetailName{font-size:18px}
  .orderDetailItemTop{grid-template-columns:82px minmax(0,1fr);gap:12px}
  .orderDetailThumb{width:82px;height:82px;border-radius:19px}
  .orderDetailProductName{font-size:20px}
  .orderDetailCard .invtot{font-size:27px}
}
@media(prefers-reduced-motion:reduce){.orderDetailPage{animation:none!important}}

/* ===================== HOME — premium editorial ===================== */

/* Headline hero: leggermente alleggerita (800→700, 40px→37px) */
.hero{font-size:37px;font-weight:700;line-height:1.07}

/* Label A COLPO D'OCCHIO sotto headline */
.homekick{margin:10px 0 14px}

/* Respiro tra hero image e sezione Lasciati ispirare */
.herocard{margin-bottom:26px}

/* Titolo sezione "Lasciati ispirare": meno dominante */
.home-sec-title{font-size:22px;font-weight:700;letter-spacing:-.3px;margin-top:4px;margin-bottom:14px}

/* Herotag — targhetta materica, meno glass */
.herotag{
  background:rgba(246,239,228,.90);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  border:1px solid rgba(199,125,107,.16);
  box-shadow:0 4px 18px rgba(70,45,25,.10);
}
body.dark .herotag{
  background:rgba(43,33,27,.92);
  border-color:rgba(199,125,107,.20);
  box-shadow:0 4px 18px rgba(0,0,0,.32);
}
.herotag .ht{font-size:14px;font-weight:700;letter-spacing:-.1px}
.herotag .hp{font-size:12.5px;font-weight:500;color:var(--soft)}

/* Hero image: crop più intenzionale */
.herocard img{object-position:center 35%}

/* ===================== TOPBAR — più calda, meno glass ===================== */

/* Override del topbar::after per luce e buio */
.topbar::after{
  background:linear-gradient(to bottom, rgba(244,236,222,.94) 0%, rgba(244,236,222,.68) 44%, transparent 100%);
  -webkit-backdrop-filter:blur(5px) saturate(130%);backdrop-filter:blur(5px) saturate(130%);
}
body.dark .topbar::after{
  background:linear-gradient(to bottom, rgba(43,33,27,.94) 0%, rgba(43,33,27,.68) 44%, transparent 100%);
}

/* ===================== CARD — scaffold stabile + raffinamenti ===================== */

/* cbody: flex:1 per riempire l'altezza disponibile della card */
.cbody{flex:1}

/* Titolo: spazio riservato a 2 righe, line-clamp */
.cbody .ct{
  min-height:calc(1.18em * 2);
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

/* Prezzo: meno dominante */
.cbody .cp{
  font-size:15px;
  font-weight:600;
  margin-top:auto;
  opacity:.9;
}

/* CTA → prezzo spinge tutto in basso, cta segue subito */
.configbtn,.liked-configbtn{margin-top:0}

/* Categoria: più raffinata */
.cbody .cardcat{
  font-size:9.5px;
  letter-spacing:.12em;
  opacity:.7;
}

/* Materiale: più morbido */
.cbody .mat{opacity:.72}

/* Cuore: più discreto */
.lk{
  background:rgba(246,239,228,.78);
  border-color:rgba(199,125,107,.18);
}
body.dark .lk{
  background:rgba(55,42,36,.82);
  border-color:rgba(199,125,107,.22);
}

/* Card dark mode: bordo caldo per separazione dal fondo */
body.dark .card{box-shadow:0 1px 3px rgba(0,0,0,.32),0 14px 34px rgba(0,0,0,.44),inset 0 0 0 1px rgba(199,125,107,.10)}

/* Card light mode: ombre più diffuse */
.card{box-shadow:0 1px 3px rgba(70,45,30,.04),0 8px 22px var(--shcol),0 20px 44px rgba(90,55,35,.04)}

/* ===================== SCREEN TRANSITION — translateY leggero ===================== */
@keyframes scrIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ===================== GLOBAL WRAP PADDING ===================== */
/* .wrap ha già 132px → sufficiente per la dock. Qui solo sicurezza mobile. */
.wrap{padding-bottom:max(132px, calc(80px + env(safe-area-inset-bottom, 24px)))}

/* Reduced motion — nuove animazioni */
@media(prefers-reduced-motion:reduce){
  @keyframes scrIn{from{opacity:1;transform:none}to{opacity:1;transform:none}}
  .cbody .cp,.cbody .ct,.lk,.herotag,.topbar::after{transition:none!important}
}

/* ===================== SHEET — scroll lock e safe-area ===================== */
html.sheet-open,body.sheet-open{overflow:hidden!important;overscroll-behavior:none!important}
/* .ipick: inset:0 copre tutto il viewport (inclusa la dock, z-index:85 > 72).
   overflow:hidden clipa il contenuto animato durante slide e drag-to-close. */
.ipick{overflow:hidden;bottom:-96px;padding-bottom:96px;box-sizing:border-box}
/* L'overlay viene esteso sotto il viewport e compensato con padding: copre la safe-area iOS senza spostare il foglio. */
/* scroll interno dello sheet */
.ipick .sheet{touch-action:pan-y}

/* ===================== FLOATING SHEET — pannello premium ==================
   Il padding sul wrapper crea il gap intenzionale tra sheet e bordo display.
   La dock resta ferma sotto lo scrim: non viene nascosta né spostata.
   Border-radius completo. Nessun pseudo-elemento, nessun cerotto. */

/* Wrapper bottom: gap visivo intenzionale dal bordo inferiore del display */
.ipick:not(.top) .sheetwrap{
  padding:0 10px calc(12px + env(safe-area-inset-bottom));
  box-sizing:border-box;
}
/* Wrapper top (notifiche): gap visivo intenzionale dal bordo superiore */
.ipick.top .sheetwrap{
  padding:calc(12px + env(safe-area-inset-top)) 10px 0;
  box-sizing:border-box;
}
/* Detailsheet: border-radius completo, max-height allineato al dvh */
.sheet.detailsheet{
  border-radius:28px;
  max-height:calc(100dvh - 20px - env(safe-area-inset-top));
}
/* Dark mode: ombra più profonda su sfondo scuro */
body.dark .ipick .sheet{
  box-shadow:0 8px 40px rgba(0,0,0,.50),0 2px 8px rgba(0,0,0,.30);
}

/* Backdrop caldo (espresso warm invece di nero freddo) */
@keyframes scrimIn{from{background:rgba(43,33,27,0)}to{background:var(--sheet-scrim)}}
@keyframes scrimOut{from{background:var(--sheet-scrim)}to{background:rgba(43,33,27,0)}}
.ipick.on{background:var(--sheet-scrim)}
.ipick.on.closing{background:rgba(43,33,27,0)}

/* Sheet base: più materica, meno glass */
.ipick .sheet{
  background:rgba(246,239,228,.96);
  -webkit-backdrop-filter:blur(10px) saturate(140%);backdrop-filter:blur(10px) saturate(140%);
  border-color:rgba(199,125,107,.14);
}
body.dark .ipick .sheet{
  background:rgba(38,29,24,.97);
  border-color:rgba(199,125,107,.18);
}

/* Detailsheet: già usa --detailGlass, riduco blur eccessivo */
.sheet.detailsheet{
  -webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);
}

/* Sheetclose: più discreto e caldo */
.sheetclose{
  width:38px;height:38px;
  border-color:rgba(199,125,107,.20);
  background:rgba(246,239,228,.80);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 3px 10px rgba(43,33,27,.12);
}
body.dark .sheetclose{
  background:rgba(55,42,34,.90);
  border-color:rgba(199,125,107,.24);
}
.sheetclose:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}

/* gdot: più raffinato, indicatore attivo terracotta soft */
.gdot{width:5px;height:5px;background:rgba(199,125,107,.25);border:0;padding:0;appearance:none;-webkit-appearance:none;border-radius:50%;transition:background .2s,width .2s,border-radius .2s;cursor:pointer}
.gdot--on{background:rgba(199,125,107,.70);width:14px;border-radius:3px}
.gdot:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px rgba(199,125,107,.65)}

/* dkick: categoria leggermente alleggerita */
.dkick{font-weight:700;letter-spacing:.12em;color:rgba(166,84,53,.85)}



/* ===================== HOME ONLY — ingresso più lento e più ampio ===================== */
@keyframes homeViewIn {
  from {
    opacity: 0;
    transform: translateY(13px) scale(.998);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.homeview,
.screen.homeview,
.homeScreen,
.screen.homeScreen{
  animation: homeViewIn .68s cubic-bezier(.19,.85,.25,1) both!important;
}

.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeview .sectionTitle,
.homeview .grid,
.homeview .card,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy,
.homeScreen .sectionTitle,
.homeScreen .grid,
.homeScreen .card{
  animation-duration:.74s!important;
  animation-timing-function:cubic-bezier(.19,.85,.25,1)!important;
}


.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeview .sectionTitle,
.homeview .grid,
.homeview .card,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy,
.homeScreen .sectionTitle,
.homeScreen .grid,
.homeScreen .card{
  animation-delay:.07s!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview,
  .screen.homeview,
  .homeScreen,
  .screen.homeScreen,
  .homeview .hero,
  .homeview .heroCard,
  .homeview .heroCopy,
  .homeview .sectionTitle,
  .homeview .grid,
  .homeview .card,
  .homeScreen .hero,
  .homeScreen .heroCard,
  .homeScreen .heroCopy,
  .homeScreen .sectionTitle,
  .homeScreen .grid,
  .homeScreen .card{
    animation:none!important;
    transition:none!important;
  }
}



/* ===================== HOME HERO ONLY — comparsa più lenta ===================== */
.homeview .hero,
.homeview .heroCard,
.homeview .heroCopy,
.homeScreen .hero,
.homeScreen .heroCard,
.homeScreen .heroCopy{
  animation-duration:.92s!important;
  animation-delay:.12s!important;
  animation-timing-function:cubic-bezier(.19,.85,.25,1)!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .hero,
  .homeview .heroCard,
  .homeview .heroCopy,
  .homeScreen .hero,
  .homeScreen .heroCard,
  .homeScreen .heroCopy{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== STRATO MOTION TUNING — soft premium ingressi ===================== */
:root{
  --strato-ease-soft:cubic-bezier(.19,.85,.25,1);
  --strato-view-dur:.46s;
  --strato-item-dur:.54s;
}

.appview{
  animation-duration:var(--strato-view-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.viewStage,
.productview,
.cartview,
.ordersview,
.updatesview,
.adminProductView{
  animation-duration:var(--strato-view-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.productview .dphoto,
.productview .dinfo,
.productview .dopts,
.productview .buybox,
.cartview .cartPageTitle,
.cartview .crow,
.cartview .ctotal,
.ordersview .title,
.ordersview .filters,
.ordersview .orderTile,
.ordersview .ordercard,
.updatesview .notifhead,
.updatesview .notifrow,
.adminProductView .adminProductCard,
.adminProductView .field,
.adminProductView .qsend{
  animation-duration:var(--strato-item-dur)!important;
  animation-timing-function:var(--strato-ease-soft)!important;
}

.productview .dinfo,
.cartview .crow,
.ordersview .orderTile,
.ordersview .ordercard,
.updatesview .notifrow,
.adminProductView .field{
  animation-delay:.04s;
}

.productview .dopts,
.cartview .ctotal,
.adminProductView .qsend{
  animation-delay:.08s;
}

.productview .buybox{
  animation-delay:.11s;
}

@media (prefers-reduced-motion: reduce){
  .appview,
  .viewStage,
  .productview,
  .cartview,
  .ordersview,
  .updatesview,
  .adminProductView,
  .productview .dphoto,
  .productview .dinfo,
  .productview .dopts,
  .productview .buybox,
  .cartview .cartPageTitle,
  .cartview .crow,
  .cartview .ctotal,
  .ordersview .title,
  .ordersview .filters,
  .ordersview .orderTile,
  .ordersview .ordercard,
  .updatesview .notifhead,
  .updatesview .notifrow,
  .adminProductView .adminProductCard,
  .adminProductView .field,
  .adminProductView .qsend{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== VISTE INTERNE — no sheet per prodotto, carrello, aggiornamenti ===================== */
.appview{padding:0 18px 12px;animation:scrIn .3s cubic-bezier(.22,1,.36,1) both}
.viewhead{display:flex;align-items:flex-start;gap:13px;margin:4px 0 16px}
.viewback{width:42px;height:42px;border-radius:50%;border:1px solid var(--strokeSoft);background:var(--glass2);color:var(--text);display:grid;place-items:center;box-shadow:inset 0 1px 0 var(--hi),0 5px 16px var(--shcol);cursor:pointer;flex:none}
.viewback svg{width:21px;height:21px}
.viewback:active{transform:scale(.985)}
.viewback:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
.vieweyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin:0 0 3px}
.viewtitle{margin:0;font-family:'Inter',system-ui,sans-serif;font-size:25px;line-height:1.08;letter-spacing:-.03em;color:var(--text)}
.viewsub{margin:5px 0 0;color:var(--soft);font-size:13.5px;line-height:1.45}
.productview .viewhead{margin-bottom:14px}
.detailview-card{border-radius:30px;border:1px solid var(--detailBorder);background:var(--detailGlass);box-shadow:inset 0 1px 0 var(--hi),0 12px 34px rgba(74,45,28,.12);padding:14px;overflow:hidden}
body.dark .detailview-card{box-shadow:inset 0 1px 0 var(--hi),0 18px 46px rgba(0,0,0,.38)}
.detailview-card .dgrid{margin-top:0}
.cartview-card,.updatesview-card{border-radius:28px;border:1px solid var(--strokeSoft);background:var(--glassDock);box-shadow:var(--elev2);padding:14px 14px 16px;overflow:hidden}
.cartview .cartitems,.updatesview .cartitems{margin-top:4px}
.cartview .cempty,.updatesview .cempty{padding:38px 8px 28px}
.cartview .qsend{width:100%;margin:12px 0 0}
.cartview .cttot{margin:16px 2px 8px}
.cartempty-action{width:100%;margin:4px 0 0;border:1px solid rgba(199,125,107,.22);background:rgba(199,125,107,.08);color:var(--text);font-family:inherit;font-weight:650;padding:13px;border-radius:16px;cursor:pointer}
.updatesview .notifclear{margin-left:auto}
.updatesview .notifrow{background:rgba(246,239,228,.54)}
body.dark .updatesview .notifrow{background:rgba(55,42,34,.62)}
@media(min-width:720px){.appview{padding-left:22px;padding-right:22px}.detailview-card,.cartview-card,.updatesview-card{padding:18px}}


/* Titolo prodotto: più raffinato */
.dttl{font-size:26px;letter-spacing:-.025em;line-height:1.08}

/* Prezzo: meno dominante */
.dprice{font-size:24px;font-weight:700}

/* Pill materiale: più morbida */
.dmat{
  background:rgba(199,125,107,.08);
  border-color:rgba(199,125,107,.18);
  color:var(--soft);
  font-weight:500;
  font-size:12px;
}

/* Label sezione: più elegante */
.dlabel{font-weight:600;letter-spacing:.05em}

/* CTA Aggiungi: materica, warm */
.dadd2{
  background:var(--card);
  border-color:rgba(199,125,107,.22);
  box-shadow:inset 0 1px 0 var(--hi),0 6px 18px var(--shcol);
  -webkit-backdrop-filter:none;backdrop-filter:none;
  font-size:14.5px;letter-spacing:.01em;
  gap:10px;
}
.dadd2:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}
body.dark .dadd2{
  background:rgba(55,42,34,.92);
  border-color:rgba(199,125,107,.26);
  color:rgba(246,236,220,.95);
}

/* seg: più caldo in light/dark */
.seg{
  background:rgba(246,239,228,.72);
  border-color:rgba(199,125,107,.14);
  -webkit-backdrop-filter:none;backdrop-filter:none;
}
body.dark .seg{background:rgba(38,29,24,.80);border-color:rgba(199,125,107,.18)}
.seg button{font-size:13px;padding:9px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.seg button.on{
  background:rgba(199,125,107,.12);
  color:var(--accent2);
  box-shadow:inset 0 0 0 1px rgba(199,125,107,.28),0 2px 8px rgba(199,125,107,.10);
}
body.dark .seg button.on{color:var(--accent);background:rgba(199,125,107,.16)}
.seg button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}
/* Struttura interna opzione: nome su riga, prezzo/meta su riga sotto */
.segopt{display:block;line-height:1.2;font-weight:600}
.seg button i{font-style:normal;font-weight:500;font-size:11px;opacity:.6;white-space:nowrap;display:block;line-height:1.2}
.seg button.on i{opacity:.85;color:inherit}

/* Sezione configurazione luce */
.eleccard{
  margin:18px 0 0;
  padding:14px 14px 12px;
  border-radius:18px;
  background:rgba(217,194,163,.12);
  border:1px solid rgba(199,125,107,.14);
  display:flex;flex-direction:column;gap:12px;
}
body.dark .eleccard{background:rgba(90,64,48,.12);border-color:rgba(199,125,107,.18)}
.eleccard-head{display:flex;flex-direction:column;gap:3px}
.eleccard-title{font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--soft)}
.eleccard-sub{font-size:12px;color:var(--soft);opacity:.7}
.elecrow{display:flex;flex-direction:column;gap:6px}
.eleclbl{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--soft)}
.eleclbl svg{opacity:.7;width:17px;height:17px}

/* qstep: controlli quantità più caldi */
.qstep button{
  background:var(--card);
  border-color:rgba(199,125,107,.18);
  box-shadow:inset 0 1px 0 var(--hi);
}
.qstep button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 3px var(--accent)}

/* Reduced motion per drag */
@media(prefers-reduced-motion:reduce){
  .sheetwrap{transition:none!important;transform:none!important}
  .gdot,.dmat,.seg button,.dadd2,.sheetclose{transition:none!important}
}



/* ===================== STRATO VIEWS V2B — transizioni premium senza cambiare canvas =====================
   Nota: niente override di html/body/#root/#appbg.
   Manteniamo il background della versione stabile fullscreen: il rettangolo basso nasceva dal tentativo V2 di ricalcolare il canvas globale. */
.screen.on,
.appview{
  animation:viewIn .36s cubic-bezier(.22,.8,.26,1) both!important;
  transform-origin:50% 16%;
}
@keyframes viewIn{
  from{opacity:0;transform:translateY(10px) scale(.997);filter:blur(2px)}
  70%{filter:blur(0)}
  to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}
.viewhead{
  margin:6px 0 22px;
  animation:viewHeadIn .42s cubic-bezier(.22,.8,.26,1) .04s both;
}
@keyframes viewHeadIn{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
}
.vieweyebrow{letter-spacing:.16em;color:rgba(166,84,53,.78)}
body.dark .vieweyebrow{color:rgba(230,160,121,.78)}
.viewtitle{font-size:clamp(27px,7vw,36px);letter-spacing:-.045em;font-weight:760}
.viewsub{max-width:440px;margin-top:8px;font-size:14px;line-height:1.55;color:var(--soft)}
.viewback{
  width:44px;height:44px;
  background:rgba(246,239,228,.62);
  -webkit-backdrop-filter:blur(18px) saturate(130%);
  backdrop-filter:blur(18px) saturate(130%);
}
body.dark .viewback{background:rgba(47,37,31,.68)}

.productview{padding-top:2px;padding-bottom:24px}
.productview .viewhead{margin-bottom:18px}
.detailview-card{
  border-radius:34px;
  padding:18px;
  background:linear-gradient(180deg,rgba(250,244,236,.68),rgba(238,226,212,.44));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.52),0 16px 42px rgba(74,45,28,.10);
}
body.dark .detailview-card{
  background:linear-gradient(180deg,rgba(52,40,33,.68),rgba(31,24,20,.52));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.10),0 20px 52px rgba(0,0,0,.34);
}
.detailview-card .dgrid{gap:20px}
.productview .dphoto{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .08s both}
.productview .dopts{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .14s both}
.productview .dbuy{animation:viewObjectIn .46s cubic-bezier(.22,.8,.26,1) .20s both}
@keyframes viewObjectIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.productview .dimg{border-radius:28px;box-shadow:0 18px 48px rgba(74,45,28,.14)}
body.dark .productview .dimg{box-shadow:0 22px 56px rgba(0,0,0,.42)}
.productview .dttl{font-size:clamp(28px,8vw,38px);letter-spacing:-.045em;line-height:1.02;margin-top:6px}
.productview .dprice{font-size:clamp(23px,6vw,28px);font-weight:720}
.productview .ddesc{font-size:14.5px;line-height:1.68;color:var(--soft)}
.productview .dlabel{margin-top:22px}
.productview .dbuy{align-items:stretch;border-top:1px solid rgba(199,125,107,.12);padding-top:18px;margin-top:2px}
.productview .dbuy .dlabel.dctr{text-align:center;margin-left:0;width:100%}
.productview .dbuy .dqty{justify-content:center}
.productview .dbuy .dadd2{
  max-width:none;
  border-radius:18px;
  padding:15px 16px;
  background:linear-gradient(135deg,rgba(199,125,107,.76),rgba(166,84,53,.82));
  -webkit-backdrop-filter:blur(18px) saturate(155%);
  backdrop-filter:blur(18px) saturate(155%);
  border-color:rgba(255,238,218,.28);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.34),0 14px 32px rgba(166,84,53,.22);
}
body.dark .productview .dbuy .dadd2{
  background:linear-gradient(135deg,rgba(199,125,107,.68),rgba(166,84,53,.74));
  border-color:rgba(255,238,218,.18);
  color:#fff;
  box-shadow:inset 0 1px 0 rgba(255,240,220,.14),0 16px 34px rgba(0,0,0,.30);
}
.productview .dbuy .dadd2 svg{stroke:#fff;filter:none}

/* ---- product detail: no secondary hero header; topbar owns navigation ---- */
.productview--clean{padding-top:10px}
.productview--clean .detailview-card{margin-top:0}

.cartview-card,
.updatesview-card{
  border-radius:32px;
  padding:18px;
  background:linear-gradient(180deg,rgba(250,244,236,.70),rgba(239,229,217,.52));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 16px 42px rgba(74,45,28,.10);
  animation:viewObjectIn .44s cubic-bezier(.22,.8,.26,1) .10s both;
}
body.dark .cartview-card,
body.dark .updatesview-card{
  background:linear-gradient(180deg,rgba(52,40,33,.70),rgba(31,24,20,.58));
  box-shadow:inset 0 1px 0 rgba(255,240,220,.10),0 22px 52px rgba(0,0,0,.34);
}
.cartview .crow,
.updatesview .notifrow{
  border-radius:20px;
  background:rgba(252,247,240,.50);
  transition:transform .24s cubic-bezier(.22,.8,.26,1),background .24s ease,border-color .24s ease;
}
body.dark .cartview .crow,
body.dark .updatesview .notifrow{background:rgba(62,47,38,.46)}
.cartview .crow:active,
.updatesview .notifrow:active{transform:scale(.992)}
/* Carrello: header sullo stesso asse di Esplora, Piaciuti e Ordini.
   Tile più editoriale: miniatura centrata, quantità e prezzo sulla stessa linea. */
.cartview .title.cartPageTitle{margin:10px -14px 4px}
.cartPageSub{margin:0 -14px 16px;color:var(--soft);font-size:13.5px;line-height:1.45}
.cartview .cartitems{display:grid;gap:14px}
.cartview .crow.cartrow{
  display:grid;
  grid-template-columns:76px minmax(0,1fr);
  grid-template-rows:auto auto auto;
  align-items:center;
  column-gap:15px;
  row-gap:9px;
  padding:17px;
  margin-bottom:0;
  border-radius:25px;
  min-height:132px;
}
.cartview .crow.cartrow img.cartThumb{
  grid-column:1;
  grid-row:1 / 3;
  justify-self:center;
  align-self:center;
  width:76px;
  height:76px;
  border-radius:19px;
  box-shadow:0 8px 20px rgba(74,45,28,.10);
}
.cartMain{display:contents;min-width:0}
.cartTopLine{grid-column:2;grid-row:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
.cartTextBlock{min-width:0;flex:1;padding-top:1px}
.cartview .cartName{font-size:15.5px;line-height:1.18;letter-spacing:-.01em;padding-right:2px}
.cartColor{margin-top:4px;font-size:12.5px;line-height:1.35;color:var(--soft);font-weight:400}
.cartColor span{font-weight:400;color:var(--soft)}
.cartOptions{grid-column:2;grid-row:2;display:grid;gap:5px;margin-top:1px;min-width:0}
.cartBottomLine{grid-column:1 / -1;grid-row:3;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;padding-top:2px}
.cartQty{flex:none;margin-top:0;align-self:center;justify-self:start}
.cartview .cartQty button{width:28px;height:28px;border-radius:10px;font-size:16px;background:rgba(246,239,228,.58);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
body.dark .cartview .cartQty button{background:rgba(55,42,34,.58)}
.cartview .cartQty span{min-width:16px;font-size:13px;font-weight:700}
.cartOptionRow{display:flex;align-items:center;gap:7px;color:var(--soft);font-size:12.5px;line-height:1.35}
.cartOptionIcon{width:18px;height:18px;border-radius:9px;display:grid;place-items:center;flex:none;color:rgba(166,84,53,.88);background:rgba(199,125,107,.08);border:1px solid rgba(199,125,107,.12)}
.cartOptionIcon svg{width:13px;height:13px;stroke:currentColor}
.cartOptionDot{width:5px;height:5px;border-radius:50%;background:currentColor;display:block;opacity:.72}
.cartItemPrice{margin-left:auto;color:var(--text);font-size:15.4px;font-weight:540;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
body.dark .cartOptionIcon{color:rgba(224,157,126,.92);background:rgba(199,125,107,.12);border-color:rgba(199,125,107,.16)}
.cartnote{margin:8px 2px 0;color:var(--soft);font-size:13px;line-height:1.45;text-align:center}
.updatesview .cempty{line-height:1.55;color:var(--soft)}
.updatesview .notifhead{margin-bottom:14px}

@media(min-width:560px){
  .productview .dgrid{gap:22px;align-items:start}
  .productview .dbuy{border-top:0;padding-top:0;margin-top:10px}
}
@media(prefers-reduced-motion:reduce){
  .screen.on,.appview,.viewhead,.productview .dphoto,.productview .dopts,.productview .dbuy,.cartview-card,.updatesview-card{animation:none!important;opacity:1!important;transform:none!important;filter:none!important}
  .wrap,.cartview .crow,.updatesview .notifrow{transition:none!important}
}

/* ---- tuning trasparenze principali: +5/6% soft ----
   Alleggerisce solo dock, back topbar e campanella notifiche.
   Non modifica card, sheet, sfondo, fullscreen o altri elementi glass. */
.dock{
  background:rgba(247,243,238,.76);
  -webkit-backdrop-filter:blur(22px) saturate(185%);
  backdrop-filter:blur(22px) saturate(185%);
}
.tb-back,
.tb-btn.bell{
  background:rgba(247,243,238,.77);
  -webkit-backdrop-filter:blur(16px) saturate(160%);
  backdrop-filter:blur(16px) saturate(160%);
}
body.dark .dock{
  background:rgba(45,36,32,.72);
  -webkit-backdrop-filter:blur(22px) saturate(178%);
  backdrop-filter:blur(22px) saturate(178%);
}
body.dark .tb-back,
body.dark .tb-btn.bell{
  background:rgba(45,36,32,.73);
  -webkit-backdrop-filter:blur(16px) saturate(152%);
  backdrop-filter:blur(16px) saturate(152%);
}


/* ===================== HOME HERO ONLY — editorial reveal =====================
   Cambia il gesto della hero: non scivola, si rivela.
   Solo Home, nessuna altra schermata. */
@keyframes homeHeadlineEditorial {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes homeHeroCardEditorial {
  from {
    opacity: .52;
    transform: scale(1.012);
  }
  58% {
    opacity: .92;
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes homeHeroTagEditorial {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.homeview .hero,
.homeScreen .hero{
  animation: homeHeadlineEditorial .82s cubic-bezier(.19,.85,.25,1) .10s both!important;
}

.homeview .herocard,
.homeScreen .herocard{
  animation: homeHeroCardEditorial .92s cubic-bezier(.19,.85,.25,1) .12s both!important;
  transform-origin:center center;
  will-change:opacity, transform;
}

.homeview .herocard .herotag,
.homeScreen .herocard .herotag{
  animation: homeHeroTagEditorial .78s cubic-bezier(.19,.85,.25,1) .28s both!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit,
.homeScreen .herocard .lk,
.homeScreen .herocard .cedit{
  animation: homeHeroTagEditorial .70s cubic-bezier(.19,.85,.25,1) .34s both!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .hero,
  .homeScreen .hero,
  .homeview .herocard,
  .homeScreen .herocard,
  .homeview .herocard .herotag,
  .homeScreen .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeScreen .herocard .lk,
  .homeScreen .herocard .cedit{
    animation:none!important;
    transition:none!important;
  }
}


/* ===================== HOME HERO ONLY — immagine stabile =====================
   Niente zoom e niente fade/opacità sulla card immagine hero.
   Restano solo headline/tag/pulsanti con ingresso morbido. */
.homeview .herocard,
.homeScreen .herocard{
  animation:none!important;
  opacity:1!important;
  transform:none!important;
  will-change:auto!important;
}

.homeview .herocard img,
.homeScreen .herocard img{
  opacity:1!important;
  will-change:auto!important;
}


/* ===================== SCROLL PERFORMANCE — no parallax / no --par =====================
   Mantiene topbar, dock e glass. Rimuove solo movimento legato allo scroll. */
.herocard img{
  transform:scale(1.08)!important;
  transition:none!important;
}

.topscrim{
  opacity:.72!important;
  transition:none!important;
}


/* ===================== HOME ANIMATION — scroll-safe v2 =====================
   Base unica, niente motion layer duplicato.
   La Home non anima più come grande contenitore scrollabile:
   lo scroll resta libero mentre restano micro-ingressi su elementi leggeri. */

.homeview,
.screen.homeview{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
  contain:none!important;
}

/* Struttura e immagine hero sempre stabili: niente zoom, niente fade, niente blur. */
.homeview .herocard{
  opacity:1!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard img{
  opacity:1!important;
  transform:scale(1.08)!important;
  transition:none!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Gli elementi sotto la hero non devono animarsi mentre l'utente può iniziare a scrollare. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

/* Animazione percepita: solo elementi leggeri e sopra la hero. */
@keyframes homeTextScrollSafeIn{
  from{
    opacity:0;
    transform:translate3d(0,10px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

@keyframes homeSmallScrollSafeIn{
  from{
    opacity:0;
    transform:translate3d(0,8px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview > .px .hero{
  animation:homeTextScrollSafeIn .86s cubic-bezier(.19,.85,.25,1) .08s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview > .px .homekick{
  animation:homeSmallScrollSafeIn .74s cubic-bezier(.19,.85,.25,1) .16s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .herotag{
  animation:homeSmallScrollSafeIn .78s cubic-bezier(.19,.85,.25,1) .20s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallScrollSafeIn .70s cubic-bezier(.19,.85,.25,1) .24s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Dopo l'ingresso, non tenere layer inutili vivi. */
.homeview.motionDone .hero,
.homeview.motionDone .homekick,
.homeview.motionDone .herotag,
.homeview.motionDone .lk,
.homeview.motionDone .cedit{
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME ANIMATION — light restore =====================
   Reintroduce movimento senza rianimare container/griglia/card.
   Scroll-safe: hero card solo translate3d, no fade, no scale, no blur. */
@keyframes homeHeroCardLightIn{
  from{transform:translate3d(0,10px,0)}
  to{transform:translate3d(0,0,0)}
}

@keyframes homeSectionTitleLightIn{
  from{
    opacity:0;
    transform:translate3d(0,8px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview .herocard{
  animation:homeHeroCardLightIn .82s cubic-bezier(.19,.85,.25,1) .08s both!important;
  opacity:1!important;
  will-change:transform;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
  transform-origin:center center;
}

.homeview .herocard img{
  opacity:1!important;
  transform:scale(1.08)!important;
  transition:none!important;
  will-change:auto!important;
}

.homeview .home-sec-title{
  animation:homeSectionTitleLightIn .68s cubic-bezier(.19,.85,.25,1) .22s both!important;
  will-change:transform, opacity;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* La griglia e le card restano ferme: niente cascata pesante durante lo scroll iniziale. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

.homeview.motionDone .herocard,
.homeview.motionDone .home-sec-title{
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .herocard,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT MOTION — smoother v2 =====================
   Solo qualità ingresso testi Home. Nessuna animazione nuova su griglia/card. */
@keyframes homeTextSmoothIn{
  0%{
    opacity:.06;
    transform:translateY(8px);
  }
  48%{
    opacity:.82;
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes homeSmallTextSmoothIn{
  0%{
    opacity:.08;
    transform:translateY(7px);
  }
  52%{
    opacity:.84;
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes homeSectionTitleSmoothIn{
  0%{
    opacity:.10;
    transform:translateY(7px);
  }
  100%{
    opacity:1;
    transform:translateY(0);
  }
}

.homeview > .px .hero{
  animation:homeTextSmoothIn .94s cubic-bezier(.16,.82,.28,1) .08s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview > .px .homekick{
  animation:homeSmallTextSmoothIn .82s cubic-bezier(.16,.82,.28,1) .17s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .herocard .herotag{
  animation:homeSmallTextSmoothIn .84s cubic-bezier(.16,.82,.28,1) .24s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallTextSmoothIn .76s cubic-bezier(.16,.82,.28,1) .26s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

.homeview .home-sec-title{
  animation:homeSectionTitleSmoothIn .76s cubic-bezier(.16,.82,.28,1) .24s both!important;
  will-change:auto!important;
  backface-visibility:visible!important;
  -webkit-backface-visibility:visible!important;
}

/* Mantieni esplicitamente ferme griglia e card prodotto. */
.homeview .grid,
.homeview .grid .card{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT TIMING — smoother curve =====================
   Solo tempi/easing/movimento/opacità iniziale dei testi Home.
   Nessuna modifica a scroll, struttura, hero image, griglia o card. */
@keyframes homeTextTimingSmoothIn{
  from{
    opacity:.18;
    transform:translate3d(0,6px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

@keyframes homeSmallTextTimingSmoothIn{
  from{
    opacity:.22;
    transform:translate3d(0,5px,0);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0);
  }
}

.homeview > .px .hero{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .04s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview > .px .homekick{
  animation:homeSmallTextTimingSmoothIn .92s cubic-bezier(.12,.72,.22,1) .13s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .herotag{
  animation:homeSmallTextTimingSmoothIn .90s cubic-bezier(.12,.72,.22,1) .19s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeSmallTextTimingSmoothIn .82s cubic-bezier(.12,.72,.22,1) .22s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

.homeview .home-sec-title{
  animation:homeTextTimingSmoothIn .82s cubic-bezier(.12,.72,.22,1) .26s both!important;
  will-change:auto!important;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .herocard .lk,
  .homeview .herocard .cedit,
  .homeview .home-sec-title{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME TEXT MOTION — unified on headline =====================
   La headline “Design contemporaneo…” è la base.
   Stesso movimento/tempo/easing per il resto dei testi Home, con soli delay gerarchici. */
.homeview > .px .hero{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .04s both!important;
  will-change:auto!important;
}

.homeview > .px .homekick{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .12s both!important;
  will-change:auto!important;
}

.homeview .herocard .herotag{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .20s both!important;
  will-change:auto!important;
}

.homeview .herocard .herotag .ht,
.homeview .herocard .herotag .hp{
  animation:none!important;
  transform:none!important;
  opacity:1!important;
}

.homeview .home-sec-title{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .28s both!important;
  will-change:auto!important;
}

/* I pulsanti restano leggeri ma seguono la stessa curva, senza diventare protagonisti. */
.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation:homeTextTimingSmoothIn 1.05s cubic-bezier(.12,.72,.22,1) .24s both!important;
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview > .px .hero,
  .homeview > .px .homekick,
  .homeview .herocard .herotag,
  .homeview .home-sec-title,
  .homeview .herocard .lk,
  .homeview .herocard .cedit{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}






/* ===================== HOME GRID WRAP — liked motion model =====================
   Segue il modello reale di Piaciuti:
   wrapper dedicato + .card.in + likedCardIn + stagger.
   Solo le prime 2 card Home si animano; dalla terza in poi restano statiche. */

.home-grid-wrap{
  padding:0 18px;
}

.home-grid-wrap .grid{
  gap:16px;
}

/* Override mirato del blocco statico Home, solo dentro questo wrapper. */
.homeview .home-grid-wrap .grid .card.in{
  animation:likedCardIn .42s cubic-bezier(.22,1,.36,1) both!important;
  opacity:1;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}

/* Stagger identico nella logica di Piaciuti, ma limitato alle prime due. */
.homeview .home-grid-wrap .grid .card.in:nth-child(1){
  animation-delay:0ms!important;
}

.homeview .home-grid-wrap .grid .card.in:nth-child(2){
  animation-delay:40ms!important;
}

/* Dalla terza in poi: statiche per preservare scroll fluido. */
.homeview .home-grid-wrap .grid .card.in:nth-child(n+3){
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}

.homeview.motionDone .home-grid-wrap .grid .card.in:nth-child(1),
.homeview.motionDone .home-grid-wrap .grid .card.in:nth-child(2){
  will-change:auto!important;
}

@media (prefers-reduced-motion: reduce){
  .homeview .home-grid-wrap .grid .card.in{
    animation:none!important;
    transform:none!important;
    opacity:1!important;
    will-change:auto!important;
  }
}


/* ===================== HOME MOTION — slower instant timing =====================
   Partenza immediata, durata più distesa.
   Non cambia struttura, scroll, hero image, layout o logiche. */

/* Testi Home: stessa animazione approvata, solo più lenta. */
.homeview > .px .hero{
  animation-duration:1.24s!important;
  animation-delay:0s!important;
}

.homeview > .px .homekick{
  animation-duration:1.16s!important;
  animation-delay:0s!important;
}

.homeview .herocard .herotag{
  animation-duration:1.16s!important;
  animation-delay:0s!important;
}

.homeview .herocard .lk,
.homeview .herocard .cedit{
  animation-duration:1.10s!important;
  animation-delay:0s!important;
}

.homeview .home-sec-title{
  animation-duration:1.12s!important;
  animation-delay:0s!important;
}

/* Prime 2 card Home: modello Piaciuti, ma più disteso. */
.homeview .home-grid-wrap .grid .card.in:nth-child(1){
  animation:likedCardIn .68s cubic-bezier(.22,1,.36,1) 0ms both!important;
}

.homeview .home-grid-wrap .grid .card.in:nth-child(2){
  animation:likedCardIn .72s cubic-bezier(.22,1,.36,1) 40ms both!important;
}

/* Dalla terza in poi resta tutto statico. */
.homeview .home-grid-wrap .grid .card.in:nth-child(n+3){
  animation:none!important;
  transform:none!important;
  opacity:1!important;
  will-change:auto!important;
}


/* ===================== CARRELLO VUOTO — full-page empty state =====================
   Quando il carrello è vuoto, niente layout checkout/card prodotto:
   pagina dedicata, ariosa, coerente con la palette reale di Strato. */
.cartemptypage{
  min-height:calc(100svh - 130px);
  display:flex;
  flex-direction:column;
}

.cartemptypage .cartPageTitle{
  position:relative;
  z-index:3;
}

.cartEmptyFull{
  position:relative;
  flex:1;
  min-height:560px;
  display:grid;
  place-items:center;
  padding:12px 18px calc(122px + env(safe-area-inset-bottom));
  overflow:hidden;
  isolation:isolate;
}

.cartEmptyFull::before{
  content:"";
  position:absolute;
  inset:4px 8px calc(84px + env(safe-area-inset-bottom));
  border-radius:38px;
  pointer-events:none;
  z-index:0;
  background:
    radial-gradient(circle at 50% 34%, rgba(255,253,248,.28), transparent 42%),
    radial-gradient(circle at 50% 80%, rgba(199,125,107,.075), transparent 62%);
}

.cartEmptyFullArt{
  position:absolute;
  left:50%;
  bottom:calc(54px + env(safe-area-inset-bottom));
  width:min(128%, 620px);
  aspect-ratio:1.16/1;
  transform:translate3d(-50%,0,0);
  background-image:url("data:image/webp;base64,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");
  background-repeat:no-repeat;
  background-position:center bottom;
  background-size:contain;
  opacity:.40;
  mix-blend-mode:multiply;
  filter:saturate(.82) contrast(.92);
  pointer-events:none;
  z-index:1;
}

.cartEmptyFullContent{
  position:relative;
  z-index:2;
  width:min(100%, 330px);
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  margin-top:-28px;
  padding:30px 18px 28px;
}

.cartEmptyMini{
  margin-bottom:14px;
  color:var(--accent);
  text-transform:uppercase;
  font-size:10px;
  letter-spacing:.18em;
  font-weight:700;
  opacity:.72;
}

.cartEmptyFullContent h3{
  margin:0 0 10px;
  color:var(--text);
  font-size:30px;
  line-height:1.06;
  letter-spacing:-.045em;
  font-weight:760;
}

.cartEmptyFullContent p{
  margin:0 0 24px;
  max-width:270px;
  color:var(--soft);
  font-size:14px;
  line-height:1.5;
}

.cartEmptyFullCta{
  min-width:154px;
  height:50px;
  border-radius:999px;
  border:1px solid rgba(199,125,107,.20);
  background:
    linear-gradient(180deg, rgba(199,125,107,.86), rgba(151,103,75,.86)),
    rgba(199,125,107,.22);
  color:#fffaf4;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 14px 30px rgba(112,72,48,.18);
}

body.dark .cartEmptyFull::before{
  background:
    radial-gradient(circle at 50% 30%, rgba(199,125,107,.105), transparent 42%),
    radial-gradient(circle at 50% 82%, rgba(255,238,218,.04), transparent 64%);
}

body.dark .cartEmptyFullArt{
  background-image:url("data:image/webp;base64,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5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych70gAD+/3rr//rUyMfRi//yR3nsvgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
  opacity:.46;
  mix-blend-mode:screen;
  filter:saturate(.86) contrast(.9);
}

body.dark .cartEmptyMini{
  color:rgba(224,157,126,.88);
}

body.dark .cartEmptyFullCta{
  border-color:rgba(199,125,107,.30);
  background:
    linear-gradient(180deg, rgba(157,105,73,.74), rgba(108,73,52,.74)),
    rgba(199,125,107,.16);
  color:var(--text);
  box-shadow:inset 0 1px 0 rgba(255,238,218,.11),0 15px 34px rgba(0,0,0,.24);
}

@media(max-width:380px){
  .cartEmptyFull{min-height:520px;padding-left:14px;padding-right:14px}
  .cartEmptyFullArt{width:138%;bottom:calc(50px + env(safe-area-inset-bottom))}
  .cartEmptyFullContent h3{font-size:27px}
}

@media(prefers-reduced-motion:reduce){
  .cartEmptyFullArt{transform:translate3d(-50%,0,0)}
}


/* ===================== CARRELLO VUOTO — no scroll + art +6% right =====================
   Solo stato carrello vuoto: blocca scroll/bounce verticale e sposta il visual verso destra. */
html.cart-empty-lock,
body.cart-empty-lock{
  overflow:hidden!important;
  overscroll-behavior:none!important;
  touch-action:none;
}

.cartemptypage{
  height:calc(100svh - 62px - env(safe-area-inset-top,0px));
  max-height:calc(100svh - 62px - env(safe-area-inset-top,0px));
  overflow:hidden!important;
  overscroll-behavior:none!important;
}

.cartemptypage .cartEmptyFull{
  min-height:0!important;
  height:100%;
  overflow:hidden!important;
  overscroll-behavior:none!important;
}

/* Spostamento richiesto: +6% verso destra. */
.cartemptypage .cartEmptyFullArt{
  left:56%!important;
}

@supports not (height: 100svh){
  .cartemptypage{
    height:calc(100vh - 62px - env(safe-area-inset-top,0px));
    max-height:calc(100vh - 62px - env(safe-area-inset-top,0px));
  }
}

@media(max-width:380px){
  .cartemptypage .cartEmptyFullArt{
    left:56%!important;
  }
}


/* ===================== CARRELLO VUOTO — viewport clean + refined earth art =====================
   Correzione strutturale: pagina vuota a schermo pieno dentro Strato, senza scroll/bounce.
   Correzione visuale: immagine rielaborata da JPG reale, bianco rimosso, palette earth tone. */

/* Il lock serve solo mentre è montato CartView vuoto; non blocca tap/CTA. */
html.cart-empty-lock,
body.cart-empty-lock{
  height:100%;
  overflow:hidden!important;
  overscroll-behavior:none!important;
  touch-action:manipulation;
}

body.cart-empty-lock .wrap{
  box-sizing:border-box;
  height:100svh;
  max-height:100svh;
  overflow:hidden!important;
  overscroll-behavior:none!important;
  padding-bottom:0!important;
}

.cartemptypage{
  box-sizing:border-box;
  min-height:0!important;
  height:100%!important;
  max-height:100%!important;
  overflow:hidden!important;
  display:flex;
  flex-direction:column;
  overscroll-behavior:none!important;
}

.cartemptypage .cartPageTitle{
  flex:0 0 auto;
  position:relative;
  z-index:4;
}

.cartemptypage .cartEmptyFull{
  position:relative;
  flex:1 1 auto;
  min-height:0!important;
  height:auto!important;
  overflow:hidden!important;
  display:grid;
  place-items:center;
  padding:0 18px calc(108px + env(safe-area-inset-bottom,0px))!important;
  overscroll-behavior:none!important;
}

.cartemptypage .cartEmptyFull::before{
  inset:auto 10px calc(70px + env(safe-area-inset-bottom,0px));
  height:min(58vh, 480px);
  border-radius:42px;
  background:
    radial-gradient(circle at 50% 34%, rgba(255,253,248,.20), transparent 44%),
    radial-gradient(circle at 50% 84%, rgba(199,125,107,.060), transparent 64%);
}

.cartemptypage .cartEmptyFullArt{
  left:56%!important;
  bottom:calc(52px + env(safe-area-inset-bottom,0px))!important;
  width:min(124%, 660px)!important;
  aspect-ratio:1.18/1!important;
  background-image:url("data:image/webp;base64,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")!important;
  opacity:.72!important;
  mix-blend-mode:normal!important;
  filter:none!important;
  transform:translate3d(-50%,0,0)!important;
}

.cartemptypage .cartEmptyFullContent{
  margin-top:-34px!important;
  padding:26px 18px 22px!important;
}

.cartemptypage .cartEmptyFullContent h3{
  font-size:30px;
}

.cartemptypage .cartEmptyFullCta{
  min-width:172px;
  height:52px;
  font-size:17px;
  line-height:1;
  font-weight:760;
  letter-spacing:-.025em;
  font-family:inherit;
}

body.dark .cartemptypage .cartEmptyFull::before{
  background:
    radial-gradient(circle at 50% 32%, rgba(199,125,107,.080), transparent 46%),
    radial-gradient(circle at 50% 86%, rgba(255,238,218,.030), transparent 66%);
}

body.dark .cartemptypage .cartEmptyFullArt{
  background-image:url("data:image/webp;base64,UklGRnKrAABXRUJQVlA4WAoAAAAQAAAASwQA1QMAQUxQSC5BAAAB32OmbZs6CMaf8/6IyF2hfIxAkiQ3bMMFthyqsPn/gyGCIqk414j+T0DbGs/v8Yvl67DnEiznBtjywzXYllyAncmnHHuTj7jvBnLO826Y80Nswg/BhB/TreLnYItAJCEiQPRCQHdRsOeKqR5xE7XicwttZP4O1YN+r6M0sPJ/wL4A+f9C34NG9ud53iggCBDCB5JiEy8IQkgRKkSECrZiud8f5q/gJbtO8YnpffRC1yvY/Jd1JSse4mYv4N6m7AB3bySAo/wdlBo70M9rBNB3uUZSklVY4xoQkYVAQKVGAgXjmrKUNGokeoXcJNcae+fIjJ9TSIIja3g2EIsa4bXWzADOGAC2YgpYHjQzeK0ZAHvCJiCfuQrISRNhwI+KN4b65ZJUCRIeMx3wKAL4yKIUHvmGKccUgJgAMHGrGxsdzHHcNpIjVVWb/HN2u724+0fEBOBFq4nX3d1tCeixvwnZ2t8WZj+cdGItbtlqjG1KGW3jx59A/YL/BfwGI0ltIiJjTJLMYPVbfsC+gNZ1OhwCYHtguoNkIy7N2OphZNRMAYBZQ2FPErXBEHKrUYRx0AwIfYhVWzMzSansldnlrGpS5Bg5xgbAZNu2IkmSrnlkMWOLq3pcNQGGSWSvRlhtpl4yZ7q7oaqZspqqCnz59N5tmEXWslB5XyRMbK2IiAnwpG3bGkm2bb3v90syk8kck5mZmZmhNFowOjG6Na7RgNEEZg5mcDRHM9M3mMdjhchCREwArm3bFLmR9H4RmUUqSSVmyWyPLbd5mGeZGpaZd//M9tnCETPvMDMzjyWjLLVaZFlQnJUZ8R1IVquiYioqs3wQERNgy9r2NJKk7/v/XzKEKRwMyRlxqiIahpmZZ1YwK5+FzB2j5LEiTsRFREyAH1vbFkm2bet9f/5/M3MPc2b2iEimySTPqc0pMS1eFcYaLGktiWliAcLsNSEiJsCTbduSJEmSdM4nsbo2m/9MBd5pAMAHANKiaSsiJsCTtu1v29629bzfD5RsyR5h5pxzKM3ibMCctdiD2dg5OzBSLY9/dJYlkQS+7y2QhEhC1m/mGRETgC/8/4X/v/D/Fwq/uuOlDvnmf0Ko1VRMLJvkWZ57x39HIGba81zr2HnvfNKcNZ8metN8UjV5kXvhP5AE/1FU/imCdamqqPBTn2gKvnNN1Ryma5XLizzLmi4XACpqJiJC/EviXxOhE59KPEuqimgSAbSrate23WEaNuu6WZcLQBFRETPFPxIAMeAEQACQnDWLKqHdab+dTbDqoqiqsqo8Kc68Kf6RAED8/yUAAoDkGBMZq2N9andTqM1y0zuK6D+aAASI8UgQ0JwkZ2XaL9erSdLTtJk2QtB85gQgABCjlQAITSFmqjvudvcToXW7mNcqzpkZARDEiCYI5JxClnq9PewmO4tpN5s6iprLlCBAjHYCpISYRA7b9e20Zjft+1rNnDcBCBBpSIBMMaZ0WG/upi+z6Xw+VVHvnJIAkaIEmWJM+bS4X05UNvNFX6o45x1BgEhcgszBp3yYrzZTkmnTr2bevHMGAkRCE2TywW8Xu+X0o+0261rVnHdCgEhzQlKIKS5mu2qqse6Xi8Kcz5UgiNQnqKHz1cNqNrXYvX1aijnvFQRxOSRUfEju+no/jVhtX96f9nkGBQHiAklQOufXi+Vh0tC3D7vMvHcGgrhokhqDd7e3q0nCZruZqlqRCQHiMkpK50N18+0pQdMuNlNzWeZIgLisEirONdfzzRRg/7gtzXzmSBCXWlKcb++vFq/4umq+njlXZAaCuPSSGpr2dn7/Gm+1e2ideu+EIC7FhHRdM7tevqZ72mwqsyw3EsSlmZDOtfeXy9dw88VmlfksUxLEpZoQ31bvv/2qrZ2f5t75zAtBXLpJabv6/Xdep12X68r74g0B4kJOZlctb65el623p8qGEB1IvLRTg6vvLtevw/br9cj6lBwI4mWekK7Zf/jhK6/xaH3OIUZHgnjZJ1N7vLrdvNbaHTfFupgtQXSDFNcefvTDV1fTp806+JwsCKJLJHNz/HC7fz21++5Pf/MXf5uiIYguktnVm+/PElDtfLsOvoqGANFdUmO1W1xMNE23l5H3KRqC6D41l3bvfDehdN8vo03FGoDoSjmq7K0sbCeMprP9MoYcDEF0rKxqu8t3NhND+/22uJCCIYhOllW9uLmwlAA6bLZ1TMkSIDpc1o3iq7eXEz3n4yb6FB1BdMA6KD3+3lIyZ7o+tj7kaAiiM9bR3vZC4mY2WW1zTp4E0THrqHj+VJLm+ToJPkVDopvW+ZGLM4mY+WKziLF4EkR3LVJ9w2fHEy7t9joOIQZDovMWqcLM2eTKdLObxpSdAdGRi3T/7K1Eyvayyzl5kujSSWYHTl1MmNwuc+9LMiS6d5K5gYtnEiPrw6nEEkgQHT15vf0nxxIgs+sp+5QtiY5f/e7jaqKjXRznqWRLED1ASuvr7aTG5rZLMXtDojdIwVQtJS8Wu1MTqmhI9AuJhIhWkxWX4yan7AiijyiErOwnJWaHexVSNCT6ikQUYTkJcT2tUi6WIHqNBEm0lXB491ylHAyJHiQJmavtJRaup1XMlSWIniQJj/0HiYTLfVlyMCR6lUSyUd1LGMzvxxSqYED0MbVMEpwP21xlQ6KnSSQKswmB5zdNzNGQ6HV6uan4b7Y7jqvaEUTfk2TfxHi89+VW5+QM0Q+VqXR/bHe4rlMplkR/lGTfhVhuf97VJRoSPVOvJzUZt11uy1RFC6KPSqmROO18W5UqGBA9VfJ6p+Oy431dSjREr1VkM3HY9dUkl2iI3iuJ1IWYa3/eNbU3IHqxMjsQY22eN7mKlujNEuXGr1S746GqowXRq5UpW12hvtxGOVsQ/Vtad12aXs9VKQ5EL5dSLK5I+w+zJlsS/V0p6ivR8fUsjbwh+r3iiivQ4nJuGm+I/i9Vt1eed8+jkh3RFxa54lxvy7q2JPrDopNrzZfbQxUM0SsmfHWNefvcVMUR/WOR7o9bVtfTqHYkeskilYtV3rwel2yJ3jJ5qdhke9s3tSPRayYRj7x5Pa6jJXrPFIM8vWtKcSSGH2eHe9s4Er1pHWNsvjYpxRF9alWLKz4+jlpHol/NSsUS3zo/VNagjy1ih/3naZ0t0c/mKF64f2jHnkRvmzlG+PplNPJEv1vHBMtX+4diib635ljgh9MmWqL/zRx0/r7361kg0QvnqNHZW79fj5NDb5x11MF7ej8eBUP0ybXq1L1+O2mcQd9cVTpyz++ntSf657qx1Hn7+NQ2nuijM+vxke3T86RyRG+dV2Pa56dJ5Ygeu27Hszf3SeWIXjv740j2g69MK0f03TV2Y9j35tORI3rwzPXo9e3DQ7BEP56xG7e+c5lkg/68psWI9dVjmy3Ro6e60erTrc2W6NfT78ap+21SLNG71+44Qm1+9DfFEX18xmZsWn2ZjjzR05e4GJdu7dgRvX3mw5j01eODM+jza/c4Gt3Pbbbo+as/jURv2myJ3j/99Rj0vXHjCQFk3I0/T+uxIzRQ2+XIs3vTJgMZVHcYda6j2hFCmOvVePN2NXKEFGrYjjW7p0kyUEM2q3FmX1WO0ENxtyPMfjO2hCLSL8aXbR0tRFHrxchy2jeWkEVpb0aVY50shJF+NaLclo0lpFHr2WhybKKFOubmbhy5TxtHyCO7m1HkPPKEQkq1GD+e29oRGpmPy7HjuQ2ESmp7O258qipH6KScvjtmnMYOUkm/GC8eY7bUCsjpcqzYVBZ6mR8fRonVrLIUDG0+jhHL6AnJzIcfjQ+XkSM0k+2HsWHvi4Vs5sO3xoVFJIST3d2ocBhZ6YCcbseDtYsW4pkfF2PBKhrIp1Y/GAnWtaV+IG2vLwI5Gygo6w8XgIM1hIamQ/rNkoGKsvkk9baVoYwgnxMvZgMh5eyzlNuQhJRWHxNuEqCm1p+TbZQs1YR1si2LgZ7a7JM0s95AUFmfkoyEptrsY3rtCVVllV7BGqoK3Ow5sUYBwsrmnFZ1oLLAr7Yp9RANpJX1IaFCMBCX/CGdCH3V7st3JFgek0lirTvdkeDkmEBjpDJws23ySILMsjqmDlM3Tb5PHGJ002p9ThpJ6KpldUgZDVBXDWz+mC6KmdFdy+otXbpwmW1ThZzgyLm/mBCTXCs2F5HNREeOjUVksmvvH36TRLnyzRGK/O2iwSmP3CwYadLj0pxfKA5x0iPPLy0SLmDi2x8sEMcoEx+XZnEIkZj6ur9lUbjPiulv3r8oEJz+OO5dEIhJsJcWg6DTIA0fXQR2kROhbhHYtsREuF7nd+UFU+FoH8KXlZMhtffQU0yIPbgDXiNTIkXLbtbqpMjt0+S8U0yLRg+Du02KiXG1Ci6TUyOPX8B2HzA5dvsgtfuTTI9UddAWXjBFrqBlcork9nlkDwGTZHePEvvKSaZJKi2xWoRu5QIsYO5WcvPYb2k9qjISnfk3xl2Vze2C/YNdhU5lzzI8JRlgbwX4pG+6EQLppkc+6Ld104ZhftZevoD/6N+QWmfICIMJfJI+aksC2vCq1/rL6jf1ezu0HlbZyQLzLugmCcmYjTCuhdi9mpPd9etqbtZOv2Hame8mrttZw0r3IiF3BqiTxYvp//2LfzO8/smaVSqcdsUqJh8IyJCwi/lorjot5pQhySK7GrCTp86403dj7ehEEhJWEhKyUlbKSllpZeb0OqztkkLHso3b7ARJBnj14m+jbuQyLms9mgdt1WcZnXDjekcmWsTjU6zmDcT//se/GdT9/RduJqi0VjESYO00PP1oelSIgCjCRhedXGVb893xqIBZDAs6eN+p7FVYLRUjxIJzA2bkxbF4noQEQrPXe0K2joWZOHchbQUQkBkSOEicwruEkDDnP/9lfTJwvv+iwi0Yq8mAwNphc4ivK4l7J2M3GC6j2NYJJCRrJ0MICQnJBnKDiEhCaD7IVKbr6EltBRwP3Mt1F2/Gwy2Y9zgBgZl8arMkiuAEBAQgJCG7Gfz3P386YPr4aosGphJGgNkfEpIcnzE8PVgbInUFB9ujCbE9V28PDye2D760FK6bQ1AbZY240YwP38rsI5DdQEJCQkJCACkCBgZguPRUENDWLJx/+k99Qqj7m/fV0g2qdmrfYvd3tMcWEptzdwCCycPjm+MJD+YTaS5VjTjvVBVi1kfH1fVXhHdAvNlpAORxnOXVBPyP+JTg6far0dlaaMLsGvDXPW7DOHd13C0gyJ7MLxGCAPwtUhrU7nqdY54JJPsVxraEhISEhITrAHp2XjivYDJ8avPms1Fu0XIh80bMButirubOi+QsYVd9MnfXT46PUo4hp7WyRtwoJP0idhuTkBBCQkIHQ+tGiOcCQii+EqBgp4KQxMVk6NNC3nw+WhElYWGMtuajYyMJL9oZgXp0DkkeHvbL5PcoG0wP9iPEjythbrxqZ7pbAscWx+ldg0CEhJCQkJCQkDxODb1C1ElgJm9cBiGfjtkm5IfPtitRbkJV/HC401fQzWVQ7Gon3ugH4vHBp086gSHZfCT1rgZHkB7XOT7QJIsTDLBmVmR6V2yOOWEbgCYhhISkwBGsuDTO76xYg6BbmYHE4ECwuDcuVadiFZSVTZg+fr5tjmpDZpkfWHf5C3g2Pcm748a49Nn0yfGEh1/NlapHm4zWKhoxYlw2XCcDAwTdceych3MJNCfeDuBktAh5HhTEksW+CAWUAdUfGw1hmQXpE3BQ3HocWYW8+fnUVG3wWJB/kDsSSEhISEhItCYhJDu92xtm0o7Z8GFOXs1pftdfV60QPygrdNbzlYSkg+vF5ayBNQhZs9GOG7eHSUgIISEhYQlkQrzewHT8cDy4PIkguaaNWeUsAnE/2UdyVrd2g0ZgF/Lmi+1gR0vjw5/YHT4fNuc0zM66YC7mphWYw7bAJzDcTgA9OD7qleGG0aMad9i+nblbwHBdXA6bs/NDHhvG8G00XNcrA6xCFZ+FC3RUJn52kCCHLevF6hI9zKzvy8xChyN9wibkzedjs4TgGN06vjtu1sCJ2M6MlxPoxt+QEN4AdWN8nEpH5QT0yr5CnNiNnGYNCziu3GlHBgoJ8XBAQkKYkxISDhx5NUlISEhIAT/GJPzsSVw3ICDjRpgBWOD6VmsD6JBhrOmdGQACGsuTTcj3n6GpNUy0Ng5gWN8MkCFBcszPjhcSxnQVBojE7eKqFiGteeLMGhYD5MUAeTF9U3Lep2MOaCdELHHZACwqIdbO7IxFbHaxKQxyHxV3vD0/hpC0A3YllBNVd/vCZa9ehoamHedU+a6kOkTrnqGUVZg+fLUhhpraT2Eo0DCWp2USEhISNjLEfQm0AxGQxMMEAiRESIdNJ6S7xRBymQXURasgCQlZKStlpay00gq7bg74XKnqjluP3JmCTp6AuDwRm7YTFNvDbaf1hCHrggEJCQkJTxIS5zEk7IfNBbKIg421Y2ELchxeXg8Y8vb9eAmiAIA8pYczZBWmD5+hoTz80Z8kgDE5yFleDSaBPA3xM24odPoDfmjLCFk3cWKvKwmBHQlO3MgQ3/a2j8dX8cw9pxAvxl9m/OYAbr6+2ra7zdj0CcIuDc2U1XKqJsAgAMSKUsIuTHebFqFY/QmdgGEFncjwERCxO8T2uoHYMxMwFsMaLtshHhS3Jy+GSwsICUnJSlkpK+V0KqP46L4f4Lk1imSrEWAQRsxmEGzrFBIQmyF3v/aBAJ1eXTCL95P9+LVp/ZN/JVuzR1e34FweSSdcelb+5vbjFcGd76Wujb/Bbm6C8+4xH11UNZzZuQy6qes1NreGZFdVGaKZH02huzrQXOqlLquytsnlzaMeuqsdQ2EdOZ2jLiuVMZcrQx66resVLKdDglxXq1g+T61cuV6ncpl56HUZUvk8pmApoHxYeEjWCpPnmorlMkTyeeYg2TFC8lRRswqSTxMH0eqIPFcUrWoM5FszB812EDkXipZKy+OrrYVsNTzuFWVLBcd3ZhbDkafM4Yiv/ttvIdzuYNz+D9JdWLxvf6tcjprFqxrSHUMUH6ZOu8oAxXNN7YohiefWQbxaEm8bqlcN4j71EG+TeDficMSydRBvR8XhdWPUS2447CLkOyoMXx1b/ZIx3AoFrFB4HDvotzG8b6hg7wph++ChYJ8Uwq3CgOQ+cTjiqw8Ww5GXwuGITWMh4RfviuBVYzSMLIJtwHDkp8aqGEvgsaKIaS6AdWOh4loAr2ozILGNUHFm+17XVsa0AG6FMgaa90+/NZBxqnn8LWScEOv+uTjKGJit+5f/N9BxFev+6/8h5MzWRUsh02jcBQZCnq17TyoZs3GvCClLtp2zlqlx7yllhNj2ClpOmvYYjZg5097z/7XM+Cf+Vsto2jVaSDnFtMeKWqbZtHmAlkuw7JiNllG9ZddCLYN0lq0DxDx7w7bFqpkEw64V1Fwt20aKGZkMSwZqro1dbzL1DHa/quRMk2G1g5onZ9c9Us0orV3HImfIzq5FgJynzq5k9EyDWd+oKWdEMuuc9AzaWDUrFsORl8IBiXNWNJqVLPRcklkOes50tOrbFfUM8dGqQxY0xoNV0UDQpTJq76loZu8SFF2tOmQKWvZWZQs9ZzwYdY4UNASrnmtFY66NmjkoulZGWaNommHzzlPR0smofYKgMz4adcgUNITKqGwh6NStTWtPRYPC5kuBoms26pAoaIx7o4KBondroywUnWlp02OgokFg86VImkSjZh6CzvBolDOKBr+zae+paMwLm7YJkq6w+ZCpaBKMyhaCTrcwykDSwtqmY6CiQSqbLhmKrhk2ryMVLVZGeQNBp98aRUhaerRp7iRNpbXpmKho6QCbr0XR2MyNShaKlldGGUg6YfPGUdEkGrUMEHS6hVHbREH7xb+E0a2DoP/Gl62yRtF+85+sMhB0/sEfGrX3VLS/gtHnDEHXL1u1jRS0+PdWBQM9Z/tbVhGKlmD0zCpa7swK1DO6B6uWEYIWHs0K1DNNrVXJQs/jI6w20HNtZ2ZJetpbtfbUMwmw+lIg53T3Zh0S9ay7NCsYyLl4mE3IObulXYru92aNjZ6Jr83KhmpGv4HZDx5y5h7s2iY5k87btQwUM/oV7PYGaua+bxih5hJg98yqGcPaskA1cwvLPMRcQ2vYPFLMwg6G1xZarm5hmaWYSeMsU3O2M7wh0d1YNjZiJh6WF0spo7s3rXGQcm1vTFsGLYtHmD52VDK6uXVQcgkb27yRsrjD25HazN6QkLazrbVKxnYO2ytLIdPuxriRg5DHE96O0ObKusZSx8Q11lUOMk6/hPWN1TFt3ptnqWPxiLcj2dy9IZHbyryplTG6OezzVDFpb+3bJqh43ML+VaSIaXtfAMFAxHMVCoAQcdY3eDtS2m0BjIyIsVugAAOpYVJ/LIFsoOFxixIcBw3TZl4ErdOwXMcimAYqGE83KMLGQsFTeygDSwVjM8PbkblZlMHUKRjdAmW4jhQwqa8K4ahg9GsU4sRDv6VelYI1+sWwxtuRrL/5hkSsUIozp19a/V8x7BLlKx5RDlG+WN+UQ+ug3qlqy8Ea9eLpEuVIqHeqm3JYO4oX62uU4zZCvNOxKohdpnbp6RIF2Thod67akrDQbp6u8HZEPLmSeB0oXVpdoSS/n7UrHkNR/NxDufPpGkX5GyNdYYWinP4FlDtX3y6LiadyHV4Vy2WAcM+2fg5jl6hbuX9JMKOFbk83T9Cw0O2cnBDMN5G6Nd25RuNcdCsnJ0Wz9ZDt6eYmDkvZyu0Twmkg20e7ExxnT9Wabf5ROB8r1cqDc+I58xDt6eYJIMGIVk5OiOclULSmmxtAjgWa3W+eFNB1oGTFyuMiGgwku7lNSA0ku6y9g+QpULE4uF1I3zaS5VbvZ1I7CDab54V04qDYVovpOlKwtP06lEMSLBaPgDr10GvXvY4VZ/SKzacYqadIvdISY/VtrVfWfTpaWg+5Lg8YrY5qRcnWo+Xg5comDUbrIkKsY+kBcb1kilVzq8AWC60uq++A2XtqlQe3CuzrRqyqFZGdeUh1LH+Kxhupcr0itA5SXS3dg+ZrmUrl5SeE9ixVLitimy361f0m4fDyMpr72EwtXvx7KxTGMcsIG4TPoTcM2vKdNvpNbUjggz4IpO+6EshHPpZBlzRqjXeMzySl9D82mQ3FtnV8Scon4akP5q4rM8s8NZK81AxPCpczwmUBfRFhz4Z+wewcXxnHzTxyb14YwEBwuO0dg7laEPOCDch4RpAJF7+RLHz/0ygLA9iaUw56F+XspP8qMma/vSK464QX/4s3Q2ETzKwKgUGY03fnDjF81nHKMPqIabzpLoR4LO0JMCfj1R4cF8sTzAPZNpKFkfegNqhCgulUYIDA8hyIVncMTG38bcv7neguI1/8PraYWVOEQ5ztcH3VBRx77x5ccDlfGbfyMO8ymfUICCAcfKGd81woQKwHFHPNfjeKp6cBI4QwhwMl4rn8s/ONhs5sZNFpWswCOQDrbMK8YpBsDAkJCevJXNwe+EEGdPWhGfAG8TvzFNfy4ryZocJPDiwAOYz2FXIOn8Tz2cFp0V1ndhzMlcReO87m8iYuD55/ZBIS5lYmv1gCZzEshsXAmqsCCd8y9jVy77gyFk9OGyFA4H2/uc/ZjvDuUreR87Ji39nePf0Fx97wreRd35DY4nmAQEBvncOTIYD5mZOIp4fAAVY9LGDWRzE92Ocz9egyh2KmBnHud9LNrF8xO30Gduc3AbG9mBMw/PIA5POiosk4GjhkUw9iBualPiT1ofnRjvBusuk0gkV33Czq6jxPAj/gUXO3hHFcG30j4Z50sxsDErZnGpiRxVPXIVmWESCVw/AUElA8uCh2s7FUyeyLlBnHW+K7COgyS8/x+c2sWcyahSWzZs2aWZGtLMNsDYthMbCYWQyLoZ8jCQnJxmExrFmLEWTTL2aNPL2aBYeoFSivx7W67AExh8MSJQqIcIQbKXnOsP44tA3V1axMO9O9dbw7A7RL7DIQc8c6uzIuNQKYZYecBDIznh5sDw/jVs5md5+avJjBgBAgCHZhSEhgAJJXBrhjHUKWhXdQJE9OBTiwIQrNaMHI9gkXVkTO+lrHkz0Bnnp0mTFT4jzasYPrxXm4Hi6FeHmvDwwIJBP6Knt0jnMOEMB48aJhQHA8Kwsjy2J+ETymdKMcUMwOjnELGC6L3Kd9sC3Aj9l0GrsaLM49ntwfVxjXkUlItDjSYTFgx6IkJJTdAVYAGeAX53wgAQYUZwd+QkJCQgKJ67iU5waMmWXKRMIAIzBmpsTLIahP2WU23RXhTUJXGmKBg70xN9cD7JHN4gaG/b24TjZ7bRW4BwkB9eOJBUlI6LAYFgxrBEwIfnjqMvsljDCQJgAcEQ3RHDiwMDpK+DM++eHyKF2UO0eIFoFdxqwZMks8NAE3snghdgsyCalH69SFzwLnNTn34DycSwj2RkJCgH5gViaQBIZgRBTegxFGgN0CFw4zU8ZAQUCwFXGb2YcmExFe1g4dZjhjkX8yrCupC2weePAwYn+yDAlBaMc0HAw59xo5yMOEAOvQxrh0JcVtYlwHTsfFvksWJiiJQgwS2KI5pQmXE4zZLSCo2RlgTBwlPTvYFuJ1RofZsdaM0TZYsyxMj+wk0MFgXBFmWARmF0R7BLaFyU0Aw6VAhAtJMhzeXwFCEkIyJ8PmB/uD64JwhYQwKBlIWGMw2Aa22Bs2gaFscNIYCu8gc+A6pp8kJMMKSBGeH13rGZ0LOwySg1ohgTjveP3BLw9o7yzXi0/lNydP0xDiHG8aec9hY1q9F0utvi0IF3sEIgwGmsWmMmT0fWh2+bIQj7QOHal4Ckt+8JslHkpI/HZhsYHB8E1AmL1iZhDbQpzd9zq6IsaXM7uS/4gVgGmoscB+unEW0i+mHls/zq6dFuQ2QJ5jMBbkQ6Y8xWhdlB+LPjW3CPMyQJxdhsI8TUadYvAQp3WkOMVoVZyvRZw8vFmgxx7S7LIk0OdMbSrN3aSuRZyasUgvA5S5DMZCHYwyebgu1PdIZaqWxfp1LUyO6g5YDx7C1LRifc/UpTJYEeyTMLldFu1FgCzXNwl3NKpk1bfj+pipShG1cD9WquSqFu9iocluOvG+RWpS1J2An4omeTAW8WWAJFerIr7IRpHscieyp4qSFCHk+6RIrmoxTwaCXFoxfwrUI9etoJ+zHkUZiPo8QI3dtKJ+LlaOyljYb4VqFCHuiwA1rsR9nowY2XeAOxVKkWWRv2QtikGFrrJQ4jK8TeSfA6Wo7oT+lJWI9VDs5wFCrJ3Y75JVIhH8e0UlGv3riOHISTIDEsfMAYl7JUOyGn9/9z+EBJNiGP//87/QYFGPBPSWGmQeKfh/hALTlUjB2X9CgcUVSMIbFJi+RBqeLAXIGqThrIICCxJxnyQoGc+F+iOrZGgcxJcURSqeEtVHxJCMr2v58TnSceqhvepqpOMqGu1hWSEhtwnSy/IdKXktlB5ABkVlMRz5LnNA4qkakqgc1FcHxDZQfSQOiQT1ze2AOGeKD1M9HOa1hfpmNxwOmfIjcTgcBYhpODQO6ssBsY+UH7AaDJcCAcJg3Ebqz3CcJIPhyH3mgMRpUGLsMRy5TxyQeKyGJFYBw5GLZBSIMhD2mQqUu4FwkCCKGwgjBwUWPwwuiRKU3TA4FwxILAMViPTDIBpIsNSD4FWiBg3EezUgcUcJPDtyM8CzI8s1/QyJtZSkZ0f8qEF4dmQlQrewDoAdKahLSPMAuM/oFk5uAKzUu4UoQ+BJ2C0E6QYAQF1DcQAwoWvIDYAGuoWpsfy+zl1D0Kr8fiypa2gI/prwDEmHZ0h+SPQMicfqWRKVxbMjj4FdRCy+fUL3sErx7TK7h7IrvmTQNUwtvpWDEIsvvWtFIcpd6R2SFIXSiwZCrF3hbTyFiFqVXsSA5D5zQKJxGI6ceQxInjIHJC5lSCJbDEe2DgOSc88BiU2CFvfs1pFSNJ+yiwZadIDuHClFOdtnV7RIc3arADE6QhfMgERrocXZo1sHapH6HXL7rEbsZx4Dkt4MSKwcBySWEQOS68QBianDgKQ3AxIHzwGJXcaA5CpyQKJ2GJA0GJCcW+pRcGs95NiDJ7Ctk4awX9r7sW0iFUSc9InqdWzRQD+5sfbDMtskampjAwFtrH7mk1WrcJ966ke48fVVRHapboG2ipBP9fibD4C90CYe3gdtEakeurSwCOB7JbbJ6CFojYV4cv3RVwFguWETlSE0S/HgYOVDOLSibKICTT05WP5fHL5YYYu4fhBZa8UjeOULeOoPalYZP4FsESgdjbUvbj4NgbaIqnVkpywdtPnNNRxxLbBJ1MhmHsIp0t+/h6N+pqR7xMMniXkjHCI7+F0cvWqVDpl0+v14rct19oeqDtjcUTgkXvP9Sp+oABs5KOlWSXrE7bO8xsJBx4Hrjj3SPcZr4kWDSEwcC/pEpeM19tQM4fk43lZ6xO1juCoLzUz14pgvHXtk/DQuA8mUXgbH/fVa+0PVGJdoZvI4/mXsEVW4jGKQ348m/utJ+8Pdm7AOjpKBptbSI+19sJYRioHmfnTsDcUI1iJQMJr9zZP0h7vXWT04iCVBjDULd579MbyPlTdqIYSPpv9v3R8qHSu9FAIGPqb+cPv8DWzUNEz8l6P2R/foDWzmYOYh94ZKR2pspIJawtDvVOwNj54BlQyFgqSAsV9oORSYfBhRxUInycvC3NPcBkPrERWNUIg0TP685lBw8tXxlK1MkJQw+su9DUbxOp6SkQmZheHHCQcCWoynohMCpn+xt6FgfhhNI0+VaMFTxaGoPx1NtYOsfmumAwHrRpOFsD4XHAhpvjeWpPVrvQ4Esv0dALyUHAgp7gF82ttAcPLtOwA41RyI4ukewKe9DQO0fr0DgGPFYWB1ugfw2LthgJ/dA8CXWw4Di8M9APRuIOpP7wL8rpNBgLV3ATC1YWD5hZsutsb3WxuGyfEuALb5IEDrGy4dwp6fdTYI0v70VouVhk3fKw4B3PpGi1UdVt31NghSPN5ksWrAsl9tZRDaL99icRjCupUNAay7weKoBPt+rdMhYPn5rRWpQtj4peQQTI43V6kKK5+mNgDQ5tZK57D0ccIBkPZXN1Y9XtsAwM9vqdLiqz32zVYHwLOtG6e0+nf0+b7gANTL2zdMIaHXD53FJ+dv2AgnBJr7DR9qiU8esallQhAPPYfa4nOpz6KpEicD9Ou++0Jr0UmzX6BpBNOBNO87vJSMzvVdN0hB0f+VRacQWj8loAFfazU66SUynU4HJBqAfc7YXB4m44RTAfq1BdtaY5PHZE6KyaDfWoBDy+hWvgQzIWTemYAlGZmaW8hwMmDm61+ii+5pMEmnAlQj4DU2j58As4qcCKTGij/9GYxLZRnMrMM0kH5lBR4bi8zVbVy2kROBcGUGPmkYl+w/YDkpJoIKQyfGyPo9LJgM0JKHxiKrxhtYmjwNkGQJzjWjkvVrLOvAKQDD1hRUxrjqO7FsIyaBfmcLKo1Kod9T2SdOAZiXxvy41ag0P8QimAQS1rbGmFyNr0NB0EmAwYXGJGuTyixwAqBqz+eNRVV1Eyg3LSaA6WQPXsuYFPEHKIvE13/sHgyCF0ZkBRQknQCkuUWHzsVUtZeg7NPrPyhMPk8ikvsNKHcdX/3RKDhlRPXyhMlCPfmXG6N2lcSj8O+YoK6TfoxHo/Ch0XjkIZTVgBN+CAer0Fo8LoNzTFZqSPhTFmbBCWOR579gshxwwg8Ku4+di6e5lwmqKuln+mkSjUK/YfKgygk/tQwmjEVumXwr6ZedaZtSY3FpziJBSSX62MxNw0urkci5y+ROhRN96dY2rF009coWku8n+6CwXoRxyLqOBHtRMsxaiP2bUiORyx6Sb+/pxJdxbp+11qB5eG01DpfmNJKV3SgmyuAHZcPoUN90406f9VU7XnTK7C/MaMczcru+f/eHL1pCkn1Y+TjkGCDB90ocu3RjGELAkUXWA3L9LCYi8J7jA2MkOxl2U5566Xgyj94srsfsSqEMMcJyAbJ8pJKxEBQCbI8fv3i74W+uW4HpWABwwjgKlHs7UezychGNbc4jG0YY7fQBEO8edHp7PpiNdTEni1szr1jAsGtXAMwSdciwww4yOX58+wHg3YtWgN+XwFuhUchzJpgf8mKhy3KbRwPJte+XCrQBbvVkAXMXi7lbG/sCiLiGD4WrkcwemA4YCyGXMPL27s1bs/vVN7kFmG9KAKtaotDh10z6r/RRbIQtzdqvOKe/Tweq9ggj4XJ48LS9f/Ou2H9zhVYUlOHax9HfwgTzQzI+wtn0gMk8/QP2EaJsAlx1+/b1yOGb5y1RjErGoJX3mYyczlJ8hMV8r6sD5loUoYLx9vWHe+beXraCshT2hUYxuIsJXleQMdLDS4P6wWW1oHK6fftuw/xXv8AtkE+lgG2jMZSlh5lMnMpRrGQ0B11EH1SoQKhqvH/7ZuTBhvls74sBOx+Dl55lgosFGSs91HShURJueLu5ffMheRSZ5+UAZQSq1qCMT6VjJqMZIHUAYFvB+ubtGx5NRUk6ZXix8jkTnCnIeKmyxQwnHSgsPG1u3n6kU8+NhqfmdihjJ7PxEvacJ78QgHPc3rz5QL++TBheLL/FBKcHOF56oLMJyE+8SmBBF/lgnTIJCWzNYtARZp0kJIOQkJBw/XHcrdeK2jGmyVQUEU4atdncvLrjlKNuAS0L5BG4vQ8KTkSxkkXNgT3D+qCuIG5jGEDy6joCAuigAcawVWz3aBFdNbDmFQoUCoeQDQSkq+r2q3cbTvs6NC/7woAKQ1NZegTKtaKOk7DQHE8AB0uoOzEYzMXInNZVQjTIgUdImvGwOAUg4x7x8E9gugqO3gEBKFTsinTl5sOrn/+cU/+0zqYxPpbGW6nBeflZKFhtxErgaU5tmwhSmLsorguS5FZAXEgYlxeZkERrNGCdYgWEhPFi+HNFvG5sQRTNIdLOWr/+7LPXnP6zwDiEQ2lgVUloqtbuhPLDfR0vwaBD6DJ4d92w/rjAi8yQ+L6LS1F2JV+Iy/jS4MBib42vf/7zn91yjm8VTGe+Lw6sXXCx+iqURxtB3CTmijMU5FpEwF+wWHd/je28ffWd7/JoKwpUGJrqdSgY6/djJvzU0LqHOXqcJQIVBiYVKJgqyOQQKa7Z3Tfoc0lF8jLRwFzaC1Awl0kKUWPj7q/R7/SbIsFLJWEpPKOCjKAEEDX5drc84TOvTIPflQk6F5ir8TUql/Iy6UOIb6vFDOdYjgyjrAoFEpisX1HBRE4keijRdeslcZ57IZsFolTXThhWfS8WDHiU2KGKazfrR5ztdghXnFYalEK/wTKTlskcUpxrVnc4572GM+BhIkFJNRYMZETyhpSube6vcOZlzYaxYFBpUC7DC1hQyIpkDSGda66+ivPfVTBbpWQgQSmi54JhP0FDSNc1s8s1DI6HooEKA3LVXeUCQQkZUoNr7u7uYTK7ddm8lxqQrF+BGZdEyRdCOtctrmawmnleNlhWElJ9LxhkvKQLKV3X3l1u0K+KjYKidNcuIIV/AwZpSQkWUpxrb2dL9G4xNKuAhQG5rJKBL5Mq1NiF9vLr6OWlOhul5RN21KfIwEuikIyt296uD+jp75slqYS8MBjnDE3ylMzOx+2Ha/S5gsFMhxI6lxpOPb7KRnFyhNTou+b9coeC9KcSwqyQUBQ+YAPWnAQhKM6F9fw9CjPXRYS5C8b1ykk2CKLEB6mdj+7Dt1CelH0ZQRiKrO/CQUMzJzYIMvmum83mGMddX6eDUCc0CIk+xsPtcg9T2U2cMAzFxvfoQGlOXBDM3ner+eYAcyNtEsvpY6mBaPcneLCpI05QEBTfxXY2X8Lk7dAgTeWEeSlheHb1x3iAvbpKRhCaQkj+7mYFsx832BjGbUFh4cJQ7v5SuokOdmrMCQeCEO/C4WG1hOk7IcxtNyUFYRia7fziW99+mw52A83JBYIafJJudruE+cWIjaGsiyrY1Mp3Hl3epYPlel0nEQhCg49+dbc/ogh3FMwlClvIEORqrdHeOTrAejHi6wKCGl3SuLz/iDH8yUkQkqX5/u/wYLWW+VqAICXEGJZXxxNG8zKX/wxJ2U/5YP3YZn7uR4AaXcr1er0/okDZHGpxYVH8x0j9AR+wUgo5ziMoMcac1tfXKNaGNiZ35YUuRcZwbaUNwt0npYjjOAJk8l66zXq3QdGuBWwI477A4JsDVdxqg4DlUk3FawQoIeQsh9lih/JdqcFU/1hiMEhXlzbbIdxbKSqOyQhCYwypW64PWxTybsiGUFZFBjJF79/5r6+0RcBquRxxzEWAzDEkSZvldoOS3tMwlSjzCU+QCVz83F/+31abhNXbu1XFcRVBSgo5SbVZ3uLzx7wvTNA7H/0y2uiNpd1AM8VMBMgUY8rtbvO4xueVPTlhAKKde+0U9r6+vleXRDERATLFlLMc1+s7DGLVYsNUlgxgjcl2CsDCaioliGIeEmBKMYkc17t6i+Gc6nJDRhgAELVZWK/lpS+J4hkChCaXhHra7A87DEZtCOO64EBGgCAAvHFqb/VOewSU74/60iOKVwiCKeWcNW3vNgcMzbIy5bHkDCWtV/Huc71RraHV7sKDNghAxUt7kigOIQCCOYTEfHw8VvUJg3S7wUYgnwpPUPPAoP/6oxGPweCwEujit5fbH5Qf9fnCExRnEAQkxZyVUq0WcwzarQBOPOAZAIhK3sfhzIiKwa+cb3sArIgs+QTqHAgQYI4xKv1uV9U7DODtBrvQqT8fFiYQE47MPDLyhp9rf4DNWh7wftsZECCYYhRVarVdXWNAbys48IXf/hUzjlH4/SOTL51se4DdJ2HmX//z/377skeAgGZJSUROq13T1RgrWXSDv/Jzcz6OyGwOQDI1MHSl/Tn4dJ/VxZIvbwwwwCqkLMpYVadjdcS4qbnocCUv8HQOS9mMMAeA8Hq9tgjAx8emypYvacwqCqNIaejSZt/UJ4yijLuyw2f2SiEf4Gj/8f/9xKmCbxJA1C4By8upqaIBX8hUqVLb3dvfr5TQMQy1CfCPhQf8aLemmDh49Tt3gCvPjftkUpt9vK9TFS34AsbV73wZncYnoQnMTfHh3qO9hlfaeC8Ozr1xOk2G6fYJwOa6r0s05MsPcfEi5PWi4/i4wQZAjuUHfH0jf2cBT31pukeYpYrtFIDDZZNyZQm+xPAJAUrWn/nkJeAPdx52Qrj5u8/1e0bpvU+2V3/8/qmKORrypYQAAWiWLCJKSFPJn/zixUsIv/NQjNjN8Pr5YaMQbrdfAI6HXY6VI8ELBZ/wieQsMRNMVdW41u3x7D8TLyoHdjsNTxRM1CGC+WuhUdHGB9uxP35+Gnufg5CXAwIgAKYsWYUKaFdXp+MD/v+KF6XU2GKnwUwJQ+PdtPQQuL6jTaov/mu7BqBd7JeZL52AYKIRAJ+hiOYkQlCPx7r1XazwgklfJjONDixTPTB+6rysNZjDikl64+X3tXF/8vi8cHQTLwQTic8QAHNMWalP1DWuPtVbfEaP+UWQGs1VOw3SAKRqYPzupASDNUyuL/wtnPDxsPYuLyxdCPAZqoioqKqCWu12VUj1k8/6NvLiJUSqis7izXfnyIR2WIz/woiA6Xrj5fe6wT8+7o9Llw58hs/lnJMoSVC9c63zPvgaZ72JeFkfuHwhR09jXvzXsDtzKW8ApRsWb7nZQ8YFC38Llzx9f8oRxyd8RoQqKqLUJ+qO1anyuUaPHhJfRAz8qc70SBxRQ5Pjw/8MtoFcj4CBehoWvznrwXS98RfvdYr571djqos+RTVnzaIKQEMbvQud9+n0pJdP+WXgjzARjkxQQ1398HvDLCUE3Pv3J4Vx9YW/hVv+cSdjpqtOHccx13zC7KraudbVsLKWlwEJHCMpTbP49yGWk3DwP5gwTm+8/F7HqDIKks/wU1RVRVVVSALSNl0I3vuQ2icGrwNf5nXWwegNBxv0zWDHMF+6PyA194HnxdwS/HH4Y6hoVhVV5TOM0Yeu89H7KC1KcBNwppwaPHXKuUbTZIKqusWIJNN8h+SsBGetK9V6XUAIc6iEKpWkkgol+QxT27UutDHuUaq1nAtIZvvPu9agBwO5tuQW/T4Ml+nP0qM5L67e/uHtu57n+8IU5iw5pJRiTvlpzDWK2SvPBSAvn3MsX5iAYMMtstK0fIv0rNJZIdp53yc/Dlc+RT0fgKSccSozWZXdwnjpf5Eg28yzgq7Coff5nADy0p0GqD23iNgwN0eKOjkvZnapyPMimXYoMsM1y5FZ2n09SeYdz+rg/zjTY8K5k3KmQUEOVozYJBaPSNJFwNkv/48rHc8PUdGVJGvpXvsaJrv+LU1OmWcXLP+PI+0Sz06Ha45U2d7vlcK1zGbzRSSK4uy5fv/9boQqnR1DO1L1/Zdf1zfgETXJdzg3OyQKhGcHvf3Ze270EHhugK64EfADTN8a7M2KpoiBP3i3Wyg2h/UZqXrM54fGyn+60crj/Ll015GA1f+fuHgpT82AP/7cH/78hEMUQ3Ncj2TdRZ4fB3c/4ETzzPNDtP9wUQLWP/WHY7IpkLmxCz//wpgzrAZsCttfpMs6oAf15t85EYge5PoaqAHxpLUAIjSZZGZoOOcM2w2Y6qZI1+vEHkD9wXs7JVB7mH52xIfWldu3jZudH5IHVKnc0zQAen/JGSrKFG7PCQNFH6ZGZp0oah9w7U1IL82liRhRpa4b6w9WDDl7dkgIv9enA6zCrGieP3gOzrit2QySR6Rs0j4QhRtOtAzsAagHGL10IkM4yAwdVMPG2uJ6054fyPT4BCI8lQlNp/xFOCTBTIG03ec+gDfoRPMOfchrrxB6x5U84YgM1kElYq4uL28e18+OpPt9Ipguc3DISUlmeBNps/LsA1F43oV2iX2A0YOEfn/cw2tlMKBq9YhV6dWt4u5Rpqfnsn6fLwjme4UrLlHwYSKhcS9tNhG96Bdc6KToxdIBeuF0BsfMYLCqNyJ1BCGzGUmEVqSec3AKzwhBAdJ2kdgL5LkQkvaC2xf4/MGEOK7DGYyjEggt6hXcYjRNBpDs2XEceOmHnje50Db2Q/cInpmfHabmtDo3FB8QvWfglL0SBnKwCNede/ZCZs6Frjv2gcoID/5gQtgseri602DAH4BbSjJAEMF5NxG9KDMudBn7wYMH8Tx/Jk32Cr1/+psP3N8J0X/DMQSaTyK16T4//Uk/kD/mQFD0w/gJPPjNGd9aXLuJxf/6mw8/LE/CLa9mqXkIF+G+v/1TF72AzKwLfdIPqtb5zL91kOwFAD/873/6ABzzXE/zSObhwL/6E+hFSk870B/91EU/ROGDF05lyFKqfsBFsxLNJvArLvSld/0AL+9Av/3TPcH4V+bSZCWur7uKRPPDBXRQSTrQr/4EBvSvzabtVF50lFM+NYtkHgnDn3w3pObePuHbKKrAUa/2NQ38StLgAoP68o1R3z5cWXeVfg/NJa4sINl/6eZoyjp1951OcXFiXVpC0n/+2njKNuMr+vTLZ4NOw8FOKXmg2LFw4k1TKbKKb77TKd8bxUm5sfl9dFrdQUXlWph+80yabJIff9wpHyZOG25+Dc7sx6KygzaDPDkW8CuzGbKHxzf06duXg06ii4/gzpt8JLbvOmi9DksmKbw4nfOsodVv/XWffB9xSq4/rjnUj9d+FLx+1UHLIdthPkWFN58dSZElGL79Z33yC+00jc0FOPS/3z4S4w87CBpWzKPLrDDzppk0WYLhqkt+2MRJN74Fp554HJMerkQpK+z/HBbwwli/R3YgumTyKUjIr8Ktb6dHYdp00cI7CvQI9DPxPn9tKk1WUPxSh3x9PZxCZk/Csb9360fAtz/qoh/VGY/gbAcY8MJYn08WIFYd8hZxfJEfh3PdPwrrH3cRIhv0k1PIcP7qVFpYgOiQ6+EUqXG4930+AtOGPt4PM8vT8WVmwM+PD/rUclKHtMbxScLBf7L24nz30056358OL2+6L+zTbxjt81qtpv74+wsdjQTBxf9t8whMP+gkMBZf+9/nBrztUkEuy+1Ff/xr4+heAW3w8PhIziO2hv7xH/7hX57H4vTs75IArL4RlGs9mk9CtpS4CBAiN5RqWlJ842//KZH1tBPgffYv/oqOJgp/8msvvvD88y2gAVXfXdv8sXDzdF+KBKwp/e5v//bv/u7zxaV/UxIdrLXWwnRd3R+SU8hJIxLPh9ByWP3S75gnv1Tst3294uhRmJ1kRitqkFZR6eE3fgy861SWPNbEdpAAEyktzFO2VoQR1TFMkFotrh00TiFnQVowYxouNWgxuZFA9bQDeZ+4WnH0KNACrckSLH0avfzOz1rvHaezggU0DuVWE4Ysy9m0rLyTgBK2OwYMRZXSstplY6tXAoNghoTImnh20bQQjwbKTz3vEU5xbI4CFqpFCMRMjPy5d3zOcpdOZIQAmPQBphYzBrkJ8npYlGuQ0oEo+pZB6WFZamOjlFMyLwaxJJSS9eWzGLQIBBj0pBPSDuJ6OBZHgRaamFrjUC2QPjn/Q7ud7iEWOGKrRbErE0Usydt1iLCwJHcNBOsxvSCFcl5SkkLAGYdKypq4WjUtIS1B8LSXwiUhNx2JG3UiJkZrMGsSkIDInYDVTw9LMNERWl0gSYDtCC0n70OAAOO+kRpC29Jy2oWVqd6KBCYAZoCQ7KrUVQw6v13jJx4FQlHPG8flRoUkwCDSrQCCBgBiOXpyyWaFFEA4CrWYhdiv4llbjKuJg0bqGpDQbrEciYhwb9k2LwYAJkuoIOW8DjWdWWNXetoZQLD+ho7DYV2CARAgWkHjUAJRegg2z0hJTLCmEAeLKHshNa6bDBZ73TWCQUBoIWYaq7KkJannRQwCQAGNIuzYtGcOndUqALuedhhUqrE4blQnJhIEDY2W1IcADOSsBrDQbA/jfca4goVu182FbPBOdQ0zdNKcC0G76iVZmcAAEDRgyQhkPI0DSOeS901GMk9/o5KO4VINIjCDAObWAMQBZsiU1UKlGLb1LkKiluG7VRRCAdrpXUIEXucSRNkoQpJSDl5HtUBm1w5tKpDOZFMORHQBGjjmtMWhghUA0SqHkqBIWK0WQRNZ5mCBWKLEIIuOJgKsrPOzmih6VCjGbLZ0BhD0oiEusuIBNglFAiAcJLS1RSVIsJ0MUTY6u0aIzjZCnvL8UBM9KgFqrKfBlk5kLgu7D4IqtuOF5uXWZUa7vFwGpCIrITDR4sxEs+mwMDHZPiep8CB1CWZvxHoKI50i7zG2uwBCxP31oEMuT5BJol3CRgihhJ0wdhAoNsYTrRQGO7qJCIay1byezselBsbuEZCkUgQt8l4Bg47l0tAoaLgDSiViHFb7POW2RUgItgnZbbWsBchGEghRoqZNcX4kokRfE9gQEqLuJp9LbhWkLXrUBApHSAK1HP28qeko05qeDKxqdXdlwJkfRoLWQgx7aqXstrSlUmwnGwxEAFBsgFPNlMyu+gmMg1UMniafgZMMHKaqUwSyVQG2GHi3GS5h0INq2ygB6gOQobX1djumt0OjKACyCMFyeO0HhbDR5YlFOZ+3QafxNN5ehMx+0dfeYyTVeNUGncZTrRWtDKZPE4azP8FIyda2vtGI0KxpWxAWlPoAmtSmu3VcDg1hOxFsEYXrObRXeu2UA2JEUclVG3Q8T9OdL0IVB3o6EDIgm2amvI5Bx/M03bVoKrCiXyqQFi5CaalU6dUzMWifpwmrjLDpRVPWcA12Y78Fi16EU9/hbeezwlbCgiISZV43mvQwO8mPGgJViAIEVjeB4D1gWZjpqqGmI3gi72jNBUICl3pkTYCsITSHkIqEVvfxspkmphyboaJk0w+VoCi5EjCSsCUvADk0vYd3nc4JUhAREVnEklBIEZRzahcrRdMcZ3m7YXUZNgpMh8uuIUgZGlSNGi4Vg+Y4bd86miSDSjadKsNJYyAUFbKVCspyFZerWgchkaKEumE3bMReIWGyAEFc8IJhAwPfeiYvNQAIWDYuBRZgvJ0ur8M7FqLu1sPqQgKLQjPUTwJYgAVYYBm8HS9fhA+Iut9wGQjsAAcuQD1yHUgCWGBhGYQo8MQgGRkHJfqxAkuUWgW7NppajuQ7vIOmzaMFuHB2PEWCwCCrIZVxVlm2WjQBCDB9/zCwAZyFDTEEQMOA6eMP9hoQexCdKh7Pd+AFoYzr9zDyxmQh5wlitsuLai5hwBKIQk7+g9KSSEKWEUYG818z310ga7u6g50zo4O9aYLdRXNGlCXKISwX8n88CDBYoiTCDjlBkf9Fg8z+8YQ3IRVf+P///f///v9/BAJWUDggHmoAAHDIAp0BKkwE1gM+PR6ORKIhoZHpDJAgA8S0t383nivtPHOcGTg7iqo7VPHIaK0j9On+K7+mvfF/DP1UDX3N2Kbs0pScgdyVXin7wBzn10/jP8ve+yv8k9kuja8/0pv9XiH7j/3fQH5z/Svtu/4v7X++D+t/7j2Cv8f0cf3j9Q/9W/0/q+f9z1rf5D1FP8B6Zfq//37/0+wv/Kv9Z///ah9ZX/C+lP6AH//4F7z3/r/8z+1Pwj8c/4H+R/HP3R/GvuH9h+YXLk9O8QP5b+K8iH/g8TeAdjD1zOzeYp7i/aPAt/3vQ79V/2nsAfrz6Zf+bwyvyP/Y9gH+N/3P/r/5j8xPpm/zP/l/wvPR+jf8j2Dv6J/g/Tk9i/7mf/L3Kf2H/+wwmfBkvODJecGS84Ml5wZLzgyXnBkuN9UctRz0vZ9ziBC+fNAel5wZLzgyXnBkvODJecGS84Ml5wZLzgyXnBkfqzeREPfZ0lOrtAvjBsz8TqXth55kbxHf40+eCIr4SEZIufyy9p9+NNt1cOdzVP338KS8e1V49qrx7VXj2qvHtVePaq8e1VOBpHTAjumGD0KBDqy3hoquHpOGvIZB6ZGYsJPrFkT9OgDEii+mmcGS84Ml5wZLzgyXnBkvODCndBe/d8IlnVKE8c2zj+ABMTgbYmwmEaNJAXyxcV2o4LyQzeOZnPKjug6/hRrMb7xt5Sn3VQDfaq8e1V49qrx7VXj2qvFu1ScWD5Y9T093fJl49qrx7VXjWnZcue0yp3Upt9y8E8CkBMeNG/n84q82tZJp71q8r/X8fhRVmGEBeUFj0WKxXyxOBticDbE4G2JwNevAErySYjpvKC5sY4hGr5wSB6sXLfLE4G2JpyA3N1TtlUXEftVetxyJhqzmcUJ1e6pyFm3Gib2oJ3Al4Oz+pdKF+xtVePaq8e1V49qqcKTIhUM2yQYLrnJo9T76SFGStj7t93H3MHQfZHfMP4HUBC1icDbE4GDyExL6e3GwYXVH0PyvO6Ishw/F+TLKpcV38fW5AyVlVfN4Ah/0mCS84Ml5wZLzgwp7thrQziZ+hmGsz8PbfNNmXRNj7ZZ+M6Lcf3z2rJcSVdowoDrEwSYnA2xNs5zxrmJNRo58vEcYfNfKUK6LegT9JF39WDmbaV/TpduAPBtTjXyOR5BdseG7E82WgLLrhyvvB4HtSxOBticDbE3xJuDeY86PjQQ2cxsVTUQW58GKZVfTj2JnS2u9U4o0yIYT7DmWfrcaZLzgyXlGw2AYaymF5tQuWCir6X7319uCBzCbd22T10p4Rb4nga+Lnlv4AIfNNMV+VyZwZLzbUpNUeakfA8acTd4qz379vI5B987Cs3v1edMjnI9F5jR3ulZLlc2moqa43aznNvBRcaVyVYiQR7PS7leO8S8D7geVtBo37dlCW7pm1BhH01OUY8CanUHEXucwWtYFb82wRxuQ2cA0yQJLzgyXnBhT4VdGmXEAzjlywCkw24hmcUiv4UuDo0RoPiqGzbumDIL/rWyGkgSb0qufX1pUcp1FLU11DNRFZOOpT4FdG7LeTdf9NKTzNgnvSUNnxO1QXUpbs/dw9SY8DWAphvKMaGQ++NSpqXl61oE/2qvHtVeLajJVgnShs3hTfBjMKSLHIDg9MoMP12ADaHKnRFogj+muiU6lCmDhRjcjDgp90iRfg6DTvuGqf4T408nxeGsrh1BTPbzyw+rwSeBticDj84efwVJpnBkvNtDirycQLhZVt4VBx1wp4a/n3AtEhlrPR6lPoFb0vIElMcxXL3dLgJ8793S9qqqmjOGpl4pkSeYXFDd4yMrVCiv/BgXpLKOYFnaRQLSMmOHZlZfWGqluiWBWtXOz0T0EzgyXkltj7TmniQCcRcTAZoEsiWMGUAuTCW3/f+UhnwyWC7bGhR+oPDF3II2tTGfAjyVeMaJuNsxRCwCzauTV0hXkgZqMptEDUabttHSJJ3UoiMleKm/ClkE7/QUFLGJ4Zs7/TU1UkRnjsyV7asW1Q26BRVjHUbiHpTS79ON9X+Y8U5HErYI93F96zVJVJFLgzPxzdlKoThGZojcc+DJebS+/f3GphkKJUKUusKn20qFVC1Wq1Wq1Wq1Wq1Wq1Wq1VCoWq1WqoWq1VCoHIZVZVJsQ8r3RaRYDPe1tBswOQepxR9q2kzyRc/GK3TlOVtc89c9dF2poG9DsLLn6aQwebu7LIx0Jc9PoD9Uosyd2sTga+N9tccZO9q0cNJ8YiNEPfPsyV4yARWGrCTfoawknoisNVxW/RenFzZs+NjMJvQTGyP1mnv17oLVzYbnyHz4Jf6iAwN9UfvLTorgC5vnjL6m1gHxJvQgmzIATlecDbD2buP6QxOBticFENVePaq8e1V49qryAJIVFvpDMzenhaSJV17Iq0BNqOTN5m/WCS82oa6LpjHgbYnBRDVXj2qvHtVePaq8gCS7127fGXtNOK88e/95XubeBYe6wSXl0Wjoz4MHAEU6temcGS84cNflcmcGS84Ml5wZMfQrpalJnElCjzxgbx+wiYVqwEz4MUo23VyZLSvIF4FEuGfBkvOHDX5XJnBkvODJecGTHuF/edP5m6tP8yZ3nDDxMlIYQOJw143lh4Jcj88Tk3ATODJecG2UsTgbYnA2xOBticFCTLwb8jHurluw14flzMKxQo7STH6uTLp+ioCS82p8OseGsT4wZYUqCZXsELK5SHJFsGlvf561vPpOGsd4zGgfQlboivX8uWiS6yjAxgWFCIltAlPYi8kTbp+OWo9Dr7AXgpWU+GkJITRNKvvAfPSsjG93+hHIVyxWK0yx+TAkGyTsC6KfOdnEmdSixFpuXh6l7hnL6in+CXJnD7pQqv08WmwkvKiHpYnA4nDdunH9mKMAo6b6I3b02itfOwMfSzEZ7SpXlpJA95wLPc0iwvZI2xOCs/y/1he08DbE4G2JwVn+XA6pJ2Q1UqX+QpkamIf14hisQzkBpZSSb45P2HnBg0cfl6caq8e1zVLl427J9qry/1hJeeOLGmRD4lQ2j/4gR7tw0NUzu/MR+C4MFf52yzfUezdgxu3DufBMPTKcVIdJscmcPulCq/d7s4MmP1cmcG9pzHIPvgj06k6Z0QPfPAeZ6LHhsHtcb5jJnNyXV93FpA14td1ZF3OrhNtGYGk+xl3cjqBcmZkk5AWLgUVNEPrM+e6/Tq6NudjVx/pQKN+znNA2K0zALwzwnQnNOnGJUJUTBwQy1IKuFlQO0WDng9zrK9tvbWJM/smv/xKTHRvj5LwiNmAd8Sgpzd8wJLjhWlvy08yJEJpDR6hrJxXV0/LYnEBgfeY6gVX7UzCdUdCeUJEFEE60lAluZRjkP130RwNJumVL/cKGMxgW19yKmf/Oes/cLqYWjPxIW6EBAZH/2ISfEM6XpiaXWqo0fC6z54CDJhwSeX5Ves8s7di1JMLPYvHeCSddDV1FIspqrxiQKeT3xqrx7XOxtETY5M4NspYebfSeg9/z9vZmcGFF7OiFpi/vfAPFNpKN1tRI2oq79zb55fDX48WuIz2pN7XY600zgZnjP9X7Xy6licDbtGaaPwxticbGA6+Tv9wB1PZGAo1wgLU4/fQ+BUr1UbTf9d99zvUFbTAZvynHzqXj2WzthLQtF0ZKNSum2sun2KVyZCoH5cm1enODJeeP0O94bTODBLtlBYZHs00O/5pl+/8L2b0YXfa7U5YJ0Y3q156Nly02Ypw5Rcgzy6P6VjeZ3tqFuZYhEHE7fjijrOCB4QmYjOFKFPBV+PaqkEkXZKW729+nxwigUX0i/UWs4OxfktwMIbjKTVxG/QzFJCsGCPEz/YKoGPmdqQ7ptFU7KKOzKPKWk9S+mq+r5DXKcAPvD7Dka7JTsOVnaYDGgobMua9d/+x45erJi4bv5AZDUUklEV676egvuyqz/HtVRrHWgmJ3b4o3IJRMZmEv41AoXvC1WqqTXqDYPDF3IJVMMhRKhMxW+i0PDrAUYiKgqXN7kG1YNV532RTdG5BKKBjtpUKp9l2YZnJmOleZoQZxDgbBcOuIU7V+rjYYA0Kzq9q3xFKuY5wNrqFWTXsfkm/ovT3Zzgq027Egtf6T4yjEPx95O0rhmEhxruwWwuopmQd9gSCFEVhqvlG1UyCS6XbyqowV/VG11ePZpq0V/arYuHHIcLf9w6AjXj2XkYg2qYIpkvODMZrmujXnlJaDQj59+bfez1pnBkw0peqoo+Nwm9Y8VNdGuzNSdYHE0ezZLZLzgyQP/4l1FEOgbYnA2xQqv2qvGBHcI4MmcGS84MmP0LgfqY9kvODDlHqoW+XqH+m/kftFeAxkMMO5Hw/6f/tJ7CJcNUKtVqtVqtVQtVqtVqtVqtVqtR27O838KF5SxOBtib94LfCDwz+54+O3YZuDnhnwPwwici5L28en44lvH9oPODJebcp7cdH8j1CuEEEmiwdQPfRQmA2tdlVXZVEE5BE4fWa8wTCqJUKtOopVG/TmCypJARfJRfKGmSChzFYTgpB9nBkvODLBQ7+QLaC4oW7dIJLmL9wHAWp1FHipX49qrx5KuRRJdkfE52VEgXFaQqzWtzECbghBdAm+GQIdk7M0GUvXOzPQLj/ij68RZzWENKLYlY9E3pZBZuhxEIINnHcTw+CM6ZX5lW5qSYamjoxRRksnFLNI44mqWQN2pR3Gt8MDINqo4+WJwOJTS47duKckfjemhKu9q9jUS5k+1KZ0CRgVnYkbCy9ZGMOjCw2pPXY2e/7Sjd9ZYik/5pMZq7BTLO3PKGIirijmq8YqRmZU/JBOGuqjcYWi8/ijtGoIrE3+HytjpRMP+n9RtJebkkOIyxclRj/Aqv2qvHl1aMcYnwkL0muFBEovmRfgqwXXudimvXHltKd8xLEzWhumiecnYo2/H6AGqHI93oCHjTvrSX0hyr4nD5g1lRKcqsaq8zcmUOyW9RT/hrx7VU5S3u+84G2Jvqnn2vapJJ3zdkZmbBU0et0FhayUfdgJL7Wp6puArixFPaaJIHlFjPsOEeSwSv3e7PCaN0tdm2qyu+4wzla4/pX3nA2xN9YJdg/wQ5JJ30Vf3Uq85WzxFDiLLIwAwV2BUBA8ucKi1zWh4+Ymb7B4c8yvLt5GSbp6ipiewI6saO+noj21qEdwtox1FQ9qv2pcNeMy3lflxbL2XLD5bW7kleH0VmVOga8e1VN0ld+8/qUyewfy56/OOfpWPpk2qIP3o0s8+EPZC3oKxNeA10cKjudB14AX4r556CUU9ESpWMd0Q/nlSoXZI2YPzrUK3WQhbrLwcjoHwOkLd4GvM3JFbqWZwVdTD6RJ/W9bv+tsoFDc0N6CVIdWUbu6CYnA2uGm4dXvSSTvor96GQSiMT5sO6r4iYKzMcGE3tVRhpS7JsYKtX/a4nc7y2El7o8nKLu+xASVdcgbWBUnc/aWVC8v3GTYvutzJRLPLC/licDYbKRMXZyf5KDJX1v7WBo/5V1RiO39X4QpTeR2twruNPu+TItgt8fmPCW9Dppns8ts38vour0txv+9+sZL/8V9jNk75aItDSS9H0IRKAe0zh90ogUIQpsKLXHWkkRWvLqosiKs1ZBqJgjqmDUkeNyD3mhyvaZwZLjb/VOePDLv4fy4s4/4e30VfyPH+G4NHl346KTvZrPhvrqOqxQHDzOmQuAnV1suotT3yKfiugbYomlXy4pn35GEh38zP74BlQjvkKlb8+OptzPj1UHzEVXlicDYmMLFNUtDIJLn2Bt+w3msIvOsZ0wrr/s0kG7ATqle+119vSbzhEoB7TOH3SiAlpzEVxVu/XTGAS1IKS7gpmlZETIFTA0t3xjaq8eaC4vBJ4CQvSkeepfi92OJcHCqxV6ssH6b1mksmOd6d1zbqw/fDLrc9q9ctO2H2lpE59yfrS5Usonu+S+eP63YFYML5iKIpuqM9wivPsn2qwRTK4SXFmlx08wr6ykwZxJjvuRSEOxD17vqzXUHV5ScDbEGArsn26XojnA2VuUiMhqlAnhtCEWw35tUAVvim6vZVn9J2XhG9WpBL7+zyiZQi3eBrzNyRW6mDicdFekjKvd9Gbg4LmEuZ9LC+CtMm36+9gUWNqrx5F6+fsHcWLVajXCosiqJUKtVqNXaU+CulmPOG643a93YWqAUKr/HXG7Xu/XoOj5yF3UBqtjGMwy7leMfEAfPlKu80rPX64dvZjxAfrnbjdr3frwgQhCDsZLQpa7OCMmikDl4fzb52184TXjyc9QdrR53/OEAtmXneV+bNKrx7L/LMfKDICQ+r20tmSqZ8g3GF9F6e7OZwA2KQ/TN5j2jQqpE8Ol72fdiNtkleF86zMlM71F6bHUpuQG9S3L/sSQ34HP4MqIrQDbEzfmNOsvuJ2r3VkPZmJWyRemdgmJvuLXcFqbaU41W8zjPWk+MoxDpt6+T24xlnYsNWENPliW+RrdMr3ZzgqssEEiNt4GolajcUhezyjimATsPS50xZkzw433nLSuTf3fJiVUI0MUi5RzeAGYbYnAsedRuEwd7hV9kEl5wZLzu5M4Ml5IiL8sePaSiSHHlR0GIa33iKPKDCtNqh+zXI3xS7Z0Hs/oTv3jsnJFF8JsJaxt4k30OC+RCCW8zSJgbYmkkXLKIm8+/j5lFfCShTOQGnnp5OWWPyleMlpuN2vd2rYQNrkTRRxRuG7njmvJyyuApUIO3yJ84dVTuSoiGfB6LZv48WHRVH7/9GSK6zYN9QmJmqJIqGRwHVFGcGS8niDWVvJmPAl4hsAK+3dbO191hhCoNERmsfIW7H3gbYo+neKT/I3Z9yAR7CMjrIoU2hPRKIUZQSadk1MjrRFUXLToEGwhJqvqP2jLCA87u/ylfLwDKEK/m9pbRL/aq4F9YoHjQSqsiG2iDc+4Ml5wZHWH+E2/oer0vcM+DJByxF1s73bSWSjPI98AbEbjnDtdSCHfF+J5wZLzgdZ/AFvpvHah7pQRA2KLs4CPc/0E+cyqSNx/1swAU2VHLL1gitoG0pm9GAq3hUOp3D50b24gtQrbSiyYGnRfUGuAeBth/CXx2ixu6p/H29Xf41gZM6DaX+sE7K5e4Z8GS3+uh3Srfm/Ckf7n7Ouhme/H7VXm52mty0aAfvIMzQQcqs+CehSuTODJb4CuH8md4HJMR99VT7Svu1HPMZH7VXi0sM1rVnbOc21nZlHPUhzj40Xx2zXdQszjnQOCkJhfV9DVXj2qo0e4/q6J6MsxLk5X5XJnGMO/xtLCi4NHHyKGwTGUw8dk5I/G6Omro1bDxb5bKqVwC2v3eOycek9ZDNJKeDHDPa1lFZrFfUCZxqcJyR+N+yJrp/tIMmSC2HfHjiTfBMJBZoFwzx/bU+kqgJNrF5ixwYFSI/kVg+s/ERV/kyixNsoTJhEq7vMRT6QQh4odwf7Lm2ysT0a7Jg+fwQx9MOfKutVwuJhIYan+y5tDOPiyNE/PqlME9k7jlJNDVGoxYbEVhm00l/db3V92GuTseuKsT092c4LZkrxloikciY5MuxtSa5E/yG0qWySvGWiKw1YSb8jc8FQlgVnDoflpY79F6e7OcFpa3WnBXjC1ftVePaq8e1V49qrx7VXj2qvHtVePaq8e1V49qrx7VXjyAAAP6fqfztylvzMe+t9b5oAAAAADzKBoTIrBUAhWLMtx6y8otM4fg4jfvui+djdof/+BM00UhpsBVeNN5AAAAAAAAudjheXfVQ/VouH2jCtUVs+aslZse02eLvRSAp5FbyABJChZPbrR9p9KMrMk3Rcee7b5k0UoqHbE51KeCe0vkbKeHRxOo7KDeeZN50PiM/k6SpARTWgM9iWU9t5+1o3RK9ANuaSxD/f36WCXeR9Tf0Xt0O1o4t5xzVxGqTfIPXJCXHV071Zrfo9970uR/TeJN2zS/XDWLX0xGl+g6WMwt8eaZ9SAoudoDAbB4zKpOIk7aMfvcE9dVhE5aIm6cyLeWgck6bUVkLtCd44Fv/cJpe5zz4WwE61OhIYufQDt9IYTa7yBb24fq8GSKPm0sGHHqqgpvwYIRv9A/IijIb9xOdojNg9nolowAAAAAiDnPiEBhcOl8cL2kbEeVYW9NPr8ZOHBE7irvYBdDhlFCpYx3fgSXEvPJaV/NYOdWtenTgQGMzxDtpOy+d0mWwsUqzS4isA6nMtDQmT/H7IzyY+tmfXSB66uJIMJmttcEyl8fZnuVB5n8OKAcRx32h5sTJkZ4knMsZMO9N6ooAAANqK6V5/9eHvjtoWDscuCv58oohVhMZHOSgaovffsCb4W1WeByuQtjRuMQ1IXLYZPap4xhN9Xk74TZiPQBsn0rK/Cyr6Ey9EoAAAAb4I7LHSZbQpcHdpPX6PzK02jg0ElLsBjqkWWU2lDQDKKFSxksFvX6rTyjpJyfqrT1nVhqm0qWbJj1HPs8CkPxrEfuFHDFCr62rr5TmLGksW+B0qDzQDq682uUvvwY1IKXaAAAFRsViZwok4bY2LWttJS9zhUuyK/gLJxp6P80G0HFf2kZnnoT552VRk41CRfU5Qhx4iZ/8GoKc4ZG6U7D0N8RC+ut+lGna0c8OUyJdD5mxsyIGGx1gHL/BZElHqVXO7QmI+B5B6e7Mz319RkOcBm0ye0BtRR2FnLWOgAAA5vYZpmXkNOoSqOrJA/oLvrD7BrcLICPR7Em+P9aNTiioVp+5k8lcuIZBtj8SqZnjj5wmyE/77C9yDEY40+qoNgrdgMds+WpCp8CWLgykoCfdsF+03FopYpbx0DSG0CAAACJX1PkdK2ZSmaOZT/MmfIRC0NA+4JeOURo9a7Txoi9iLtqjCQ+oUER3UKGhzwJHfcmNCPwxGQG5IxPP4q/AMxDrVV1tuLsaopRDVP6dtvqh5R0mS4+t7A0iLFIslkxk4S2u/B5eAAABt8UnECn5vK8/xv7QiqJBkJ4zT3t/6dvFubod4g6VGHwcGy7/8uBiC7+GL5OxgwewxoLCZhbjgjWwxwXpALNpCJ0iK+7Fi2R2h1ctvn3jckg50Eyatex3yJXDIlDAADyvzdLpAumwkc/IqaN6G4W1nhdaisZDq/vsFn3kvLz/EZblvnRjGp3FhUWzvPcBEWfCLUgDWZTLzgbgZSVIqEazL2ujmsz7lEna6jv7CHoNTcRGS1pFAABppIo3UvS9vsBjZds5TKjNi4SFHJh9iX6mMaKNfiwz/nuL1h1/fgErzyl3eRSBP2NN8c48hw3sQQ1l+MohGPgxYEyulqqd7HnbcyQTJZi+ljwjjtI8iCcV0ZMgQ71k5mlOzkSJKWrgaU87Bc6/XQFHpjVK1gnTA7YSt8aLnrLnL3eeyCSFNSIzoU27jdzTH/4wsZI5NoT6THEvBMmEfDhKWOrgxdQGBWgABpT3j/LZAcAweANlJ6rVgwWyphcjCcEvSeUbYJNkdODdGv006CXxV61F5Xw+VHPS3ZRRLNSGv8GlnsDnHfo5CTWAC/vP8vQrK9XmN3rIX5EQc1bspytDeWDKpvUfMNBeVE4UugAAKsdgVowvcjsWrC4YuerYpgcb6vyADkMYw2RVlgIEQMB1bvTrRSYBmjq9vycZ3vLzP3d9fhLx8/4bjaf9d4n8PIWBOJHVBOWEFju8ij6ihcdc1h653VVNGcfC2U4on8WNgU+Er3BnDrmVPwAK/uTDGOG9XnAGGqG6B2nQ+nwLWEIzsade0IpJR4NmCt7RTVbMca0vSCPOJPqYD6a40PuhAmLQ4nq32i4K6zgHjltABEPLModUks4vZWHcA8R09VJdfN49djNDAkIYon/gOyIrqzXFhXhIkFeioVsCTAsGF3iut0cCB45RlTACOTJw+s7yHiSgufqKUgJd6E9QPQ0BxHg4AtxrC/UDWvKmwSSw2P3l56rX15nFFjslb2GuedE7Q3lLnyTtfaUD8Ccy82fGulQfc9IqZk8G73BeETPT+By/nF3Y6D9ZFOfKLlVDeUwnt6jfyj5ZgbhVOEcYUYfRg2g/7LJrOoTXADpd08/TUeON+uUR+shLh9t64bEcnJeOpBu8LNIs/DqDhylOMqoTlmtyJvz5Abxr6D2di0g5gcNEkF6ATWoZV86a0oF7C3K2+FP8KgtaaHgP1YHyPZye/CmxW3qBsmNPbPtfBP8N/+zt3/7//3v9U/qEy/7BycpV+RfMv/21Pur/zXbb6V9lClFu3GzHxobqn5tErOgLGt9ujc10Q86aGIqkuCoWl/kVXz98gn2wzf6idOI0jhBi+tZ38k/L4qcf0SNksiDcDMNSEPj1sLthGSANHmiB3t3eKKk3U31VJZg1yTrYKAhqshfTfEbtBWq4AVP/0J++uHZrtF7eIqdAdwdpYALk7b+4W7e7XUGtnPQ3h/B5+CeA4bWde9fbVjdhatWBJWIfFejRTtVsFF3ObKkYF2145s8d2/MJVcKhbGb4nFcJvMbsiqtczlXgl3TsMDCoO6HKM+SOChk97x10JAAqL+qdyql1m2KAacnUQcKhktqB2k5g1uqFPn9tGGYt7MeKSig0QAFDUTl2tt28Wv7wZntW+619nD1pi/guAbwFS2cqVkGJ7S5bX8D6Nblp48eScAi66E4Z3omKijNFuBKa8ms2WZI1509bAeJiBMh2Iybc7Vrjrfn1OcHRJOL4k5hXi7NkgBUgJgvZB2E6nGS2eOXzqhIECYOll4+rXL5AFLgp4qleHyr3o+RTyRQJtrVX9wXGlmcxuPdMCVSyfjTKvMstIrHVya2c2TBXVkqg1BUmw//CA97e2PTVL8JpTv4jjMgKqk0velm8K3S/oN57Rx7uZEVf0qtTm9VTyHLbajbKtKci93rpJIN7gvOB1iftQ4KP3xnyEJ/1/c+D0jqQtJjT9IzhscFlq/8VAh7j0xYUM81KNNNG1/ZXe8vdZuhHr0pWbXIBJ+xooXyHucESM5VQQijzG/fGpOhp57BzjpvLjm8f/mXEVz9t3KxcgRt40xWqz/irFimDLAHfFtK4EB8K32sdMTbZP8wo7b769ikquKmvvNT6075AN+9yOh/Aq+aKaI3WPgyGBDRuebnFwB0vcgqEIXg9D0Rw4e4FEQ11NLIskK6vneTMCInyUiT36Gp9Pdg1ihvvvmcEtsqq5xbwWiCtlf5gJAIYPY9MNjDEaBWr2QYxlyXd2ZVLLH2kyRRm84Qpds1ksjvtJCy2rLP8W1GGNaqqpdTFU2XxRnZwzaATwQh/sLzQVQIeeikoZkDFrLYy7U+70Kqn1eOo5PVEer/Pu/ApTtNDK6L6GKUZU6xJYoouuzAs98aynYkZbdszr/x8pVvmOIleVu54FMnUgQ0PZDEAl6I23moP15FnLcqih/YpiXpV1RJmmANiXQfZ+q9jvx1JF7XbBGLGLd9WedT91s9WjPzJow/JOjeoBj/cxwZT1eWgi2nKGquGCXnp5Zn/dRRHkNnZgWX8EsN4o+r8sJA6njyEgMHLWbo1Fb0i+cEMzhLW/+3ZUmJQH5Wg5sSfXsyWGSxT0g8BXH/acSXY+CIHmX3OVAz0R20/bccz5OMen2424XDWEulyEcFaQG5/uM9PO+pbpBrQk2ARZeFDtvovnI9XbMWhZisbSHGzzc+jiZVB4p6gCIxruSLqj2UvBJw0LvRVlHuyDFlE/zo2z7h2eGakz7ixDFh8fMAB5FnQQhxt9d3WNG089afD6L9C7VH5VFJJM2esjJMU6XB4hIFv2IMWsnNtcCCiHLhUjmNe/f/Q3fpFwUrZjW6i60wRGCxx8Jrf0fGDZJkftAUT3svpTLC2ygkrMUbsKZbhPzhUb7rdMLx0PRNaz64oAj1h/rR9j4CkJqxlG79CGQz1suqAWI2CiXqb5vG9Nt5SVeGsfKH7JDs8fg50lMuQYVw2/K/+DaBaD/D2ewCfm4oo5KbPbcOKJcihGkOFyp/N8CHEWQL+t6w4mYRYaaRa1mWh8B/KZ84CXuk/IN4qY8HnitL4Yz/iU5aG0L6/t9HTTEyDHvnCcRwwJd94yyhoeXe/lzZ03V7px1QXwZtPTz9wtWf+xH67XNVnWEBP89zielPZeO8xueQMP6S0DvMmba/aCc7OL4KH1K1BL1dQVV8NQM8bmHGPOrWF3F0RKh7zDSsGJVcSupcc+JBL9+x3dW6K5EcJt7FSh6/3pYx/X8Dpn8W+mv7Nt2nPgCH4Dz09fLK1GCYyoKTwoUdubySnl5R5ihsQ640Nt+hNs0H3RccGhiTioUfL0IYGCrB+n8TNcyT3ySAR7flyM4AU1GSRJCdzQo6nAdqEcZYAdNxNtwZNVfHHcGaERgqksmtE3nZuW8X2kFZV4bHSrYndyrCWe53epuUxLzs6RhAnK3jxWTHP0JjYhoARF1bPaMR1+EOvidRz4KenlahGj1F+z2q6IkG1h5Vi9hAUn3tdmgXU3k8uN3PAbdjo3p1lqZ8gSnam3/PGraqUDECLYYVySIp0LPUyXDwNiTWWpnykwpTus1DkK1dbWZ32rEoYGHmjk4xjVDnsTR3ggk0PDfT3J11ZDPXbofIwxFNSflx5Do825dTl2qN6JqAtGm5oHdC+KHcFQw4KVX/wunOC4VzCCC4H3pNCr+EmL/e7vBbarhb2XMcNZbKQEGgASnYvVUF7nKluKtPLkI9+hldTv/VRbXB3vC0LBjCryUmxuFE0CUscYM7DXwJCOVM1ZbET6ctDrsxdcyXiG9G3pQd8eGenyEy7kAwKkBm7QQAqDQryrbzXgqTLs7lK8Ic1kyhqvcMEiJza489FsdK3gEM6oMSG2rSWAsSiQvyp8GgGZaAJJpHQ6Y9hgRC3Ijx9EjZ91a46k8nkC4Y3eFH+KakT7l2DKNN2O9ImLMOc6PR7TZzEExRiSShobZp8xZsHlB/L+OnfMq+GCi29WOd0tUTlB8JyDl4Rc31fMmizL7oP0l7RzP8/R7+yQQrMgMkkaTULOiKzAUV5UqMqstN9+aPtfDHNuCb0N6GZerheltM/9eBcwIsR3IwXc9vWwo6cYym9yWGRPV+07o+y4kxMB20nWSvAGQ6BKIH/J+UL1GkL3rjVs9o4q6oBV5tcUh3cnuhk91brniv6yRrk5mDVAIzBkv8OTmYb6ga5eIcgdXmqK9tkxXGdZoFA1oePkfXGcS/89wesS1FGmTm8TsnQ5J4LOn0Uzkhx9JjmzvvslCsP7DWub+AON9YFMFVxVYmqHREv0IxExVOLC2dav7sbBan5PJs6yX2yoKuC0yGEYg4+HYbg0a4paP4aGRUjNFYuaGNIffvQ2QparjlqubT2fHQJLbonH4byUkZqzwjumtDvzGbADGPw+c6fmT1T1s4YX+1a17XPX5IO2KFJPx/CjmVjcLuLB9yh4BWNL77MuV+x7gVVJ12mQIjSfNhC+m8uaTPJvw+TyV29E53ZLFCtrbD1Rp3+w+qKG5aWKGkXYsIFG9QN4D7B2GBSOoBgVKdTfEhyHbes/jDCZAd3x2/66lp/0GaPlsU4PpKcV5AnCLwhpvZW/GlUE5QszB6LTZWM2Tw3YRBg2Ow/apPHzYfT51w/OtIEUoiJhA7OfoZduAjVaiQBNE9w9o9zlvfN12mptVd0pacW4QrVHEUMSMpFt/TO1Lvutclr/eOWqF+Y30WqqwUEFXDsMH50ewz0xggRo76TFax5HB2zsJysx340E5fivUufD7emdLW47LS2fNDMpoGFtToDaXGgwCHQuMawD1ParubeCZVPuRMhjIIc+I0VMEmxE3LFUb6l15s7J57x7QQIXB+dKmDE0QuFcBxTYf6XwCXEL29SDm7H0XNaX5qIxI65OtkGLwvG+02+ZEoUKL9wfABRNMPWqBKuuFBsBh1PIyv3ytlCPt2pVIFwfRGO3I0xDWq05bD1S4UnsRd14JCAOUKStsFn5SglDx+x1LBzoemz0xVbaZUw5KZKAAAhsAAAJf9kHHCpHVn+bx45CBctxT53GhmGfymkvn+baW6xwCKModLo0FPiOnIgBa2+oY8Snr3ashBGX4u/zfF+y80IVUCO1/fWOAFweoRAFSPY5jRp7dtXLGfe0wXjwY4zYSnMQAVp5Zj4Z/HnaXY1sg3t0jNcEmmlf6vX4o2yzFKlfsGOsNmpOGaKFEGFujjzVeoT9gMpYAANG8c0iOxpQqTbC0UoYUVuIoP3+Uzbby9akdztbknP7de9hHASbF2k0TkvHSpZnnGg5yJYH76r9l/sM6dVG4n7s9BI8U5kkfx89Lxfx6t+1HgK4kJIpNriVXQR08qqBElF8GRt1HHvDrHirPO/QopIThmcE7qcIAAbHEc4jH0Zkq+9AXILUgRzpXJLUxoXj3ikBMseo1ig42KdeprX7KRXf7xO7yxL8nRihECbR0XAIvAAAKuZduJOiyFi7n/l40vCDwazfqx+ShQEbmnFjUZbebdzEt9c3v7A/1++Jl97YW4EN8Ipw+ovGzMwlIhw7QVxcFj19qnA+s/PRa20Crqnj5jJJEm/+E7pnOdBh0VQN6MWWLUYv2HTc6lV/H21AoFlX4jdrk2ez+7ipLCYMaRbDwfgWobCsTUVYexF+NDOJsbuiOS74obrX1eWBodDBF4AACfCK4g4G8JY1XWh5xvv3ykICpZVAEiPwUvMWseGiepRX0EMHhoA+0vKFQzeWZ/xdxgifbSilL5iMf+U/SRmFD3+T1lCFk5Q0SjllgiWY+o2ZehhSkz/fpYOjIBrwsKAdiX7pnpf7b1zVGga4Dkrtj5w8bAhOcoDIESmm7xuXgA8HAAB5+sBfj4vJBb/tAIsD0avyx75vFXwAlhGnOLi0b8ee4x9yrv7jQPBCq0FTZA2YqLPRHBXXQzocj+MD+aXsAiNxfoBLqordsfaoo1NjS+DOn7uH/nwYIl19z83wyYqp/5X/agihCvmm513PSxfCh5dsOo52WIyUWVdUU1RNrG4ayOY3jJ/9fPTe4QrPbnVvOM3AW2LzwPnlU17AkrcDor3ZobBSyQ94njYUlMy81qHZOrboAjBgv8k4mXSdpu2BLkcZaJlpPBY9D4L3Z57vuJ3c0oKNW8zzmBz9pGNG0/lgoMhEd+tKffwf6Sl+gNAgnEcDnrN0F9SIdqXbKdZ++RHFoVITJ3mp+5aVTQ82LTAakiC+zL33t/FVSkTADJS8kwxFMDHxNpMl60RvVLXYtbseUwtjGaHiUb/L3GVdp2lMLsQinFc4DJH0zQ9KpQUkEXRSfZjWsCFvK32ldqi32WUjEnbq125n1xd5GUFmB0sJX5tKd4yJ0i86xNoGnaxD5q2x391Xc6AjCeZf/asx0LiJf54q7+RUH8oeAbyKfB0/+GkGvK0JudqRv+9TpU9MxNDShKRd1e8sj4NvOucCqNTzdtoAV+PIZqs4hT9C9QHoz6/u3ZmIbJUSiGGi0cSXhRZ8/KEWtYzsWNZnMLjWC2QKWFIu1noFZOgA5OI7Qi0JAADDGPQHF2t/EeHof+b8IYlWbOfr4LJA/VjTwMkJuvx2kUuqoocqqiMdolQFLvx6kzciDqbbQ5LSp9DYBxBWZHfpsCye7yLnerLCoLrNAT6mvl5Ro5axByj3MpGu13sDFwhiK2GZ60zAESHD4nlOaYafe6LwJjpOvg2blihclP/C7Or9Y04pzo4VPQuTTL8KdWbeveNbj4xgGbvqAL430bgjTPWByC2yLs8Xmmwe4QHMM5hOR88oTeWu/dB/3MDpKM9Uuh4vSSxzbYHxnomkEFqGCYtjDxgBSAoGuxBstymITEP88OwPFjZVImMu34wGWuJeaJ6euYmuYvUfVHT3pCxFlrj8gcdog1sxPUIV6lKMIde7PCj2dEi9SW4zVjdOFUUoCAuIKmxOMe2UhmAkq2/6MSNto3QrHkFL+EMXJonzh//sg9LkmkItHf0ebHqvHXREtOraQYxTHMmebZZNIj1X7N+ypAFaa0ckF3pDjTezm8axMKFBU8Fn3ATWJkcz1sB2akOhF9Zl7xKECx6x3yYLPBqEs/XZVoxEIRGOoFk5wr3J0GU2rYADuVM182FNYdfyalDQPa/chNed41PTSgTOaChjQpCjncCSldRjyMcWb5dSx0iGf9aWgSM5+7a10qxeLiPamhFT+kAbImUljCf3DY9s5CrqLEjG/VovXNnwhIoFkw2EvVU40IsoRQzaz48iHBdq8nOGiJfZxojHK6DXfB7AwWMgkN4Olat257ZFq3nQ90PqwQNl/Pi/2FDK//fHtjbPWZmpxHgPy2s1SZogsU12ll4YKCuH7YkNOLP+DfY3DPAYCXMfVLRcMbCvdzBiKXMEQt2KI6KbrzxgEjRQxWFQRftn4FZ7LYN0+YslEtcRVkw9BVkjYD0RE51ERsWm/D5+SyrJJNuEuWmABUeX4AC49bkOSi5oWwme4c+1GMIgteZmj4Bl+DTTT8aA0wSQ9TXRpmsS0QwN6sTMLMbZ5MBdHKupPdTLEwUIEcVnZ19Zp090W69OA5otyMbVYEVCUyijjQZ1HJCsi0XQRLGhAwv6MvgP3cnQkZ/4Od55Vm7vGDBGXeGAk2L2nZcwikRl6z8irn6w1U8suKFv5n9KpikivkEcBJQZ5zRbal+gAObSH/G5G14DtKDgxCnj25BHN0RcectqK8Z8TYkXkQnFF9aMNvTPzZ6RM6+MfHmTdfkHmhiztgxqr4TGjeSUllimX8By4InmvWMx+QaN2+DTctgUpNoHhRY8XON3IUydIUmDOig0FlxxItGv0s2XRob9+GZMmB5VNRudKX1IDMUUtHNmn0QbVXC1ZMAj34z9Yj3XBZ6wzEo3+HoIMzCNJR16un7FR6FO/B7GDIOx2r8NVLLV7S02+0kBeVEu/e2hN80SYxOWAkANqiu+bBbP71NwMzBpCpAdA1j2XfJxBnbZ810YweWYBRwYRc/bOp5fWO8Wex5R8+H5LkIcf2kEqIKJkTWPFAExNe+P5xHW+uqAfWV9SPomX9TF6O3TIJcU8iDbLh9FGHZ+VN3LvqtfVgC+veHy4iaO5vUAWbqb7ff82olgRzL3xthiRbPj0R56x1hRNvjjoB9utdZq/MxLATSN7LzqDX3fTSG0cVJ2B2vQhW5ty+N7zXDu3i+5vG97mljrrdbVS/LA8dbbTHx2pw0zn8ReSvk9PLKUp2SPB4f5LHxE0cGh3J/LhREh6z9OJApdlNdMIQUDKE2I4X3fjwtRx6Nre3ZVNhkjN8cw+qT3Nq99l17VmlTskfRn9L395URxT3fpay7/fbgDbdrzYSDah3/TeLfAqtmTQJDdBLeL4ZUhXfTrEEWlYVBG0hVB+91AOZKqYfMg0621rH4vNJPKYTpTnGa8hjDHqF4j9aFSzTF60S0NqNmG5AcoEbEPYHwep4UJKGQEfpFGbxD941rWEpbgKTq9uLXZqJ9NJdYzryfwWfxNI2cKy/zl3uo2EwRiYGEU8YIZj0SV4WTpk2DqNmi3gmtyA6d2eYuun2QKdS1sgbHvZwFZthraQNRNhsPaO13gzA4WaP6psbgymAUWU5aASy3D0ltjNC9P5CJuW1PlALBKiLAIm5bA6US1Ena5N2GporJqj6Vhoas4P6V1BOEp5Cu00QhvDvnNxDRIsN4moSwDx4l+n3o4u81CT8fODzCKcjsrZdytod3IZ6pGR/WOKCge2JY8LdyG89/TELKGGUNaory+AHYr/qByF827m5X9FfW5LznIh3ocIAJ00pyoXDPpDydlghmD8xfwGJcLNS5yX3B+ZexJbUJ8jvfQhosjzRpZsOOv3zbFjylyjSDLXVmoj+Byrzs5dRVeBeKfh87o7J27G4KO9kjotzkK5NMqD9nP9NY+/1bSXxoVFOFFKaipe6XAiYujS7ZC+y3abiume1xqPia3A6nMb6c/X0jGa5VdxvCDAjejun4P9CqMe/0WiXc6k+FlJMYj6hGleTTgEuGZBtJwmtV2PGWiu+BzDk3zaUwNkIOD2GJe9FhJrOoJWp6SWjBs1MDh+pgC5A/Wi7CaD1G0Tf8uh9vtJUDMpxdx5ihR7VhNLZPZoo7qmZh8tq3UbFDD2INA15NUsw96F/YJCJFr834fF6RiPWYBySfFi1SBUjBeMBSABLtgvuQ9nWRehEXqevUkb27NER5oUSDFwUiFqMuy8YAoMT5mwQiQuyfn580vsk5m3mokn7cVHYvE5R6tFK4tYfuCsEmKyYpp1Yhql2196J/M0fAiaislDCvn93h6LzszJXwjQ96q/AL981yZdSTAnzxIK3glTPLGNUHCSSrLQgP3bMy9CZsHAC+vlN1BGH9gII7ViJ0FLmMxU0pkBzEbVkuIkllejiJfjfmUuppw9yl/6WOZFUenyq+c0LjHMduUXu5YSP0vXTVwEF4JphS0nM+dndXZ+wVv+T1wAV6cZBxiLdLs8gJTOeI0Olidd1vtF3BeK/UpLuxrdKzqbiGCuF4EbvaKG5DrRALz0s4+XurOytvU+gPutZjUGdb4PsR84iXJqq+J8byy+l1qtKTFWuq5A+3SBersdb/VriSGNr8/zwS7QnM0vQx6DyNz6SGqSGf/sXuAWYLDhrV8D0xpmeLG9nRQitQpMhIN/O1OCl0H+Lx2qROj9EcO82MgVADN22jtOhtDLVjGjrJZ2Ku/DEDxR7gPGkwNKYOuV9aqRgUlUZvWTsaEspgFoLN46EIwCCBwMT51HSnzXLRkhe5IGo3APCgjy9+Sa0MFdTUwAAAzh6uifehupcsD8Xk2iVNaZj7qlE9iGONqAKeaKnVSFwW18YjMEN1DxoN1T67XSMM9IVZP4JndwrN16AVGoKl5po0+0QvHP1nbKx3Kc45K4sWuOeCe6+JE6n0U1cYiyED0tfrymaFhhXSnGhHTE4eUeSzJ/yXqfZLkJgX0hfrDqc7nPyfupbIq9vPF6onJGv+4Sl5269RDdrHV9vwSZpE8WyZvrScjx7wOvEQtH03fuP8H3Fl3kBkVDLsVmIyKKuZ6TDaX/e14YHU7gk/r840kN3UZyuQ8jCtkmhVFq8OedHTA9jWIu6bhJh9ME8gN7SmUMzmda0bCaTa+AadoDc5Mxek++W6ab/g9ArGlSfh5fGDdGc9huEoxlOmw/ZaSQuIrgwxauNnLr9jwCjeLRSqXVHIPEpEt00r3BUqOs2v1h2sKFfwe+rC7LmgtRVJL2jPz+0Rdyb8G+8n+sf5yVAPgCbbjFfnLrWi3S1uVf8uF+JKwX6xUyKSykLgddOO5hdvIydJ08G7FVYdXLTqv2j+zm9dJukq/xOKhcqeSQAVL/OGalTIeH4K3pC7av/dG6PIQcae4/oGg+St+6gKQbo7FFt7K5BcACJES5gGwB+APC2ZuL3mYr+Tw6P2bjDTHg/m6RBkEuJ6TR9xNlQksqBu7K3S1hB2z0F/hluw8RZMPkh3BRDix6LvZAbmWE3TkIbaawsJ8nH3OAmI1wC9+u5cGwordn6DcZW7jQfz8hHw7ApmbNNbAmRzyJTYVPB/dIFlBj5k0pX2g4Trwq1YxKS71zN9557ESzJDDkZP9GdzzMll7BE2Bh3Txh11V1oFMgX/UXd8JghXdjqHj/jzhaMeNpncWTOlnABMkPWrRQHRRs+Djl9iXm6QNpDtBXadQqz7G3Z649T9iJqml/GmMmnX7z5EUDUGFUKz/j8Lt7Vxv7siQ48fBOcrljH5ygJN59jpF5S/8TizZVSzyjBttKCq1Xm4kn7I5eQ5GSliG+rWlAbhqD/EYc9Cdv3mDNCpRmc/9rXi0EirNm5cxiIERi3wVXTzl2ogL+FRvU2+KDy64C2HsWOk6zzHo8aGUKEVY3HT1dIG1lWFEhF/ZcU003M3N8JtK2hTIHwByDz5p39oWPmZkl+hfd5WfBAy5dhN6OWfuSFFVCwHzCfwUix0Aqd24JFq5MZkqhM2jQiDzB/I2U+KEqVQrognEn+UhME4gzohlsjCFuDzrEJOMS0F+dakR5TdrXRVWSCjAK5NQIs3XyjjxEZA2eXcBLbX9IlTSWB4YTSsR0I9H0aWbDZLFNSuNiiFfSiQrRUzPwMgFYYOPIxpTEpuRKzbIcnGviyeH/SjS5pwVpJW8ImiGAwjBNhL95e72NrcICMDtsl6oMzYmQUJWEoJC6CNbvTA3TUMTGZyROvvwwmRjx3lk7hAZoX6qd9o7PE8H7mViXOgggrU2f6jIyW0wJS8Pj/C2lN9IRlJP5pUUZLEc0Zdf5cthIcIThxpNtgIjkHZuFNfzYVhi3F3dS40QM/3vyDOkzTtd1HvsE8V+3lrXZ2mIIxom00PLVUrOlyIGLe3EVbpawusjvbYfD2FTrWlkpvymtGGxvHcFzsvy9V+tw8JIfpmwAZnAgIfqkvLx800/pUPd9BYfOyJlmM+ph/YY18AflfdUr6xIFDMLA8IqpijnhGtELg639M1m4IYaYWIpaqxa9BDDjBt8POtc/c6XEOHy4+k4WAX5k0WI8Ksw5CYGEjoO8CLkJVadsziCYGuaYH/fMNlT4E+YT9eSWx8fhji0PmZeF+lmIUIwKq6Yl70EI4RQhL5EzzQfeb7P5Wv/rYwuMvVxnBfEjQIkv/37QcTqxxREGQrHhMM85+1MNLSSLI8QjVOt68kQKXpxiXksfcVoUzAvZakfLffaqo9UJwpWsmYAPy/VGmL+7+XGLF9GGSgIcwQcED8m5OSpMp0IQK6EWvrc2pvOx7YCB9zx9tCyO1Y1vQh0+3jG9ygC9bw9XefYYBlH9QjUcx1PAZiMi/INi5VnpeF3EqTrY5ngADo3Y4KUF71e8zOY1N8rX/9eqzhVon2UahurFnxscNFFVzoiiosM2zgEGaFyq+cecM48b9RF/txW1czksIHcaeGfaXKm3sAFdUcab5w2KKlW/MDX9wfivt/2xuwYggDkmS1HJs489N3vuhTHqYyGEylDuQk9YyZzgN4vdQwbfhGVz0dbDled+6G9UA21/o5aM1cZFc4GNVVlqCm970OOnLUahmwDYFdZSzmGcDHEXmxpgO9lZsK/OrGORbr5haZb2XFI6hzqdhT+JkPopTlGJU4/YFnQshcprOpKvnqlNutA1E9tRNKWBVfSw0Blp2UOzXMwB8vTUXvPC0XExo2dMbeFAa5xHstPrDidpDZKVD09ulF2U80KqkPSZZKqX36Ln4ZU0RB7g0rzE1m0t4KtX7kywh7aRs8xuRh42MufGKB5HqDttP6AecJuGQ8OPVP3Q3hJzHTplCNDfSpG2kCWqD1VkxBEpb2nVo/yPl12A7PHX/aCoNNvQo0jb1xqC48j+OnSqKKzTt0ym6xZh+6TbysxUVzO3jttYrLxO3gS7DcpY82Dvi4rkTiefKJFBWpX0r6iq0SBZ3NxaCfm4kTqKC1UaGseklBz7+mJFXBeMAPZMeBTrDRlwMIwgAvJANDvLymYYcwFdUGOZYlFyoBcHpxt926Gx/3Wx13Q2/NZ/NkyocQjadHaeH+aS8oFyWimo88TKINh5VEoVukXb5XzC2CYgHa7podkbXQDGMkuDSpety0Kyrj1WCx8c1S0MAXJrSL7kz465EHhbpPv+tw2RCMlZYPgJySFyPojcYgQSPWiiVtNylmIprmPryN5L8PGYxA1f18Q6lq8UzTgK3/dkmPjwbtCFDveCBQXMhIaI8UZA11pmoLoZVNhTumCzyYgDRHmWQyf4FDzU2QaoIbfQ67/N8vnFxcMJvlp6bsUBNq3/0GQ7lB1F/r3tFbJgEIo0ZUm1yb08fs1B5dKNblsUq50sm/INcyoI4WS2YNj0FD5gC/cOa1UwAUTuxHGdFjtXF6DUfQYj/cHT+qAbLMAxUY8QiZDNkw9jgRr+FW8Izp9YNvIgAAC3qhcRkb4nwx5d5MMTr7MjGKZ0O6rFQ6axbYMadlfrf1m6imZVZ75FY0KpU1d7DEsnXkeIoUOzDY7040Q8VenWmbemPJ3fWRpGF1cMiVGinzatA93deAum8ZyMvUYTAAP+Ccd3fFfYQuTcw2sAuG9w/bhCTWJwM27Rw55/FzZdkhZKnNBusf4AEKV6PIOFOQ5+kY4jv2ngeQexWdjSgCebYNmfgNEbbulT41yCNRltxwUoSYtl457pifw/9z1GSWRlKDcIpccIPg1p7BDxMiS0PVNKjZTby315fQAHhrXeN+B+dSFYjnPmE2tvC9eRnzWJX1vjq0JSZNsELJXVu2i3g+5aOKCQEFeSDKwH8yACYlgWmvtZ6FDeF/2yifoRTe54PjUSmAFczxm1Gz7a7r4tfgGZ6w1FrtrEHb7dnBKcdETudb4gtmFfESKBz5lfjClfHASH8SoE285rpcV2/wRuOS6QAJv2plC/nicqvxoxxXQWMMyBvHToA80fzhtb/gK2AiDLQ8kpIH3kr3iFrP2BcsBwl+i/aXMUjFqe8/ZayWzPr+3nM4AOolt209obw8K0IpPFQK7V8cGIXLqhK7opENpcdJbieerMEA8/Mq7SRYo3Tox9vmW44MC/RdvrrAsojs7PNKcepb7YMif//emsSlMazcOPRpGLbsBWQ+IA0JYXyOPrDsfguGWZFc3sP3MJHwUze8G0eJfUOpJ/Huzzh4Nl1MHaLxdKIDlGfzOlwgoj6oG+gPYyzzVZLxMvBYHgzd3RmULfoSUZ+zH4+LZ1sd7c5DIQwgcl2DfSsWywR3AsrDdK8EeFHU3o67Rk1tRESrJLfl/lKRHqQDZkrnq6QhrESRUsI/e7q3zJLmzcYj7zrMtNWwamNsjfkv6QmZOyVVrojCU5e6/iGu+ZWoLY4guDJjbiKW4uFO+6XwS4AWEouqnwZu8YCSSvYuMxt9ftgdCDSMuc4njAgEoMzB3C42oA59RrUE3oYoPSnFONjJapfxuZjMAROyy8tdil0ljJLsyBmVpYkQ0ykM8F4JtIlg6ydIWljRuQ2IRZ/urPN77wyZIp9zqEkT0qQXK1ERDvOelR/m+/YSiM4aVAr9vuDo9NeVB9wD0ZDCb08snZV4wbVC6BZPi6sa/C8gk5hO9aWp3L2arV1NRhsz2t8HmCuygsaIjdSLgeI9OHZT63iMJhwZ58RXdWHxsCFkrHzIAXD6wsA19rtBxMsSOkN/wdpMO8FnlUx+c5CqtzmLMWm2CiMgANJlOESa9cA3nk6PFe793qzybzb/YbJxeD6eifVtXXnE5Iy3ifw1P69TulXde0jP+uDTlZqRxq+PC3TrN4meGK9TwUyWaELm9pfPX4XxpHltN0rm6X5hSTvcqA64HAzOoUPD+ZwfdlolmBWIpXFfVJCUOqT2J/UVGa5XZmgwCf2o+GrK2SSqG/AERbVw6cWYTYLQo1L0k/6DbIt/hAeXMfFVS0QBAm4OluUdQocubcet2kaa8EvybybUu57YMOhNyeR2tp8utZS4ev3iTlJ6Ee1dHzOlB7IP40Es5S3yQ3cIbwZpQPMOcTerreoumURoC9uhpkJ7ty/9H/L14biJ1Y8w6cH8OOoveQrCQJ8FVe82YiNCmBOnvWAgFmHg7s2ceefCUw/1kImu2WCF8VYgIOPxYVhGoDFA4x3sfg/KyJ8Nm37kAI6sybNaCJOCqkv7HlEkaDyAQLJ5qgnlOVozzxL5OX6ctYnqFi+KQB7ULxwE8OQCGbQDhfOW/u0dC39bdqnKQwOWY6kXvNa/Ow25z23Ph8vs7F+7hVGV1IDGfy93O/dLNcqd1SC2FKAJvUUPtTDb4C4NCPnVQuN0RRILSOx5viODgB0nzg+5aFBadhxhRYcu6S0vgN/nEfzFdAd0c8Vsn2sPahm0JAS9mrXdhE4/6HrG4pKKOxzj+8xeCZVQ0G7UhIEdCZVkoVHWxtgHCM8wcuJPXAT+bZKhqhnCoeZwNiGoioEcequcE6e7IzyAa5tKgS7dK4hEqdR204gLY5TpTtLVOLNI9b4kpL2sCrgpOS6+5QN76e/m747gLrkmC+d47yL6D6QQV7+hgn9iS5lkU35hLJiKl9Qo6nL9vLABjTvAajjEPyJtGufroN7tr2baXfSvmSwdmjOH9e7WWJhs1feqTvttAL9YihdctR+QoBs6OJwHXnIhaRE28QGkEAPqQAqBSH0Y2YFe643pN+B48c/CEoweuXBvlRGGmiect6JxIkwsGqLGHnZu1UQ7c+pk0OPPAGdkbhSHTtp8b/zYlP27RZlnyWMvXBzhTveex9XbzIej01pWYItY1J0GSOqOAbo1PjbMet9t7bpVhdFONCfh3664Ta3bugVfR3zGVfYocriY9tm2uSY0THIFMbyc4V4E/T3flnWrBGhoFRStseyE3ZsMuIF1IJBT7NRLtmqdVdTv8VbxgoherFMpsvvMkHBJR5nLjCp8wy+jNTfUE1Vx8bqvK08sdUm9Cho5BFNYTgycVImSjtk7GgDj5dlSKss/Rv30FSv0r9qxlRhwws2fMj6XAvUMcqB0uTPcgxr5mi7o1VSChXcxB1hwGvwbQWEuDsnMHtcQ3E+zpZ73mmu0UanrR1mNN/2KpfzzklcPrR2DOSBSWgOvFj9Y0jSaL7b9Ke3q04HTIhHt9/uavUmP+bZxDLL4FXB0A5Q+dUaKB/RgSAdgZqYGHesWmn4ifqV9I/V/3T1/CNY+yODKn8QloPJGwoHmn/cfvsAy2rg/oqXQFlpAH9m+BqkTTbRqOKA1/M4hddGozk+QQI1AOYjiN5is/pLoEvUPLdsa/1N687iBpNvPkwhcSRkOOEEzTVH2Os/+Ms7IfGRsFtXJEkhVwQYBIZuY4KwLnb5z42x+Wur+UHNKRbB7vOryPFHIGezxmpxy9xfXiH+HvmU6wpDLVw3HOC0IGgAaU2z2ah6bbG/faOuv5QbKfWqvuNgUlR9f49/6RKeRB4VtyIRZnI4pSyw8JfbWmgER2Mxq2CsdwiAWCmjsQ1eRmy4Uu2oyPXap4lNXWVty6e7dk9hAzX7r4w8l1AeuF5NbKaZklH9l6t2PwhrTCXxeF/AtNydfEHQs1ey0jyX2OuQRs4W1O88SlhZ7EgK4hfhPkwR1k61hfJtmdeFMOMZHYNWQNBzb5qIcuxaHUMV1BEsS2rzx4O+LY8nJnYpgburP57NOh+G+E06ELEgUUAeP/WQsifpeFAv7K9Kbnl28Q+9HW4cx37WE7u0aGhnrpZWkV/ZaH122+XBYUZh2bNGVBZm6zys9FIvFANkM9NS7YYkExBRt6QQq6XOn3dpcvIU0chYUHD7bD+/ZCrPEGCq+GDM1Mi5r9K2mq++z89Z003eChn2nilYx+YQte9X/lgpddO/ry3fFxTnxKeF7bBTtxsZlkRFpJB2KdW4ic0LbfjDl8FRQpKaa9r8tI+FWDORDgND9FtcpXY243odUD97Rz+CvumIctpUBoLnzNtmhuyQEUz6Mo4o/qp0D1Z40FaZI8BOcWVu4EjBaLODq8+SXN6wwnA6uJBwD9M/XLMJhq5A7dmf3AD0Z9goD2bsU9ycbI67egksDRzdvkw9460ICiutA0NTPlNZ3ECedwuZKmzTFLdvxnsXv613nCytDPkVWJxakBwLdpDqC4xKtMDZPOcgoNh+TQzl6St4EE5tMtqxKqT7SSOq2iooHZbkeWuXkHlcQWlBUjl0AD6DX2s6peYfohd8+Uv8iTqY+5ShfP/Ivxb314uwGTW1+UpOOlLMje/pPKRkCCBglIa0u3SEOirNG2dRSphvBcmwad2uTcr9mI6sEsw+aJ5UBoheW7W4rMxQdvqDFfG6G0Uv0/Bl1czpGYXaFgUVuWbITd+Om0A9D+VAYph7MB/5a8eSd/oMFYnxpLo/qYsenxOEZSACFBuwQZJEBEWPcj65hyw62VmluqoZU+xAaxao4vEiPb47vIeh1FYQISVFbaeaIxOfBvc+HcMRqpyAs/ghi1mNKV/ap/30UKxnoKE4RmFWdgyUTZaaf4VvOzj8IeML2/XNqNlbO0MgeHQfaKV0KYFNWr6KsBQI3cZ2t4I+b3SigEEsA0NDwb91/ifJ3oiUcgSCwswJFApgYunaC83yKRps38u6aQJS9Q/0eR/Ofc404xmc3MQcVMFDPNd4/zAI41FIoN/bFJUmI9bztA0OkASsgskVjhyhqwJBExjBfi1fEnY8MhC8EPjFsg51noCg6QDbASxz96fGLGg6uwLADmBmi4NUZ31CBjZwhwAOOg9xQVAVLMe4kwn3Do7kSSIwgY1es51MYC0LgNoMIbcBnHI/vPM32LSt9tYU88v/mylFJDAOmESfSALXNjKBJ4fU/2aAoc3Lo7eYE8eJM5BG1OhKbI8rY+PewxJmDkzGHmHOP+rBj401vlKN4nO9tU6/NNjOxTyF8n3csjbpy8OUWRV/+0uslwqh00sLayvL/zO/xMS3HDeHW4eZUUMe56YrXSYrZwwurguMFPuAOrhcwTMQ7MpXi7skDGqtuBV+aUgVjvJSJNbKRy13F5mlxGwnnSO2SDqrSh1W+BodGSRmLQV+BmTgaVvIWTeoNJ3IJiAVhSLA+fnyZ5DW6E7NtgiFINmaPgf+nn2Aegm4QCLkHtGsn9Ow1w5VdLhVQ3MOd9YMSYrKvGn4KM3pOs4DPc5opHn0fzXUvlcR4+VvEzgAleSIQuryxfPfBX22rT5IbdFo+FuHh3grVKiX+LqB8aH36uKQdWpOpTOto2EMvq3uTmpdSz44tWDdTtidQzwntQZ6b7ejBTHyQi2+bJGm9DnZ06G3m1y1Oj8qpB6EE4tlBT/Sb21TMfWOocYs9d+noPbrebmsd0Q9q3uGJcsoBHT0eWU0tBp6eG13AKR6rJs0okGqfpmWRoRO1wZJPrf8e8sNtNl+/itSXcvrYoPOSr0ipHtTndizE8Ti6yTrP6BxjKM9951gl4n2lzpN0DKaI28cDvY76rD3NDauxWg5BZV+VfHIvxX9/HhOV3B/8gb+NigIKt1vYdw/37w0UQ1X5z2HSh3XedVC/ev0z3Fao281R4GYDtl4xV6mbSrXl0epJOTnub1JXdypZmagFJuVGuWmcwdubHAoODYkcxfbg4mqn7RPvy+43u9zp2WgRqcG+plO0CyxsRukm0qLTtL5m3zcun6uzYiHidMcOCe+RgdnhyG2068StWuZh9jyZqKV1PS0FZ6xQicCO2rfc46qncyN/9v4ebiJBMAf5c4vR0jB/2x66+uSuu2cnABuNSifMKpG1P6AuDi4gz5eAOXXxPgcayhVAE0/hLqd7HFTPCXCJ+8R61KQfukCM34VcsYHi0tRT8LCOL1lt1zdzLGet5FQHtLU03uUW5UraPNacLYYILp4BZqng9V8C5VJ23lY+3QIAkvSTu/TDiN86u02QoB22xaqshHM4707WpAY5bK/4gAa5Y6LMhhgEu9klRjojSig1XXjnuB2bkLc5FljHc2ve3NQ05B7EFNHpLOAPisPjag/HHoveir48AQItaqqheIWWPVVRriXFhNAzNl67yK2XP00XwN6M92PrpesRVH4hbPMyWnci6Y+Vrer1V5lmWKnoQ0/krIYSKSaLFXCWBh96mBe5oTCqzFwuiCB91JpCV05mpBN5e4GcDcGOHJfD4SaSIPmKzIzPsQHoRZvaT7gDq4gNniTmEa6G7PalCtQ6OBfpfSEp6UAfiWQV966Y/H3QMIIf3O+KYJ+42rVkvEb83w7zaFqC9HNXHzbhUbcBuEqMTdcRJ8TubuCDRvMGigRiCOqaEdTKdiYW7BG8+0A50ru1Qd8Qnc1bMHdY9ist5ATV8rzfmbrdwGVkCw9DcjdbqhHoq/TbHYg1YMdtCecw2p/pjFJpsePq9y+xB07oFC/afGwIyImQoZqY5P/gr6ieeOy2qZ2EdBp9ebdDswNxbz2jpdo/1gzwDpDQAkmB3cLC+lSY/Rl++D+V4l49FzAbnSuos5vSoVlkDmEiOl1J/mTUgr+BqS5P8EGImcW0zCs3yUXozBFUohbB42bBFUBGD1XnseGD7BYwf4vtz3HFb4YfG3JOsqmLqnFBRoS4FGiSs6Ftuy+ZaCb3T0HJ7yH+ZbHgtu9mj8efVcALhN1ELsSUhCIgKwhTwL5DUdUzBZwbGnCqg945fHguhHjLWXuWT30cDhe8DyV3haZoVVnJjS0941je7Ww/DS9YHxG0wjkTpIND1TFF3422lPS0Y0ffzSue7SaFkwbQy3xd/4hWRbZwOxTDxiBY86Gqp+q0vQKCJkYvAw9jwrOwt1bdiUAblsX+Bfex/wQ0tZvfAvi90AVPiaP0vLnsdl3A62GqiS05AgdHbubYK1T3xQ5bbkoO52RnGB2Ilni4i85lcrCyedgANhjrcz+21P2IiWmrnAYjNFLqtbQgnK3j0H1Mp+8nBgEryZkDPvTiXcBLAjwiW6//0P3BAwVD/GsSV/eOX6do4NhGpjL2FIqCvm+x+CEzlPiFwsU58ANHRWA5alhxClb0/ubKjW6K9QSJx9jCC36KUAWn3ae++wm1t1TdwuYo5d+y4i1OrnRmcTWixmXY2Rd/ywCsLhtm13YPmeU9y7qbmlqo7FPUI9Sw6hBx3a/ZJP9vpajxxMnTTfZc+FZaFOR/Q0/BRVfwEnHnAkKvh7EkEG9J8sK3on5sExvGkCq3RjWReaQvUuzAnx1UW2InTbyQpsZMeV+g+2pPw91T4g4hVARhDtlspjPZAhTKffyHRc1uVdCT0Zz8Y2j+mOzn5nyfOqsI42bhAQWWs6wkjSbbQQej95Cckvafm10La+gqBQqlHrEp0UBkkXKZdoN53s3OskEV330v6IprGeq9FojO4v99jzt6+f6IkSSY++rJUdIBAB7P6YAH/7Yao80Mh2yoKhnwKLU8GdOVjbR3Xgbvq6H6LBnqBAiEES/b4XQgFc1uYtmcoo8q1I6X05pG/GSfckxQdIJmCz2L993C4ZnmSxxnp3Qmo3yCkOPurq8HrSJHO2SCXLHlcPNygQf0iA5jeiw7mOa4ei6UofvsL36Rmvrui3jgH6lqRlRpQC79//3gc11zzpuf/Z+R2YjO//I+Ov/YAqGFip30f4xbaWabga6e62atI7veW21RLu6LNYyoraCXLlwqLhe6nl2MRCpnw8TnTS7+xScm20BOAhJKnRL3+L362w7aEW6JUB45LCDA9ix30kYSS85sSbFwUDxwE+Fm2uutmVDJxVh49C9auTQPD52q4TbnhjcCAsTAaGXEmGJsv37wNhffjrZQv4UGkkcfZ/7vIIEK0Xe6iabSDRhvP7psS04HN3n7s7sPNP0ZpA+Zeyl7DR6JgV5chkR17TTm2v4g2HOcMBPRTdr1Fx9fA7vQ9397XkpHqD3EL3a+88Hy/KlCWOFAr2xkjKm3O4bRxxP2Xyguxb/0lCwisAKIGixLX+6YbuDKNVvziZmnU3lo+4Dj20STbVxS5ZLY+B61ljMsJzM3xu9p3t4BRyE8tsUcseyJFhrBx+pl7rPIR82suOc/3JtdeAeuHpBPzlTIwdMwAFdIVcwBQTcwC1Jy2zzx/ROzrW77PMjxbzGKcbG3y/g4IIqnPjeH0wiSdwwBJzpaRJt4VsH5yIoxGUJG9aX0de8aTBM7ym5Q+wScvNxXRfHRONXixph+tZUBwIo98qhqER4Ipx1MHoSEg5aTXjxO5bRxh8uN815+7EH6SwyUk5CQHHafKSuwoKBpdxUebFjHejDU4zYaG20fjoDZoi4D6xXKKWHUuUxOChJiMFg+uyKO0m7IZwJt85b/RUg3B6xnI/luCx8TL6/L7VaydPiLMOUoiDbkC95nAm17oF637D1ECPFWAr0315Zfwdjnqr0I/Wunro/4haDezmMAfQiGI3RoUpR4zt5ajf9u7DJFTIyOQSPL88RevrkdrAKQgV1l6i1+mterbzm6ysRTScoGsNPwrEMdW00YwdTEJ00bdZDZYFsD8EzEVVSA56uzGRMUfd/VT4A04l7EN31oAJCkcKRWcgMFu1Zq4Ql+idtpCHpwRLjZDfj6T2X4MlWuZs5ZyxCDG/LRb5+lpGGcd2NGbWqjl9v9ft0ZdOSiXsyzcOu0K2WASp22DZyptUF83cfLIHkcjQdjqI3KSEeiEUiTN0MCzi6oriHfrtVu53wGYVWsjOR87SjKg2SnCi+2bgGoBg7aaS6YkZpiOoM5cSHtNRag4XCqQKpI+yRZwnxAJ+7TctbYQtCYYJ3h5LsxpeRoE7ObCVARc9MLlCoA+bHRoEl1KndYy4JKixIjSIMwAXsfjUqnQAmsABMt7U2ruqIGk3uZsvVu6qFP3zt9H+ILQrakW96fo08vQseUA3gZ4l23fiquzLYic9wQpdc24jy0EhEis4nvqfx5CSAAAbCAWLsqvS+74jhWPDimV5Y/5U2fsuHZbuTCMjZCSuIvnkL6nrYuH5umbihA+Be+qhhVf18bMIlJGK5b3Z9y+BSU+V+137JskBWixK+IA+42d3aeUC/+iJghEV+eHpXBLbQljD/XRvjV6QpyWRpjn4I5bkadCQ3oyr54LmkeElcu0pCP29BT9mUyDgNRk7wvtv4t+YHMsnNMwOzmTE0FlvqCO07cnU8qKN2ha6VZUE+znWprg53g2mnbJlY++YZ8ch03GRIWAf7mS3vQewHw8IjY5X/BZ7dEI9rlTAOIrcx+5KMw2AJYFBHMADaQLOi0GJ8CtIKlWwF01/IduIBlnPGSnOzQqsPoKxNZUR8xOWWPCyS5CugFPPdI4kbAM/LyIQUlC0WQpCd1R0YKByFT1ylLSgnGwX5H7fq5s05/bUVIjBTuvlSupVE/QDcVGsR+4a1Dir7R5yXkqJWPGu4ZDu/0VrsmRJ9toiyENMmDJFDcHM/tlk1T9arMaS8Zv53DqFvFlRMP5cWJxBD6AhY0/FOFfiEW+QxRPDtV4oRmyzGD96SgMFNv5u5V5euTT1AbyEPJU9crehIss12ePduyXH86em9MRK9BwWYlTSu4cts5DeTk6LP778Yrq+DndZrhuAWUt+xD0g5FHLer+lhsgPcmYt5ko9gpTVt8uy6vp/50zG/Eer2Fh8D/gHHFq/mpNSIZ/zhFy3GPFr9Gitm50hQaqKFMfEK4ajSbtNQ4BFuib+f9DgD4cEltuyF+v4q2CMzL4uqTmfxdFgCdypH/wuMAyQ6qtNd+FtZSWd36hH4dJcEBe6RMtpnm1ZemfNIoWuHqhFZDqE0wgPNQB78bmp/cnuCFA4ATZ5O66rMS5W2PczRLeol4iMDF/kFGbQJCn50y19a9F8Q0hH4//MYmctLr9PZVHrV4KoBPTtbs5SAnYTujE41MzN//emtUojHGdgsm8vUende+Dn/BqagBQv9h4j/k1N+JnKJnRUvAEL8oGZEEViFV9uw3VER9c+ZuggH+YahTJari4EzTdyMbK5kwMItl7QACBEXQy6wvQms+ELuMwxYHQGggxD+EYDUdxs6ebjlRkTeO8PzVs5o1gDbVDNmRR+egu2vSxne6rjA1xgIF3R/qOzxSxoh7CvGGTBmh+JrmiduNM/Nat4jEU0oJzF1JoSxSmAhFm55waE4vxve+cqjy+olNtcqoKdvJSMpLzhDR1W2C2EVh0NQc/Fu7IiMjH3sf7Plw0p0xrTyQ6xK+IFWh/CI+VXnNfNlnp5Kh+0u8MiIIOyzjg/dJdynZSIlwBszp1GFu/OddrucSuVitPmo4QtrDHpWXdwNnwBvFYTtDr6awVCBz+Rew7Te+/j2CuCWCu3w0OwXXqap0pU2jp3nr6XmWPtzbFNU6Uu//i4n6wupkJhRVt4FOqWozqX4vv2uqtu+MHj2jNzeckYFKiuf8AayLgArBq7vV5E33+u0Cm5ddpFNdCrUT6OiWkGghD3ap0c6s9cRcJHN4Lc4evIgEGSEKElcRFUQTmXg/IP1I54/+Bq2ts4Hxs/WahuNehu/AEBJUN7pkGuihAo4Us29gmpcdaSFK9SA852en0CzB4PfW/xsh5KQQvjTwNwsNWGH6/1eGVsmLRN7s5QNAudOR0c6jvEADYhZC43I+HQUlCxp8GBSJy2lDSKBsxBKd/Cm5aljWmNL9jqGLGThKxkGO5oWOjjlMSATkJM0RkQQoemWw/D7RJcJEOgFMyK8ngVPcJLS8dBE47V11t9qEoBU8MTwJUpujwLet//Mq+92kOM3RiUumikJqLqe03tpN9nQAFBxpjsu4vr0vOMcO35si8G/DxH2ScS7F+mRwjCJ4RKYqOYH9/oQ86uojzDa2TTt3Cjs8i9pvJ5zKh3y9z1UAFfmtd1RT1vvBwHttW5YDvesmJ0WAItCpMeYxiNO/IZcEb/p/vR2zUKyr0dnpKYhu0x4O1GxDenvmi0JXyIhU+NcVOphVLYghQceM8G2fIWu/hscDcu3vuiwpDRyLSUkultqDElJsbdwGPSKZePAC8ZZ/djmNcBRZfDGPkk/OWxTsOGw4T5ZTxU/Ql4XWMOIj6ZfU5q/kJ76ynvkdAez7UhxS91mUbig0k+JEFiKlUdxFI/GEWL7rTXe24iYsJA7wb8SzBhgKyyIgoPfTw0dO1VYpuWx/PtuJ7PT0hfSdJo5Z9uwylfBrYd0iNqP+C6zCuh9rgRuilIbJTjP0lXs3/kaAtVm+m3EB4x4ssp6x5rqNAC9OfPMQ9pO9NI+PZPH4KP6p72FppfOuWWyCE+AqAmHU0hi5c0KwyNyu5v5XaiGiMYyqzEsn8vVbDzQ/JiHAIDGPIV8XkaG7zxnJDGW6gzrpk2x8vazvcaj7bB6nbXn1gJxCjdzIpOUUt3ayhuIjv9D1qgIk09XPtERq1k/7xlkRfvhjXD75LQjBFIdF38yDPdS3V7plGMn9AWbaBAQ7I5JMRAx6/ecOYTJxj7Sg0TboELq9QyKuSe2uYbd5maDkSceWcHAM9slaSeRBkC2dZ4F9U7vDaHSOtdQddgMwv4aD4OTRSKcrtvDn7Rg9QcfowJhwLqg2WVE5ODkT+7PH0ElpdYrs++58/i7WOAaih1k59sRgJqpApFNWV7+gCw+VXnRC6ZUZ+Na5i6CLzrsffC/u2lY/cZZv2v1UXSja+ZNV8pvF45jd/PaqXCy599o16m62Och73icMH5q/GoRAvYnSmF2nlojixAlwcm6ugrNSOKoq9UERgTFW+Dg+c55dotPGEZSma2QM0iBK9PAmrIObzbrN+MgfSNKNJnDLgAAAnrVwPVRzTT1yr/8+ru3VCznm8t98cQRQZLxwgX6jeSUmtdorakLP61cgyKv0av0f9YkL78cXMc0OEBg42rhDjp2ZU0FABDNFiZtjCe60MjgVUOiAkNhDW+fYo02dKPukQKxa58K5Ci5DR0ROCCIATk4Qv0cnhfRo7qUllzDpuwruTrRdHY080k6wizbgN19yig+jNR3jBFkPxsJNAgtSwt0NJKH/25sq+n9uiHypJzgi8LI5KohSv5S3MZJcWyqqwVjYTf/2bZxB8xXEVajN7xx2wv+Ilk9zrkTpRFs7cFqoRbwAC4YiTMSuGynV/votQmIj9YRxA1dv/Cn8QAHBN7Apy042cUK+6ZQ5VeYrH8+pX9fF+UXjv+pzT00wbIb8DXinRB1OGy7JO91Gz6Cnq2PCPQcmOEpltaKzUgeTMqMj7Qb9uJuH/Tkz9QIvHQiLnhT1ORmZu2T+4EN0E8/a8pmV1ThdeKXtzxy1ap0YRg9LdtyOtuLXXzTJS2UoHe28NYnVfOmEm37dXrQsLmkV1kgmg1/6ccqmCHXwyac+aIkACVPumT70EinorhlZ8mAJkpuEx/D4iaXSAEPuEIDfEN2uNN0sgu2rlCgrE/LzgnAo8hTqQum9nzma+mGB3hCpBPNH9WBNeTkSBdRIf4f2n/wFtWBjGcSQzZ1Qd8zPgGtPrPX7cPUgB8cKQ7FCcRswQAl4OIvM0xIf4Ad3nOT9NHIxdgnSHzy6uf9hv2pxlRMQqz63VUp2yV1NNkXv8bm1Z+VZVGqlzm4xicM1EmXtaGM/IobVFUG9Wr8LsTt+kmce0W4bkfG2ldXb5cZDdtE+z1mfa5b1fpalaBe8tstlcrZYIDqzXjTjlTFCzAon51lVZptp8XNf5ZK8fhc/5wBQ4WGLw/hrditpTesgnVOcDbQmMLw231ki8BxSVqrOt/2xS6pBaVUcAVmoj+fO0rUDqUmacjOgeKoEGh3esC/yixMv4KFNBqasA3O6plt8kqqzfBSTBpZ58u6cqudDIYLDorst80TwoKuNw63FICzDQFrv67t7/IUNTZmwaxiABIKpPRwq7dmYju5B393hNz4swgsBHyAaqoIsxvyY8C6lgz9IiPWPa/zXaH7csYawYh+asjXdDBoMH83a5JG9FAbpv7qiee/oVbuexYOhWmETRglvzIUNj9Sl/i4z0jilJsOs4l9JHSiJ6uq7Q6O9+/37yAprEYUN/XfGwDcqigAeSj9jHjzjJF7S42gQslEuyRbM2+6Fh7VmgJggdVgx3hiZ5eWujU4lOUq/R0nYUSd2mBpbQO1Ps4w+c2/zQ17d6B8hNsWOSTUVPdeY1FgmdkHbfGb6jcSfCQ3zSXE9MkJwEsi3X8eyNkhzwxPTpQ++xlYf44r4EBc4c4/kvKXdxuR/pjS7KZBEeiHQa8QZ7cCQ7DTpOPH3f7fhKohwOZw+ozy98NpbOHp8asnjIlqocKMPwLW/OZDEWYu27FmFuTuw0tllT4s6WJQfiCKWmlC1Dm1w/HsJbwQ0Xa2gT/eT078fCsxOPqEKn+Xmt6b2s76VqwLlb8+unU03Ee3Il9kDDeF05W30WaI3d6PER592FJolRp6qF7738tXT84RdCAv8bVG0Qzl0iL9Quux9D5M/fEpXtkKo5qO5o4WMIzU69oLoEPoPVnrnXH7Hgt06OdM6NvCfLIFmwqx9jeK/7qldoqEfTJL334nZ9zkh1R/TZySpQMJQsGjOPOxodSFUbkprcWNN1JDZrshjHrWdZKt6yQKlEqaREikhLTjJP+47eKppY3p6w7ePBRqCZQCyMB6vgBbVXpgzc3P49zfyMAhRmo/bM8YWQlMDpLs1rnlb+CY9VgBKyyYUc4BmH7BZ8/Ok6/HidVgnl0LwchRnGK8dLyvwmD6P0Ifxny/f0cX5i3/fWEGytpRJ/yje3YRUz7jVyYHV1bBanPGsGyQB3+wzbA+DSv83Zx3H4HbcV179M48XIkDCkDo233WZL8USwwSTaG2V5nLs03kJr9h8Ls9/uw7YckfzASzXjL8Mv1FlJy4yfNFGTCkhyKCLNQrnKsEnnVVQkhnmCSV5VxquZqdByILoNlI5u7ziGqd8iE9tO3xFLVomktvUl8ZflOvJBqT469OVytd7SavTGaE4wXZ1iRSQQ3l+roWld3gZaGVrZWsYjUYxgXVc3EyOdCmcPa2ac4su37rv1UORzVxcT3lHOiH+a4XbwZ0Y8NnpJJ3fjIGW5/4pOK+X8n9CySt6irQG92zoVFzo4azFdWfzJnMhDYYEDv36ILjHvQ0WiE8oYMV1I6bI4SgHKYAKBoEMNHPH5aVHTGLU5KMr+7l64umRGeBhjEvP68stvJH5V67cDvcV75ks6T/r/x35usPNDrKxplt2Nt5O3k7dGT9pQCvW4tLkSxTiesow1dDYcoXfG6UfRduViL0iA/STyJ7HMj67haWrs0O6P1hGY9OU1LtC9loxfAP5Ni1bun02JKkHmI3IXe81WkKtiiidxDaxmcOjbCZaNqb3a0Xu0FIAZnsNqd2LD418tdjYin64H6gl58b7D3xaBAlMki/hUi+2BTzu5oMKnMU4BnJ1VoOmkQoZJacnFGbHXQzacpYyA4Zh0MXa6mB1pnSWhlfkDr4L+1/GN6Kip7zM0ctb1cxjPyWXPMKiPT3VMavyLeyvSFb0gggEJ1WIAjl/8gosrzHmKfYq9NEiGV3Y89AN+XYCXAVHbcfusJDQfm3EnwMpIMde0L7TDQJCDWzmg+LCE8/caHzz6MPTaYcaiMzGOxh/h9avxyy5GZFQNSG/gm9UYQngB8Z/8QVr0wfsBrMDix2oI4c/HHsUsqnWDViahAbLR0XIVSzppvBN8XKzVNGEMzzSnoWzt0HVLG8cuhIZ98NQvp/ALyX9wNW3dS6tMP1oqj/ghBT+VABG1eNvysJlp0g/KW6LbUtpocQXCy8RjONMB5AHo81LCz4q2N/jAvvD9RWYhnpXBGvjE5sUfCX/lZAVP5V5zwIT7FrGCGjTYlYwzG3BY5oDM32P4SArsclzn/pDBH4/yghIv1fS2TuOX7YHkp6t5QgrVIPes1TKAbjb1tL+rpopJgADJxkvLm8J2lHeoZ5U09JzJ2wdZMTP2iC6CjNs5GvWo5QXKFnY8lAxinZu5RCNmle4Qe035gc/0MAAjNUpGq1SWoTpA1Di63PZ5qPMMN0XwDastuZ14oHi7oAAAAAAAAAAAAAAAAA=")!important;
  opacity:.58!important;
  mix-blend-mode:normal!important;
  filter:none!important;
}

@supports not (height: 100svh){
  body.cart-empty-lock .wrap{
    height:100vh;
    max-height:100vh;
  }
}

@media(max-width:380px){
  .cartemptypage .cartEmptyFull{
    padding-left:14px!important;
    padding-right:14px!important;
    padding-bottom:calc(102px + env(safe-area-inset-bottom,0px))!important;
  }
  .cartemptypage .cartEmptyFullArt{
    left:56%!important;
    width:136%!important;
    bottom:calc(48px + env(safe-area-inset-bottom,0px))!important;
  }
  .cartemptypage .cartEmptyFullContent h3{
    font-size:27px;
  }
  .cartemptypage .cartEmptyFullCta{
    min-width:164px;
    height:51px;
    font-size:16.5px;
  }
}

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

/* ============================================================
   PWA INSTALL SYSTEM — progressive enhancement
   ============================================================ */
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled]           = useState(false);
  const [platform, setPlatform]             = useState("unknown");

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || !!navigator.standalone;
    setInstalled(standalone);
    setPlatform(isIOS ? "ios" : "desktop");

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); setPlatform("android"); };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
    return outcome === "accepted";
  }, [deferredPrompt]);

  return { installed, platform, canPrompt: !!deferredPrompt, install };
}

/* PWA: benefit list */
const PWA_BENEFITS = [
  { text: "Accesso immediato dalla Home",      path: "M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" },
  { text: "Esperienza più fluida",              path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { text: "Notifiche e aggiornamenti",          path: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" },
  { text: "I tuoi preferiti sempre con te",     path: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" },
];

function PWAInstallModal({ onInstall, onLater }) {
  return (
    <div className="pwa-overlay" onClick={(e) => e.target === e.currentTarget && onLater()}>
      <div className="pwa-sheet" role="dialog" aria-modal="true">
        <div className="pwa-pill" />
        <img src="/icon-192.png" alt="Strato" className="pwa-icon" />
        <h2 className="pwa-title">Sempre a portata di mano.</h2>
        <p className="pwa-sub">Installa Strato sulla schermata Home per un'esperienza più rapida, immersiva e progettata per il tuo dispositivo.</p>
        <ul className="pwa-benefits">
          {PWA_BENEFITS.map((b, i) => (
            <li key={i} className="pwa-benefit">
              <span className="pwa-bico"><svg viewBox="0 0 24 24"><path d={b.path}/></svg></span>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
        <button className="pwa-btn-p" onClick={onInstall}>Aggiungi alla Home</button>
        <button className="pwa-btn-later" onClick={onLater}>Più tardi</button>
      </div>
    </div>
  );
}

function PWAInstallIOSGuide({ onClose }) {
  return (
    <div className="pwa-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pwa-sheet" role="dialog" aria-modal="true">
        <div className="pwa-pill" />
        <img src="/icon-192.png" alt="Strato" className="pwa-icon" />
        <h2 className="pwa-title">Aggiungi Strato alla tua Home.</h2>
        <p className="pwa-sub">Per installare Strato, segui questi semplici passaggi:</p>
        <div className="pwa-steps">
          <div className="pwa-step">
            <div className="pwa-snum">1</div>
            <div className="pwa-stxt">Tocca l'icona
              <svg className="pwa-share-ico" viewBox="0 0 24 24"><path d="M8 12H5a1 1 0 00-1 1v6a1 1 0 001 1h14a1 1 0 001-1v-6a1 1 0 00-1-1h-3"/><polyline points="15 6 12 3 9 6"/><line x1="12" y1="14" x2="12" y2="3"/></svg>
              <strong>Condividi</strong> nella barra di Safari</div>
          </div>
          <div className="pwa-step">
            <div className="pwa-snum">2</div>
            <div className="pwa-stxt">Seleziona <strong>"Aggiungi alla schermata Home"</strong></div>
          </div>
          <div className="pwa-step">
            <div className="pwa-snum">3</div>
            <div className="pwa-stxt">Tocca <strong>Aggiungi</strong> per confermare</div>
          </div>
        </div>
        <button className="pwa-btn-p" onClick={onClose}>Ho capito</button>
      </div>
    </div>
  );
}

function Bg(){return null;}

/* ============================================================
   HAPTIC FEEDBACK — strategia progressiva a 3 livelli
   ============================================================
   Livello 1 — Vibration API (Android Chrome, alcuni browser):
     navigator.vibrate() — pattern discreti per tipo di azione.
     Escluso iOS: Safari/PWA non supportano vibrate(); verrebbe
     ignorato silenziosamente ma non ha senso includerlo.

   Livello 2 — CSS class injection per microanimazione visiva:
     Aggiunge .hap-[type] all'elemento target per 320ms.
     Scale + brightness transitional → sensazione di "risposta".
     Funziona su tutti i dispositivi, incluso iOS Safari e PWA.

   Livello 3 — No-op silenzioso:
     Se nessuna API è disponibile o il contesto non è supportato,
     le interazioni restano perfettamente funzionali senza alcuna
     regressione visiva o comportamento anomalo.

   Rilevamento capabilities a runtime (prima chiamata):
   - iOS Safari / WKWebView / PWA iOS: vibrate non disponibile
     → solo livello 2 (microanimazione CSS)
   - Android Chrome / Edge / Samsung Internet: vibrate disponibile
     → livello 1 + livello 2 in parallelo
   - Desktop: vibrate raramente disponibile
     → solo livello 2 (coerente, non invasivo)
   ============================================================ */

const _hapticCap = (() => {
  let cache = null;
  return () => {
    if (cache !== null) return cache;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const hasVibrate = !isIOS && typeof navigator.vibrate === "function";
    cache = { hasVibrate, isIOS };
    return cache;
  };
})();

/* Durate di vibrazione per tipo di azione [ms] */
const HAPTIC_PATTERNS = {
  like:    [18],          /* feedback leggero, positivo */
  unlike:  [10],          /* più breve, azione di rimozione */
  add:     [12],          /* risposta immediata, azione primaria */
  confirm: [20, 40, 20],  /* doppio impulso: azione critica completata */
  nav:     [8],           /* navigazione: quasi impercettibile */
};

/* CSS keyframes e classi iniettati dinamicamente una sola volta */
const _injectHapticCSS = (() => {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const s = document.createElement("style");
    s.id = "haptic-css";
    s.textContent = [
      "@keyframes hapLike{0%{transform:scale(1)}30%{transform:scale(1.28)}70%{transform:scale(.96)}100%{transform:scale(1)}}",
      "@keyframes hapAdd{0%{transform:scale(1)}40%{transform:scale(.95)}100%{transform:scale(1)}}",
      "@keyframes hapConfirm{0%{transform:scale(1)}25%{transform:scale(.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}",
      "@keyframes hapNav{0%{transform:scale(1)}35%{transform:scale(.95)}100%{transform:scale(1)}}",
      ".hap-like{animation:hapLike .28s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-unlike{animation:hapAdd .22s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-add{animation:hapAdd .24s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-confirm{animation:hapConfirm .32s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-nav{animation:hapNav .2s cubic-bezier(.22,1,.36,1) both!important}",
    ].join("");
    document.head.appendChild(s);
  };
})();

/**
 * useHaptic() → { tap }
 * tap(type, element?) — attiva il feedback appropriato.
 *   type: "like" | "unlike" | "add" | "confirm" | "nav"
 *   element: HTMLElement opzionale per microanimazione CSS (livello 2)
 */
function useHaptic() {
  const tap = useCallback((type, element) => {
    _injectHapticCSS();
    const cap = _hapticCap();

    /* Livello 1: Vibration API (Android/desktop supportato) */
    if (cap.hasVibrate) {
      const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.nav;
      try { navigator.vibrate(pattern); } catch (_) { /* silenzio */ }
    }

    /* Livello 2: microanimazione CSS sull'elemento target */
    if (element && element instanceof HTMLElement) {
      const cls = "hap-" + type;
      element.classList.remove(cls);
      /* forza reflow per restart animazione in caso di tap rapidi */
      void element.offsetWidth;
      element.classList.add(cls);
      const tid = setTimeout(() => element.classList.remove(cls), 350);
      return () => clearTimeout(tid);
    }
  }, []);

  return { tap };
}



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
function Card({ p, liked, onLike, onOpen, onEdit, context }) {
  const c0 = p.cols[0];
  const { tap } = useHaptic();
  const lkRef = useRef(null);
  const isLiked = context === "liked";
  const isHome  = context === "home";
  const quietCnt = isLiked || isHome; // nascondi badge conteggio in Home e Piaciuti
  const ctaLabel = isLiked ? "Scopri" : isHome ? "Scopri" : "Configura";
  const ctaCls   = isLiked ? "liked-configbtn" : "configbtn";
  const handleCardKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  };
  return (
    <div
      className={"card in" + (isLiked ? " liked-card" : "")}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      aria-label={p.title}
    >
      <div className="ph">
        <img src={colImg(c0)} alt={p.title + (p.category ? " · " + p.category : "")} loading="lazy" decoding="async" />
        <button
          ref={lkRef}
          className="lk"
          onClick={(e) => { e.stopPropagation(); tap(liked ? "unlike" : "like", lkRef.current); onLike(p.id); }}
          aria-label={liked ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className={"heart" + (liked ? " liked" : "")}><HeartI /></span>
        </button>
        {!quietCnt && <div className="cnt"><HeartI /> {p.likeCount}</div>}
        {onEdit && !isLiked && (
          <button className="cedit" onClick={(e) => { e.stopPropagation(); onEdit(p); }} aria-label="Modifica" onKeyDown={(e) => e.stopPropagation()}><Pencil /></button>
        )}
      </div>
      <div className="cbody">
        <div className="cardcat"><Raw html={glassIcon(p.categoryIcon, 14)} />{p.categoryName}</div>
        <div className="ct">{p.title}</div>
        <div className="mat">{p.material}</div>
        <div className="cp">{eur(p.price)}</div>
        <button
          className={ctaCls}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          onKeyDown={(e) => e.stopPropagation()}
        >{ctaLabel}</button>
      </div>
    </div>
  );
}

/* ============================ APP ===================================== */
export default function App() {
  const [ready, setReady] = useState(false);
  const { tap } = useHaptic();
  /* PWA install */
  const { installed: pwaInstalled, platform: pwaPlatform, canPrompt: pwaCanPrompt, install: pwaInstall } = usePWAInstall();
  const [pwaModal, setPwaModal]   = useState(null); // null | "main" | "ios"
  const pwaShownRef               = useRef(false);
  const [pushInfo, setPushInfo] = useState({ supported: false, permission: "default", subscribed: false, busy: false });
  const [user, setUser] = useState(null);
  const [prints, setPrints] = useState([]);
  const [cats, setCats] = useState([]);
  const [likes, setLikes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("home");
  const [updatesReturnTab, setUpdatesReturnTab] = useState("home");
  const [orderFocus, setOrderFocus] = useState(null);
  const [notifSeen, setNotifSeen] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_seen") || "[]"); } catch (e) { return []; } });
  const [notifCleared, setNotifCleared] = useState(() => { try { return JSON.parse(localStorage.getItem("strato_notif_cleared") || "[]"); } catch (e) { return []; } });
  const [detailId, setDetailId] = useState(null);
  const [cart, setCart] = useState([]);
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

    // Mantiene la status bar mobile nello stesso tono del canvas Strato.
    // Non modifica fullscreen, root, dock o sfondo: aggiorna solo il colore
    // che browser/PWA usano per l'area di sistema sopra la WebView.
    const statusColor = dark ? "#312720" : "#eadccf";
    document.documentElement.style.backgroundColor = statusColor;
    document.body.style.backgroundColor = statusColor;
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", statusColor);
  };

  /* ---- scroll lock: quando uno sheet è aperto blocca lo scroll del body ---- */
  const anySheetOpen = !!editingCat;
  useEffect(() => {
    if (!anySheetOpen) return;
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("sheet-open");
    body.classList.add("sheet-open");
    // Blocca touchmove sul backdrop; lascia scrollare solo .ipick .sheet.
    const onTouchMove = (e) => {
      if (e.target.closest(".ipick .sheet")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      html.classList.remove("sheet-open");
      body.classList.remove("sheet-open");
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [anySheetOpen]);

  const syncBackstop = () => {
    try {
      // Sfondo definitivo Strato: nessuna personalizzazione admin, nessuna immagine custom.
      // #appbg è un layer fisso CSS; html/body restano coerenti con le variabili tema.
      document.documentElement.style.removeProperty("background");
      document.body.style.removeProperty("background");
      document.body.style.removeProperty("background-image");
      let bg = document.getElementById("appbg");
      if (!bg) {
        bg = document.createElement("div");
        bg.id = "appbg";
        bg.setAttribute("aria-hidden", "true");
        document.body.insertBefore(bg, document.body.firstChild);
      }
      bg.removeAttribute("style");
      const r = document.getElementById("root");
      if (r) { r.style.position = "relative"; r.style.zIndex = "1"; }
    } catch (e) {}
  };

  useEffect(() => { applyTheme(theme); syncBackstop(); }, [theme]);
  useEffect(() => { document.body.removeAttribute("data-bg"); }, []);
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
      .select("*, order_items(*, prints(material))")
      .order("created_at", { ascending: false });
    setOrders((data || []).map((o) => ({
      id: o.id, user_id: o.user_id, who: o.customer_name || "Cliente", avatar: o.customer_avatar || "",
      status: o.status, total: Number(o.total) || 0, date: o.created_at,
      items: (o.order_items || []).map((it) => ({
        t: it.title, col: it.color_name, material: it.prints?.material || "", base: Number(it.base_price) || 0,
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

  /* Mostra la PWA install modal una sola volta, dopo il primo login */
  useEffect(() => {
    if (!user) return;
    if (pwaInstalled) return;
    if (pwaShownRef.current) return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") return;
    pwaShownRef.current = true;
    const t = setTimeout(() => setPwaModal("main"), 1400);
    return () => clearTimeout(t);
  }, [user, pwaInstalled]);


  const refreshPushInfo = useCallback(async () => {
    const st = await checkPushStatus();
    setPushInfo((prev) => ({ ...prev, ...st }));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshPushInfo();
  }, [user, pwaInstalled, refreshPushInfo]);

  // Deep-link dalle notifiche: ?tab=orders[&order=...] apre la sezione ordini.
  useEffect(() => {
    if (!user) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      const o = params.get("order");
      if (t === "orders") { setTab("orders"); if (o) setOrderFocus(o); }
      if (t || o) window.history.replaceState({}, "", window.location.pathname);
    } catch (_) {}
  }, [user]);

  const togglePush = async () => {
    if (!user || pushInfo.busy) return;
    // Permesso negato: nessun tentativo (la card mostra lo stato bloccato).
    if (pushInfo.permission === "denied") return;
    // Attivazione su iOS richiede la PWA installata: apriamo la guida con garbo.
    if (!pushInfo.subscribed && pwaPlatform === "ios" && !pwaInstalled) {
      setPwaModal("ios");
      return;
    }
    setPushInfo((prev) => ({ ...prev, busy: true }));
    try {
      if (pushInfo.subscribed) {
        await disablePushNotifications(supabase, user.id);
        setPushInfo({ supported: true, permission: Notification.permission, subscribed: false, busy: false });
      } else {
        await enablePushNotifications(supabase, user.id);
        setPushInfo({ supported: true, permission: "granted", subscribed: true, busy: false });
      }
    } catch (e) {
      console.warn("Push toggle error", e);
      await refreshPushInfo();
      setPushInfo((prev) => ({ ...prev, busy: false }));
      toast("Non è stato possibile aggiornare le notifiche.");
    }
  };

  // parallax + scrim su scroll
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const sy = window.scrollY || 0;
      // Scroll performance: rimosso update continuo di --par per mantenere 120Hz fluido.
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
    tap("add");
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
    if (!user) { setAuthGate("per inviare la richiesta d'ordine"); return; }
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
    // Notifica agli admin (non blocca la UX se fallisce).
    try {
      supabase.functions
        .invoke("push-notify", { body: { type: "new_order", order_id: ord.id } })
        .then(({ error }) => { if (error) console.warn("new_order push", error); })
        .catch((err) => console.warn("new_order push", err));
    } catch (err) { console.warn("new_order push", err); }
    tap("confirm");
    saveCart([]);
    await loadOrders();
    setTab("orders");
    setOrderDone(true);
  };
  const setOrderStatus = async (id, status) => {
    const order = orders.find((o) => o.id === id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast("Errore aggiornamento"); return; }

    if (order?.user_id && (status === "confirmed" || status === "rejected" || status === "completed")) {
      try {
        const { data: pushData, error: pushError } = await supabase.functions.invoke("push-notify", {
          body: { type: "order_status", order_id: id, status },
        });
        // La function risponde 200 anche quando non recapita nulla: leggiamo sent/total
        // per non lasciare invisibile un fallimento di consegna.
        if (pushError) {
          console.warn("Push notify error", pushError);
          let detail = "";
          try {
            if (pushError.context && typeof pushError.context.json === "function") {
              const b = await pushError.context.json();
              if (b && b.error) detail = String(b.error);
            }
          } catch (_) {}
          if (!detail) detail = pushError.message || "errore funzione";
          toast("Notifica non inviata: " + detail);
        } else if (pushData && typeof pushData.sent === "number") {
          if (pushData.total === 0) toast("Notifica: nessun dispositivo iscritto per l'utente");
          else if (pushData.sent < pushData.total) toast("Notifica rifiutata dal push server — controlla le chiavi VAPID");
        }
      } catch (_) {
        // La push non deve mai bloccare il flusso admin o l'aggiornamento ordine.
      }
    }

    await loadOrders();
    toast(status === "confirmed" ? "Ordine confermato" : (status === "completed" ? "Ordine completato" : "Richiesta rifiutata"));
  };

  const deleteOrder = async (id) => {
    const r1 = await supabase.from("order_items").delete().eq("order_id", id);
    if (r1.error) { toast("Errore: " + r1.error.message); return false; }
    const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id");
    if (error) { toast("Errore: " + error.message); return false; }
    if (!data || data.length === 0) { toast("Eliminazione bloccata: manca una policy DELETE per gli admin (RLS)."); return false; }
    await loadOrders();
    toast("Ordine eliminato");
    return true;
  };

  /* ---- navigazione ---- */
  const open = (t) => {
    if ((t === "orders" || t === "profile" || t === "liked") && !user) { setAuthGate(t === "orders" ? "per vedere i tuoi ordini" : (t === "liked" ? "per vedere i tuoi preferiti" : "per accedere al profilo")); return; }
    setDetailId(null); setInvId(null); setEditing(null); setTab(t); window.scrollTo(0, 0);
  };

  const allNotifs = orders
    .filter((o) => isAdmin ? o.status === "pending" : (o.status === "confirmed" || o.status === "completed" || o.status === "rejected"))
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .map((o) => ({
      id: o.id, status: o.status, date: o.date,
      title: isAdmin ? "Nuova richiesta" : (o.status === "completed" ? "Ordine completato" : (o.status === "confirmed" ? "Ordine confermato" : "Ordine non accettato")),
      body: (o.items[0] ? o.items[0].t : "Ordine") + " · " + eur(o.total) + (isAdmin ? " · " + o.who : ""),
    }));
  const notifSig = (n) => n.id + ":" + n.status;
  const notifs = allNotifs.filter((n) => !notifCleared.includes(notifSig(n)));
  const unread = notifs.filter((n) => !notifSeen.includes(notifSig(n))).length;
  const markNotifsSeen = () => { const all = notifs.map(notifSig); setNotifSeen((prev) => { const m = [...new Set([...prev, ...all])]; try { localStorage.setItem("strato_notif_seen", JSON.stringify(m)); } catch (e) {} return m; }); };
  const clearNotifs = () => { const sigs = notifs.map(notifSig); setNotifCleared((prev) => { const m = [...new Set([...prev, ...sigs])]; try { localStorage.setItem("strato_notif_cleared", JSON.stringify(m)); } catch (e) {} return m; }); };
  const openNotifs = () => { setUpdatesReturnTab(tab === "updates" ? "home" : tab); setDetailId(null); setInvId(null); setTab("updates"); markNotifsSeen(); window.scrollTo(0, 0); };
  const onNotifClick = (id) => { setDetailId(null); setTab("orders"); setOrderFocus(id); window.scrollTo(0, 0); };
  const openDetail = (id) => { setInvId(null); setDetailId(id); window.scrollTo(0, 0); };
  const byId = (id) => prints.find((p) => p.id === id);

  if (!ready) {
    return (<><style>{CSS}</style><Bg /><Raw html={GRADS_SVG} /><div className="boot">Strato…</div></>);
  }

  const adminEdit = isAdmin ? (prod) => { setDetailId(null); setInvId(null); setEditing(prod); } : undefined;
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
        {(detailId || inv || editing)
          ? <button className="tb-btn left tb-back" onClick={() => detailId ? setDetailId(null) : (inv ? setInvId(null) : setEditing(null))} aria-label="Torna indietro"><ChevronLeft /></button>
          : <div className="tb-spacer" />}
        <div className="brand2"><span className="mk"><Box /></span>Strato</div>
        <div className="tb-right">
          {user && (
            <button className="tb-btn bell" onClick={openNotifs} aria-label="Notifiche">
              <Bell />{unread > 0 && <span className="softdot belldot" />}
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
        {editing ? (
          <AdminProduct
            editing={editing.id ? editing : null} cats={cats}
            onClose={() => setEditing(null)}
            onSaved={async () => { await Promise.all([loadPrints(), loadCats()]); setEditing(null); toast("Salvato"); }}
            onDelete={deletePrint}
            user={user} toast={toast}
          />
        ) : detail ? (
          <Detail
            key={detail.id} p={detail} cats={cats} prints={prints}
            onClose={() => setDetailId(null)} onOpen={openDetail}
            onAdd={addToCart} isAdmin={isAdmin} onEdit={adminEdit} onColorPhoto={changeColorPhoto}
            onSaveAddons={async (patch) => { await supabase.from("prints").update(patch).eq("id", detail.id); await loadPrints(); toast("Prezzi aggiornati"); }}
          />
        ) : (
          <>
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
            {tab === "cart" && (
              <CartView cart={cart} total={cartTotal} onStep={cartStep} onConfirm={placeOrder} onGoExplore={() => open("search")} />
            )}
            {tab === "orders" && (
              inv ? (
                <OrderDetailView o={inv} isAdmin={isAdmin} onDelete={async (id) => { const ok = await deleteOrder(id); if (ok) setInvId(null); }} />
              ) : (
                <OrdersTab orders={orders} isAdmin={isAdmin} onOpenOrder={(id) => { setInvId(id); window.scrollTo(0, 0); }}
                  onConfirm={(id) => setOrderStatus(id, "confirmed")} onReject={(id) => setOrderStatus(id, "rejected")} onComplete={(id) => setOrderStatus(id, "completed")}
                  onDelete={deleteOrder}
                  orderFocus={orderFocus} clearFocus={() => setOrderFocus(null)}
                  onGoExplore={() => open("search")} />
              )
            )}
            {tab === "updates" && (
              <UpdatesView notifs={notifs} onItemClick={onNotifClick} onClear={clearNotifs} isAdmin={isAdmin} />
            )}
            {tab === "profile" && user && (
              <Profile user={user} theme={theme} onTheme={pickTheme} onLogout={logout}
                isAdmin={isAdmin} onNewProduct={() => setEditing({})}
                likedPrints={prints.filter((p) => liked(p.id))} onOpenProduct={openDetail} onLike={toggleLike} onEditProduct={adminEdit}
                pwaInstalled={pwaInstalled} onPWAInstall={() => setPwaModal("main")}
                pushSupported={pushInfo.supported} pushPermission={pushInfo.permission}
                pushSubscribed={pushInfo.subscribed} pushBusy={pushInfo.busy}
                onTogglePush={togglePush} />
            )}
          </>
        )}
      </main>
      {/* DOCK */}
      <div className="dockwrap">
        <div className="dock dock5">
          <button className={"dnav home" + (tab === "home" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("home"); }} aria-label="Home"><HomeI /></button>
          <button className={"dnav search" + (tab === "search" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("search"); }} aria-label="Esplora"><SearchI /></button>
          <button className={"dnav liked" + (tab === "liked" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("liked"); }} aria-label="Piaciuti"><HeartI /></button>
          <button className={"dnav cart" + (tab === "cart" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("cart"); }} aria-label={cartCount > 0 ? "Carrello con articoli" : "Carrello"}><CartIcon />{cartCount > 0 && <span className="softdot cartdot" />}</button>
          <button className={"dnav orders" + (tab === "orders" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("orders"); }} aria-label="I miei ordini"><OrdersI />{orders.some((o) => o.status === "pending") && isAdmin && <span className="orddot" />}</button>
        </div>
      </div>

      {orderDone && <OrderDoneModal onDone={() => setOrderDone(false)} />}

      {authGate && <AuthGate reason={authGate} onGoogle={loginGoogle} onClose={() => setAuthGate(null)} />}

      {/* PWA install modals */}
      {pwaModal === "main" && (
        <PWAInstallModal
          onInstall={async () => {
            if (pwaPlatform === "ios") { setPwaModal("ios"); return; }
            const ok = await pwaInstall();
            if (ok || !pwaCanPrompt) { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }
            else setPwaModal(null);
          }}
          onLater={() => { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }}
        />
      )}
      {pwaModal === "ios" && (
        <PWAInstallIOSGuide
          onClose={() => { setPwaModal(null); localStorage.setItem("pwa-install-dismissed","1"); }}
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
  const homeRef = useRef(null);
  // Una sola tile in evidenza: articolo casuale, nuovo ad ogni refresh del sito.
  const hero = useMemo(() => (prints.length ? prints[Math.floor(Math.random() * prints.length)] : null), [prints.length]);
  const { tap } = useHaptic();
  const heroLkRef = useRef(null);
  useEffect(() => {
    const el = homeRef.current;
    if (!el) return;
    el.classList.remove("motionDone");
    const t = window.setTimeout(() => el.classList.add("motionDone"), 1150);
    return () => window.clearTimeout(t);
  }, [hero?.id]);
  return (
    <section ref={homeRef} className="screen on homeview">
      <div className="px">
        <h1 className="hero">Design contemporaneo, plasmato strato dopo strato.</h1>
        <div className="kick homekick">A COLPO D'OCCHIO</div>
      </div>
      {hero && (
        <div className="herocard" key={hero.id} onClick={() => onOpen(hero.id)}>
          <img src={colImg(hero.cols[0])} alt={hero.title} loading="eager" fetchPriority="high" decoding="async" />
          <button ref={heroLkRef} className="lk" onClick={(e) => { e.stopPropagation(); tap(liked(hero.id) ? "unlike" : "like", heroLkRef.current); onLike(hero.id); }} aria-label={liked(hero.id) ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}>
            <span className={"heart" + (liked(hero.id) ? " liked" : "")}><HeartI /></span>
          </button>
          <div className="herotag"><div className="ht">{hero.title}</div><div className="hp">{eur(hero.price)}</div></div>
          {onEdit && <button className="cedit hero" onClick={(e) => { e.stopPropagation(); onEdit(hero); }} aria-label="Modifica"><Pencil /></button>}
        </div>
      )}
      <h2 className="title px home-sec-title">Lasciati ispirare</h2>
      {prints.length === 0 && <p className="empty">Nessun prodotto ancora.</p>}
      <div className="home-grid-wrap">
        <Grid>
          {prints.map((p) => <Card key={p.id} p={p} liked={liked(p.id)} onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} context="home" />)}
        </Grid>
      </div>
    </section>
  );
}

/* ---- Icone opzioni lampada (inline, solo per la scheda dettaglio) ---- */
/* Stile identico a IcoBulb: strokeWidth 2, round caps, fill none, viewBox 0 0 24 24, 17px */
const IcoCable  = () => (
  /* 3 archi quadratici consecutivi = filo arricciato, stesso arco della dome IcoBulb */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 17 Q5.5 7 9 17 Q12.5 7 16 17 Q19.5 7 23 17"/>
  </svg>
);
const IcoBulb   = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14a5 5 0 1 0-6 0"/><path d="M9 18h6M10 21h4"/>
  </svg>
);
const IcoHolder = () => (
  /* Cupola bezier (come dome lampadina) + corpo rettangolare = portalampada E27 */
  <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 17 Q12 5 18 17 V21 H6 Z"/>
  </svg>
);

/* ---- Hook drag-to-close (touch) per tutti gli sheet ---- */
// dir: "down" per sheet dal basso (Carrello, Dettaglio, Ordine)
//      "up"   per sheet dall'alto (Notifiche)
function useDragToClose(doClose, dir = "down") {
  const wrapRef  = useRef(null);
  const sheetRef = useRef(null); // ref all'elemento scrollabile interno
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;

    let startY = 0, dy = 0, active = false, startT = 0;

    // Controlla se lo scroll interno ha raggiunto il bordo corretto per avviare il drag.
    const atBoundary = () => {
      const s = sheetRef.current;
      if (!s) return true;
      if (dir === "down") return s.scrollTop <= 2;
      // "up": alla fine dello scroll
      return s.scrollTop + s.clientHeight >= s.scrollHeight - 8;
    };

    // Non parte da elementi interattivi (bottoni, input, ecc.).
    const isInteractive = (t) =>
      !!t.closest("button,input,select,textarea,[role=button],[role=radio],[role=option]");

    const onStart = (e) => {
      if (!atBoundary() || isInteractive(e.target)) return;
      startY = e.touches[0].clientY;
      dy = 0; active = true; startT = Date.now();
    };

    const onMove = (e) => {
      if (!active) return;
      const raw = e.touches[0].clientY - startY;
      // Cancella il drag se l'utente si muove nella direzione opposta
      if (dir === "down" && raw <= 0) { active = false; return; }
      if (dir === "up"   && raw >= 0) { active = false; return; }
      dy = Math.abs(raw);
      if (dy > 4) {
        // Blocca lo scroll nativo del browser durante il drag
        // (richiede passive:false sull'addEventListener)
        e.preventDefault();
        const tx = dir === "down" ? dy : -dy;
        wrap.style.transform  = `translateY(${tx}px)`;
        wrap.style.transition = "none";
      }
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      const vel = dy / Math.max(1, Date.now() - startT);
      if (dy > 90 || vel > 0.45) {
        // Sopra soglia: anima via e chiudi
        const tx = dir === "down" ? "100vh" : "-100vh";
        wrap.style.transform  = `translateY(${tx})`;
        wrap.style.transition = "transform .26s ease";
        doClose();
      } else {
        // Sotto soglia: rimbalzo morbido a zero
        wrap.style.transform  = "translateY(0)";
        wrap.style.transition = "transform .3s cubic-bezier(.2,.8,.2,1)";
        setTimeout(() => { if (wrap) { wrap.style.transform = ""; wrap.style.transition = ""; } }, 320);
      }
    };

    wrap.addEventListener("touchstart",  onStart, { passive: true });
    wrap.addEventListener("touchmove",   onMove,  { passive: false }); // non-passive: serve preventDefault
    wrap.addEventListener("touchend",    onEnd);
    wrap.addEventListener("touchcancel", onEnd);
    return () => {
      wrap.removeEventListener("touchstart",  onStart);
      wrap.removeEventListener("touchmove",   onMove);
      wrap.removeEventListener("touchend",    onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [doClose, dir]);
  return { wrapRef, sheetRef };
}

/* ---- DETTAGLIO ---- */
function Detail({ p, prints, onClose, onOpen, onAdd, isAdmin, onSaveAddons, onEdit, onColorPhoto }) {
  const [ci, setCi] = useState(0);
  const [qty, setQty] = useState(1);
  const [cable, setCable] = useState("Normale");
  const photoInput = useRef(null);
  const galleryRef = useRef(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const [bulb, setBulb] = useState(0);
  const [holder, setHolder] = useState(0);
  const [editP, setEditP] = useState(false);
  const [ad, setAd] = useState(p.addons);

  const c = p.cols[ci] || p.cols[0];
  const photoList = (c.imgs && c.imgs.length ? c.imgs : [colImg(c)]);

  useEffect(() => {
    setPhotoIndex(0);
    const node = galleryRef.current;
    if (node) node.scrollTo({ left: 0, behavior: "auto" });
  }, [ci, p.id]);

  const onGalleryScroll = (e) => {
    const el = e.currentTarget;
    const next = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    const clamped = Math.max(0, Math.min(photoList.length - 1, next));
    if (clamped !== photoIndex) setPhotoIndex(clamped);
  };

  const goPhoto = (idx) => {
    setPhotoIndex(idx);
    const node = galleryRef.current;
    if (node) node.scrollTo({ left: idx * node.clientWidth, behavior: "smooth" });
  };

  const adds = [];
  if (p.isElectrical) {
    if (cable === "Intrecciato") adds.push({ label: "Cavo in tessuto", amt: Number(ad.braided) || 0 });
    if (bulb) adds.push({ label: "Lampadina", amt: Number(ad.bulb) || 0 });
    if (holder) adds.push({ label: "Portalampada premium", amt: Number(ad.holder) || 0 });
  }
  const unit = p.price + adds.reduce((s, x) => s + x.amt, 0);
  const cableText = cable === "Intrecciato" ? "in tessuto" : "standard";
  const optLabel = p.isElectrical
    ? "Cavo " + cableText + " · " + (bulb ? "Con lampadina" : "Senza lampadina") + " · " + (holder ? "Portalampada premium" : "Portalampada standard")
    : "";

  const doAdd = (e) => {
    if (e && e.currentTarget) confetti(e.currentTarget);
    onAdd({
      key: p.id + "|" + (c.id || c.name || "unico") + (optLabel ? "|" + optLabel : ""),
      pid: p.id, t: p.title, col: c.name || "", opt: optLabel, base: p.price, adds, price: unit,
      qty, img: c.img || "",
    });
  };
  const saveAddons = () => { onSaveAddons({ addon_braided: Number(ad.braided) || 0, addon_bulb: Number(ad.bulb) || 0, addon_holder: Number(ad.holder) || 0 }); setEditP(false); };

  return (
    <section className="screen on appview productview productview--clean" aria-label={"Scheda prodotto: " + p.title}>
      <div className="detailview-card detailsheet">
        {isAdmin && onEdit && <button className="dedit detailedit" onClick={() => onEdit(p)} aria-label="Modifica prodotto"><Pencil /></button>}
        <div className="dgrid">
          <div className="dphoto">
            <div className="dgallery" ref={galleryRef} onScroll={onGalleryScroll}>
              {photoList.map((src, gi) => (
                <img key={gi} className="dimg" src={src || colImg(c)} alt={p.title} />
              ))}
            </div>
            {photoList.length > 1 && (
              <div className="gdots" aria-label="Selettore foto">
                {photoList.map((_, gi) => (
                  <button
                    key={gi}
                    type="button"
                    className={"gdot" + (gi === photoIndex ? " gdot--on" : "")}
                    onClick={() => goPhoto(gi)}
                    aria-label={"Mostra foto " + (gi + 1)}
                    aria-current={gi === photoIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
            {isAdmin && onColorPhoto && (
              <>
                <button className="dphotobtn" onClick={() => photoInput.current && photoInput.current.click()} aria-label="Aggiungi foto colore"><Camera /></button>
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

            {/* Colore */}
            <div className="dlabel dcolor">Colore</div>
            <div className="dswatches readonly" role="list">
              {p.cols.map((cc, k) => (
                <div key={k} className="dswbox ro" role="listitem" aria-label={cc.name}>
                  <span className="dsw" style={{ background: "linear-gradient(135deg," + cc.a + " 0%," + cc.a + " 50%," + cc.b + " 50%," + cc.b + " 100%)" }} />
                  <span className="dswn">{cc.name}</span>
                </div>
              ))}
            </div>

            {/* Configurazione luce (solo prodotti elettrici) */}
            {p.isElectrical && (
              <div className="eleccard">
                <div className="eleccard-head">
                  <span className="eleccard-title">Configurazione luce</span>
                  <span className="eleccard-sub">Scegli i dettagli.</span>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoCable /> Cavo</span>
                  <div className="seg" role="group" aria-label="Tipo cavo">
                    <button
                      className={cable === "Normale" ? "on" : ""}
                      onClick={() => setCable("Normale")}
                      aria-pressed={cable === "Normale"}
                      aria-label="Cavo standard incluso"
                    ><span className="segopt">Standard</span><i>incluso</i></button>
                    {p.allowBraided && (
                      <button
                        className={cable === "Intrecciato" ? "on" : ""}
                        onClick={() => setCable("Intrecciato")}
                        aria-pressed={cable === "Intrecciato"}
                        aria-label={"Cavo in tessuto, più " + eur(ad.braided)}
                      ><span className="segopt">In tessuto</span><i>+{eur(ad.braided)}</i></button>
                    )}
                  </div>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoHolder /> Portalampada</span>
                  <div className="seg" role="group" aria-label="Portalampada">
                    <button className={!holder ? "on" : ""} onClick={() => setHolder(0)} aria-pressed={!holder} aria-label="Portalampada standard incluso"><span className="segopt">Standard</span><i>incluso</i></button>
                    <button className={holder ? "on" : ""} onClick={() => setHolder(1)} aria-pressed={!!holder} aria-label={"Portalampada premium, più " + eur(ad.holder)}><span className="segopt">Premium</span><i>+{eur(ad.holder)}</i></button>
                  </div>
                </div>

                <div className="elecrow">
                  <span className="eleclbl"><IcoBulb /> Lampadina</span>
                  <div className="seg" role="group" aria-label="Lampadina">
                    <button className={!bulb ? "on" : ""} onClick={() => setBulb(0)} aria-pressed={!bulb} aria-label="Senza lampadina"><span className="segopt">Senza</span></button>
                    <button className={bulb ? "on" : ""} onClick={() => setBulb(1)} aria-pressed={!!bulb} aria-label={"Con lampadina, più " + eur(ad.bulb)}><span className="segopt">Con lampadina</span><i>+{eur(ad.bulb)}</i></button>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <button className="elecedit" onClick={() => setEditP(!editP)}>✎ Prezzi aggiunte</button>
                    {editP && (
                      <div className="elecprices">
                        <div className="epp"><span>Cavo in tessuto</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.braided} onChange={(e) => setAd({ ...ad, braided: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Lampadina</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.bulb} onChange={(e) => setAd({ ...ad, bulb: e.target.value })} /> €</span></div>
                        <div className="epp"><span>Portalampada premium</span><span className="eur"><input type="number" min="0" step="0.5" value={ad.holder} onChange={(e) => setAd({ ...ad, holder: e.target.value })} /> €</span></div>
                        <button className="saveaddons" onClick={saveAddons}>Salva prezzi</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quantità e CTA */}
          <div className="dbuy">
            <div className="dlabel dctr">Quantità</div>
            <div className="qstep dqty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuisci quantità">−</button>
              <span aria-live="polite" aria-label={"Quantità: " + qty}>{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))} aria-label="Aumenta quantità">+</button>
            </div>
            <button
              className="dadd2"
              onClick={doAdd}
              aria-label={"Aggiungi al carrello, totale " + eur(unit * qty).replace(",", " virgola").replace("€", "euro")}
            >
              <CartIcon /> Aggiungi — {eur(unit * qty)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- CARRELLO ---- */

function CartView({ cart, total, onStep, onConfirm, onGoExplore }) {
  const cartOptionKind = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("cavo")) return "cable";
    if (l.includes("lampadina")) return "bulb";
    if (l.includes("portalampada")) return "holder";
    return "addon";
  };
  const cartOptionLabel = (label) => {
    const raw = String(label || "").trim();
    const l = raw.toLowerCase();
    if (!raw) return "";
    if (l.includes("cavo in tessuto") || l.includes("cavo intrecciato")) return "Cavo in tessuto - incluso";
    if (l.includes("cavo normale") || l.includes("cavo standard")) return "Cavo standard - incluso";
    if (l.includes("portalampada premium") || l.includes("con portalampada") || l === "portalampada") return "Portalampada premium - incluso";
    if (l.includes("portalampada standard") || l.includes("senza portalampada")) return "Portalampada standard - incluso";
    if (l.includes("con lampadina") || l === "lampadina") return "Con lampadina";
    if (l.includes("senza lampadina")) return "Senza lampadina";
    if (l.startsWith("cavo ")) return "Cavo " + raw.slice(5) + " - incluso";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const cartOptionIcon = (kind) => {
    if (kind === "cable") return <IcoCable />;
    if (kind === "bulb") return <IcoBulb />;
    if (kind === "holder") return <IcoHolder />;
    return <span className="cartOptionDot" aria-hidden="true" />;
  };
  const cartOptionRows = (c) => {
    const fromOpt = String(c.opt || "")
      .split("·")
      .map((x) => x.trim())
      .filter(Boolean);
    if (fromOpt.length) return fromOpt.map((label) => ({ label: cartOptionLabel(label), kind: cartOptionKind(label) })).filter((x) => x.label);
    return (c.adds || []).map((a) => ({ label: cartOptionLabel(a.label), kind: cartOptionKind(a.label) })).filter((x) => x.label);
  };
  useEffect(() => {
    if (cart.length !== 0) return;
    document.documentElement.classList.add("cart-empty-lock");
    document.body.classList.add("cart-empty-lock");
    return () => {
      document.documentElement.classList.remove("cart-empty-lock");
      document.body.classList.remove("cart-empty-lock");
    };
  }, [cart.length]);

  if (cart.length === 0) {
    return (
      <section className="screen on appview cartview cartemptypage" aria-label="Carrello vuoto">
        <h2 className="title px cartPageTitle"><span className="ticon"><CartIcon /></span>Carrello</h2>
        <div className="cartEmptyFull">
          <div className="cartEmptyFullArt" aria-hidden="true" />
          <div className="cartEmptyFullContent">
            <div className="cartEmptyMini">Ancora nessun oggetto</div>
            <h3>Il carrello è vuoto.</h3>
            <p>Quando sceglierai un oggetto, lo ritroverai qui.</p>
            <button className="cartempty-action cartEmptyFullCta" onClick={onGoExplore}>Esplora</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen on appview cartview" aria-label="Carrello">
      <h2 className="title px cartPageTitle"><span className="ticon"><CartIcon /></span>Carrello</h2>
      <p className="cartPageSub px">Controlla i dettagli della tua scelta.</p>
      <div className="cartview-card">
        <div className="cartitems">
          {cart.length === 0 && (
            <>
              <div className="cempty">Gli oggetti scelti appariranno qui.</div>
              <button className="cartempty-action" onClick={onGoExplore}>Esplora gli oggetti</button>
            </>
          )}
          {cart.map((c, i) => {
            const opts = cartOptionRows(c);
            return (
              <div className="crow cartrow" key={c.key}>
                <img className="cartThumb" src={c.img || gimg(c.a || "#cfc4b4", c.b || "#9a8d79")} alt="" />
                <div className="cartMain">
                  <div className="cartTopLine">
                    <div className="cartTextBlock">
                      <div className="cn cartName">{c.t}</div>
                      {c.col && <div className="cartColor">Colore: <span>{c.col}</span></div>}
                    </div>
                  </div>
                  {opts.length > 0 && (
                    <div className="cartOptions" aria-label="Aggiunte e configurazione">
                      {opts.map((opt, k) => (
                        <div className="cartOptionRow" key={k}>
                          <span className="cartOptionIcon">{cartOptionIcon(opt.kind)}</span>
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="cartBottomLine">
                    <div className="qstep csmall cartQty"><button onClick={() => onStep(i, -1)} aria-label="Diminuisci">−</button><span>{c.qty}</span><button onClick={() => onStep(i, 1)} aria-label="Aumenta">+</button></div>
                    <div className="cartItemPrice">{eur(c.price * c.qty)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cttot"><span>Totale</span><span>{eur(total)}</span></div>
        {cart.length > 0 && <>
          <p className="cartnote">Prepareremo il tuo oggetto con cura.</p>
          <button className="qsend" onClick={onConfirm}><Check /> Invia richiesta</button>
        </>}
      </div>
    </section>
  );
}

function CartSheet({ cart, total, onClose, onStep, onConfirm }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") doClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const { wrapRef, sheetRef } = useDragToClose(doClose);
  return (
    <div className={"ipick on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Carrello" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap" ref={wrapRef}>
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi carrello"><ChevronDown /></button>
        <div className="sheet" ref={sheetRef}>
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
                <div className="qstep csmall"><button onClick={() => onStep(i, -1)} aria-label="Diminuisci">−</button><span>{c.qty}</span><button onClick={() => onStep(i, 1)} aria-label="Aumenta">+</button></div>
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
          <span className="badge bp">Inviato</span>
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

function OrderDetailView({ o, isAdmin, onDelete }) {
  const STATUS_META = {
    confirmed: { label: "Confermato", cls: "ostat--confirmed", note: "Ordine confermato." },
    pending:   { label: "Inviato", cls: "ostat--pending", note: "in attesa di conferma." },
    completed: { label: "Completato", cls: "ostat--completed", note: "Il tuo ordine è pronto!" },
    rejected:  { label: "Non accettato", cls: "ostat--rejected", note: "Questa richiesta non può essere confermata in questo momento." },
  };
  const st = STATUS_META[o.status] || STATUS_META.pending;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const customerName = o.who || "Cliente";
  const dateLine = o.date ? fmtDate(o.date).replace(/ /g, "/") : "Dettaglio della richiesta";
  const optionKind = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("cavo")) return "cable";
    if (l.includes("lampadina")) return "bulb";
    if (l.includes("portalampada")) return "holder";
    return "addon";
  };
  const optionLabel = (label) => {
    const raw = String(label || "").trim();
    const l = raw.toLowerCase();
    if (!raw) return "";
    if (l.includes("senza lampadina")) return "Senza lampadina";
    if (l.includes("con lampadina") || l === "lampadina") return "Con lampadina";
    if (l.includes("senza portalampada")) return "Portalampada standard - incluso";
    if (l.includes("con portalampada")) return "Portalampada premium - incluso";
    if (l.includes("portalampada premium") || l === "portalampada") return "Portalampada premium - incluso";
    if (l.includes("portalampada standard")) return "Portalampada standard - incluso";
    if (l.includes("cavo normale") || l.includes("cavo standard")) return "Cavo standard - incluso";
    if (l.includes("cavo in tessuto") || l.includes("cavo intrecciato")) return "Cavo in tessuto - incluso";
    if (l.startsWith("cavo ")) return "Cavo " + raw.slice(5) + " - incluso";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const optionIcon = (kind) => {
    if (kind === "cable") return <IcoCable />;
    if (kind === "bulb") return <IcoBulb />;
    if (kind === "holder") return <IcoHolder />;
    return <span className="orderOptionDot" aria-hidden="true" />;
  };
  const optionRows = (it) => {
    const fromOpt = String(it.opt || "")
      .split("·")
      .map((x) => x.trim())
      .filter(Boolean);
    if (fromOpt.length) return fromOpt.map((label) => ({ label: optionLabel(label), kind: optionKind(label) }));
    return (it.adds || []).map((a) => ({ label: optionLabel(a.label), kind: optionKind(a.label) })).filter((x) => x.label);
  };
  return (
    <section className="screen on orderDetailPage">
      <div className="orderDetailHero px">
        <h2 className="orderDetailTitle">Dettaglio ordine</h2>
      </div>
      <div className="orderDetailCard glass inv">
        <div className="orderDetailHead">
          <div className="orderDetailIdentity">
            {isAdmin && <img className="invav" src={o.avatar || avatarURI(customerName)} alt="" />}
            <div className="orderDetailIdentityText">
              <div className="orderDetailName">{customerName}</div>
              <div className="orderDetailDate">{dateLine}</div>
            </div>
          </div>
          <div className="orderDetailStatus"><span className={"ostat " + st.cls}>{st.label}</span></div>
        </div>
        <div className="invitems">
          {o.items.map((it, i) => {
            const material = it.material || "";
            const color = it.col || "";
            const opts = optionRows(it);
            return (
              <div className="orderDetailItem" key={i}>
                <div className="orderDetailItemTop">
                  <img className="orderDetailThumb" src={it.img || gimg("#cfc4b4", "#9a8d79")} alt="" />
                  <div className="orderDetailProduct">
                    <div className="orderDetailProductLine">
                      <b className="orderDetailProductName">{it.t}</b>
                      <span className="orderDetailQty">×{it.qty}</span>
                    </div>
                    {(material || color) && (
                      <div className="orderDetailProductMeta">
                        {material && <span>{material}</span>}
                        {color && <span>Colore: <strong>{color}</strong></span>}
                      </div>
                    )}
                    {opts.length > 0 && (
                      <div className="orderDetailOptions" aria-label="Aggiunte e configurazione">
                        {opts.map((opt, k) => (
                          <div className="orderOptionRow" key={k}>
                            <span className="orderOptionIcon">{optionIcon(opt.kind)}</span>
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="orderDetailItemPrice">{eur(it.price * it.qty)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cttot invtotrow"><span>Totale</span><span className="invtot">{eur(o.total)}</span></div>
      </div>
      {isAdmin && onDelete && (
        <div className={"orderDanger" + (deleteConfirm ? " confirming" : "")}>
          {!deleteConfirm ? (
            <button type="button" className="orderDangerBtn" onClick={() => setDeleteConfirm(true)}>Elimina ordine</button>
          ) : (
            <div className="orderDangerConfirm">
              <div>
                <b>Eliminare definitivamente?</b>
                <span>Questa azione non può essere annullata.</span>
              </div>
              <div className="orderDangerActions">
                <button type="button" className="orderDangerCancel" onClick={() => setDeleteConfirm(false)}>Annulla</button>
                <button type="button" className="orderDangerDelete" onClick={() => onDelete(o.id)}>Elimina</button>
              </div>
            </div>
          )}
        </div>
      )}
      {!isAdmin && <p className="orderDetailNote">{st.note}</p>}
    </section>
  );
}

/* ---- PIACIUTI ---- */
function LikedEmpty() {
  return (
    <div className="liked-empty">
      <div className="liked-empty-mark" aria-hidden="true">
        <HeartI />
      </div>
      <h3 className="liked-empty-title">Ciò che merita di restare.</h3>
      <p className="liked-empty-sub">Gli oggetti che salvi appariranno qui.</p>
    </div>
  );
}
function Liked({ likedPrints, onOpen, onLike, onEdit }) {
  return (
    <section className="screen on liked-screen">
      <h2 className="title px"><span className="ticon"><HeartI /></span>Piaciuti</h2>
      {likedPrints.length > 0 && (
        <p className="liked-page-sub px">Ciò che merita di restare.</p>
      )}
      {likedPrints.length === 0 && <LikedEmpty />}
      {likedPrints.length > 0 && (
        <div className="liked-grid-wrap">
          <Grid>{likedPrints.map((p, i) => (
            <Card
              key={p.id}
              p={p}
              liked
              onLike={onLike}
              onOpen={() => onOpen(p.id)}
              onEdit={onEdit}
              context="liked"
            />
          ))}</Grid>
        </div>
      )}
      <div className="liked-bottom-spacer" />
    </section>
  );
}

/* ---- PROFILO ---- */
function OrdersTab({ orders, isAdmin, onOpenOrder, onConfirm, onReject, onComplete, onDelete, orderFocus, clearFocus, onGoExplore }) {
  const orderRefs = useRef({});
  useEffect(() => {
    if (orderFocus && orderRefs.current[orderFocus]) {
      orderRefs.current[orderFocus].scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => clearFocus && clearFocus(), 2600);
      return () => clearTimeout(t);
    }
  }, [orderFocus]);

  const oTitle = (o) => o.items.length > 1 ? o.items.length + " articoli" : (o.items[0] ? o.items[0].t : "Ordine");
  const setRef = (id) => (el) => { orderRefs.current[id] = el; };
  const [filter, setFilter] = useState("all");

  const pend = orders.filter((o) => o.status === "pending");
  const conf = orders.filter((o) => o.status === "confirmed");
  const comp = orders.filter((o) => o.status === "completed");
  const rej  = orders.filter((o) => o.status === "rejected");

  const filters = isAdmin
    ? [
        ["all", "Tutti", orders.length],
        ["pending", "Da accettare", pend.length],
        ["confirmed", "Accettati", conf.length],
        ["completed", "Completati", comp.length],
        ["rejected", "Rifiutati", rej.length],
      ]
    : [
        ["all", "Tutti", orders.length],
        ["pending", "Inviati", pend.length],
        ["confirmed", "Accettati", conf.length],
        ["completed", "Completati", comp.length],
      ];

  useEffect(() => {
    if (!filters.some(([id]) => id === filter)) setFilter("all");
  }, [isAdmin, orders.length]);

  const STATUS_META = {
    confirmed: { label: "Confermato",  cls: "ostat--confirmed", note: "Ordine confermato." },
    pending:   { label: "Inviato",    cls: "ostat--pending",   note: "in attesa di conferma." },
    completed: { label: "Completato", cls: "ostat--completed", note: "Il tuo ordine è pronto!" },
    rejected:  { label: "Non accettato", cls: "ostat--rejected", note: "Questa richiesta non può essere confermata in questo momento." },
  };

  const orderMetaText = (o) => (
    <>
      {o.date && <span>{fmtDate(o.date)}</span>}
      <span>{eur(o.total)}</span>
    </>
  );

  const OrderCard = ({ o, idx }) => {
    const st = STATUS_META[o.status] || STATUS_META.pending;
    const thumb = o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79");
    return (
      <article
        className={"orderCard glass ord in" + (orderFocus === o.id ? " ofocus" : "")}
        ref={setRef(o.id)}
        style={{ animationDelay: idx * 55 + "ms" }}
        onClick={() => onOpenOrder(o.id)}
        role="button"
        tabIndex={0}
        aria-label={"Ordine: " + oTitle(o) + ", stato: " + st.label}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenOrder(o.id); } }}
      >
        <img className="orderThumb" src={thumb} alt={oTitle(o)} />
        <div className="orderBody">
          <div className="orderTitle">{oTitle(o)}</div>
          <div className="orderMeta">{orderMetaText(o)}</div>
          {!isAdmin && <p className="orderNote">{st.note}</p>}
        </div>
        <div className="orderSide">
          <span className={"ostat " + st.cls}>{st.label}</span>
          {isAdmin && o.status === "confirmed" && onComplete && (
            <button className="orderCompleteBtn" onClick={(e) => { e.stopPropagation(); onComplete(o.id); }}>Completa</button>
          )}

        </div>
      </article>
    );
  };

  // Banner pendenti (admin: con azioni; cliente: card unificata)
  const PendCard = ({ o, idx }) => {
    const thumb = o.items[0] ? (o.items[0].img || gimg("#cfc4b4", "#9a8d79")) : gimg("#cfc4b4", "#9a8d79");
    return (
      <article
        className={"orderCard glass orderCard--pend ord in" + (orderFocus === o.id ? " ofocus" : "")}
        ref={setRef(o.id)}
        style={{ animationDelay: idx * 55 + "ms" }}
        onClick={() => onOpenOrder(o.id)}
        role="button" tabIndex={0}
        aria-label={"Richiesta in attesa: " + oTitle(o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenOrder(o.id); } }}
      >
        {isAdmin && <img className="orderAvatar" src={o.avatar || avatarURI(o.who)} alt={o.who} />}
        {!isAdmin && <img className="orderThumb" src={thumb} alt={oTitle(o)} />}
        <div className="orderBody">
          <div className="orderTitle">{isAdmin ? o.who : oTitle(o)}</div>
          <div className="orderMeta">{orderMetaText(o)}</div>
          <p className="orderNote">{isAdmin ? "Apri il dettaglio per controllare la richiesta." : STATUS_META.pending.note}</p>
        </div>
        <div className="orderSide">
          <span className="ostat ostat--pending">Inviato</span>
          {isAdmin && (
            <div className="orderAdminActions" onClick={(e) => e.stopPropagation()}>
              <button className="btnY" onClick={() => onConfirm(o.id)}>Conferma</button>
              <button className="btnN" onClick={() => onReject(o.id)}>Rifiuta</button>
            </div>
          )}
        </div>
      </article>
    );
  };

  const ordered = [...pend, ...conf, ...comp, ...rej];
  const visibleOrders = filter === "all" ? ordered : ordered.filter((o) => o.status === filter);
  const emptyFilterText = isAdmin
    ? { pending: "Nessuna richiesta da accettare.", confirmed: "Nessun ordine accettato.", completed: "Nessun ordine completato.", rejected: "Nessun ordine rifiutato." }
    : { pending: "Nessun ordine inviato.", confirmed: "Nessun ordine accettato.", completed: "Nessun ordine completato." };

  return (
    <section className="screen on ordersPage">
      <div className="ordersHero">
        <h2 className="title px" style={{ marginBottom: 4 }}><span className="ticon"><OrdersI /></span>Ordini</h2>
        <p className="ordersSubtitle px">Tocca per scoprire i dettagli.</p>
      </div>

      {orders.length === 0 && (
        <div className="ordersEmpty">
          <div className="ordersEmptyIcon" aria-hidden="true"><OrdersI /></div>
          <p className="ordersEmptyText">Quando sceglierai un oggetto, lo ritroverai qui.</p>
          {onGoExplore && (
            <button type="button" className="ordersExploreCta" onClick={onGoExplore}>Esplora</button>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <>
          <div className="orderFilters" role="tablist" aria-label="Filtra ordini">
            {filters.map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                className={"orderFilter" + (filter === id ? " on" : "")}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                <span>{label}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>
          {visibleOrders.length === 0 ? (
            <p className="ordersFilterEmpty">{emptyFilterText[filter] || "Nessun ordine in questa sezione."}</p>
          ) : (
            <div className="ordersList">
              {visibleOrders.map((o, i) => o.status === "pending"
                ? <PendCard key={o.id} o={o} idx={i} />
                : <OrderCard key={o.id} o={o} idx={i} />
              )}
            </div>
          )}
        </>
      )}

      <div className="ordersBottomSpacer" />
    </section>
  );
}

function Profile({ user, theme, onTheme, onLogout, isAdmin, onNewProduct, likedPrints, onOpenProduct, onLike, onEditProduct, pwaInstalled, onPWAInstall, pushSupported, pushPermission, pushSubscribed, pushBusy, onTogglePush }) {
  const denied  = pushPermission === "denied";
  const iosLock = pushPermission !== "granted" && typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !pwaInstalled;

  const pushSubtitle = pushBusy
    ? "Aggiornamento notifiche…"
    : denied
      ? "Le notifiche sono bloccate nelle impostazioni del browser."
      : iosLock
        ? "Su iPhone le notifiche sono disponibili aprendo Strato dalla schermata Home."
        : pushSubscribed
          ? (isAdmin ? "Ti avviseremo quando arriva una richiesta da confermare." : "Ti avviseremo quando una richiesta viene aggiornata.")
          : "Ricevi aggiornamenti discreti sulle richieste Strato.";

  const canToggle = pushSupported && !denied && !pushBusy;

  const handleToggleKey = (e) => {
    if (canToggle && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onTogglePush(); }
  };

  const chevron = <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;

  const onPwaKey = (e) => {
    if (!pwaInstalled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPWAInstall(); }
  };

  return (
    <section className="screen on profilePage">
      <h2 className="title px"><span className="ticon"><User /></span>Profilo</h2>

      {/* Card identità */}
      <div className="profileHero">
        <img className="profileAvatar" src={user.avatar || avatarURI(user.name)} alt={"Avatar di " + user.name} />
        <div className="profileIdentity">
          <div className="profileName">{user.name}</div>
          <span className="profileRolePill">{isAdmin ? "Amministratore" : "Cliente"}</span>
          <p className="profileMicrocopy">{isAdmin ? "Gestisci l'esperienza Strato con cura e coerenza." : "Il tuo spazio personale Strato."}</p>
        </div>
      </div>

      {/* Amministrazione */}
      {isAdmin && (
        <section className="profileSection">
          <h3 className="profileSectionTitle">Amministrazione</h3>
          <div className="profileAdminCard">
            <div className="profileAdminActions">
              <button type="button" className="profileSubtleButton" onClick={onNewProduct}>
                <span className="profileSubtleIcon"><Plus /></span>
                <span className="profileSubtleText">
                  <span className="profileSubtleT">Nuovo prodotto</span>
                  <span className="profileSubtleS">Aggiungi un oggetto alla collezione.</span>
                </span>
                <span className="profileSubtleArr">{chevron}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Aspetto */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">Aspetto</h3>
        <div className="themeseg compact">
          {[["light", "Luce", <Sun key="s" />], ["dark", "Buio", <Moon key="m" />], ["auto", "Automatico", <AutoI key="a" />]].map(([t, label, icon]) => (
            <button key={t} type="button" className={"segbtn" + (theme === t ? " on" : "")} onClick={() => onTheme(t)} aria-pressed={theme === t} aria-label={label}>
              <span className="segico">{icon}</span><span className="seglbl">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* App */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">App</h3>
        <div
          className={"pwa-prow" + (pwaInstalled ? " installed" : "")}
          onClick={!pwaInstalled ? onPWAInstall : undefined}
          onKeyDown={!pwaInstalled ? onPwaKey : undefined}
          role={pwaInstalled ? undefined : "button"}
          tabIndex={pwaInstalled ? undefined : 0}
        >
          <div className="pwa-prowl">
            <img src="/icon-192.png" alt="Strato" className="pwa-prow-ico" />
            <div>
              <div className="pwa-prowt">{pwaInstalled ? "Esperienza app attiva" : "Installa Strato"}</div>
              <div className="pwa-prows">{pwaInstalled ? "Strato è aperta in modalità app." : "Accesso rapido, fluido e senza distrazioni."}</div>
            </div>
          </div>
          {pwaInstalled
            ? <span className="pwa-prow-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
            : <span className="pwa-prow-arr">{chevron}</span>
          }
        </div>

        {/* Notifiche ordini — toggle persistente */}
        {pushSupported && (
          <div className={"push-row" + (denied ? " push-row--denied" : "") + (pushBusy ? " push-row--busy" : "")}>
            <span className="push-row-ico"><Bell /></span>
            <div className="push-row-body">
              <span className="push-row-title">Notifiche ordini</span>
              <span className="push-row-sub">{pushSubtitle}</span>
            </div>
            {!denied && (
              <button
                type="button"
                role="switch"
                aria-checked={pushSubscribed}
                aria-label={pushSubscribed ? "Disattiva notifiche ordini" : "Attiva notifiche ordini"}
                disabled={pushBusy || !canToggle}
                className={"push-toggle" + (pushSubscribed ? " push-toggle--on" : "") + (pushBusy ? " push-toggle--busy" : "")}
                onClick={canToggle ? onTogglePush : undefined}
                onKeyDown={handleToggleKey}
              >
                <span className="push-toggle-knob" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Logout */}
      <div className="profileLogoutWrap">
        <button type="button" className="profileLogout" onClick={onLogout} aria-label="Esci"><LogOut /><span>Esci</span></button>
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
    <section className="screen on appview productview productview--clean adminProductView" aria-label={editing ? "Modifica prodotto" : "Nuovo prodotto"}>
      <div className="detailview-card adminProductCard">
        <div className="adminProductHead">
          <div className="dkick">{editing ? "Modifica articolo" : "Nuovo articolo"}</div>
          <h2 className="adminProductTitle"><Pencil /> {editing ? "Modifica prodotto" : "Nuovo prodotto"}</h2>
        </div>
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
            <label className="achk"><input type="checkbox" checked={f.allow_braided} onChange={(e) => upd("allow_braided", e.target.checked)} /> Permetti cavo in tessuto (altrimenti solo Normale)</label>
            <div className="afrow3">
              {f.allow_braided && <div className="afield"><label>Cavo in tessuto +€</label><input type="number" step="0.5" value={f.addon_braided} onChange={(e) => upd("addon_braided", e.target.value)} /></div>}
              <div className="afield"><label>Lampadina +€</label><input type="number" step="0.5" value={f.addon_bulb} onChange={(e) => upd("addon_bulb", e.target.value)} /></div>
              <div className="afield"><label>Portalampada premium +€</label><input type="number" step="0.5" value={f.addon_holder} onChange={(e) => upd("addon_holder", e.target.value)} /></div>
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
    </section>
  );
}


function UpdatesView({ notifs, onItemClick, onClear, isAdmin }) {
  return (
    <section className="screen on appview updatesview" aria-label="Aggiornamenti">
      <div className="viewhead">
        <div>
          <div className="vieweyebrow">{isAdmin ? "Richieste" : "Aggiornamenti"}</div>
          <h2 className="viewtitle">{isAdmin ? "Richieste da confermare" : "Aggiornamenti"}</h2>
          <p className="viewsub">{isAdmin ? "Controlla i dettagli quando vuoi." : "Le tue richieste, aggiornate con discrezione."}</p>
        </div>
        {notifs.length > 0 && <button className="notifclear" onClick={onClear}><Trash /> Elimina tutte</button>}
      </div>
      <div className="updatesview-card">
        <div className="cartitems">
          {notifs.length === 0 && <div className="cempty">Nessun aggiornamento al momento.<br />Ti avviseremo quando una richiesta cambia stato.</div>}
          {notifs.map((n) => (
            <button className="notifrow" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
              <span className={"notifdot s-" + n.status} />
              <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
              <span className="notifarrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function NotifSheet({ notifs, onClose, onItemClick, onClear }) {
  const [closing, setClosing] = useState(false);
  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 340); };
  const { wrapRef, sheetRef } = useDragToClose(doClose, "up");
  return (
    <div className={"ipick top on" + (closing ? " closing" : "")} role="dialog" aria-modal="true" aria-label="Notifiche" onClick={(e) => { if (e.target.classList.contains("ipick") || e.target.classList.contains("sheetwrap")) doClose(); }}>
      <div className="sheetwrap" ref={wrapRef}>
        <div className="sheet" ref={sheetRef}>
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
        <button className="sheetclose" onClick={doClose} aria-label="Chiudi notifiche"><ChevronUp /></button>
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
        <div className="psec">Icona categoria</div>
        {ICON_GROUPS.map((g) => (
          <div key={g.t}>
            <div className="iggroup">{g.t}</div>
            <div className="ig">
              {g.keys.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"ib" + (icon === k ? " on" : "")}
                  onClick={() => setIcon(k)}
                  aria-label={k.replace(/_/g," ")}
                  aria-pressed={icon === k}
                ><Raw html={glassIcon(k, 30)} /></button>
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

/* Icone minimali inline: nessuna dipendenza esterna per il set nav/azioni. */
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
