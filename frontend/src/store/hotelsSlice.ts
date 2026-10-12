import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api';

// What the backend sends for each hotel in the list
export interface Hotel {
  id: number;
  name: string;
  city: string;
  address: string;
  stars: number;
  from_price: string;
  cover: string | null;
  rating: string | null;
}

export interface Filters {
  q: string;
  maxPrice: number;
  minStars: number;
}

// Asks the backend for the hotels that match the search
export const fetchHotels = createAsyncThunk('hotels/fetch', (filters: Filters) => {
  const query = new URLSearchParams({
    q: filters.q,
    maxPrice: String(filters.maxPrice),
    minStars: String(filters.minStars),
  });
  return api<Hotel[]>(`/hotels?${query}`);
});

interface HotelsState {
  list: Hotel[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelsState = { list: [], loading: false, error: null };

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading = false;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Could not load hotels';
      });
  },
});

export default hotelsSlice.reducer;