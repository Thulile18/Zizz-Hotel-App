import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

export default function ReviewForm({ hotelId, onPosted }: { hotelId: number; onPosted: () => void }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function post() {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setMessage('');
    try {
      await api(`/reviews/${hotelId}`, 'PUT', { rating, comment });
      setMessage('Thank you for your review!');
      onPosted(); // refresh the reviews list
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="panel">
      <h4>Leave a review</h4>
      <label>
        Rating
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        Your comment
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your stay?" />
      </label>
      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
      <button className="cta" onClick={post}>
        {user ? 'Post review' : 'Log in to review'}
      </button>
    </div>
  );
}