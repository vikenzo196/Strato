import React, { useState, useEffect, useRef } from "react";
import {
  Menu, X, Heart, User, LogOut, ChevronLeft, ChevronRight, Plus, Search,
  Trash2, Upload, Clock, Ruler, Box, Check, ArrowRight, Send, Pencil, MessageCircle
} from "lucide-react";
import { supabase } from "./lib/supabase";

/* =========================================================================
   PALETTE — variabili CSS, così il tema chiaro/scuro segue il dispositivo
   ========================================================================= */
const C = {
  bg: "var(--bg)", surface: "var(--surface)", surfaceAlt: "var(--surfaceAlt)",
  ink: "var(--ink)", inkSoft: "var(--inkSoft)", inkFaint: "var(--inkFaint)",
  line: "var(--line)", clay: "var(--clay)", clayDeep: "var(--clayDeep)", claySoft: "var(--claySoft)",
  sage: "var(--sage)", sageSoft: "var(--sageSoft)", heart: "var(--heart)",
  headerBg: "var(--headerBg)", shadow: "var(--shadow)", shadowSoft: "var(--shadowSoft)",
};
const HEART_FIXED = "#C2715F";   // per il cuore sopra le foto (bolla bianca)
const INK_FIXED = "#2C2825";
const WA_GREEN = "#25D366";
const display = "'Fraunces', Georgia, serif";
const body = "'Hanken Grotesk', system-ui, sans-serif";

/* =========================================================================
   HELPERS
   ========================================================================= */
const eur = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";

const WA_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || "393248143316").replace(/\D/g, "");
const waLink = (p) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Ciao! Vorrei ordinare: ${p.title} — ${eur(p.price)}. (dal sito Strato)`)}`;

const timeAgo = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "ora"; if (m < 60) return m + " min fa";
  const h = Math.floor(m / 60); if (h < 24) return h + " h fa";
  return Math.floor(h / 24) + " g fa";
};

