import { Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
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
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="/hotels/:id" element={<HotelPage />} />
          <Route path="/booking-confirmed" element={<BookingConfirmed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/hotels" element={<AdminHotels />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        <Link to="/privacy">Privacy policy</Link>
      </footer>
    </>
  );
}