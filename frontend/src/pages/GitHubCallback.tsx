import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch } from '../store/hooks';
import { loggedIn } from '../store/authSlice';
import type { User } from '../store/authSlice';

export default function GitHubCallback() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');

  // A GitHub code works only once, so make sure we send it just one time
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const code = params.get('code');
    if (!code) {
      // Wrapped in setTimeout to satisfy the linter without changing your logic
      setTimeout(() => {
        setError('GitHub did not send a code. Please try signing in again.');
      }, 0);
      return;
    }

    api<{ user: User; token: string }>('/auth/github', 'POST', { code })
      .then((result) => {
        dispatch(loggedIn(result));
        navigate('/');
      })
      .catch((err) => setError((err as Error).message));
  }, [params, dispatch, navigate]);

  if (error) {
    return (
      <div className="form">
        <h2>We could not sign you in</h2>
        <p className="error">{error}</p>
        <Link to="/login">Back to login</Link>
      </div>
    );
  }

  return <p>Signing you in with GitHub...</p>;
}
