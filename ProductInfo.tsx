import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/mockProducts';
import { ArrowRight } from './icons';

type Variant = 'full' | 'compact';

export function ProductCard({ product, variant = 'full' }: { product: Product; variant?: Variant }) {
  const nav = useNavigate();
  const price = product.basePrice.toFixed(2).replace('.', ',');

  if (variant === 'compact') {
    // Esplora "Aggiunti di recente" — 110px tile, name + price + arrow CTA
    return (
      <article className="rcard" onClick={() => nav(`/articolo/${product.id}`)} role="button">
        <div className="rcard__thumb"><img src={product.thumb} alt={product.name} /></div>
        <div className="rcard__body">
          <div className="rcard__name">{product.name}</div>
          <div className="rcard__foot">
            <span className="rcard__price">{price} €</span>
            <span aria-hidden><ArrowRight size={12} color="var(--accent)" /></span>
          </div>
        </div>
      </article>
    );
  }

  // Home "Lasciati ispirare" — full card with SCOPRI pill
  return (
    <article className="pcard" onClick={() => nav(`/articolo/${product.id}`)} role="button">
      <div className="pcard__thumb"><img src={product.thumb} alt={product.name} /></div>
      <div className="pcard__body">
        <div>
          <div className="pcard__cat">{product.category}</div>
          <h3 className="pcard__name">{product.name}</h3>
        </div>
        <div>
          <div className="pcard__price">{price} €</div>
          <div className="pcard__cb">SCOPRI</div>
        </div>
      </div>
    </article>
  );
}
