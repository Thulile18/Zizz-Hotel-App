import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';
import { useMoney } from '../lib/currency';
import BackButton from '../components/BackButton';
import Lightbox from '../components/Lightbox';
import Photo from '../components/Photo';
import SaveButton from '../components/SaveButton';

interface Room {
  id: number;
  room_type: string;
  capacity: number;
  price_per_night: string;
  total_rooms: number;
  image_path: string | null;
  description: string | null;
  amenities: string[];
}

interface Review {
  id: number;
  user_id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface HotelImage {
  id: number;
  storage_path: string;
  caption: string | null;
  category: string | null;
  display_order: number;
}

interface HotelDetails {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string;
  city: string;
  region: string | null;
  country: string;
  latitude: string | null;
  longitude: string | null;
  star_rating: number;
  facilities: string[];
  policies: string | null;
  hotel_images: HotelImage[];
  rooms: Room[];
  reviews: Review[];
}

// The hotel route can name some fields differently (stars / star_rating, type / room_type,
// lat / latitude, images / hotel_images). This reads either so the page never breaks.
type Raw = Record<string, unknown>;
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (v == null || v === '' ? null : String(v));
const num = (v: unknown, fallback = 0): number =>
  v == null || Number.isNaN(Number(v)) ? fallback : Number(v);

function normalizeHotel(raw: Raw): HotelDetails {
  const images = asArray(raw.hotel_images ?? raw.images)
    .map((img, i): HotelImage => {
      if (typeof img === 'string') {
        return { id: i, storage_path: img, caption: null, category: null, display_order: i };
      }
      const r = img as Raw;
      return {
        id: num(r.id, i),
        storage_path: String(r.storage_path ?? r.url ?? r.path ?? ''),
        caption: str(r.caption),
        category: str(r.category),
        display_order: num(r.display_order, i),
      };
    })
    .filter((img) => img.storage_path);

  const rooms = asArray(raw.rooms).map((item): Room => {
    const r = item as Raw;
    return {
      id: num(r.id),
      room_type: String(r.room_type ?? r.type ?? 'Room'),
      capacity: Math.max(1, num(r.capacity, 2)),
      price_per_night: String(r.price_per_night ?? 0),
      total_rooms: num(r.total_rooms),
      image_path: str(r.image_path),
      description: str(r.description),
      amenities: asArray(r.amenities).map(String),
    };
  });

  const reviews = asArray(raw.reviews).map((item): Review => {
    const r = item as Raw;
    return {
      id: num(r.id),
      user_id: num(r.user_id),
      reviewer_name: String(r.reviewer_name ?? r.name ?? r.user_name ?? 'Guest'),
      rating: num(r.rating, 5),
      comment: str(r.comment),
      created_at: String(r.created_at ?? ''),
    };
  });

  return {
    id: num(raw.id),
    name: String(raw.name ?? ''),
    tagline: str(raw.tagline),
    description: str(raw.description),
    address: String(raw.address ?? ''),
    city: String(raw.city ?? ''),
    region: str(raw.region),
    country: String(raw.country ?? ''),
    latitude: str(raw.latitude ?? raw.lat),
    longitude: str(raw.longitude ?? raw.lng),
    star_rating: num(raw.star_rating ?? raw.stars, 5),
    facilities: asArray(raw.facilities).map(String),
    policies: str(raw.policies),
    hotel_images: images,
    rooms,
    reviews,
  };
}

// Dates as "2026-12-10" in the visitor's own time zone
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
// A date typed into the link (?checkIn=2026-12-10), if it looks right
const fromLink = (value: string | null, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;

export default function HotelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const formatPrice = useMoney();

  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [broken, setBroken] = useState<string[]>([]);

  const [category, setCategory] = useState('All');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [checkIn, setCheckIn] = useState(fromLink(searchParams.get('checkIn'), iso(inDays(1))));
  const [checkOut, setCheckOut] = useState(fromLink(searchParams.get('checkOut'), iso(inDays(3))));
  const [guests, setGuests] = useState(
    Math.min(20, Math.max(1, Number(searchParams.get('guests')) || 2)),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bookError, setBookError] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  const [locating, setLocating] = useState(false);

  function loadHotel() {
    api<Raw>(`/hotels/${id}`)
      .then((raw) => setHotel(normalizeHotel(raw)))
      .catch((err) => setError((err as Error).message));
  }

  useEffect(() => {
    loadHotel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (hotel) document.title = `${hotel.name} — VELOUR`;
  }, [hotel]);

  if (error) return <p className="v-state v-error">Error: {error}</p>;
  if (!hotel) return <p className="v-state v-muted v-pulse">Loading…</p>;

  const images = [...hotel.hotel_images].sort((a, b) => a.display_order - b.display_order);
  const cover = images.length > 0 ? images[0].storage_path : null;
  const gallery = images.filter((img) => !broken.includes(img.storage_path));
  const categories = [...new Set(gallery.map((g) => g.category).filter((c): c is string => Boolean(c)))];
  const shownGallery = category === 'All' ? gallery : gallery.filter((g) => g.category === category);

  const nights = Math.max(0, Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86400000));

