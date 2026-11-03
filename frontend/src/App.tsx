import { Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Hotels from './pages/Hotels';
import Login from './pages/Login';
import HotelPage from './pages/HotelPage';
import BookingConfirmed from './pages/BookingConfirmed';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import AdminHotels from './pages/AdminHotels';
import GitHubCallback from './pages/GitHubCallback';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <div className="v-app">
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/hotels/:id" element={<HotelPage />} />
          <Route path="/booking-confirmed" element={<BookingConfirmed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="*"
            element={
              <div className="v-notfound">
                <h1>404</h1>
                <p className="eyebrow">Page not found</p>
                <Link to="/" className="v-textlink">Go home</Link>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="v-footer">
        <div className="v-footer-inner">
          <span className="v-footer-brand">VELOUR</span>
          <span>
            Hotels in 12 cities worldwide · Prices shown are approximate when not in Rand ·{' '}
            <Link to="/privacy">Privacy policy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}