import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';


interface Reservation {
  id: number;
  check_in: string;
  check_out: string;
  rooms_booked: number;
  guests: number;
  total_price: string;
  status: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  hotel: string;
  room_type: string;
}

// "2026-12-09T22:00:00.000Z" becomes "10 Dec 2026" in the visitor's own time zone
function showDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

// The same date as "2026-12-10", which is what a date box needs
function inputDate(value: string) {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newIn, setNewIn] = useState('');
  const [newOut, setNewOut] = useState('');

  const [promo, setPromo] = useState('');

  function load() {
    api<Reservation[]>('/admin/bookings')
      .then(setReservations)
      .catch((err) => setError((err as Error).message));
  }

  // When the page opens: send visitors away, load the table for admins
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve, cancel or move a reservation
  async function change(id: number, body: object) {
    setError('');
    setMessage('');
    try {
      await api(`/admin/bookings/${id}`, 'PATCH', body);
      setEditingId(null);
      setMessage(`Booking #${id} updated. The guest has been notified.`);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startEditing(r: Reservation) {
    setEditingId(r.id);
    setNewIn(inputDate(r.check_in));
    setNewOut(inputDate(r.check_out));
  }

  async function sendPromotion() {
    setError('');
    setMessage('');
    try {
      const result = await api<{ sent: number }>('/admin/promotions', 'POST', { message: promo });
      setMessage(`Promotion sent to ${result.sent} guest(s).`);
      setPromo('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user) return null;
  if (!isAdmin) return <p>Sorry, this page is for admins only.</p>;

  return (
    <div className="stack">
      <h2>Admin panel</h2>
      <Link to="/admin/hotels">Manage hotels →</Link>
      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}

      <h3>Reservations</h3>
      {reservations.length === 0 && <p>No reservations yet.</p>}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Guest</th>
              <th>Hotel and room</th>
              <th>Dates</th>
              <th>Rooms and guests</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>
                  {r.guest_name}
                  <br />
                  {r.guest_email}
                  <br />
                  {r.guest_phone ?? 'No phone'}
                </td>
                <td>
                  {r.hotel}
                  <br />
                  {r.room_type}
                </td>
                <td>
                  {showDate(r.check_in)} to {showDate(r.check_out)}
                </td>
                <td>
                  {r.rooms_booked} room(s), {r.guests} guest(s)
                </td>
                <td>${Number(r.total_price)}</td>
                <td>
                  <b>{r.status}</b>
                </td>
                <td>
                  {editingId === r.id ? (
                    <div className="actions">
                      <input type="date" value={newIn} onChange={(e) => setNewIn(e.target.value)} />
                      <input type="date" min={newIn} value={newOut} onChange={(e) => setNewOut(e.target.value)} />
                      <button className="cta" onClick={() => change(r.id, { checkIn: newIn, checkOut: newOut })}>
                        Save dates
                      </button>
                      <button onClick={() => setEditingId(null)}>Close</button>
                    </div>
                  ) : (
                    <div className="actions">
                      {r.status !== 'confirmed' && (
                        <button className="cta" onClick={() => change(r.id, { status: 'confirmed' })}>
                          Approve
                        </button>
                      )}
                      {r.status !== 'cancelled' && (
                        <button onClick={() => change(r.id, { status: 'cancelled' })}>Cancel</button>
                      )}
                      {r.status !== 'cancelled' && <button onClick={() => startEditing(r)}>Change dates</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Send a promotion</h3>
      <div className="panel">
        <label>
          Message for all guests
          <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Spring special: 10% off!" />
        </label>
        <button className="cta" onClick={sendPromotion} disabled={!promo}>
          Send to all guests
        </button>
      </div>
    </div>
  );
}