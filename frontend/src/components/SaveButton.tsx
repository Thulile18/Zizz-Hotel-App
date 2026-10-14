import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

interface SavedHotel {
  id: number;
}

export default function SaveButton({ hotelId }: { hotelId: number }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [saved, setSaved] = useState(false);

  // When the page opens, find out whether this hotel is already saved
  useEffect(() => {
    if (!user) return;
    api<SavedHotel[]>('/favourites')
      .then((list) => setSaved(list.some((h) => h.id === hotelId)))
      .catch(() => setSaved(false));
  }, [user, hotelId]);

  async function toggle() {
    if (!user) {
      navigate('/login');
      return;
    }
    await api(`/favourites/${hotelId}`, saved ? 'DELETE' : 'PUT');
    setSaved(!saved);
  }

  return <button onClick={toggle}>{saved ? ':hearts: Saved' : '♡ Save'}</button>;
}