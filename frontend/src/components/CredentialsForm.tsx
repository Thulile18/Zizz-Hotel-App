import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../api';
import { useAppDispatch } from '../store/hooks';
import { loggedIn } from '../store/authSlice';

type Panel = '' | 'email' | 'password';

export default function CredentialsForm() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState<Panel>('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function toggle(panel: Panel) {
    setOpen(open === panel ? '' : panel);
    setMessage('');
    setError('');
  }

  async function changeEmail(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);
    try {
      const updated = await api<{ id: number; name: string; email: string; role: string }>(
        '/users/me/email',
        'PUT',
        { newEmail, password: emailPassword },
      );
      dispatch(
        loggedIn({
          user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
          token: localStorage.getItem('token') ?? '',
        }),
      );
      setMessage('Your email was changed. Use the new one next time you sign in.');
      setNewEmail('');
      setEmailPassword('');
      setOpen('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api('/users/me/password', 'PUT', { currentPassword, newPassword });
      setMessage('Your password was changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpen('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="v-panel fade-up">
      <div>
        <p className="eyebrow">Sign-in details</p>
        <p className="v-panel-text" style={{ marginTop: 8 }}>
          Typed something wrong, or want to change it? Update your email or password here.
        </p>
      </div>

      {message && <p className="v-msg v-msg-ok" style={{ margin: 0 }}>{message}</p>}
      {error && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{error}</p>}

      <div className="v-btn-row">
        <button className="v-btn v-btn-sm v-btn-outline" onClick={() => toggle('email')}>
          Change email
        </button>
        <button className="v-btn v-btn-sm v-btn-outline" onClick={() => toggle('password')}>
          Change password
        </button>
      </div>

      {open === 'email' && (
        <form className="v-form" onSubmit={changeEmail}>
          <div>
            <label className="v-label">New email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          </div>
          <div>
            <label className="v-label">Current password</label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="v-btn v-btn-block" disabled={busy}>
            {busy ? 'Please wait…' : 'Save new email'}
          </button>
        </form>
      )}

      {open === 'password' && (
        <form className="v-form" onSubmit={changePassword}>
          <div>
            <label className="v-label">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="v-label">New password</label>
            <input
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="v-label">Repeat new password</label>
            <input
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="v-btn v-btn-block" disabled={busy}>
            {busy ? 'Please wait…' : 'Save new password'}
          </button>
        </form>
      )}
    </section>
  );
}
