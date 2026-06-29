import { CartItem } from './CartItem';
import { CTA } from '../components/CTA';
import { Check } from '../components/icons';
import { mockOrders } from '../data/mockOrders';

export function CartFilled() {
  const lines = mockOrders[0].lines;
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  return (
    <>
      <div className="page-head" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 8C7 5.24 9.24 3 12 3C14.76 3 17 5.24 17 8" stroke="var(--text)" strokeWidth="1.7" strokeLinecap="round"/><path d="M5 8h14l-1.5 10a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 8z" stroke="var(--text)" strokeWidth="1.7" strokeLinejoin="round" fill="none"/></svg>
        <h1 style={{ font: "800 26px/1 var(--font-sans)", color: 'var(--text)', letterSpacing: '-0.03em', margin: 0 }}>Shopping bag</h1>
      </div>
      <div className="cart-items">
        {lines.map(l => <CartItem key={l.productId} line={l} />)}
      </div>
      <div style={{ textAlign: 'center', padding: '20px 0 8px', font: "italic 400 12px/1 var(--font-sans)", color: 'var(--text-soft)' }}>Prepareremo il tuo ordine con cura.</div>

      {/* Footer fisso: Totale + CTA, con blur che separa dagli articoli in scroll */}
      <div className="cart-foot">
        <div className="cart-total">
          <span className="cart-total__label">Totale</span>
          <span className="cart-total__value">{total.toFixed(2).replace('.', ',')} €</span>
        </div>
        <div style={{ padding: '0 14px 4px' }}>
          <CTA block icon={<Check />}>Invia richiesta</CTA>
        </div>
      </div>
    </>
  );
}
