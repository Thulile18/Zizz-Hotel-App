import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch } from '../store/hooks';
import { loggedIn } from '../store/authSlice';
import type { User } from '../store/authSlice';
import BackButton from '../components/BackButton';
import hero from '../assets/hero.jpg';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body =
        mode === 'login' ? { email, password } : { name, email, password, consent };
      const result = await api<{ user: User; token: string }>(`/auth/${mode}`, 'POST', body);
      dispatch(loggedIn(result));
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v-auth v-auth-split">
      <div className="v-auth-art" aria-hidden="true">
        <img src={hero} alt="" />
        <div className="veil" />
        <div className="v-auth-quote">
          <p className="eyebrow">VELOUR</p>
          <p className="v-auth-big">Where evenings slow down.</p>
          <p className="v-muted">Save your favourite stays, manage your bookings and review your stays in one place.</p>
        </div>
      </div>

      <div className="v-auth-panel">
      <div className="v-auth-card fade-up">
        <BackButton fallback="/" />
        <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join VELOUR'}</p>
        <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>

        <a
          className="v-btn v-btn-outline v-btn-block"
          href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&scope=user:email`}
        >
          Continue with GitHub
        </a>

        <div className="v-divider">or</div>

        <form onSubmit={handleSubmit} className="v-form">
          {mode === 'register' && (
            <div>
              <label className="v-label">Name</label>
              <input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="v-label">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="v-label">Password</label>
            <input
              type="password"
              placeholder="Password (at least 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="v-check">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label htmlFor="consent">
                I agree to the <Link to="/privacy">privacy policy</Link>.
              </label>
            </div>
          )}

          {error && <p className="v-error">{error}</p>}

          <button
            type="submit"
            className="v-btn v-btn-block"
            disabled={busy || (mode === 'register' && !consent)}
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="v-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>

        <p className="v-small">
          By signing in with GitHub you agree to our <Link to="/privacy">privacy policy</Link>.
        </p>
      </div>
      </div>
    </div>
  );
}
