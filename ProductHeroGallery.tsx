import type { ReactNode } from 'react';
export function EmptyState({ icon, image, kicker, title, text, cta }:
  { icon?: ReactNode; image?: string; kicker?: string; title: ReactNode; text?: ReactNode; cta?: ReactNode }) {
  return (
    <div className="empty">
      {image ? <img className="empty__img" src={image} alt="" /> : icon && <div className="empty__icon">{icon}</div>}
      {kicker && <div className="empty__kicker">{kicker}</div>}
      <h2 className="empty__title">{title}</h2>
      {text && <p className="empty__text">{text}</p>}
      {cta}
    </div>
  );
}