const mapPrint = (r) => ({
  id: r.id, title: r.title, desc: r.description || "", price: Number(r.price) || 0,
  material: r.material || "", dim: r.dimensions || "", time: r.print_time || "",
  images: (r.images && r.images.length ? r.images : [PLACEHOLDER]),
  likeCount: r.like_count || 0, createdAt: new Date(r.created_at).getTime(),
});

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='800' height='800' fill='#ECE7DE'/><circle cx='400' cy='380' r='150' fill='#D9CDBF'/></svg>`);

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        let { width, height } = img;
        if (width > height && width > max) { height = (height * max) / width; width = max; }
        else if (height > max) { width = (width * max) / height; height = max; }
        const cv = document.createElement("canvas");
        cv.width = width; cv.height = height;
        cv.getContext("2d").drawImage(img, 0, 0, width, height);
        cv.toBlob((blob) => resolve({ kind: "new", blob, preview: URL.createObjectURL(blob) }), "image/jpeg", 0.82);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.515 5.26l-.999 3.648 3.973-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

/* =========================================================================
   CAROUSEL — track con parallax, drag (touch+mouse), tap distinto da swipe
   ========================================================================= */
function Carousel({ images, rounded = 24, ratio = "100%", showDots = true, parallax = 0.16, onTap }) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef(null);
  const start = useRef(null);
  const moved = useRef(0);
  const [w, setW] = useState(0);
  const n = images.length;

  useEffect(() => { setI(0); setDrag(0); }, [images]);
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(update); ro.observe(el); }
    else window.addEventListener("resize", update);
    return () => { ro ? ro.disconnect() : window.removeEventListener("resize", update); };
  }, []);

  const go = (d) => setI((p) => Math.min(n - 1, Math.max(0, p + d)));
  const onDown = (x, e) => {
    if (e && e.target.closest && e.target.closest("button")) return;
    start.current = x; moved.current = 0; setDragging(true);
    if (e && e.currentTarget.setPointerCapture && e.pointerId != null) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} }
  };
  const onMove = (x) => {
    if (start.current == null) return;
    let dx = x - start.current;
    moved.current = Math.max(moved.current, Math.abs(dx));
    if ((i === 0 && dx > 0) || (i === n - 1 && dx < 0)) dx *= 0.35;
    setDrag(dx);
  };
  const onUp = () => {
    if (start.current == null) return;
    const threshold = Math.max(44, (w || 300) * 0.16);
    if (drag < -threshold) go(1);
    else if (drag > threshold) go(-1);
    else if (moved.current < 8 && onTap) onTap();
    start.current = null; setDragging(false); setDrag(0);
  };

  const progress = w ? i - drag / w : i;
  const trackX = -progress * (w || 0);
  const over = parallax;

  return (
    <div ref={wrapRef}
      style={{ position: "relative", width: "100%", paddingTop: ratio, borderRadius: rounded, overflow: "hidden", background: C.surfaceAlt, touchAction: "pan-y", cursor: dragging ? "grabbing" : (onTap ? "pointer" : "grab"), userSelect: "none" }}
      onPointerDown={(e) => onDown(e.clientX, e)} onPointerMove={(e) => onMove(e.clientX)} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => { if (dragging) onUp(); }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", transform: `translate3d(${trackX}px,0,0)`, transition: dragging ? "none" : "transform .55s cubic-bezier(.2,.85,.25,1)", willChange: "transform" }}>
        {images.map((src, k) => {
          const off = (k - progress) * (w || 0) * over;
          return (
            <div key={k} style={{ position: "relative", flex: w ? `0 0 ${w}px` : "0 0 100%", height: "100%", overflow: "hidden" }}>
              <img src={src} alt="" draggable={false}
                style={{ position: "absolute", top: 0, height: "100%", width: `${(1 + 2 * over) * 100}%`, left: `-${over * 100}%`, transform: `translate3d(${off}px,0,0)`, transition: dragging ? "none" : "transform .55s cubic-bezier(.2,.85,.25,1)", objectFit: "cover", willChange: "transform" }} />
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} className="s-press" style={navBtn(8)} aria-label="Prec"><ChevronLeft size={18} /></button>
          <button onClick={() => go(1)} className="s-press" style={navBtn(null, 8)} aria-label="Succ"><ChevronRight size={18} /></button>
          {showDots && (
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, pointerEvents: "none" }}>
              {images.map((_, k) => <span key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, background: k === i ? "#fff" : "rgba(255,255,255,0.6)", transition: "all .35s cubic-bezier(.2,.85,.25,1)" }} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
const navBtn = (left, right) => ({
  position: "absolute", top: "50%", transform: "translateY(-50%)", left: left ?? "auto", right: right ?? "auto",
  width: 34, height: 34, borderRadius: 17, border: "none", background: "rgba(255,255,255,0.82)", color: INK_FIXED,
  display: "grid", placeItems: "center", cursor: "pointer", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
});

/* =========================================================================
   APP
   ========================================================================= */
export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [prints, setPrints] = useState([]);
  const [likes, setLikes] = useState([]);
  const [route, setRoute] = useState({ name: "home" });
  const [menu, setMenu] = useState(false);
  const [toasts, setToasts] = useState([]);

  const isAdmin = user?.role === "admin";
  const toast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const bootstrap = async (session) => {
    const { data: rows } = await supabase.from("prints").select("*").order("created_at", { ascending: false });
    setPrints((rows || []).map(mapPrint));
    if (!session) { setUser(null); setLikes([]); return; }
    const au = session.user;
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", au.id).maybeSingle();
    const provider = au.app_metadata?.provider || "email";
    setUser({
      id: au.id,
      name: prof?.full_name || au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split("@")[0] : "Utente"),
      role: prof?.is_admin ? "admin" : "user",
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
    });
    const { data: l } = await supabase.from("likes").select("print_id").eq("user_id", au.id);
    setLikes((l || []).map((r) => r.print_id));
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

  const logout = async () => { await supabase.auth.signOut(); setMenu(false); setRoute({ name: "home" }); };

  const toggleLike = async (id) => {
    if (!user) return;
    const liked = likes.includes(id);
    setLikes(liked ? likes.filter((x) => x !== id) : [...likes, id]);
    setPrints((prev) => prev.map((p) => p.id === id ? { ...p, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) } : p));
    if (liked) await supabase.from("likes").delete().eq("user_id", user.id).eq("print_id", id);
    else await supabase.from("likes").insert({ user_id: user.id, print_id: id });
  };

  const uploadBlobs = async (blobs) => {
    const urls = [];
    for (const blob of blobs) {
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error } = await supabase.storage.from("prints").upload(path, blob, { contentType: "image/jpeg" });
      if (error) { toast("Errore upload immagine"); throw error; }
      urls.push(supabase.storage.from("prints").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  };

  const addPrint = async (data, newBlobs) => {
    const urls = await uploadBlobs(newBlobs);
    const { data: row, error } = await supabase.from("prints").insert({
      title: data.title, description: data.desc, price: data.price, material: data.material,
      dimensions: data.dim, print_time: data.time, images: urls, created_by: user.id,
    }).select().single();
    if (error) { toast("Errore pubblicazione"); throw error; }
    setPrints((prev) => [mapPrint(row), ...prev]);
    toast("Stampa pubblicata");
  };

  const updatePrint = async (id, data, keptUrls, newBlobs) => {
    const urls = [...keptUrls, ...(await uploadBlobs(newBlobs))];
    const { data: row, error } = await supabase.from("prints").update({
      title: data.title, description: data.desc, price: data.price, material: data.material,
      dimensions: data.dim, print_time: data.time, images: urls,
    }).eq("id", id).select().single();
    if (error) { toast("Errore salvataggio"); throw error; }
    setPrints((prev) => prev.map((p) => p.id === id ? mapPrint(row) : p));
    toast("Stampa aggiornata");
  };

  const deletePrint = async (id) => {
    const { error } = await supabase.from("prints").delete().eq("id", id);
    if (error) { toast("Errore eliminazione"); return; }
    setPrints((prev) => prev.filter((p) => p.id !== id));
    toast("Stampa rimossa");
  };

  const go = (name, extra = {}) => { setRoute({ name, ...extra }); setMenu(false); window.scrollTo(0, 0); };
  const byId = (id) => prints.find((p) => p.id === id);

  const GlobalStyle = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
      :root{
        --bg:#F4F1EB; --surface:#FBFAF6; --surfaceAlt:#ECE7DE;
        --ink:#2C2825; --inkSoft:#736B61; --inkFaint:#A39C90; --line:#E2DBD0;
        --clay:#A8806B; --clayDeep:#8C6856; --claySoft:#E4D5CB;
        --sage:#7F9079; --sageSoft:#DBE2D5; --heart:#C2715F;
        --headerBg:rgba(244,241,235,0.85);
        --shadow:0 8px 30px rgba(44,40,37,0.08); --shadowSoft:0 2px 12px rgba(44,40,37,0.05);
      }
      @media (prefers-color-scheme: dark){
        :root{
          --bg:#1B1917; --surface:#232020; --surfaceAlt:#2C2826;
          --ink:#ECE6DE; --inkSoft:#B3AA9E; --inkFaint:#7E766B; --line:#39332F;
          --clay:#C49A82; --clayDeep:#A8806B; --claySoft:#43352D;
          --sage:#9FB098; --sageSoft:#2F3A2C; --heart:#DE8B79;
          --headerBg:rgba(27,25,23,0.85);
          --shadow:0 10px 34px rgba(0,0,0,0.45); --shadowSoft:0 2px 14px rgba(0,0,0,0.35);
        }
      }
      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      body { background: var(--bg); }
      ::selection { background: var(--claySoft); }

      @keyframes s-fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      @keyframes s-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes s-drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes s-toastIn { from { opacity: 0; transform: translateY(18px) scale(.94); } to { opacity: 1; transform: none; } }
      @keyframes s-pop { 0% { transform: scale(1); } 35% { transform: scale(1.4); } 70% { transform: scale(.9); } 100% { transform: scale(1); } }
      @keyframes s-heroReveal { from { opacity: 0; transform: scale(1.08); clip-path: inset(7% round 26px); } to { opacity: 1; transform: none; clip-path: inset(0% round 26px); } }
      @keyframes s-maskUp { from { transform: translateY(115%); } to { transform: translateY(0); } }
      @keyframes s-blurIn { from { opacity: 0; filter: blur(9px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: none; } }

      .s-intro { animation: s-fadeUp .65s cubic-bezier(.2,.85,.25,1) both; animation-delay: var(--d, 0s); }
      .s-hero  { animation: s-heroReveal .95s cubic-bezier(.2,.85,.25,1) both; animation-delay: var(--d, 0s); }
      .s-mask  { display: block; overflow: hidden; }
      .s-mask > span { display: block; animation: s-maskUp .85s cubic-bezier(.2,.85,.25,1) both; animation-delay: var(--d, 0s); }
      .s-blur  { animation: s-blurIn .7s ease both; animation-delay: var(--d, 0s); }
      .s-fade { animation: s-fadeUp .5s cubic-bezier(.2,.8,.2,1) both; }
      .s-rise > * { animation: s-fadeUp .55s cubic-bezier(.2,.8,.2,1) both; }
      .s-rise > *:nth-child(1){animation-delay:.03s}.s-rise > *:nth-child(2){animation-delay:.08s}
      .s-rise > *:nth-child(3){animation-delay:.13s}.s-rise > *:nth-child(4){animation-delay:.18s}
      .s-rise > *:nth-child(5){animation-delay:.23s}.s-rise > *:nth-child(6){animation-delay:.28s}
      .s-rise > *:nth-child(7){animation-delay:.33s}.s-rise > *:nth-child(8){animation-delay:.38s}
      .s-rise > *:nth-child(n+9){animation-delay:.42s}
      .s-card { transition: transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s cubic-bezier(.2,.8,.2,1); will-change: transform; }
      .s-card:active { transform: scale(.985); }
      @media (hover:hover){ .s-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,.18); } }
      .s-press { transition: transform .18s cubic-bezier(.2,.8,.2,1), opacity .2s, background .25s, color .25s; }
      .s-press:active { transform: scale(.95); }
      @media (hover:hover){ .s-press:hover { opacity: .92; } }
      .s-pop { animation: s-pop .42s cubic-bezier(.2,.8,.2,1); transform-origin: center; }
      @media (prefers-reduced-motion: reduce){ .s-fade,.s-rise>*,.s-pop,.s-intro,.s-hero,.s-mask>span,.s-blur{ animation: none !important; } }
    `}</style>
  );

  if (!ready) return (<div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", fontFamily: body, color: C.inkSoft }}><GlobalStyle />Carico…</div>);
  if (!user) return (<><GlobalStyle /><Login /></>);

  const likeCountTotal = likes.length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: body, color: C.ink }}>
      <GlobalStyle />

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: C.headerBg, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginRight: "auto", color: C.ink }}>
            <span style={{ width: 26, height: 26, borderRadius: 9, background: C.clay, display: "grid", placeItems: "center", color: "#fff" }}><Box size={15} /></span>
            <span style={{ fontFamily: display, fontSize: 21, fontWeight: 600, letterSpacing: "-0.5px" }}>Strato</span>
          </button>
          <button onClick={() => go("likes")} className="s-press" style={iconBtn} aria-label="I miei like">
            <Heart size={19} fill={likeCountTotal ? "currentColor" : "none"} style={{ color: likeCountTotal ? C.heart : C.ink }} />
          </button>
          <button onClick={() => setMenu(true)} className="s-press" style={iconBtn} aria-label="Menu"><Menu size={20} /></button>
        </div>
      </header>

      {/* MENU HAMBURGER — Profilo · I miei like · Logout */}
      {menu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div onClick={() => setMenu(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", animation: "s-fadeIn .3s ease both" }} />
          <nav style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "78%", maxWidth: 320, background: C.surface, padding: 20, display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.25)", animation: "s-drawerIn .4s cubic-bezier(.2,.8,.2,1) both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ fontFamily: display, fontSize: 20, fontWeight: 600 }}>Menu</span>
              <button onClick={() => setMenu(false)} style={iconBtn}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 20px", borderBottom: `1px solid ${C.line}`, marginBottom: 12 }}>
              <Avatar user={user} size={44} />
              <div>
                <div style={{ fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: C.inkSoft }}>{isAdmin ? "Amministratore" : "Account " + user.provider}</div>
              </div>
            </div>
            <MenuItem icon={<User size={19} />} label="Profilo" onClick={() => go("profile")} />
            <MenuItem icon={<Heart size={19} />} label="I miei like" onClick={() => go("likes")} />
            <MenuItem icon={<LogOut size={19} />} label="Logout" onClick={logout} danger />
          </nav>
        </div>
      )}

      {/* CONTENUTO */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px 80px" }}>
        <div key={route.name + (route.id || route.editId || "")} className="s-fade">
          {route.name === "home" && <Home prints={prints} go={go} likes={likes} toggleLike={toggleLike} isAdmin={isAdmin} />}
          {route.name === "gallery" && <Gallery prints={prints} go={go} likes={likes} toggleLike={toggleLike} />}
          {route.name === "detail" && <Detail p={byId(route.id)} go={go} liked={likes.includes(route.id)} toggleLike={toggleLike} user={user} isAdmin={isAdmin} />}
          {route.name === "likes" && <ListView title="I miei like" empty="Non hai ancora messo like. Tocca il cuoricino su una stampa." items={likes.map(byId).filter(Boolean)} go={go} likes={likes} toggleLike={toggleLike} />}
          {route.name === "profile" && <Profile user={user} isAdmin={isAdmin} go={go} likes={likes} prints={prints} deletePrint={deletePrint} />}
          {route.name === "admin" && isAdmin && <AdminForm editing={route.editId ? byId(route.editId) : null} addPrint={addPrint} updatePrint={updatePrint} go={go} />}
        </div>
      </main>

      {/* TOASTS */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 60, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: C.ink, color: C.bg, padding: "11px 18px", borderRadius: 30, fontSize: 14, display: "flex", alignItems: "center", gap: 8, boxShadow: C.shadow, animation: "s-toastIn .38s cubic-bezier(.2,.8,.2,1) both" }}>
            <Check size={16} /> {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENTI DI SUPPORTO
   ========================================================================= */
const iconBtn = { width: 38, height: 38, borderRadius: 12, border: "none", background: "transparent", color: "var(--ink)", display: "grid", placeItems: "center", cursor: "pointer" };

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 12px", borderRadius: 14, border: "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left", color: danger ? C.heart : C.ink, fontFamily: body, fontSize: 16, fontWeight: 500 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceAlt)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {icon} {label}
    </button>
  );
}

