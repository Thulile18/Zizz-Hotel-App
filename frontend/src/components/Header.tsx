import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loggedOut } from '../store/authSlice';

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="header">
      <Link to="/" className="logo-link">
        <h1 className="logo">Zizz Hotels</h1>
      </Link>
      <nav>
        {user ? (
          <>
            <span className="hello">Hi, {user.name}</span>
            <button onClick={() => dispatch(loggedOut())}>Log out</button>
          </>
        ) : (
          <button className="cta" onClick={() => navigate('/login')}>
            Log in
          </button>
        )}
      </nav>
    </header>
  );
}