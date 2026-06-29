export function CartSummary({ total }: { total: number }) {
  return (
    <>
      <div style={{ height: 1, background: 'var(--border)', margin: '16px 18px 0' }} />
      <div className="cart-total">
        <span className="cart-total__label">Totale</span>
        <span className="cart-total__value">{total.toFixed(2).replace('.', ',')} €</span>
      </div>
    </>
  );
}
