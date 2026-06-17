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
.tb-btn.cart .cbadge{display:grid}
.tb-right{gap:10px}

/* ---- parallasse leggera su scroll (solo immagine hero) ---- */
.herocard img{transform:scale(1.08) translateY(calc(var(--par,0) * -0.015px));transition:transform .05s linear}

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
          <button className={"dnav cart" + (tab === "cart" ? " act" : "")} onClick={(e) => { tap("nav", e.currentTarget); open("cart"); }} aria-label={"Carrello" + (cartCount > 0 ? " (" + cartCount + ")" : "")}><CartIcon />{cartCount > 0 && <span className="cartbadge">{cartCount}</span>}</button>
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
  // Una sola tile in evidenza: articolo casuale, nuovo ad ogni refresh del sito.
  const hero = useMemo(() => (prints.length ? prints[Math.floor(Math.random() * prints.length)] : null), [prints.length]);
  const { tap } = useHaptic();
  const heroLkRef = useRef(null);
  return (
    <section className="screen on">
      <div className="px">
        <h1 className="hero">Design contemporaneo, plasmato strato dopo strato.</h1>
        <div className="kick homekick">A COLPO D'OCCHIO</div>
      </div>
      {hero && (
        <div className="herocard" key={hero.id} onClick={() => onOpen(hero.id)}>
          <img src={colImg(hero.cols[0])} alt={hero.title} loading="lazy" decoding="async" />
          <button ref={heroLkRef} className="lk" onClick={(e) => { e.stopPropagation(); tap(liked(hero.id) ? "unlike" : "like", heroLkRef.current); onLike(hero.id); }} aria-label={liked(hero.id) ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}>
            <span className={"heart" + (liked(hero.id) ? " liked" : "")}><HeartI /></span>
          </button>
          <div className="herotag"><div className="ht">{hero.title}</div><div className="hp">{eur(hero.price)}</div></div>
          {onEdit && <button className="cedit hero" onClick={(e) => { e.stopPropagation(); onEdit(hero); }} aria-label="Modifica"><Pencil /></button>}
        </div>
      )}
      <h2 className="title px home-sec-title">Lasciati ispirare</h2>
      {prints.length === 0 && <p className="empty">Nessun prodotto ancora.</p>}
      <Grid>
        {prints.map((p) => <Card key={p.id} p={p} liked={liked(p.id)} onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} context="home" />)}
      </Grid>
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
  return (
    <section className="screen on appview cartview" aria-label="Carrello">
      <div className="viewhead">
        <div>
          <div className="vieweyebrow">Richiesta</div>
          <h2 className="viewtitle">Carrello</h2>
          <p className="viewsub">Controlla i dettagli della tua scelta.</p>
        </div>
      </div>
      <div className="cartview-card">
        <div className="cartitems">
          {cart.length === 0 && (
            <>
              <div className="cempty">Gli oggetti scelti appariranno qui.</div>
              <button className="cartempty-action" onClick={onGoExplore}>Esplora gli oggetti</button>
            </>
          )}
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
