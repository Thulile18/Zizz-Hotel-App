import { Link } from 'react-router-dom';
import type { Hotel } from '../store/hotelsSlice';
import { useMoney } from '../lib/currency';
import Photo from './Photo';

// Large, uneven photo cards. The tagline appears when you hover or focus a card.
export default function DestinationCards({ hotels }: { hotels: Hotel[] }) {
  const formatPrice = useMoney();

  return (
    <div className="v-mosaic">
      {hotels.map((h) => (
        <Link key={h.id} to={`/hotels/${h.id}`} className="v-dest fade-up">
          <Photo className="v-dest-img" src={h.cover} alt={h.name} />
          <span className="v-dest-tag">{[h.city, h.country].filter(Boolean).join(', ')}</span>
          <div className="v-dest-body">
            <p className="eyebrow">
              {h.property_type ?? 'Hotel'} · {'★'.repeat(h.stars)}
            </p>
            <h3>{h.name}</h3>
            {h.tagline && <p className="v-dest-tagline">{h.tagline}</p>}
            <p className="v-dest-price">
              From <span className="v-gold">{formatPrice(Number(h.from_price))}</span> / night
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
