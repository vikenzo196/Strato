import type { OrderLine } from '../data/mockOrders';
import { QuantityStepper } from '../components/QuantityStepper';
import { Close } from '../components/icons';

export function CartItem({ line }: { line: OrderLine }) {
  return (
    <div className="cart-card">
      <div className="cart-card__thumb"><img src={line.thumb} alt={line.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
      <div className="cart-card__body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: 'var(--text)', marginBottom: 3 }}>{line.name}</div>
            <div style={{ font: "400 12px/1 var(--font-sans)", color: 'var(--text-soft)' }}>Colore: {line.color}</div>
          </div>
          <button style={{ width: 28, height: 28, background: 'color-mix(in srgb, var(--accent) 9%, transparent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-label="Rimuovi"><Close color="var(--accent)" /></button>
        </div>
        {line.accessories.length > 0 && (
          <div className="cart-accessori">
            <div className="cart-accessori__label">Accessori</div>
            <div className="cart-accessori__row"><span className="base">Base</span><span className="base">{line.basePrice.toFixed(2).replace('.', ',')} €</span></div>
            {line.accessories.map(a => (
              <div className="cart-accessori__row" key={a.id}><span>{a.label}</span><span>+{a.price.toFixed(2).replace('.', ',')} €</span></div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <QuantityStepper />
          <div style={{ font: "800 20px/1 var(--font-sans)", color: 'var(--accent)', letterSpacing: '-0.02em' }}>{line.lineTotal.toFixed(2).replace('.', ',')} €</div>
        </div>
      </div>
    </div>
  );
}
