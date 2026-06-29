import type { ReactNode } from 'react';
import { ArrowRight } from './icons';

export function CTA({ children, onClick, block=false, ghost=false, withArrow=false, icon }:
  { children: ReactNode; onClick?: () => void; block?: boolean; ghost?: boolean; withArrow?: boolean; icon?: ReactNode }) {
  return (
    <button className={'cta' + (block ? ' cta--block' : '') + (ghost ? ' cta--ghost' : '')} onClick={onClick}>
      {icon}
      <span>{children}</span>
      {withArrow && <ArrowRight color="var(--accent-contrast)" />}
    </button>
  );
}
