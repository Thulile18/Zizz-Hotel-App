import type { Hotel } from '../store/hotelsSlice';
import { distanceKm, stayPoint } from '../lib/geo';
import type { Point } from '../lib/geo';
import HotelCard from './HotelCard';

const NEARBY_KM = 150;

// Other stays close to this one: hotels, guesthouses, apartments, villas and lodges
export default function NearbyStays({
  currentId,
  point,
  hotels,
}: {
  currentId: number;
  point: Point | null;
  hotels: Hotel[];
}) {
  if (!point) return null;

  const nearby = hotels
    .filter((h) => h.id !== currentId)
    .map((h) => {
      const p = stayPoint(h);
      return { hotel: h, km: p ? distanceKm(point, p) : Infinity };
    })
    .filter((x) => x.km <= NEARBY_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);

  if (nearby.length === 0) return null;

  return (
    <div>
      <h2 className="v-h3">Stay nearby</h2>
      <p className="v-muted" style={{ margin: '-16px 0 32px', fontSize: '0.875rem' }}>
        Other stays within {NEARBY_KM} km, from hotels to guesthouses, apartments and lodges.
      </p>
      <div className="v-grid v-grid-3">
        {nearby.map(({ hotel, km }) => (
          <HotelCard key={hotel.id} hotel={hotel} distance={km} />
        ))}
      </div>
    </div>
  );
}