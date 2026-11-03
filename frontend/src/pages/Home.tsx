import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHotels } from '../store/hotelsSlice';
import DestinationCards from '../components/DestinationCards';
import MoodDiscovery from '../components/MoodDiscovery';
import SurpriseMe from '../components/SurpriseMe';
import hero from '../assets/hero.jpg';

export default function Home() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list, error } = useAppSelector((state) => state.hotels);
  const [q, setQ] = useState('');
  const heroImage = useRef<HTMLImageElement>(null);

  useEffect(() => {
    document.title = 'VELOUR — Luxury Hotels in Cape Town, Paris & Johannesburg';
    dispatch(fetchHotels({ q: '', maxPrice: 1000000, minStars: 0 }));
  }, [dispatch]);

  // A gentle parallax: the hero photo drifts slower than the page. Off for "reduce motion".
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (heroImage.current) {
          heroImage.current.style.transform = `translateY(${Math.min(window.scrollY, 900) * 0.18}px) scale(1.08)`;
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Featured hotels; if none are marked featured yet, show the first six
  const featured = list.filter((h) => h.is_featured);
  const shown = (featured.length > 0 ? featured : list).slice(0, 6);

  return (
    <>
      <section className="v-hero">
        <img ref={heroImage} className="v-hero-img v-parallax" src={hero} alt="VELOUR lounge at night" />
        <div className="veil" />
        <div className="v-hero-content fade-up">
          <p className="eyebrow v-hero-eyebrow">Hotels of quiet distinction</p>
          <h1 className="v-hero-title">
            Where evenings
            <br />
            slow down.
          </h1>
          <form
            className="v-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/hotels?${new URLSearchParams({ q, country: 'All', sort: 'name' })}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Where to? Paris, Tokyo, Cape Town…"
            />
            <button type="submit" className="v-btn v-btn-lg">Search</button>
          </form>
        </div>
      </section>

      <section className="v-section">
        <div className="v-section-head">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="v-h2" style={{ margin: '12px 0 0' }}>Featured addresses</h2>
          </div>
          <Link to="/hotels" className="v-viewall">View all</Link>
        </div>

        {error && <p className="v-error">Sorry, we could not load the hotels: {error}</p>}

        <DestinationCards hotels={shown} />
      </section>

      <MoodDiscovery hotels={list} />
      <SurpriseMe hotels={list} />
    </>
  );
}
