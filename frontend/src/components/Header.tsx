import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loggedOut } from '../store/authSlice';
import { CURRENCIES, setCurrency, useCurrency } from '../lib/currency';
import type { Currency } from '../lib/currency';

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const currency = useCurrency();

  function signOut() {
    dispatch(loggedOut());
    navigate('/login', { replace: true });
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => `v-link${isActive ? ' active' : ''}`;

  return (
    <header className="v-header">
      <div className="v-header-inner">
        <Link to="/" className="v-brand">VELOUR</Link>

        <nav className="v-nav">
          <NavLink to="/hotels" className={linkClass}>Hotels</NavLink>

          {user ? (
            <>
              <Link to="/profile" className="v-link">My stays</Link>
              <Link to="/profile" className="v-link">Account</Link>
              {user.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
              <button className="v-textbtn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="v-link">Sign in</Link>
          )}

          <select
            className="v-currency"
            aria-label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>
                {code} — {c.label}
              </option>
            ))}
          </select>
        </nav>
      </div>
    </header>
  );
}