  const location = [hotel.city, hotel.region, hotel.country].filter(Boolean).join(', ');
  const place = [hotel.address, hotel.city, hotel.region, hotel.country].filter(Boolean).join(', ');
  const hasGps = hotel.latitude != null && hotel.longitude != null;
  const destination = hasGps ? `${hotel.latitude},${hotel.longitude}` : place;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(destination)}&z=15&output=embed`;

  async function share() {
    const link = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: hotel?.name, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setNote('Link copied. You can paste it to share.');
      }
    } catch {
      // The guest closed the share window. Nothing to do.
    }
  }

  async function reserve(room: Room, rooms: number) {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookError('');
    setBusyId(room.id);
    try {
      const result = await api<{ bookingId: number; checkoutUrl: string }>('/bookings', 'POST', {
        roomId: room.id,
        checkIn,
        checkOut,
        rooms,
        guests,
      });
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      setBookError((err as Error).message);
      setBusyId(null);
    }
  }

  async function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!hotel) return;
    setReviewMessage('');
    setReviewError('');
    try {
      await api(`/reviews/${hotel.id}`, 'PUT', { rating, comment: comment.trim() });
      setComment('');
      setReviewMessage('Thank you for your review.');
      loadHotel();
    } catch (err) {
      setReviewError((err as Error).message);
    }
  }

  function open(origin?: string) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${
      origin ? `&origin=${origin}` : ''
    }`;
    window.open(url, '_blank', 'noopener');
  }

  function directionsFromHere() {
    if (!navigator.geolocation) {
      open();
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        open(`${p.coords.latitude},${p.coords.longitude}`);
      },
      () => {
        setLocating(false);
        open();
      },
      { timeout: 8000 },
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="v-hero v-hero-sm">
        <Photo key={hotel.id} className="v-hero-img" src={cover} alt={hotel.name} />
        <div className="veil" />
        <div className="v-back-float">
          <BackButton fallback="/hotels" />
        </div>
        <div className="v-hero-content fade-up">
          <p className="eyebrow v-hero-eyebrow">
            {location} · {'★'.repeat(hotel.star_rating)}
          </p>
          <h1 className="v-hotel-title">{hotel.name}</h1>
          {hotel.tagline && <p className="v-tagline">{hotel.tagline}</p>}

          <div className="v-hero-actions">
            <SaveButton hotelId={hotel.id} />
            <button className="v-textbtn v-gold" onClick={share}>Share location</button>
          </div>

          {note && <p className="v-hero-note">{note}</p>}
        </div>
      </section>

      <div className="v-hotel-layout">
        <div className="v-hotel-main">
          {/* Overview */}
          <div>
            <p className="v-lead">{hotel.description || 'No overview has been added yet.'}</p>
            {hotel.facilities.length > 0 && (
              <div className="v-chips">
                {hotel.facilities.map((f) => (
                  <span key={f} className="v-chip">{f}</span>
                ))}
              </div>
            )}
          </div>

          {/* Gallery */}
          {gallery.length > 1 && (
            <div>
              {categories.length > 1 && (
                <div className="v-gal-filter" role="group" aria-label="Photo categories">
                  {['All', ...categories].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`v-tab${category === c ? ' active' : ''}`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <div className="v-gal">
                {shownGallery.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    className="v-gal-item"
                    aria-label={`Open photo: ${g.caption || hotel.name}`}
                    onClick={() => setLightbox(i)}
                  >
                    <img
                      src={g.storage_path}
                      alt={g.caption || hotel.name}
                      loading="lazy"
                      onError={() =>
                        setBroken((b) => (b.includes(g.storage_path) ? b : [...b, g.storage_path]))
                      }
                    />
                    {g.caption && <span className="v-gal-cap">{g.caption}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div>
            <h2 className="v-h3">Rooms &amp; suites</h2>
            <div>
              {hotel.rooms.map((r) => {
                const roomsNeeded = Math.max(1, Math.ceil(guests / r.capacity));
                const total = Number(r.price_per_night) * nights * roomsNeeded;
                return (
                  <article key={r.id} className="v-room fade-up">
                    <Photo className="v-room-img" src={r.image_path} fallback={cover} alt={r.room_type} />
                    <div className="v-room-body">
                      <h3>{r.room_type}</h3>
                      {r.description && <p className="v-room-desc">{r.description}</p>}
                      <p className="v-room-meta">
                        Up to {r.capacity} guests
                        {r.amenities.length > 0 ? ` · ${r.amenities.slice(0, 4).join(' · ')}` : ''}
                      </p>
                      <div className="v-room-foot">
                        <div>
                          <span className="v-room-rate">{formatPrice(r.price_per_night)}</span>
                          <span className="v-muted"> / night</span>
                          {nights > 0 && (
                            <p className="v-room-sub">
                              {formatPrice(total)} for {nights} night{nights > 1 ? 's' : ''}
                              {roomsNeeded > 1 ? ` · ${roomsNeeded} rooms` : ''}
                            </p>
                          )}
                        </div>
                        <button
                          className="v-btn"
                          disabled={busyId === r.id || nights <= 0}
                          onClick={() => reserve(r, roomsNeeded)}
                        >
                          {busyId === r.id ? 'Reserving…' : user ? 'Reserve' : 'Sign in to reserve'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Policies */}
          {hotel.policies && (
            <div>
              <h3 className="v-sub">Policies &amp; guidelines</h3>
              <p className="v-muted v-pre">{hotel.policies}</p>
            </div>
          )}

          {/* Getting here */}
          <div>
            <h2 className="v-h3" style={{ marginBottom: 16 }}>Getting here</h2>
            <p className="v-place">📍 {place}</p>
            {hasGps && (
              <p className="v-gps">
                GPS {Number(hotel.latitude).toFixed(4)}, {Number(hotel.longitude).toFixed(4)}
              </p>
            )}
            <div className="v-map-frame">
              <iframe
                title={`Map of ${hotel.name}`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="v-map-actions">
              <button className="v-btn" onClick={directionsFromHere} disabled={locating}>
                {locating ? 'Finding you…' : 'Directions from my location'}
              </button>
              <a
                className="v-btn v-btn-outline"
                href={`https://waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Waze
              </a>
            </div>
          </div>

          {/* Guest notes */}
          <div>
            <h2 className="v-h3">Guest notes</h2>
            {hotel.reviews.length === 0 && <p className="v-muted">No reviews yet.</p>}
            <div className="v-quotes">
              {hotel.reviews.map((rv) => (
                <blockquote key={rv.id} className="v-quote">
                  <p>{rv.comment ? `“${rv.comment}”` : 'Left a rating.'}</p>
                  <footer>
                    {rv.reviewer_name} · {'★'.repeat(rv.rating)}
                  </footer>
                </blockquote>
              ))}
            </div>

            {user ? (
              <form className="v-panel" style={{ marginTop: 40 }} onSubmit={submitReview}>
                <p className="eyebrow">Write a review</p>
                <div className="v-stars-input">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className={`v-star${n <= rating ? ' on' : ''}`}
                      onClick={() => setRating(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  maxLength={1000}
                  rows={4}
                  placeholder="Tell other guests about your stay"
                />
                {reviewMessage && <p className="v-msg v-msg-ok" style={{ margin: 0 }}>{reviewMessage}</p>}
                {reviewError && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{reviewError}</p>}
                <p className="v-panel-text">You can review a hotel once your stay is complete.</p>
                <div>
                  <button type="submit" className="v-btn">Post review</button>
                </div>
              </form>
            ) : (
              <p style={{ marginTop: 32, fontSize: '0.875rem' }}>
                <Link to="/login" className="v-textlink">Sign in</Link> to write a review.
              </p>
            )}
          </div>
        </div>

        {/* Your stay */}
        <div>
          <div className="v-sticky">
            <aside className="v-panel">
              <p className="eyebrow">Your stay</p>
              <div>
                <label className="v-label">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={iso(new Date())}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div>
                <label className="v-label">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
              <div>
                <label className="v-label">Guests</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <p className="v-panel-text">
                {nights > 0
                  ? `${nights} night${nights > 1 ? 's' : ''} selected. Choose a room to reserve. More guests means more rooms, and each room's total updates as you change them.`
                  : 'Choose valid dates.'}
              </p>
              {bookError && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{bookError}</p>}
              {!user && (
                <p className="v-panel-text">
                  <Link to="/login" className="v-textlink">Sign in</Link> to reserve.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox
          images={shownGallery.map((g) => ({ url: g.storage_path, caption: g.caption, category: g.category }))}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
