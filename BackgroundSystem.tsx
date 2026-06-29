import type { CSSProperties } from 'react';
type P = { size?: number; color?: string; style?: CSSProperties };

export const LogoMark = ({ size=13 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 2L16 6.5V13.5L9 17L2 13.5V6.5Z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
    <path d="M2 6.5L9 11L16 6.5" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M9 11V17" stroke="#fff" strokeWidth="1.6"/>
  </svg>
);
export const Back = ({ size=20, color='var(--accent)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none"><path d="M14 5l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Bell = ({ size=22, color='var(--accent)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="2" r="1.1" fill={color}/><rect x="7.35" y="2" width="1.3" height="1.6" fill={color}/><path d="M8 3.5C5.5 3.5 3.7 5.3 3.7 7.7V10.2H12.3V7.7C12.3 5.3 10.5 3.5 8 3.5Z" fill={color}/><rect x="2.4" y="10.2" width="11.2" height="1.5" rx="0.75" fill={color}/><circle cx="8" cy="13.1" r="1.2" fill={color}/></svg>
);
export const Chevron = ({ size=15, color='var(--accent)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const ArrowRight = ({ size=14, color='currentColor' }: P) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 3.5L11 7l-3.5 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Search = ({ size=18, color='var(--accent)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none"><circle cx="7.5" cy="7.5" r="5" stroke={color} strokeWidth="2"/><path d="M12 12l3.5 3.5" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
export const Heart = ({ size=22, color='var(--dock-icon)', fill='none' }: P & {fill?:string}) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none"><path d="M11 19S3 14.5 3 8.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 8.5C19 14.5 11 19 11 19z" stroke={color} strokeWidth="1.5" fill={fill}/></svg>
);
export const DockHome = ({ size=21, color='var(--dock-icon)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none"><path d="M3 10L11 3L19 10V19H14V14H8V19H3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"/></svg>
);
export const DockExplore = ({ size=21, color='var(--dock-icon)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none"><circle cx="9.5" cy="9.5" r="6" stroke={color} strokeWidth="1.5" fill="none"/><path d="M14 14l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>
);
export const DockCart = ({ size=21, color='var(--dock-icon)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 8C7 5.24 9.24 3 12 3C14.76 3 17 5.24 17 8" stroke={color} strokeWidth="1.7" strokeLinecap="round"/><path d="M5 8h14l-1.5 10a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 8z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none"/><path d="M9.5 12.5C9.5 13.88 10.62 15 12 15C13.38 15 14.5 13.88 14.5 12.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
);
export const Close = ({ size=12, color='var(--text)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>
);
export const Check = ({ size=16, color='var(--accent-contrast)' }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M2.5 8l4 4 7-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// Config group icons (Cavo / Portalampada / Lampadina / Finitura / Incisione) — stroke beige
export const ConfigIcon = ({ id }: { id: string }) => {
  const s = '#8B7355';
  switch (id) {
    case 'cavo': return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="4.5" y="6" width="7" height="5" rx="1.5" stroke={s} strokeWidth="1.3" fill="none"/><path d="M6 6V4M10 6V4" stroke={s} strokeWidth="1.4" strokeLinecap="round"/><path d="M8 11v2" stroke={s} strokeWidth="1.3" strokeLinecap="round"/></svg>
    );
    case 'portalampada': return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M5 4h6v5a3 3 0 0 1-6 0V4z" stroke={s} strokeWidth="1.3" fill="none"/><path d="M4.5 4h7" stroke={s} strokeWidth="1.4" strokeLinecap="round"/><path d="M5.5 6.5h5M5.5 8h5" stroke={s} strokeWidth="1" strokeLinecap="round" opacity="0.55"/></svg>
    );
    case 'lampadina': return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 0 1 3 9c-.5.5-.8 1-.8 1.6V13H5.8v-0.4c0-.6-.3-1.1-.8-1.6A5 5 0 0 1 8 2z" stroke={s} strokeWidth="1.3" fill="none"/><path d="M6 13h4M6.5 14.5h3" stroke={s} strokeWidth="1.3" strokeLinecap="round"/></svg>
    );
    case 'finitura': return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 2.5c2 3 3.3 4.6 3.3 6.6a3.3 3.3 0 0 1-6.6 0C4.7 7.1 6 5.5 8 2.5z" stroke={s} strokeWidth="1.3" fill="none"/><path d="M6.5 9.2a1.6 1.6 0 0 0 1.6 1.4" stroke={s} strokeWidth="1.1" strokeLinecap="round"/></svg>
    );
    default: return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10.5 3.2l2.3 2.3-7 7-2.8.5.5-2.8 7-7z" stroke={s} strokeWidth="1.3" fill="none" strokeLinejoin="round"/><path d="M9.2 4.5l2.3 2.3" stroke={s} strokeWidth="1.1" strokeLinecap="round"/></svg>
    );
  }
};

// Category glyphs — semplici e grandi, stile Esplora: outline var(--text) + accento var(--accent).
export const CategoryGlyph = ({ id }: { id: string }) => {
  const t = 'var(--text)';
  const a = 'var(--accent)';
  switch (id) {
    case 'vasi': return (
      <svg width="48" height="48" viewBox="0 0 26 30" fill="none">
        <path d="M9 1.5L17 1.5L19.5 5C21 7.5 21.5 10 19.5 12.5C23.5 15.5 24 20.5 22.5 24L20.5 27.5L5.5 27.5L3.5 24C2 20.5 2.5 15.5 6.5 12.5C4.5 10 5 7.5 6.5 5Z" stroke={t} strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M5.5 17Q9 14.5 13 17Q17 19.5 20.5 17" stroke={a} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M4 20.5Q8 18 13 20.5Q18 23 22 20.5" stroke={a} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M5 24Q9 21.5 13 24Q17 26.5 21 24" stroke={a} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    );
    case 'lampade': return (
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <path d="M7.5 8.5h13" stroke={t} strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M7.5 8.5C8.5 14 11 18 14 18C17 18 19.5 14 20.5 8.5" stroke={t} strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M14 18v6" stroke={t} strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M11 24h6" stroke={a} strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    );
    case 'orologi': return (
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9.5" stroke={t} strokeWidth="2.2"/>
        <path d="M14 9v5l3.5 2" stroke={a} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    default: return (
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="11" r="7.5" stroke={t} strokeWidth="2.2"/>
        <path d="M14 7v4l2.8 1.6" stroke={a} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 18.5C11 18.5 9.5 20.5 9.5 22.5H18.5C18.5 20.5 17 18.5 17 18.5" stroke={t} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
};
