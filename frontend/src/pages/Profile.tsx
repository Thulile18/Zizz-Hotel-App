import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loggedIn } from '../store/authSlice';
import { fetchHotels } from '../store/hotelsSlice';
import type { User } from '../store/authSlice';
import { useMoney } from '../lib/currency';
import BackButton from '../components/BackButton';
import CredentialsForm from '../components/CredentialsForm';
import HotelCard from '../components/HotelCard';
import Photo from '../components/Photo';
import PrivacyControls from '../components/PrivacyControls';

interface Profile extends User {
  phone: string | null;
}

interface Booking {
  id: number;
  hotel_id: number;
  check_in: string;
  check_out: string;
  rooms_booked: number;
  guests: number;
  total_price: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  hotel: string;
  room_type: string;
  rooms?: { image_path: string | null } | null;
}

interface SavedHotel {
  id: number;
  name: string;
  city: string;
  stars: number;
  cover: string | null;
  from_price: string;
}

interface Notification {
  id: number;
  message: string;
  created_at: string;
}

// "2026-12-09T22:00:00.000Z" becomes "10 Dec 2026" in the visitor's own time zone
function showDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "10 Dec 2026, 14:30"
function showDateTime(value: string) {
  return new Date(value).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Where is this booking right now? Front desk check-in and check-out decide it.
function stayLabel(b: Booking) {
  if (b.status === 'cancelled') return 'Cancelled';
  if (b.status === 'pending') return 'Awaiting payment';
  if (b.checked_out_at) return 'Completed';
  if (b.checked_in_at) return 'Staying now';
  return 'Upcoming';
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const allStays = useAppSelector((state) => state.hotels.list);
  const formatPrice = useMoney();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState<SavedHotel[]>([]);
  const [notes, setNotes] = useState<Notification[]>([]);

  function loadBookings() {
    api<Booking[]>('/bookings').then(setBookings).catch(() => setBookings([]));
  }

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    document.title = 'My account — VELOUR';
    api<Profile>('/users/me').then((p) => {
      setName(p.name);
      setPhone(p.phone ?? '');
    });
    loadBookings();
    api<SavedHotel[]>('/favourites').then(setSaved).catch(() => setSaved([]));
    api<Notification[]>('/notifications').then(setNotes).catch(() => setNotes([]));
    dispatch(fetchHotels({ q: '', maxPrice: 1000000, minStars: 0 }));
  }, [user, navigate, dispatch]);

  async function saveProfile() {
    setMessage('');
    setError('');
    try {
      const updated = await api<Profile>('/users/me', 'PUT', { name, phone });
      dispatch(
        loggedIn({
          user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
          token: localStorage.getItem('token') ?? '',
        }),
      );
      setMessage('Profile saved.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function cancel(id: number) {
    if (!window.confirm('Cancel this booking?')) return;
    await api(`/bookings/${id}`, 'DELETE');
    loadBookings();
    api<Notification[]>('/notifications').then(setNotes);
  }

  if (!user) return null;

  // Ideas to fill the page when there is nothing to show yet: featured stays first, not already saved
  const savedIds = saved.map((s) => s.id);
  const ideas = [
    ...allStays.filter((h) => h.is_featured),
    ...allStays.filter((h) => !h.is_featured),
  ]
    .filter((h) => !savedIds.includes(h.id))
    .slice(0, 3);
  const showIdeas = (bookings.length === 0 || saved.length === 0) && ideas.length > 0;

  return (
    <div className="v-page">
      <BackButton fallback="/" />
      <p className="eyebrow">Your account</p>
      <h1 className="v-title">Welcome{name ? `, ${name}` : ''}</h1>

      <div className="v-profile">
        {/* Left column: details, sign-in details, notifications, privacy */}
        <div className="v-side">
          <div className="v-panel fade-up">
            <p className="eyebrow">Personal details</p>

            <div>
              <label className="v-label">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="v-label">Email</label>
              <input value={user.email} disabled />
            </div>
            <div>
              <label className="v-label">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>

            {message && <p className="v-msg v-msg-ok" style={{ margin: 0 }}>{message}</p>}
            {error && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{error}</p>}

            <button className="v-btn v-btn-block" onClick={saveProfile}>
              Save changes
            </button>
          </div>

          <CredentialsForm />

          <div className="v-panel fade-up">
            <p className="eyebrow">Notifications</p>
            {notes.length === 0 ? (
              <p className="v-muted" style={{ margin: 0, fontSize: '0.875rem' }}>No notifications.</p>
            ) : (
              <div className="v-notes">
                {notes.map((n) => (
                  <div key={n.id} className="v-note">
                    <p>{n.message}</p>
                    <span className="v-note-date">{showDate(n.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <PrivacyControls />
        </div>

        {/* Right column: stays and saved hotels */}
        <div className="v-main-col">
          <div>
            <p className="eyebrow">My stays</p>
            {bookings.length === 0 ? (
              <p className="v-muted" style={{ marginTop: 24 }}>
                No stays yet. <Link to="/hotels" className="v-textlink">Find a hotel</Link>.
              </p>
            ) : (
              <div className="v-stays">
                {bookings.map((b) => {
                  const label = stayLabel(b);
                  return (
                    <article key={b.id} className="v-stay v-stay-photo fade-up">
                      <Photo
                        key={b.id}
                        className="v-stay-img"
                        src={b.rooms?.image_path ?? null}
                        alt={b.room_type}
                      />
                      <div>
                        <p className="eyebrow">
                          <span className={label === 'Cancelled' ? 'v-error' : ''}>{label}</span>
                        </p>
                        <h2>
                          <Link to={`/hotels/${b.hotel_id}`} className="v-plain">{b.hotel}</Link>
                        </h2>
                        <p>
                          {b.room_type} · {b.rooms_booked} room(s) · {b.guests} guest(s)
                        </p>
                        <p>
                          {showDate(b.check_in)} → {showDate(b.check_out)}
                        </p>
                        {b.checked_in_at && <p>Checked in {showDateTime(b.checked_in_at)}</p>}
                        {b.checked_out_at && <p>Checked out {showDateTime(b.checked_out_at)}</p>}
                      </div>

                      <div className="v-stay-side">
                        <span className="v-price">{formatPrice(b.total_price)}</span>
                        {label === 'Completed' && (
                          <Link to={`/hotels/${b.hotel_id}`} className="v-btn v-btn-sm">
                            Write a review
                          </Link>
                        )}
                        {(b.status === 'pending' || (b.status === 'confirmed' && !b.checked_in_at)) && (
                          <button className="v-btn v-btn-sm v-btn-outline" onClick={() => cancel(b.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">Saved hotels</p>
            {saved.length === 0 ? (
              <p className="v-muted" style={{ marginTop: 24 }}>
                No saved hotels yet — tap “Save hotel” on any hotel.
              </p>
            ) : (
              <div className="v-saved">
                {saved.map((h) => (
                  <article key={h.id} className="v-saved-card fade-up">
                    <div className="v-saved-img">
                      {h.cover && <img src={h.cover} alt={h.name} loading="lazy" />}
                    </div>
                    <div className="v-saved-body">
                      <div>
                        <p className="eyebrow">
                          {h.city} · {'★'.repeat(h.stars)}
                        </p>
                        <h3>{h.name}</h3>
                      </div>
                      <div className="v-saved-foot">
                        <span>
                          From <span className="v-gold">{formatPrice(h.from_price)}</span>
                        </span>
                        <Link to={`/hotels/${h.id}`} className="v-textlink">
                          Details
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {showIdeas && (
            <div>
              <p className="eyebrow">Ideas for your next escape</p>
              <div className="v-grid v-suggest-grid">
                {ideas.map((h) => (
                  <HotelCard key={h.id} hotel={h} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
