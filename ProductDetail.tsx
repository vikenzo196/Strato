import type { Product } from '../data/mockProducts';
import { ProductCard } from './ProductCard';
// Horizontal scroller used under "Lasciati ispirare" in Home.
export function CardRow({ products }: { products: Product[] }) {
  return (
    <div className="h-scroll">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
