import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
}

// When the page reloads, remember who was logged in
const saved = localStorage.getItem('user');
const initialState: AuthState = { user: saved ? JSON.parse(saved) : null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedIn(state, action: PayloadAction<{ user: User; token: string }>) {
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      state.user = action.payload.user;
    },
    loggedOut(state) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
    },
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export default authSlice.reducer;