import React, { useEffect, useMemo, useRef } from "react";
import { colImg, eur } from "../../utils/product.js";
import { HeartI, Pencil } from "../../ui/visuals.jsx";

export default function Home({ prints, liked, onLike, onOpen, onEdit, CardComponent, tap = () => {} }) {
  const homeRef = useRef(null);
  // Una sola tile in evidenza: articolo casuale, nuovo ad ogni refresh del sito.
  const hero = useMemo(() => (prints.length ? prints[Math.floor(Math.random() * prints.length)] : null), [prints.length]);
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
        <h1 className="hero">Il design che cercavi,<br />finalmente prende forma.</h1>
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
        <div className="grid">
          {prints.map((p) => (
            <CardComponent key={p.id} p={p} liked={liked(p.id)} onLike={onLike} onOpen={() => onOpen(p.id)} onEdit={onEdit} context="home" />
          ))}
        </div>
      </div>
    </section>
  );
}
