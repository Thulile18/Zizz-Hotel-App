import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import hotelsReducer from './hotelsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;