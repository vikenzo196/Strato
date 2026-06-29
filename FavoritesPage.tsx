import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { CTA } from '../components/CTA';
import { useTheme } from '../shell/ThemeProvider';

export function CartEmptyV3() {
  const nav = useNavigate();
  const { theme } = useTheme();
  const img = new URL(`../assets/empty-states/cart/empty_cart_v3_${theme}.png`, import.meta.url).href;
  return (
    <EmptyState
      image={img}
      title={<>La tua shopping bag<br/>è vuota.</>}
      text={<>Esplora e scegli il tuo<br/>prossimo oggetto.</>}
      cta={<CTA withArrow onClick={() => nav('/esplora')}>Esplora</CTA>}
    />
  );
}
