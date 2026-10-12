import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loggedOut } from '../store/authSlice';

export default function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="header">
      <h1 className="logo">Zizz Hotels</h1>
      <nav>
        {user ? (
          <>
            <span className="hello">Hi, {user.name}</span>
            <button onClick={() => dispatch(loggedOut())}>Log out</button>
          </>
        ) : (
          <button className="cta">Log in</button>
        )}
      </nav>
    </header>
  );
}