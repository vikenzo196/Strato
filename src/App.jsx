import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
import "./styles/app.css";
import {
  GRADS_SVG,
  glassIcon,
  normalizeCategoryIcon,
  confetti,
  ICON_GROUPS,
  CartIcon,
  HomeI,
  SearchI,
  CatsI,
  HeartI,
  OrdersI,
  IcoCable,
  IcoBulb,
  IcoHolder,
  GoogleIcon,
  Sun,
  Moon,
  AutoI,
  Bell,
  Trash,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Camera,
} from "./ui/visuals.jsx";
import { checkPushStatus, enablePushNotifications, disablePushNotifications } from "./utils/push.js";
import { eur, fmtDate, gimg, avatarURI, colImg, compressImage, mapPrint } from "./utils/product.js";
import { usePWAInstall } from "./hooks/usePWAInstall.js";

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
      "@keyframes hapLike{0%{transform:scale(1)}36%{transform:scale(1.055)}72%{transform:scale(.992)}100%{transform:scale(1)}}",
      "@keyframes hapAdd{0%{transform:scale(1)}44%{transform:scale(.972)}100%{transform:scale(1)}}",
      "@keyframes hapConfirm{0%{transform:scale(1)}25%{transform:scale(.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}",
      "@keyframes hapNav{0%{transform:scale(1)}35%{transform:scale(.95)}100%{transform:scale(1)}}",
      ".hap-like{animation:hapLike .34s cubic-bezier(.22,1,.36,1) both!important}",
      ".hap-unlike{animation:hapAdd .24s cubic-bezier(.22,1,.36,1) both!important}",
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

