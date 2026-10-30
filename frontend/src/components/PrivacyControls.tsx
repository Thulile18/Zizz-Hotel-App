import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppDispatch } from '../store/hooks';
import { loggedOut } from '../store/authSlice';

export default function PrivacyControls() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Save everything we hold about the user as a file
  async function download() {
    setError('');
    try {
      const data = await api<object>('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-zizz-hotels-data.json';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Your data was downloaded.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteAccount() {
    const sure = window.confirm(
      'Delete your account? Your personal details will be erased and you will be logged out. This cannot be undone.'
    );
    if (!sure) return;
    setError('');
    try {
      await api('/users/me', 'DELETE');
      dispatch(loggedOut());
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="v-panel fade-up">
      <div>
        <p className="eyebrow">Your rights</p>
        <h3>Your data and privacy</h3>
      </div>

      <p className="v-panel-text">
        You can download a copy of the personal information we hold about you, or permanently
        delete your account.
      </p>

      {message && <p className="v-msg v-msg-ok" style={{ margin: 0 }}>{message}</p>}
      {error && <p className="v-msg v-msg-err" style={{ margin: 0 }}>{error}</p>}

      <div className="v-btn-row">
        <button className="v-btn v-btn-sm v-btn-outline" onClick={download}>
          Download my data
        </button>
        <button className="v-btn v-btn-sm v-btn-outline" onClick={deleteAccount}>
          Delete my account
        </button>
      </div>
    </section>
  );
}