import type { Hotel } from '../store/hotelsSlice';
import { Link } from 'react-router-dom';
import { useMoney } from '../lib/currency';
import { formatKm } from '../lib/geo';

export default function HotelCard({ hotel, distance }: { hotel: Hotel; distance?: number }) {
  const formatPrice = useMoney();
  const from = Number(hotel.from_price);

  return (
    <div className="fade-up">
      <Link to={`/hotels/${hotel.id}`} className="v-card">
        <div className="v-card-img">
          {hotel.cover && <img src={hotel.cover} alt={hotel.name} loading="lazy" />}
          {distance !== undefined && Number.isFinite(distance) && (
            <span className="v-distance">{formatKm(distance)} away</span>
          )}
        </div>
        <div className="v-card-body">
          <p className="eyebrow">
            {hotel.property_type ? `${hotel.property_type} · ` : ''}
            {hotel.city}
            {hotel.region ? `, ${hotel.region}` : ''}
            {hotel.country ? `, ${hotel.country}` : ''} · {'★'.repeat(hotel.stars)}
          </p>
          <h3>{hotel.name}</h3>
          {hotel.tagline && <p className="v-card-tag">{hotel.tagline}</p>}
          <p className="v-card-price">
            From <span className="v-gold">{formatPrice(from)}</span> / night
          </p>
        </div>
      </Link>
    </div>
  );
}