/* ============================ CARD ==================================== */
function Card({ p, liked, onLike, onOpen, onEdit, context }) {
  const c0 = p.cols[0];
  const { tap } = useHaptic();
  const lkRef = useRef(null);
  const isLiked = context === "liked";
  const isHome  = context === "home";
  const cardContextClass = isLiked ? " card--liked" : isHome ? " card--home" : " card--explore";
  const quietCnt = isLiked || isHome; // nascondi badge conteggio in Home e Piaciuti
  const ctaLabel = isLiked ? "Scopri" : isHome ? "Scopri" : "Configura";
  const ctaCls   = isLiked ? "liked-configbtn" : "configbtn";
  const handleCardKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
  };
  return (
    <div
      className={"card in" + cardContextClass + (isLiked ? " liked-card" : "")}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleCardKey}
      aria-label={p.title}
    >
      <div className="ph">
        <img src={colImg(c0)} alt={p.title + (p.category ? " · " + p.category : "")} loading="lazy" decoding="async" />
        {!quietCnt && <div className="cnt"><HeartI /> {p.likeCount}</div>}
        {onEdit && !isLiked && (
          <button className="cedit" onClick={(e) => { e.stopPropagation(); onEdit(p); }} aria-label="Modifica" onKeyDown={(e) => e.stopPropagation()}><Pencil /></button>
        )}
        <button
          ref={lkRef}
          className="lk"
          onClick={(e) => { e.stopPropagation(); tap(liked ? "unlike" : "like", lkRef.current); onLike(p.id); }}
          aria-label={liked ? "Rimuovi dai piaciuti" : "Salva nei piaciuti"}
          aria-pressed={liked}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className={"heart" + (liked ? " liked" : "")}><HeartI /></span>
        </button>
      </div>
      <div className="cbody">
        <div className="cardmeta">
          <div className="cardcat"><Raw html={glassIcon(p.categoryIcon, 14)} />{p.categoryName}</div>
        </div>
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
  const [selectedCatId, setSelectedCatId] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

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
    document.documentElement.classList.toggle("dark", !!dark);

    // Mantiene la status bar mobile nello stesso tono del canvas Strato.
    // v2cd: in dark allinea anche html/body al canvas effettivo per evitare
    // differenze visibili durante rubber-band iOS.
    const statusColor = dark ? "#2D2420" : "#F4EEE6";
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

  // v2bu: rimossa la molla artificiale su wheel.
  // Lo scroll resta nativo; il blocco sotto interviene solo sulle viste corte.
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

  // v2bu: pagine corte statiche; pagine lunghe a scroll nativo.
  useLayoutEffect(() => {
    if (!ready) return;

    const html = document.documentElement;
    const body = document.body;
    const clearLock = () => {
      html.classList.remove("short-page-lock");
      body.classList.remove("short-page-lock");
    };

    let raf = 0;
    let resizeObserver = null;
    const measure = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;

        // Il carrello vuoto ha già un lock dedicato e non va alterato.
        if ((tab === "cart" && cart.length === 0) || body.classList.contains("sheet-open")) {
          clearLock();
          return;
        }

        const wrap = document.querySelector("main.wrap");
        if (!wrap) { clearLock(); return; }

        const activeView = Array.from(wrap.children).find((el) => el.classList && el.classList.contains("screen") && el.classList.contains("on")) || wrap.firstElementChild;
        if (!activeView) { clearLock(); return; }

        // Misura sempre senza lock, altrimenti overflow:hidden falserebbe il risultato.
        clearLock();

        const wrapStyle = window.getComputedStyle(wrap);
        const padTop = parseFloat(wrapStyle.paddingTop) || 0;
        const padBottom = parseFloat(wrapStyle.paddingBottom) || 0;
        const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
        const viewHeight = Math.ceil(activeView.getBoundingClientRect().height);
        const requiredHeight = Math.ceil(viewHeight + padTop + padBottom);

        // Soglia conservativa: blocca solo se la vista reale rientra nel viewport.
        const shouldLock = requiredHeight <= viewport + 1;
        html.classList.toggle("short-page-lock", shouldLock);
        body.classList.toggle("short-page-lock", shouldLock);
        if (shouldLock && window.scrollY !== 0) window.scrollTo(0, 0);
      });
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", measure);

    const wrap = document.querySelector("main.wrap");
    const activeView = wrap && (Array.from(wrap.children).find((el) => el.classList && el.classList.contains("screen") && el.classList.contains("on")) || wrap.firstElementChild);
    if (window.ResizeObserver && activeView) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(activeView);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", measure);
      if (resizeObserver) resizeObserver.disconnect();
      clearLock();
    };
  }, [ready, tab, detailId, invId, editing, cart.length, prints.length, cats.length, likes.length, orders.length, q, selectedCatId, searchFocus, user?.id, isAdmin, orderFocus]);

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
    setNotifPanelOpen(false);
    if (t !== "search" || tab !== "search") {
      setQ("");
      setSearchFocus(false);
      if (t !== "search") setSelectedCatId("");
    }
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
  const openNotifs = () => {
    setSearchFocus(false);
    setNotifPanelOpen((open) => {
      const next = !open;
      if (next) markNotifsSeen();
      return next;
    });
  };
  const onNotifClick = (id) => { setNotifPanelOpen(false); setDetailId(null); setInvId(null); setTab("orders"); setOrderFocus(id); window.scrollTo(0, 0); };
  const openDetail = (id) => { setNotifPanelOpen(false); setQ(""); setSearchFocus(false); setInvId(null); setDetailId(id); window.scrollTo(0, 0); };
  const byId = (id) => prints.find((p) => p.id === id);

  if (!ready) {
    return (<><Bg /><Raw html={GRADS_SVG} /><div className="boot">Strato…</div></>);
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
      const payload = { ...data, icon: normalizeCategoryIcon(data.icon) };
      if (editingCat && editingCat.id) await supabase.from("categories").update(payload).eq("id", editingCat.id);
      else await supabase.from("categories").insert({ ...payload, position: cats.length });
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
  const selectedCat = selectedCatId ? cats.find((c) => String(c.id) === String(selectedCatId)) : null;
  const exploreText = q.trim();
  const exploreProducts = exploreResults(prints, exploreText, selectedCatId);
  const exploreSuggestions = exploreText.length >= 2 ? exploreProducts.slice(0, 4) : [];

  return (
    <>
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
            <button className={"tb-btn bell" + (notifPanelOpen ? " bell--open" : "")} onClick={openNotifs} aria-label="Notifiche" aria-expanded={notifPanelOpen}>
              <Bell /><span className="bellChevron" aria-hidden="true"><ChevronDown /></span>{unread > 0 && <span className="softdot belldot" />}
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
      {user && notifPanelOpen && (
        <NotifDropdown notifs={notifs} onItemClick={onNotifClick} onClear={clearNotifs} onClose={() => setNotifPanelOpen(false)} />
      )}

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
                <input
                  className="searchbox"
                  placeholder={selectedCat ? "Cerca in " + selectedCat.name + "…" : "Cerca per nome…"}
                  value={q}
                  onFocus={() => setSearchFocus(true)}
                  onChange={(e) => setQ(e.target.value)}
                />
                {selectedCat && (
                  <div className="exploreCatContext px">
                    <button
                      className="tb-back exploreCatBack"
                      onClick={() => { setSelectedCatId(""); setQ(""); setSearchFocus(false); }}
                      aria-label="Torna alle categorie"
                    ><ChevronLeft /></button>
                    <span className="exploreCatIcon"><Raw html={glassIcon(selectedCat.icon, 22)} /></span>
                    <span className="exploreCatName">{selectedCat.name}</span>
                  </div>
                )}
                {searchFocus && exploreText.length >= 2 && (
                  <div className="predictivePanel" role="listbox" aria-label="Suggerimenti ricerca">
                    <div className="predictiveTitle">Suggerimenti</div>
                    {exploreSuggestions.length > 0 ? exploreSuggestions.map((p) => (
                      <button
                        key={p.id}
                        className="predictiveItem"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => openDetail(p.id)}
                      >
                        <img src={colImg(p.cols[0])} alt="" loading="lazy" decoding="async" />
                        <span className="predictiveCopy">
                          <span className="predictiveName">{p.title}</span>
                          <span className="predictiveMeta">{p.categoryName || "Oggetto"}{p.material ? " · " + p.material : ""}</span>
                        </span>
                      </button>
                    )) : (
                      <div className="predictiveEmpty">{selectedCat ? "Nessun oggetto trovato in questa categoria." : "Nessun oggetto trovato."}</div>
                    )}
                  </div>
                )}
                {!selectedCat && !exploreText && (
                  <>
                    <h3 className="osec">Categorie</h3>
                    {cats.length === 0 && <p className="empty">Nessuna categoria.{isAdmin ? " Tocca + per aggiungerne." : ""}</p>}
                    <div className="catgrid">
                      {cats.map((c) => (
                        <button key={c.id} className="cat glass" onClick={() => { setSelectedCatId(c.id); setQ(""); setSearchFocus(false); }}>
                          {isAdmin && <span className="cedit catedit2" onClick={(e) => { e.stopPropagation(); setEditingCat(c); }}><Pencil /></span>}
                          <span className="ci"><Raw html={glassIcon(c.icon, 50)} /></span>
                          <span className="catn">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {(selectedCat || exploreText) && (
                  <>
                    <Grid>
                      {exploreProducts.map((p) => (
                        <Card key={p.id} p={p} liked={liked(p.id)} onLike={toggleLike} onOpen={() => openDetail(p.id)} onEdit={adminEdit} />
                      ))}
                    </Grid>
                    {exploreProducts.length === 0 && <p className="empty">{selectedCat && exploreText ? "Nessun oggetto trovato in questa categoria." : (selectedCat ? "Nessun oggetto in questa categoria." : "Nessun risultato.")}</p>}
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
  const title = (p.title || "").toLowerCase();
  return title.includes(q.toLowerCase());
}

function exploreScore(p, q) {
  const n = (q || "").trim().toLowerCase();
  if (!n) return 1;
  const title = (p.title || "").toLowerCase();
  if (!title.includes(n)) return 0;
  if (title === n) return 100;
  if (title.startsWith(n)) return 88;
  if (title.includes(n)) return 72;
  return 0;
}

function exploreResults(prints, q, categoryId) {
  const n = (q || "").trim();
  return (prints || [])
    .filter((p) => !categoryId || String(p.category_id || "") === String(categoryId))
    .map((p) => ({ p, score: exploreScore(p, n) }))
    .filter(({ score }) => !n || score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
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
          <div className="cartEmptyScene">
            <div className="cartEmptyFullContent">
              <div className="cartEmptyMini">Ancora nessun oggetto</div>
              <h3>Il carrello è vuoto.</h3>
              <p>Quando sceglierai un oggetto, lo ritroverai qui.</p>
            </div>
            <div className="cartEmptyFullArt" aria-hidden="true" />
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
          <p className="ordersEmptyText">Quando invierai un ordine,<br />lo ritroverai qui.</p>
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
          {isAdmin && <span className="profileRolePill">Amministratore</span>}
          <p className="profileMicrocopy">{isAdmin ? "Gestisci l'esperienza Strato con cura e coerenza." : "Il tuo spazio personale Strato."}</p>
        </div>
      </div>

      {/* Preferenze */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">Preferenze</h3>
        <div className="profilePreferenceCard">
          <div className="profileSettingIntro">
            <span className="profileSettingLabel">Aspetto</span>
          </div>
          <div className="themeseg compact">
            {[["light", "Luce", <Sun key="s" />], ["dark", "Buio", <Moon key="m" />], ["auto", "Auto", <AutoI key="a" />]].map(([t, label, icon]) => (
              <button key={t} type="button" className={"segbtn" + (theme === t ? " on" : "")} onClick={() => onTheme(t)} aria-pressed={theme === t} aria-label={label === "Auto" ? "Automatico" : label}>
                <span className="segico">{icon}</span><span className="seglbl">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* App */}
      <section className="profileSection">
        <h3 className="profileSectionTitle">App</h3>
        <div className="profileAppCard">
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

          {/* Notifiche — toggle persistente */}
          {pushSupported && (
            <>
              <div className="profileAppDivider" aria-hidden="true" />
              <div className={"push-row" + (denied ? " push-row--denied" : "") + (pushBusy ? " push-row--busy" : "")}>
                <span className="push-row-ico"><Bell /></span>
                <div className="push-row-body">
                  <span className="push-row-title">Notifiche</span>
                  <span className="push-row-sub">{pushSubtitle}</span>
                </div>
                {!denied && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pushSubscribed}
                    aria-label={pushSubscribed ? "Disattiva notifiche" : "Attiva notifiche"}
                    disabled={pushBusy || !canToggle}
                    className={"push-toggle" + (pushSubscribed ? " push-toggle--on" : "") + (pushBusy ? " push-toggle--busy" : "")}
                    onClick={canToggle ? onTogglePush : undefined}
                    onKeyDown={handleToggleKey}
                  >
                    <span className="push-toggle-knob" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Strumenti */}
      {isAdmin && (
        <section className="profileSection profileSection--admin">
          <h3 className="profileSectionTitle">Strumenti</h3>
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

      {/* Logout */}
      <div className="profileLogoutWrap">
        <button type="button" className="profileLogout" onClick={onLogout} aria-label="Esci da Strato"><LogOut /><span>Esci da Strato</span></button>
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


function NotifDropdown({ notifs, onItemClick, onClear, onClose }) {
  return (
    <div className="notifDropdown" role="region" aria-label="Notifiche">
      <div className="notifDropdownInner">
        <div className="notifDropdownHead">
          <div className="notifDropdownTitle"><Bell /> Notifiche</div>
          <div className="notifDropdownActions">
            {notifs.length > 0 && <button className="notifclear notifclear--inline" onClick={onClear}><Trash /> Elimina tutte</button>}
            <button className="notifDropdownClose" onClick={onClose} aria-label="Chiudi notifiche"><ChevronUp /></button>
          </div>
        </div>
        <div className="notifDropdownList">
          {notifs.length === 0 && <div className="cempty notifDropdownEmpty">Nessuna notifica per ora.</div>}
          {notifs.slice(0, 4).map((n) => (
            <button className="notifrow notifrow--dropdown" key={n.id + n.status} onClick={() => onItemClick(n.id)}>
              <span className={"notifdot s-" + n.status} />
              <span className="notiftxt"><b>{n.title}</b><span className="notifb">{n.body}</span></span>
              <span className="notifarrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
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
  const [icon, setIcon] = useState(normalizeCategoryIcon(cat ? cat.icon : "v_classico"));
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
