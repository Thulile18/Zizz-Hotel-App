import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Hotel } from '../store/hotelsSlice';
import { MOODS, moodByKey } from '../lib/moods';
import { useMoney } from '../lib/currency';
import Photo from './Photo';

const BUDGETS = [0, 3000, 5000, 7000];

// One click picks a real hotel from your own list that fits the mood and budget you chose.
export default function SurpriseMe({ hotels }: { hotels: Hotel[] }) {
  const money = useMoney();
  const [moodKey, setMoodKey] = useState('');
  const [budget, setBudget] = useState(0);
  const [guests, setGuests] = useState(2);
  const [arrive, setArrive] = useState('');
  const [leave, setLeave] = useState('');

  const [pick, setPick] = useState<Hotel | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [cycle, setCycle] = useState('');
  const [seen, setSeen] = useState<number[]>([]);
  const [empty, setEmpty] = useState(false);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const ids = timers.current;
    return () => {
      ids.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
    };
  }, []);

  const mood = moodByKey(moodKey || null);

  function surprise() {
    const candidates = hotels.filter(
      (h) => (!mood || mood.matches(h)) && (!budget || Number(h.from_price) <= budget),
    );
    setEmpty(false);
    if (candidates.length === 0) {
      setPick(null);
      setEmpty(true);
      return;
    }

    const fresh = candidates.filter((h) => !seen.includes(h.id));
    const source = fresh.length > 0 ? fresh : candidates;
    const chosen = source[Math.floor(Math.random() * source.length)];
    setSeen(fresh.length > 0 ? [...seen, chosen.id] : [chosen.id]);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setPick(chosen);
      return;
    }

    setPick(null);
    setShuffling(true);
    let step = 0;
    const interval = window.setInterval(() => {
      setCycle(candidates[step % candidates.length].name);
      step += 1;
    }, 90);
    const finish = window.setTimeout(() => {
      window.clearInterval(interval);
      setShuffling(false);
      setPick(chosen);
    }, 1400);
    timers.current.push(interval, finish);
  }

  const reasons: string[] = [];
  if (pick) {
    if (mood) reasons.push(`Matches your mood: ${mood.name}`);
    if (budget > 0) reasons.push(`From ${money(Number(pick.from_price))} a night, inside your budget`);
    if ((pick.tags ?? []).includes('hidden-gem')) reasons.push('A hidden gem most travellers miss');
    reasons.push(
      `${pick.property_type ?? 'Hotel'} in ${[pick.city, pick.country].filter(Boolean).join(', ')}`,
    );
    reasons.push(`${pick.stars}-star stay`);
  }

  const planParams = new URLSearchParams();
  if (arrive && leave) {
    planParams.set('checkIn', arrive);
    planParams.set('checkOut', leave);
  }
  planParams.set('guests', String(guests));

  return (
    <section className="v-section">
      <div className="v-surprise">
        <p className="eyebrow">Don't know where to start?</p>
        <h2>Surprise me</h2>

        <div className="v-surprise-controls">
          <div>
            <label className="v-label">Mood</label>
            <select value={moodKey} onChange={(e) => setMoodKey(e.target.value)}>
              <option value="">Any mood</option>
              {MOODS.map((m) => (
                <option key={m.key} value={m.key}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="v-label">Budget</label>
            <select value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b === 0 ? 'Any budget' : `Under ${money(b)} / night`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="v-label">Guests</label>
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
              {[1, 2, 3, 4, 6].map((g) => (
                <option key={g} value={g}>{g} guest{g > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="v-label">Arrive (optional)</label>
            <input type="date" value={arrive} onChange={(e) => setArrive(e.target.value)} />
          </div>
          <div>
            <label className="v-label">Leave (optional)</label>
            <input type="date" min={arrive} value={leave} onChange={(e) => setLeave(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="v-btn" onClick={surprise} disabled={shuffling}>
            {shuffling ? 'Choosing…' : pick ? 'Try another' : 'Surprise me'}
          </button>
        </div>

        <div aria-live="polite">
          {shuffling && <p className="v-shuffle">{cycle}</p>}
          {empty && (
            <p className="v-muted" style={{ marginTop: 24 }}>
              Nothing fits those choices yet. Try a different mood or budget.
            </p>
          )}
          {pick && (
            <div className="v-reveal" key={pick.id}>
              <Photo className="v-reveal-img" src={pick.cover} alt={pick.name} />
              <div>
                <h3 style={{ margin: 0, fontSize: '2.25rem' }}>{pick.name}</h3>
                {pick.tagline && <p className="v-muted" style={{ margin: '4px 0 0' }}>{pick.tagline}</p>}
                <ul className="v-why">
                  {reasons.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
                <p className="v-panel-text" style={{ marginTop: 16 }}>
                  Prices are “from” rates. Availability for your dates is checked on the hotel page when you reserve.
                </p>
                <div style={{ marginTop: 20 }}>
                  <Link to={`/hotels/${pick.id}?${planParams}`} className="v-btn">
                    View hotel
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
