import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAppSelector } from '../store/hooks';

// The favourites route may send the hotel's id as hotel_id or as id, so accept both
interface SavedHotel {
  hotel_id?: number;
  id?: number;
}

export default function SaveButton({ hotelId }: { hotelId: number }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [saved, setSaved] = useState(false);

  // When the page opens, find out whether this hotel is already saved
  useEffect(() => {
    if (!user) return;
    api<SavedHotel[]>('/favourites')
      .then((list) => {
        setSaved(list.some((h) => (h.hotel_id ?? h.id) === hotelId));
      })
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

  return (
    <button className={`v-save${saved ? ' saved' : ''}`} onClick={toggle}>
      {saved ? '♥ Saved' : '♡ Save hotel'}
    </button>
  );
}