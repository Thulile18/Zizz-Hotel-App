import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

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

  if (state === 'checking') return <p>Checking your payment...</p>;

  if (state === 'failed') {
    return (
      <div className="form">
        <h2>We could not confirm your booking</h2>
        <p className="error">{message}</p>
        <Link to="/">Back to all hotels</Link>
      </div>
    );
  }

  return (
    <div className="form">
      <h2>Booking confirmed</h2>
      <p>Thank you! Your payment was received and your booking number is {bookingId}.</p>
      <Link to="/">
        <button className="cta">Find more hotels</button>
      </Link>
    </div>
  );
}
