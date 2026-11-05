# Zizz Hotels: frontend

React and TypeScript single-page app, built with Vite. It uses Redux Toolkit for shared state and React Router for pages. All data comes from the backend API.

## Run it

```
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # type check and production build into dist/
```

`frontend/.env`:

```
VITE_GITHUB_CLIENT_ID=<client id of your GitHub OAuth app>
VITE_API_URL=<backend address ending in /api, only needed when deployed>
```

The backend address is read once in `src/api.ts` from `VITE_API_URL`. When that is not set it uses `http://localhost:3000/api`, so the backend must be running on your computer. Vite reads `.env` when it starts and when it builds, so restart `npm run dev` (or redeploy) after changing it.

## Folders

| Folder | What is in it |
|---|---|
| `src/pages/` | One file per screen: Home, Hotels, HotelPage, Login, GitHubCallback, BookingConfirmed, Profile, AdminPage, AdminHotels, Privacy |
| `src/components/` | Reusable pieces: Header, HotelCard, SaveButton, CredentialsForm, PrivacyControls, NearbyStays, MoodDiscovery, DestinationCards, SurpriseMe, Lightbox, Photo, BackButton, SuccessBurst. The booking panel and the review form are part of `HotelPage.tsx`. |
| `src/store/` | Redux: `store.ts`, `authSlice.ts`, `hotelsSlice.ts`, `hooks.ts` |
| `src/lib/` | `currency.ts` (display currency), `geo.ts` (distances, place search), `moods.ts` (mood filters) |
| `src/api.ts` | One helper for every request to the backend |
| `src/velour.css`, `src/index.css` | Styles |

## State (Redux)

- `authSlice` holds the logged-in user. The token and user are also saved in the browser's storage, so a page reload keeps you logged in. Signing out removes both.
- `hotelsSlice` holds the list of hotels from `GET /api/hotels`, with loading and error states.
- The display currency is handled in `lib/currency.ts`.

## How pages talk to the backend

Every request goes through `api()` in `src/api.ts`. It adds the login token, turns error answers into readable messages and handles empty answers (204). Pages show those messages in red.

## Protected pages

Profile redirects to the login page when nobody is logged in. Admin pages show a staff-only message to guests. This is only for a tidy screen. The backend refuses the same requests on its own, so hiding a button does not protect any data.

## Payments and sign-in

- Booking sends the guest to Stripe's payment page. After paying, Stripe returns them to `/booking-confirmed`, which asks the backend to confirm the payment.
- "Sign in with GitHub" sends the guest to GitHub, which shows its account chooser each time. GitHub then returns them to `/auth/github/callback` with a one-time code that the page passes to the backend.

## Maps and location

- A hotel page shows a Google Maps embed built from the hotel's coordinates (or its address), with buttons for directions from the visitor's location (Google Maps) and for Waze.
- "Near me" uses the browser's location, which is asked for permission and stays in the browser. "Find nearby" looks up a typed place with OpenStreetMap's free search.

## Currency

Prices are stored in rand. The currency switcher converts them for display with approximate rates. Payments are always charged in rand.

## Deploying on Vercel

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment | `VITE_API_URL` and `VITE_GITHUB_CLIENT_ID` |

`vercel.json` sends every address to `index.html`, so refreshing a page, and coming back from Stripe or GitHub, does not give a 404. `VITE_` values are built into the site, so redeploy after changing them.

## Not done

No offline mode, no automated frontend tests, photos are links rather than uploads.