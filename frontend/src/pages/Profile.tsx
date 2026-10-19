import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loggedIn } from '../store/authSlice';
import type { User } from '../store/authSlice';
import PrivacyControls from '../components/PrivacyControls';

interface Profile extends User {
  phone: string | null;
}

interface Booking {
  id: number;
  check_in: string;
  check_out: string;
  rooms_booked: number;
  guests: number;
  total_price: string;
  status: string;
  hotel: string;
  room_type: string;
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

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

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

  // Load everything when the page opens
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    api<Profile>('/users/me').then((p) => {
      setName(p.name);
      setPhone(p.phone ?? '');
    });
    loadBookings();
    api<SavedHotel[]>('/favourites').then(setSaved).catch(() => setSaved([]));
    api<Notification[]>('/notifications').then(setNotes).catch(() => setNotes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setMessage('');
    setError('');
    try {
      const updated = await api<Profile>('/users/me', 'PUT', { name, phone });
      // Keep the header's "Hi, ..." in step with the new name
      dispatch(loggedIn({ user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role }, token: localStorage.getItem('token') ?? '' }));
      setMessage('Profile saved.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function cancel(id: number) {
    await api(`/bookings/${id}`, 'DELETE');
    loadBookings();
    api<Notification[]>('/notifications').then(setNotes);
  }

  if (!user) return null;

  return (
    <div className="stack">
      <h2>Your profile</h2>

      <section className="panel">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input value={user.email} disabled />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
        </label>
        {message && <p>{message}</p>}
        {error && <p className="error">{error}</p>}
        <button className="cta" onClick={saveProfile}>
          Save changes
        </button>
      </section>

      <h3>Your bookings</h3>
      {bookings.length === 0 && <p>No bookings yet. Find a place you love on the home page.</p>}
      {bookings.map((b) => (
        <div key={b.id} className="panel">
          <b>{b.hotel}</b>, {b.room_type}
          <br />
          {showDate(b.check_in)} to {showDate(b.check_out)} · {b.rooms_booked} room(s) · {b.guests} guest(s)
          <br />${Number(b.total_price)} · <b>{b.status}</b>
          {b.status !== 'cancelled' && (
            <div>
              <button onClick={() => cancel(b.id)}>Cancel booking</button>
            </div>
          )}
        </div>
      ))}

      <h3>Saved hotels</h3>
      {saved.length === 0 && <p>Tap Save on a hotel to keep it here.</p>}
      <div className="grid">
        {saved.map((h) => (
          <article key={h.id} className="card">
            <img src={h.cover ?? 'https://picsum.photos/seed/placeholder/800/500'} alt={h.name} loading="lazy" />
            <div className="card-body">
              <h3>{h.name}</h3>
              <p>
                {h.city} · {'★'.repeat(h.stars)}
              </p>
              <p>
                <b>${Number(h.from_price)}</b> per night
              </p>
              <Link to={`/hotels/${h.id}`}>
                <button className="cta">View details</button>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <h3>Notifications</h3>
      {notes.length === 0 && <p>Nothing new yet.</p>}
      {notes.map((n) => (
        <p key={n.id}>
          {n.message} <small>({showDate(n.created_at)})</small>
        </p>
      ))}
      <PrivacyControls/>
    </div>
  );
}