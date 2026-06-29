import { useState } from 'react';
export function QuantityStepper({ initial=1 }: { initial?: number }) {
  const [n, setN] = useState(initial);
  return (
    <div className="stepper">
      <button onClick={() => setN(v => Math.max(1, v - 1))} aria-label="Diminuisci">−</button>
      <span>{n}</span>
      <button onClick={() => setN(v => v + 1)} aria-label="Aumenta">+</button>
    </div>
  );
}
