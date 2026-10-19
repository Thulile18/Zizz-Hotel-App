import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch } from '../store/hooks';
import { loggedIn } from '../store/authSlice';
import type { User } from '../store/authSlice';

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
    <form className="form" onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>

      {mode === 'register' && (
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {mode === 'register' && (
        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree to the <Link to="/privacy">privacy policy</Link>.
          </span>
        </label>
      )}

      {error && <p className="error">{error}</p>}

      <button className="cta" type="submit" disabled={busy || (mode === 'register' && !consent)}>
        {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
      </button>

      <a
        className="github"
        href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&scope=user:email`}
      >
        Sign in with GitHub
      </a>
      <small>
        By signing in with GitHub you agree to our <Link to="/privacy">privacy policy</Link>.
      </small>

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}
      >
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </form>
  );
}