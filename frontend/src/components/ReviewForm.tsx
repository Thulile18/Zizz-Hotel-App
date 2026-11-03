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
      setComment('');
      onPosted(); // refresh the reviews list
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="v-panel fade-up" style={{ maxWidth: '36rem' }}>
      <p className="eyebrow">Leave a review</p>

      <div>
        <label className="v-label">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="v-label">Your comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your stay?"
          rows={4}
        />
      </div>

      {message && <p className="v-msg v-msg-ok" style={{ margin: 0 }}>{message}</p>}
      {error && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{error}</p>}

      <button className="v-btn v-btn-block" onClick={post}>
        {user ? 'Post review' : 'Log in to review'}
      </button>
    </div>
  );
}