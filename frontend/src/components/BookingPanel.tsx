import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

interface Room {
  id: number;
  type?: string;
  room_type?: string;
  capacity: number;
  price_per_night: string;
}

export default function BookingPanel({ rooms }: { rooms: Room[] }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // Safely grab the first room option id if available
  const initialRoomId = rooms && rooms.length > 0 ? rooms[0].id : 0;

  const [roomId, setRoomId] = useState(initialRoomId);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const room = rooms.find((r) => r.id === roomId);
  const today = new Date().toISOString().slice(0, 10);

  const nights =
    checkIn && checkOut
      ? Math.round((+new Date(checkOut) - +new Date(checkIn)) / 86400000)
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
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <aside className="v-panel">
      <div>
        <p className="eyebrow">Reservation</p>
        <h3>Book your stay</h3>
      </div>

      <div>
        <label className="v-label">Room</label>
        <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.room_type || r.type || 'Standard room'} · ${Number(r.price_per_night)}/night · sleeps {r.capacity}
            </option>
          ))}
        </select>
      </div>

      <div className="v-two">
        <div>
          <label className="v-label">Check-in</label>
          <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div>
          <label className="v-label">Check-out</label>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
      </div>

      <div className="v-two">
        <div>
          <label className="v-label">Rooms</label>
          <input
            type="number"
            min="1"
            value={roomCount}
            onChange={(e) => setRoomCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="v-label">Guests</label>
          <input
            type="number"
            min="1"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </div>
      </div>

      {total > 0 && (
        <div className="v-total">
          <span className="v-muted">{nights} night(s)</span>
          <span>
            Total: <span className="v-gold">${total}</span>
          </span>
        </div>
      )}

      {error && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{error}</p>}

      <button
        className="v-btn v-btn-block"
        onClick={bookAndPay}
        disabled={busy || !checkIn || !checkOut}
      >
        {busy ? 'Please wait…' : user ? 'Book and pay' : 'Log in to book'}
      </button>
    </aside>
  );
}