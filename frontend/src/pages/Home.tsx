import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHotels } from '../store/hotelsSlice';
import HotelCard from '../components/HotelCard';

export default function Home() {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.hotels);

  const [q, setQ] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minStars, setMinStars] = useState(0);

  // Search again whenever a filter changes (after a short pause while typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchHotels({ q, maxPrice, minStars }));
    }, 300);
    return () => clearTimeout(timer);
  }, [q, maxPrice, minStars, dispatch]);

  return (
    <>
      <section className="filters">
        <input
          placeholder="Search by city or hotel name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label>
          Up to ${maxPrice} per night
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </label>
        <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))}>
          <option value="0">Any rating</option>
          <option value="3">3 stars and up</option>
          <option value="4">4 stars and up</option>
          <option value="5">5 stars</option>
        </select>
      </section>

      {loading && <p>Loading hotels...</p>}
      {error && <p>Sorry, we could not load the hotels: {error}</p>}
      {!loading && !error && list.length === 0 && (
        <p>No hotels match your search. Try a wider price range.</p>
      )}

      <div className="grid">
        {list.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </>
  );
}