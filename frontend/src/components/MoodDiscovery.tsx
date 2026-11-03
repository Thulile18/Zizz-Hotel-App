import { Link } from 'react-router-dom';
import type { Hotel } from '../store/hotelsSlice';
import { MOODS } from '../lib/moods';
import Photo from './Photo';

// Pick how you want to feel. Each tile shows a real photo of a hotel that fits that mood.
export default function MoodDiscovery({ hotels }: { hotels: Hotel[] }) {
  const tiles = MOODS.map((mood) => {
    const found = hotels.filter(mood.matches);
    const cover = found.find((h) => h.cover)?.cover ?? null;
    return { mood, count: found.length, cover };
  }).filter((t) => t.count > 0);

  if (tiles.length === 0) return null;

  return (
    <section className="v-section">
      <p className="eyebrow">Feel first, choose later</p>
      <h2 className="v-h2" style={{ margin: '12px 0 40px' }}>How do you want to feel?</h2>
      <div className="v-moods">
        {tiles.map(({ mood, count, cover }) => (
          <Link key={mood.key} to={`/hotels?mood=${mood.key}`} className="v-mood">
            <Photo className="v-mood-img" src={cover} alt="" />
            <span className="v-mood-count">
              {count} stay{count > 1 ? 's' : ''}
            </span>
            <div className="v-mood-body">
              <h3>{mood.name}</h3>
              <p>{mood.line}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
