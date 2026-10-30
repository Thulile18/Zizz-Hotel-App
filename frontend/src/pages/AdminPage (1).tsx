import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';
import { useMoney } from '../lib/currency';
import BackButton from '../components/BackButton';
import SuccessBurst from '../components/SuccessBurst';

interface Reservation {
  id: number;
  check_in: string;
  check_out: string;
  rooms_booked: number;
  guests: number;
  total_price: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
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

// "10 Dec, 14:30"
function showTime(value: string) {
  return new Date(value).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// The same date as "2026-12-10", which is what a date box needs
function inputDate(value: string) {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function stayLabel(r: Reservation) {
  if (r.status === 'cancelled') return 'cancelled';
  if (r.status === 'pending') return 'pending';
  if (r.checked_out_at) return 'completed';
  if (r.checked_in_at) return 'in house';
  return 'confirmed';
}

const PROMO_LIMIT = 300;

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const formatPrice = useMoney();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newIn, setNewIn] = useState('');
  const [newOut, setNewOut] = useState('');
  const [filter, setFilter] = useState('all');
  const [promo, setPromo] = useState('');
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState<string | null>(null);

  function load() {
    api<Reservation[]>('/admin/bookings')
      .then(setReservations)
      .catch((err) => setError((err as Error).message));
  }

  // The thank-you pop-up closes by itself after a few seconds
  useEffect(() => {
    if (!thanks) return;
    const id = window.setTimeout(() => setThanks(null), 3500);
    return () => window.clearTimeout(id);
  }, [thanks]);

  // When the page opens: send visitors away, load the table for admins
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve, cancel, move dates, check in or check out
  async function change(id: number, body: object, done?: string) {
    setError('');
    setMessage('');
    try {
      await api(`/admin/bookings/${id}`, 'PATCH', body);
      setEditingId(null);
      setMessage(done ?? `Booking #${id} updated. The guest has been notified.`);
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
    if (!window.confirm(`Send this message to every guest?\n\n“${promo}”`)) return;
    setError('');
    setMessage('');
    setSending(true);
    try {
      const result = await api<{ sent: number }>('/admin/promotions', 'POST', { message: promo });
      setMessage(`Sent to ${result.sent} guest(s). They will see it under Notifications in their account.`);
      setThanks(`Your message is on its way to ${result.sent} guest${result.sent === 1 ? '' : 's'}.`);
      setPromo('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="v-center">
        <div className="v-status-card">
          <h2>Admin</h2>
          <p className="v-status-text">This area is for hotel staff only.</p>
        </div>
      </div>
    );
  }

  const activeBookings = reservations.filter((x) => x.status !== 'cancelled');
  const inHouse = reservations.filter((x) => x.checked_in_at && !x.checked_out_at);
  const revenueTotal = reservations
    .filter((x) => x.status === 'confirmed')
    .reduce((s, x) => s + Number(x.total_price), 0);
  const shownReservations =
    filter === 'all' ? reservations : reservations.filter((x) => x.status === filter);

  return (
    <div className="v-page">
      <BackButton fallback="/" />
      <div className="v-pagehead">
        <div>
          <p className="eyebrow">Staff</p>
          <h1 className="v-title">Dashboard</h1>
        </div>
        <div className="v-row-actions">
          <Link to="/hotels" className="v-textlink">Browse as a guest →</Link>
          <Link to="/admin/hotels" className="v-textlink">Manage hotels &amp; rooms →</Link>
        </div>
      </div>

      <div className="v-stats v-stats-4 fade-up">
        <div className="v-stat">
          <p className="eyebrow">Total bookings</p>
          <p className="v-stat-value">{reservations.length}</p>
        </div>
        <div className="v-stat">
          <p className="eyebrow">Active stays</p>
          <p className="v-stat-value">{activeBookings.length}</p>
        </div>
        <div className="v-stat">
          <p className="eyebrow">In house now</p>
          <p className="v-stat-value">{inHouse.length}</p>
        </div>
        <div className="v-stat">
          <p className="eyebrow">Revenue</p>
          <p className="v-stat-value v-stat-gold">{formatPrice(revenueTotal)}</p>
        </div>
      </div>

      {message && <p className="v-msg v-msg-ok">{message}</p>}
      {error && <p className="v-msg v-msg-err">{error}</p>}

      <div className="v-tabs">
        {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
          <button
            key={f}
            className={`v-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {shownReservations.length === 0 ? (
        <p className="v-muted">No reservations match this filter.</p>
      ) : (
        <div className="v-table-wrap fade-up">
          <table className="v-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Guest</th>
                <th>Hotel &amp; room</th>
                <th>Stay</th>
                <th>Total</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownReservations.map((r) => {
                const label = stayLabel(r);
                return (
                  <tr key={r.id}>
                    <td className="v-muted">#{r.id}</td>
                    <td>
                      <span className="v-cell-main">{r.guest_name}</span>
                      <span className="v-cell-sub">{r.guest_email}</span>
                      <span className="v-cell-sub">{r.guest_phone ?? 'No phone number'}</span>
                    </td>
                    <td>
                      <span className="v-cell-main">{r.hotel}</span>
                      <span className="v-cell-gold">
                        {r.room_type} · {r.rooms_booked} room(s)
                      </span>
                    </td>
                    <td className="v-muted">
                      {showDate(r.check_in)} to {showDate(r.check_out)}
                      {r.checked_in_at && <span className="v-cell-sub">In: {showTime(r.checked_in_at)}</span>}
                      {r.checked_out_at && <span className="v-cell-sub">Out: {showTime(r.checked_out_at)}</span>}
                    </td>
                    <td>{formatPrice(r.total_price)}</td>
                    <td>
                      <span className={`v-status${label === 'cancelled' ? ' v-status-bad' : ''}`}>{label}</span>
                    </td>
                    <td>
                      {editingId === r.id ? (
                        <div className="v-row-actions">
                          <input
                            type="date"
                            className="v-input-sm v-input-date"
                            value={newIn}
                            onChange={(e) => setNewIn(e.target.value)}
                          />
                          <input
                            type="date"
                            className="v-input-sm v-input-date"
                            min={newIn}
                            value={newOut}
                            onChange={(e) => setNewOut(e.target.value)}
                          />
                          <button
                            className="v-btn v-btn-sm"
                            onClick={() => change(r.id, { checkIn: newIn, checkOut: newOut })}
                          >
                            Save
                          </button>
                          <button className="v-btn v-btn-sm v-btn-outline" onClick={() => setEditingId(null)}>
                            Close
                          </button>
                        </div>
                      ) : (
                        <div className="v-row-actions">
                          {r.status === 'confirmed' && !r.checked_in_at && (
                            <button
                              className="v-linkbtn"
                              onClick={() =>
                                change(r.id, { action: 'check_in' }, `Booking #${r.id}: guest checked in.`)
                              }
                            >
                              Check in
                            </button>
                          )}
                          {r.checked_in_at && !r.checked_out_at && (
                            <button
                              className="v-linkbtn"
                              onClick={() =>
                                change(r.id, { action: 'check_out' }, `Booking #${r.id}: guest checked out.`)
                              }
                            >
                              Check out
                            </button>
                          )}
                          {r.status !== 'confirmed' && r.status !== 'cancelled' && (
                            <button className="v-linkbtn" onClick={() => change(r.id, { status: 'confirmed' })}>
                              Approve
                            </button>
                          )}
                          {r.status !== 'cancelled' && !r.checked_in_at && (
                            <button
                              className="v-linkbtn muted danger"
                              onClick={() => change(r.id, { status: 'cancelled' })}
                            >
                              Cancel
                            </button>
                          )}
                          {r.status !== 'cancelled' && !r.checked_out_at && (
                            <button className="v-linkbtn muted" onClick={() => startEditing(r)}>
                              Change dates
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="v-promo">
        <p className="eyebrow" style={{ marginBottom: 16 }}>Message all guests</p>
        <div className="v-panel">
          <div className="v-field">
            <label className="v-label">Your message</label>
            <textarea
              rows={3}
              maxLength={PROMO_LIMIT}
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Spring special: 10% off weekend stays this month!"
            />
            <p className="v-panel-text" style={{ marginTop: 6 }}>
              {promo.length} / {PROMO_LIMIT} · Every guest gets this under Notifications in their account.
            </p>
          </div>
          {promo.trim() && (
            <div className="v-preview">
              <span className="eyebrow">Preview</span>
              <p>{promo}</p>
            </div>
          )}
          <div>
            <button className="v-btn" onClick={sendPromotion} disabled={!promo.trim() || sending}>
              {sending ? 'Sending…' : 'Send to all guests'}
            </button>
          </div>
        </div>
      </div>

      {thanks && <SuccessBurst title="Message sent" text={thanks} onClose={() => setThanks(null)} />}
    </div>
  );
}
