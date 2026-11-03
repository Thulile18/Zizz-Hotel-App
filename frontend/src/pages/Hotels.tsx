import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHotels } from '../store/hotelsSlice';
import type { Hotel } from '../store/hotelsSlice';
import { MOODS, moodByKey } from '../lib/moods';
import { currentPosition, distanceKm, formatKm, geocodePlace, stayPoint } from '../lib/geo';
import type { Point } from '../lib/geo';
import BackButton from '../components/BackButton';
import HotelCard from '../components/HotelCard';

interface Origin {
  point: Point;
  label: string;
}

export default function Hotels() {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.hotels);
  const [params, setParams] = useSearchParams();

  const [origin, setOrigin] = useState<Origin | null>(null);
  const [place, setPlace] = useState('');
  const [locating, setLocating] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const q = params.get('q') ?? '';
  const country = params.get('country') ?? 'All';
  const sort = params.get('sort') ?? 'name';
  const type = params.get('type') ?? '';
  const mood = moodByKey(params.get('mood'));

  useEffect(() => {
    document.title = 'Hotels worldwide — VELOUR';
    dispatch(fetchHotels({ q: '', maxPrice: 1000000, minStars: 0 }));
  }, [dispatch]);

  function set(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '') next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  }

  function applyOrigin(next: Origin) {
    setOrigin(next);
    set({ sort: 'distance' });
  }

  function clearOrigin() {
    setOrigin(null);
    setPlaceError('');
    if (sort === 'distance') set({ sort: 'name' });
  }

  async function nearMe() {
    setPlaceError('');
    setLocating(true);
    try {
      const point = await currentPosition();
      applyOrigin({ point, label: 'your location' });
    } catch (err) {
      setPlaceError((err as Error).message);
    } finally {
      setLocating(false);
    }
  }

  async function searchPlace(e: FormEvent) {
    e.preventDefault();
    if (!place.trim()) return;
    setPlaceError('');
    setLocating(true);
    try {
      const found = await geocodePlace(place.trim());
      if (!found) setPlaceError(`We could not find “${place.trim()}”. Try a city, town or address.`);
      else applyOrigin(found);
    } catch (err) {
      setPlaceError((err as Error).message);
    } finally {
      setLocating(false);
    }
  }

  const distances = new Map<number, number>();
  if (origin) {
    list.forEach((h) => {
      const p = stayPoint(h);
      distances.set(h.id, p ? distanceKm(origin.point, p) : Infinity);
    });
  }

  const countries = [
    'All',
    ...[...new Set(list.map((h) => h.country).filter((c): c is string => Boolean(c)))].sort(),
  ];
  const types = [...new Set(list.map((h) => h.property_type).filter((t): t is string => Boolean(t)))].sort();

  const term = q.trim().toLowerCase();
  const matches = (h: Hotel) =>
    !term ||
    [h.name, h.city, h.region, h.country, h.address, h.tagline].some((s) =>
      (s ?? '').toLowerCase().includes(term),
    );

  const shown = list
    .filter((h) => country === 'All' || h.country === country)
    .filter((h) => !type || h.property_type === type)
    .filter((h) => !mood || mood.matches(h))
    .filter(matches)
    .sort((a, b) => {
      if (origin && sort === 'distance') {
        return (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity);
      }
      if (sort === 'price') return Number(a.from_price) - Number(b.from_price);
      if (sort === 'stars') return b.stars - a.stars;
      return a.name.localeCompare(b.name);
    });

  const nearest = origin && shown.length > 0 ? distances.get(shown[0].id) : undefined;

  // When nothing matches, offer the closest alternatives instead of an empty page
  const filtersOn = Boolean(q.trim() || country !== 'All' || type || mood);
  let suggestions: Hotel[] = [];
  let suggestionNote = '';
  if (!loading && !error && shown.length === 0) {
    const byMood = mood ? list.filter((h) => mood.matches(h)) : [];
    const byType = type ? list.filter((h) => h.property_type === type) : [];
    const featured = list.filter((h) => h.is_featured);
    if (byMood.length > 0) {
      suggestions = byMood;
      suggestionNote = `Stays that match the mood “${mood?.name}”`;
    } else if (byType.length > 0) {
      suggestions = byType;
      suggestionNote = `Other ${type} stays`;
    } else {
      suggestions = featured.length > 0 ? featured : list;
      suggestionNote = 'Some of our favourite stays';
    }
    suggestions = suggestions.slice(0, 4);
  }

  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true });
    clearOrigin();
  }

  return (
    <div className="v-page">
      <BackButton fallback="/" />
      <p className="eyebrow">Destinations worldwide</p>
      <h1 className="v-title" style={{ margin: '12px 0 0' }}>Find your stay</h1>

      <div className="v-controls">
        <input
          placeholder="Search city, province, country or stay — e.g. Durban, Gauteng, Japan"
          value={q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <select value={country} onChange={(e) => set({ country: e.target.value })}>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="name">Sort: Name</option>
          <option value="price">Sort: Lowest price</option>
          <option value="stars">Sort: Stars</option>
          {origin && <option value="distance">Sort: Nearest</option>}
        </select>
      </div>

      {/* Find stays near you, or near any place in the world */}
      <form className="v-nearby" onSubmit={searchPlace}>
        <button type="button" className="v-btn v-btn-outline" onClick={nearMe} disabled={locating}>
          {locating ? 'Finding…' : '◎ Near me'}
        </button>
        <input
          aria-label="Find stays near any place in the world"
          placeholder="Or find stays near any place in the world — e.g. Santorini, Nairobi, Times Square"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <button type="submit" className="v-btn" disabled={locating || !place.trim()}>
          Find nearby
        </button>
      </form>
      {placeError && <p className="v-error v-mt">{placeError}</p>}
      {origin && (
        <p className="v-origin">
          Showing stays nearest to <span className="v-gold">{origin.label}</span>
          {nearest !== undefined && Number.isFinite(nearest) && ` — the closest is ${formatKm(nearest)} away`}.{' '}
          <button type="button" className="v-linkbtn" onClick={clearOrigin}>Clear</button>
        </p>
      )}

      {types.length > 1 && (
        <div className="v-mood-chips" role="group" aria-label="Filter by type of stay">
          <button className={`v-tab${!type ? ' active' : ''}`} onClick={() => set({ type: '' })}>
            All stays
          </button>
          {types.map((t) => (
            <button key={t} className={`v-tab${type === t ? ' active' : ''}`} onClick={() => set({ type: t })}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="v-mood-chips" role="group" aria-label="Filter by mood">
        <button className={`v-tab${!mood ? ' active' : ''}`} onClick={() => set({ mood: '' })}>
          Any mood
        </button>
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`v-tab${mood?.key === m.key ? ' active' : ''}`}
            onClick={() => set({ mood: m.key })}
          >
            {m.name}
          </button>
        ))}
      </div>
      {mood && <p className="v-muted v-mood-line">{mood.line}</p>}

      {loading && <p className="v-muted v-mt">Loading…</p>}
      {error && <p className="v-error v-mt">Sorry, we could not load the stays: {error}</p>}
      {!loading && !error && shown.length === 0 && (
        <div className="v-empty">
          <h2>Nothing matches all of those choices</h2>
          <p className="v-muted">
            Try fewer filters, or take a look at the closest matches below.
          </p>
          {filtersOn && (
            <button type="button" className="v-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {shown.length > 0 && <p className="v-count">{shown.length} stays</p>}

      <div className="v-grid v-mt">
        {shown.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} distance={origin ? distances.get(hotel.id) : undefined} />
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="v-suggest">
          <p className="eyebrow">Closest matches</p>
          <h2 className="v-h3" style={{ margin: '12px 0 8px' }}>You might like these instead</h2>
          <p className="v-muted" style={{ margin: '0 0 32px', fontSize: '0.875rem' }}>{suggestionNote}</p>
          <div className="v-grid">
            {suggestions.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
