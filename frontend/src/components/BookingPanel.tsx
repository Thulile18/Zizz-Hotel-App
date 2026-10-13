import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

interface Room {
  id: number;
  type: string;
  capacity: number;
  price_per_night: string;
}

export default function BookingPanel({ rooms }: { rooms: Room[] }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? 0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const room = rooms.find((r) => r.id === roomId);
  const today = new Date().toISOString().slice(0, 10);

  // A friendly estimate. The server works out the real price again.
  const nights =
    checkIn && checkOut
      ? Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86_400_000)
      : 0;
  const total = room && nights > 0 ? nights * roomCount * Number(room.price_per_night) : 0;

  async function bookAndPay() {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const result = await api<{ bookingId: number; checkoutUrl: string }>('/bookings', 'POST', {
        roomId,
        checkIn,
        checkOut,
        rooms: roomCount,
        guests,
      });
      window.location.href = result.checkoutUrl; // off to Stripe to pay
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <aside className="panel">
      <h3>Book your stay</h3>

      <label>
        Room
        <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.type} · ${Number(r.price_per_night)}/night · sleeps {r.capacity}
            </option>
          ))}
        </select>
      </label>

      <label>
        Check-in
        <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      </label>

      <label>
        Check-out
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>

      <label>
        Number of rooms
        <input
          type="number"
          min="1"
          value={roomCount}
          onChange={(e) => setRoomCount(Number(e.target.value))}
        />
      </label>

      <label>
        Guests
        <input
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />
      </label>

      {total > 0 && (
        <p>
          {nights} night(s): <b>${total}</b>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <button
        className="cta"
        onClick={bookAndPay}
        disabled={busy || !checkIn || !checkOut}
      >
        {busy ? 'Please wait...' : user ? 'Book and pay' : 'Log in to book'}
      </button>
    </aside>
  );
}