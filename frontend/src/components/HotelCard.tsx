import type { Hotel } from '../store/hotelsSlice';
import { Link } from 'react-router-dom';

export default function HotelCard({ hotel }: { hotel: Hotel }) {
    return (
        <article className="card">
            <img
                src={hotel.cover ?? 'https://picsum.photos/seed/placeholder/800/500'}
                alt={hotel.name}
                loading="lazy"
            />
            <div className="card-body">
                <h3>{hotel.name}</h3>
                <p>
                    {hotel.city} · {'★'.repeat(hotel.stars)}
                    {hotel.rating ? ` · ${hotel.rating}/5` : ''}
                </p>
                <p>
                    <b>${Number(hotel.from_price)}</b> per night
                </p>
                <Link to={`/hotels/${hotel.id}`}>
                    <button className="cta">View details</button>
                </Link>
            </div>
        </article>
    );
}