function Avatar({ user, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: user.role === "admin" ? C.clay : C.sage, color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, fontSize: size * 0.4, flexShrink: 0 }}>
      {(user.name || "?")[0].toUpperCase()}
    </div>
  );
}

// cuore sopra le foto (bolla bianca): colori fissi per restare leggibile in entrambi i temi
function HeartBtn({ active, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label="Mi piace" className="s-press" style={{ width: 36, height: 36, borderRadius: 18, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.92)", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <Heart key={active ? "on" : "off"} className={active ? "s-pop" : ""} size={18} fill={active ? HEART_FIXED : "none"} color={active ? HEART_FIXED : INK_FIXED} />
    </button>
  );
}

const WaButton = ({ p, big }) => (
  <a href={waLink(p)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="s-press"
    style={{ textDecoration: "none", background: WA_GREEN, color: "#fff", borderRadius: big ? 16 : 12, padding: big ? "15px" : "9px 12px", fontFamily: body, fontWeight: 600, fontSize: big ? 16 : 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
    <WhatsAppIcon size={big ? 20 : 16} /> {big ? "Ordina su WhatsApp" : "Ordina"}
  </a>
);

function Card({ p, go, liked, toggleLike }) {
  return (
    <div onClick={() => go("detail", { id: p.id })} className="s-card" style={{ cursor: "pointer", background: C.surface, borderRadius: 22, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: C.shadowSoft, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: C.surfaceAlt }}>
          <img src={p.images[0]} alt={p.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", top: 10, right: 10 }}><HeartBtn active={liked} onClick={() => toggleLike(p.id)} /></div>
        <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", gap: 6 }}>
          {p.likeCount > 0 && (
            <span style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <Heart size={11} fill="#fff" color="#fff" /> {p.likeCount}
            </span>
          )}
          {p.images.length > 1 && <span style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 20 }}>{p.images.length} foto</span>}
        </div>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <h3 style={{ margin: 0, fontFamily: display, fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>{p.title}</h3>
          <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{eur(p.price)}</span>
        </div>
        <span style={{ fontSize: 12.5, color: C.inkSoft }}>{p.material}</span>
        <div style={{ marginTop: 2 }}><WaButton p={p} /></div>
      </div>
    </div>
  );
}

function Grid({ children }) {
  return <div className="s-rise" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 14 }}>{children}</div>;
}

/* ----------------------------- LOGIN ----------------------------- */
function Login() {
  const [busy, setBusy] = useState(null);
  const signIn = async (provider) => {
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) { setBusy(null); alert("Login non riuscito: " + error.message); }
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: body, color: C.ink, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 380, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 20, background: C.clay, display: "grid", placeItems: "center", color: "#fff", margin: "0 auto 22px" }}><Box size={30} /></div>
        <h1 style={{ fontFamily: display, fontSize: 38, fontWeight: 600, letterSpacing: "-1px", margin: "0 0 6px" }}>Strato</h1>
        <p style={{ color: C.inkSoft, margin: "0 0 36px", fontSize: 15.5, lineHeight: 1.5 }}>Le mie stampe 3D, strato dopo strato.<br />Sfoglia, metti like, ordina su WhatsApp.</p>
        <button onClick={() => signIn("apple")} disabled={!!busy} className="s-press" style={authBtn(C.ink, C.bg)}>
          <AppleIcon /> {busy === "apple" ? "Apertura…" : "Continua con Apple"}
        </button>
        <button onClick={() => signIn("google")} disabled={!!busy} className="s-press" style={authBtn(C.surface, C.ink, true)}>
          <GoogleG /> {busy === "google" ? "Apertura…" : "Continua con Google"}
        </button>
        <p style={{ fontSize: 12, color: C.inkFaint, marginTop: 22, lineHeight: 1.5 }}>Per diventare amministratore imposta <code>is_admin</code> nel database (vedi README).</p>
      </div>
    </div>
  );
}
const authBtn = (bg, color, border) => ({ width: "100%", padding: "14px 18px", borderRadius: 14, marginBottom: 12, cursor: "pointer", background: bg, color, fontFamily: body, fontWeight: 600, fontSize: 15.5, border: border ? `1.5px solid ${C.line}` : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 });
const AppleIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" /></svg>);
const GoogleG = () => (<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.8 6.1C12.2 13.3 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" /><path fill="#FBBC05" d="M10.3 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-2.9.8-4.3l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.4l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.8-3.8-13.7-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>);

/* ----------------------------- HOME ----------------------------- */
function Home({ prints, go, likes, toggleLike, isAdmin }) {
  const latest = prints.slice(0, 5);
  const hero = latest.map((p) => p.images[0]);
  return (
    <div>
      <section style={{ paddingTop: 22 }}>
        <p className="s-intro" style={{ "--d": ".05s", color: C.clay, fontWeight: 600, fontSize: 13, letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 8px" }}>Ultime creazioni</p>
        <h1 className="s-mask" style={{ fontFamily: display, fontSize: 34, fontWeight: 600, letterSpacing: "-1px", lineHeight: 1.12, margin: "0 0 18px", paddingBottom: 4 }}>
          <span style={{ "--d": ".14s" }}>Stampe fresche di piatto.</span>
        </h1>
        {latest[0] ? (
          <div className="s-hero" style={{ "--d": ".26s", borderRadius: 26, overflow: "hidden", boxShadow: C.shadow, position: "relative" }}>
            <Carousel images={hero} rounded={26} ratio="72%" parallax={0.18} onTap={() => go("detail", { id: latest[0].id })} />
            <div className="s-blur" style={{ "--d": ".9s", position: "absolute", left: 16, bottom: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", pointerEvents: "none" }}>
              <div style={{ background: C.headerBg, padding: "8px 14px", borderRadius: 16, backdropFilter: "blur(4px)" }}>
                <div style={{ fontFamily: display, fontWeight: 600, fontSize: 18 }}>{latest[0].title}</div>
                <div style={{ fontSize: 13, color: C.inkSoft }}>{eur(latest[0].price)}</div>
              </div>
            </div>
          </div>
        ) : <Empty text={isAdmin ? "Catalogo vuoto. Carica la tua prima stampa!" : "Catalogo in arrivo."} />}
      </section>

      {isAdmin && (
        <button onClick={() => go("admin")} className="s-intro s-press" style={{ "--d": ".5s", marginTop: 18, width: "100%", padding: "15px", borderRadius: 16, border: `1.5px dashed ${C.claySoft}`, background: C.surface, color: C.clayDeep, fontFamily: body, fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
          <Plus size={18} /> Carica una nuova stampa
        </button>
      )}

      {prints.length > 0 && (
        <section className="s-intro" style={{ "--d": ".58s", marginTop: 34 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontFamily: display, fontSize: 22, fontWeight: 600, margin: 0 }}>Catalogo</h2>
            <button onClick={() => go("gallery")} className="s-press" style={{ background: "none", border: "none", color: C.clay, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Vedi tutto <ArrowRight size={15} /></button>
          </div>
          <Grid>{prints.slice(0, 4).map((p) => <Card key={p.id} p={p} go={go} liked={likes.includes(p.id)} toggleLike={toggleLike} />)}</Grid>
        </section>
      )}
    </div>
  );
}

/* ----------------------------- GALLERY ----------------------------- */
function Gallery({ prints, go, likes, toggleLike }) {
  const [q, setQ] = useState("");
  const list = prints.filter((p) => (p.title + p.material + p.desc).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ paddingTop: 22 }}>
      <h1 style={{ fontFamily: display, fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px", margin: "0 0 16px" }}>Catalogo</h1>
      <div style={{ position: "relative", marginBottom: 18 }}>
        <Search size={18} style={{ color: C.inkFaint, position: "absolute", left: 14, top: 13 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nome o materiale…" style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, fontFamily: body, fontSize: 15, color: C.ink, outline: "none" }} />
      </div>
      {list.length === 0 ? <Empty text="Nessun risultato." /> : <Grid>{list.map((p) => <Card key={p.id} p={p} go={go} liked={likes.includes(p.id)} toggleLike={toggleLike} />)}</Grid>}
    </div>
  );
}

function ListView({ title, items, empty, ...rest }) {
  return (
    <div style={{ paddingTop: 22 }}>
      <h1 style={{ fontFamily: display, fontSize: 28, fontWeight: 600, margin: "0 0 16px" }}>{title}</h1>
      {items.length === 0 ? <Empty text={empty} /> : <Grid>{items.map((p) => <Card key={p.id} p={p} liked={rest.likes.includes(p.id)} {...rest} />)}</Grid>}
    </div>
  );
}

/* ----------------------------- DETAIL ----------------------------- */
function Detail({ p, go, liked, toggleLike, user, isAdmin }) {
  if (!p) return <Empty text="Stampa non trovata." />;
  const spec = [
    { icon: <Box size={16} />, label: "Materiale", val: p.material || "—" },
    { icon: <Ruler size={16} />, label: "Dimensioni", val: p.dim || "—" },
    { icon: <Clock size={16} />, label: "Tempo di stampa", val: p.time || "—" },
  ];
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => go("gallery")} style={{ background: "none", border: "none", color: C.inkSoft, fontFamily: body, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}><ChevronLeft size={17} /> Indietro</button>
        {isAdmin && <button onClick={() => go("admin", { editId: p.id })} className="s-press" style={{ background: "none", border: `1px solid ${C.line}`, color: C.ink, fontFamily: body, fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 12 }}><Pencil size={15} /> Modifica</button>}
      </div>
      <div style={{ position: "relative" }}>
        <Carousel images={p.images} rounded={24} ratio="92%" />
        <div style={{ position: "absolute", top: 12, right: 12 }}><HeartBtn active={liked} onClick={() => toggleLike(p.id)} /></div>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h1 style={{ fontFamily: display, fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px", margin: 0 }}>{p.title}</h1>
          <span style={{ fontFamily: display, fontSize: 24, fontWeight: 600, whiteSpace: "nowrap" }}>{eur(p.price)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: C.inkSoft, fontSize: 13.5 }}>
          <Heart size={15} fill={p.likeCount ? C.heart : "none"} style={{ color: C.heart }} /> {p.likeCount} mi piace
        </div>
        {p.desc && <p style={{ color: C.inkSoft, lineHeight: 1.6, marginTop: 12 }}>{p.desc}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "18px 0 22px" }}>
          {spec.map((s) => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ color: C.clay, display: "flex", justifyContent: "center", marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => toggleLike(p.id)} className="s-press" style={{ width: 52, borderRadius: 16, border: `1.5px solid ${C.line}`, background: C.surface, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Heart key={liked ? "on" : "off"} className={liked ? "s-pop" : ""} size={20} fill={liked ? "currentColor" : "none"} style={{ color: liked ? C.heart : C.ink }} />
          </button>
          <div style={{ flex: 1 }}><WaButton p={p} big /></div>
        </div>
      </div>

      <Comments printId={p.id} user={user} isAdmin={isAdmin} />
    </div>
  );
}

/* ----------------------------- COMMENTS ----------------------------- */
function Comments({ printId, user, isAdmin }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("comments").select("*").eq("print_id", printId).order("created_at", { ascending: true });
    setList(data || []);
  };
  useEffect(() => { load(); }, [printId]);

  const send = async () => {
    const b = text.trim(); if (!b || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("comments").insert({ print_id: printId, user_id: user.id, user_name: user.name, body: b }).select().single();
    setSending(false);
    if (!error && data) { setList((l) => [...(l || []), data]); setText(""); }
  };
  const del = async (id) => { setList((l) => l.filter((c) => c.id !== id)); await supabase.from("comments").delete().eq("id", id); };

  return (
    <div style={{ marginTop: 30, borderTop: `1px solid ${C.line}`, paddingTop: 22 }}>
      <h2 style={{ fontFamily: display, fontSize: 20, fontWeight: 600, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={18} style={{ color: C.clay }} /> Commenti {list && list.length > 0 ? `(${list.length})` : ""}
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Scrivi un commento…" style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, fontFamily: body, fontSize: 15, color: C.ink, outline: "none" }} />
        <button onClick={send} disabled={!text.trim() || sending} className="s-press" style={{ width: 48, borderRadius: 12, border: "none", background: C.clay, color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, opacity: text.trim() ? 1 : 0.5 }}><Send size={18} /></button>
      </div>

      {list === null ? <p style={{ color: C.inkFaint, fontSize: 14 }}>Carico…</p> : list.length === 0 ? (
        <p style={{ color: C.inkFaint, fontSize: 14 }}>Ancora nessun commento. Scrivi il primo!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 19, background: C.sage, color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, flexShrink: 0 }}>{(c.user_name || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{c.user_name || "Utente"}</span>
                  <span style={{ fontSize: 12, color: C.inkFaint }}>{timeAgo(new Date(c.created_at).getTime())}</span>
                  {(isAdmin || c.user_id === user.id) && (
                    <button onClick={() => del(c.id)} aria-label="Elimina" style={{ marginLeft: "auto", background: "none", border: "none", color: C.inkFaint, cursor: "pointer", padding: 2 }}><Trash2 size={15} /></button>
                  )}
                </div>
                <div style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.5, marginTop: 2, wordBreak: "break-word" }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- PROFILE ----------------------------- */
function Profile({ user, isAdmin, go, likes, prints, deletePrint }) {
  return (
    <div style={{ paddingTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar user={user} size={64} />
        <div>
          <h1 style={{ fontFamily: display, fontSize: 26, fontWeight: 600, margin: 0 }}>{user.name}</h1>
          <div style={{ color: C.inkSoft, fontSize: 14 }}>{isAdmin ? "Amministratore · proprietario" : "Accesso con " + user.provider}</div>
        </div>
      </div>

      <button onClick={() => go("likes")} style={{ width: "100%", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 18, padding: "16px", textAlign: "left", cursor: "pointer", fontFamily: body, marginBottom: 22, display: "flex", alignItems: "center", gap: 14 }}>
        <Heart size={22} fill={likes.length ? C.heart : "none"} style={{ color: C.heart }} />
        <div>
          <div style={{ fontFamily: display, fontSize: 24, fontWeight: 600 }}>{likes.length}</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft }}>Stampe che ti piacciono</div>
        </div>
        <ArrowRight size={18} style={{ marginLeft: "auto", color: C.inkFaint }} />
      </button>

      {isAdmin && (
        <>
          <button onClick={() => go("admin")} className="s-press" style={primaryWide}><Upload size={18} /> Carica nuova stampa</button>
          <h2 style={{ fontFamily: display, fontSize: 20, fontWeight: 600, margin: "26px 0 12px" }}>Gestisci stampe ({prints.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {prints.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 10 }}>
                <img src={p.images[0]} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft }}>{eur(p.price)} · {p.likeCount} like</div>
                </div>
                <button onClick={() => go("admin", { editId: p.id })} aria-label="Modifica" className="s-press" style={{ ...iconBtn, color: C.ink }}><Pencil size={17} /></button>
                <button onClick={() => deletePrint(p.id)} aria-label="Elimina" style={{ ...iconBtn, color: C.heart }}><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
const primaryWide = { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: C.ink, color: C.bg, fontFamily: body, fontWeight: 600, fontSize: 15.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };

/* ----------------------------- ADMIN FORM (nuova / modifica) ----------------------------- */
function AdminForm({ editing, addPrint, updatePrint, go }) {
  const init = editing
    ? { title: editing.title, price: String(editing.price).replace(".", ","), material: editing.material, dim: editing.dim, time: editing.time, desc: editing.desc }
    : { title: "", price: "", material: "", dim: "", time: "", desc: "" };
  const [f, setF] = useState(init);
  const [images, setImages] = useState(editing ? editing.images.map((src) => ({ kind: "url", src })) : []);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const onFiles = async (e) => {
    const files = [...e.target.files].slice(0, 6 - images.length);
    setBusy(true);
    const out = [];
    for (const file of files) out.push(await compressImage(file));
    setImages((prev) => [...prev, ...out]);
    setBusy(false); e.target.value = "";
  };
  const valid = f.title && f.price && images.length > 0 && !saving;
  const submit = async () => {
    if (!f.title || !f.price || images.length === 0) return;
    setSaving(true);
    const fields = { ...f, price: parseFloat(String(f.price).replace(",", ".")) || 0, material: f.material || "PLA", dim: f.dim || "—", time: f.time || "—", desc: f.desc || "" };
    const keptUrls = images.filter((x) => x.kind === "url").map((x) => x.src);
    const newBlobs = images.filter((x) => x.kind === "new").map((x) => x.blob);
    try {
      if (editing) await updatePrint(editing.id, fields, keptUrls, newBlobs);
      else await addPrint(fields, newBlobs);
      go(editing ? "detail" : "home", editing ? { id: editing.id } : {});
    } catch (_) { setSaving(false); }
  };
  const field = (key, label, ph) => (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={lbl}>{label}</span>
      <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} placeholder={ph} style={inp} />
    </label>
  );

  return (
    <div style={{ paddingTop: 22 }}>
      <button onClick={() => go(editing ? "profile" : "home")} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 12, padding: 0, fontFamily: body, fontSize: 14 }}><ChevronLeft size={17} /> Indietro</button>
      <h1 style={{ fontFamily: display, fontSize: 28, fontWeight: 600, margin: "0 0 18px" }}>{editing ? "Modifica stampa" : "Nuova stampa"}</h1>

      <span style={lbl}>Foto (carosello, max 6)</span>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {images.map((im, k) => (
          <div key={k} style={{ position: "relative" }}>
            <img src={im.kind === "url" ? im.src : im.preview} alt="" style={{ width: 76, height: 76, borderRadius: 12, objectFit: "cover" }} />
            <button onClick={() => setImages(images.filter((_, idx) => idx !== k))} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, border: "none", background: C.ink, color: C.bg, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={13} /></button>
          </div>
        ))}
        {images.length < 6 && (
          <button onClick={() => fileRef.current.click()} style={{ width: 76, height: 76, borderRadius: 12, border: `1.5px dashed ${C.claySoft}`, background: C.surface, color: C.clay, cursor: "pointer", display: "grid", placeItems: "center" }}>{busy ? "…" : <Plus size={22} />}</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} />
      </div>

      {field("title", "Titolo", "Es. Vaso Onda")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("price", "Prezzo (€)", "24,00")}
        {field("material", "Materiale", "PLA opaco")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("dim", "Dimensioni", "120 × 120 × 180 mm")}
        {field("time", "Tempo di stampa", "6h 20m")}
      </div>
      <label style={{ display: "block", marginBottom: 18 }}>
        <span style={lbl}>Descrizione</span>
        <textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Dettagli, finitura, note…" rows={3} style={{ ...inp, resize: "vertical" }} />
      </label>

      <button onClick={submit} disabled={!valid} className="s-press" style={{ ...primaryWide, opacity: valid ? 1 : 0.4, cursor: valid ? "pointer" : "not-allowed" }}>
        <Check size={18} /> {saving ? "Salvo…" : editing ? "Salva modifiche" : "Pubblica stampa"}
      </button>
    </div>
  );
}
const lbl = { display: "block", fontSize: 13, fontWeight: 600, color: C.inkSoft, marginBottom: 6 };
const inp = { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, fontFamily: body, fontSize: 15, color: C.ink, outline: "none" };

/* ----------------------------- EMPTY ----------------------------- */
function Empty({ text, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.inkSoft }}>
      <div style={{ width: 60, height: 60, borderRadius: 30, background: C.surfaceAlt, display: "grid", placeItems: "center", margin: "0 auto 14px", color: C.inkFaint }}><Box size={26} /></div>
      <p style={{ margin: 0, fontSize: 15 }}>{text}</p>
      {action && <button onClick={onAction} style={{ marginTop: 14, padding: "10px 20px", borderRadius: 12, border: "none", background: C.ink, color: C.bg, fontFamily: body, fontWeight: 600, cursor: "pointer" }}>{action}</button>}
    </div>
  );
}
