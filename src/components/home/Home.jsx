import React from "react";

export default function Home({ prints, liked, onLike, onOpen, onEdit, CardComponent, onExplore }) {
  return (
    <section className="screen on homeview">
      <div className="homeClaudeBg" aria-hidden="true">
        <svg viewBox="0 0 390 760" preserveAspectRatio="none">
          <defs>
            <radialGradient id="homeClaudeRadial" cx="94%" cy="25%" r="68%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="homeClaudeWarm" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#C4784A" stopOpacity="0.10" />
              <stop offset="42%" stopColor="#C4784A" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#C4784A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M468 -24 C438 10 325 20 306 82 C288 145 352 178 332 246 C315 308 282 330 278 398 C278 434 294 468 326 498 C370 536 438 552 468 566 L468 -24 Z" fill="currentColor" opacity="0.10" />
          <path d="M468 -24 C424 8 292 18 272 84 C252 150 320 184 300 256 C282 322 246 344 242 416 C242 448 258 482 292 512 C338 552 430 566 468 574 L468 -24 Z" fill="currentColor" opacity="0.065" />
          <path d="M468 -24 C386 8 255 18 235 84 C215 150 282 184 262 256 C244 322 208 344 204 416 C204 448 220 482 254 512 C302 552 426 568 468 578 L468 -24 Z" fill="currentColor" opacity="0.038" />
          <rect width="390" height="760" fill="url(#homeClaudeRadial)" />
          <rect width="390" height="760" fill="url(#homeClaudeWarm)" />
        </svg>
      </div>
      <div className="px homeIntroBlock">
        <h1 className="hero">Il design<br />che cercavi,<br />finalmente<br />prende forma.</h1>
      </div>
      <button type="button" className="homeSearchBridge" onClick={onExplore} aria-label="Vai alla ricerca">
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Cerchi qualcosa?</span>
      </button>
      <div className="homeSectionBar px">
        <h2 className="home-sec-title">Lasciati ispirare</h2>
        <button type="button" className="homeExploreLink" onClick={onExplore}>Esplora <span aria-hidden="true">→</span></button>
      </div>
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
