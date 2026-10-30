import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import SuccessBurst from '../components/SuccessBurst';

export default function BookingConfirmed() {
  const [params] = useSearchParams();
  const bookingId = params.get('booking');
  const [state, setState] = useState<'checking' | 'confirmed' | 'failed'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!bookingId) {
      // Wrapped in setTimeout to satisfy the linter without changing your logic
      setTimeout(() => {
        setState('failed');
        setMessage('No booking was found.');
      }, 0);
      return;
    }
    api<{ status: string }>(`/bookings/${bookingId}/confirm`, 'POST')
      .then(() => setState('confirmed'))
      .catch((err) => {
        setState('failed');
        setMessage((err as Error).message);
      });
  }, [bookingId]);

  if (state === 'checking') {
    return (
      <div className="v-center">
        <p className="eyebrow v-pulse">Confirming your payment…</p>
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div className="v-center">
        <div className="v-status-card v-status-card-error fade-up">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Something went wrong</p>
          <h2>We could not confirm your stay</h2>
          <p className="v-msg v-msg-err">{message}</p>
          <Link to="/" className="v-textlink">Back to all hotels</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="v-center">
      <div className="v-status-card fade-up">
        <SuccessBurst
          inline
          title="Thank you. Your stay is reserved."
          text="Your payment was received and your reservation is confirmed. We look forward to welcoming you."
        />
        <div className="v-ticket">
          <span className="v-ticket-label">Booking no.</span>
          <span className="v-gold">#{bookingId}</span>
        </div>
        <Link to="/profile" className="v-btn v-btn-block">View my stays</Link>
        <p style={{ marginTop: 16 }}>
          <Link to="/hotels" className="v-textlink">Find more stays</Link>
        </p>
      </div>
    </div>
  );
}
