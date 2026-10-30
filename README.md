# Zizz Hotels

A hotel booking web app. Guests can search hotels, view photos, a map, prices, facilities and policies, save favourites, book rooms and pay, leave reviews and manage their profile. Admins manage hotels, rooms and reservations.

**Stack:** React + TypeScript + Redux (frontend), Node.js + Express + TypeScript (backend), PostgreSQL (database), Stripe (payments), GitHub OAuth (sign-in), GitHub Actions (CI/CD).

## Project structure

```
database/schema.sql        the 8 tables, relationships, indexes
backend/src
  config/                  settings (env.ts) and database connection (db.ts)
  routes/                  the URLs
  middleware/              login and admin guards
  controllers/             take the request, send the answer
  services/                the rules (checks, prices, availability)
  modals/                  database queries
  tests/                   automated tests
frontend/src
  pages/                   Home, HotelPage, Login, Profile, Admin, Privacy ...
  components/              Header, HotelCard, BookingPanel, ReviewForm ...
  store/                   Redux (auth and hotels)
.github/workflows          CI and CD pipelines
```

A request travels: route -> middleware -> controller -> service -> modal -> database.

## Run it on your computer

You need Node.js 20+, PostgreSQL, a Stripe test account and a GitHub OAuth app.


1. Create a database called `hotels` and run `database/schema.sql` in it..
2. Backend: in `backend`, create a `.env` file with these settings, then run `npm install` and `npm run dev` (port 3000):.
   `PORT`, `CLIENT_URL` (http://localhost:5173), `DATABASE_URL`, `JWT_SECRET` (at least 32 random characters), `STRIPE_SECRET_KEY` (a test key), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

1. Frontend: in `frontend`, create a `.env` file with `VITE_GITHUB_CLIENT_ID`, then run `npm install` and `npm run dev` (port 5173)..
2. GitHub OAuth app callback URL: `http://localhost:5173/auth/github/callback`..
3. First admin: register, then run `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';` and log in again..

Test payments with the Stripe test card `4242 4242 4242 4242`, any future date, any CVC.

## API

| Method and path | Who |
|---|---|
| POST /api/auth/register, /login, /github | Anyone |
| GET /api/hotels, /api/hotels/:id | Anyone |
| POST, PUT, DELETE /api/hotels, PUT /api/hotels/rooms/:id | Admin |
| POST, GET /api/bookings, POST /api/bookings/:id/confirm, DELETE /api/bookings/:id | Guest |
| GET, PUT /api/users/me, GET /api/users/me/export, DELETE /api/users/me | Guest |
| GET /api/favourites, PUT, DELETE /api/favourites/:hotelId | Guest |
| PUT /api/reviews/:hotelId (needs a confirmed booking at that hotel) | Guest |
| GET /api/notifications | Guest |
| GET /api/admin/bookings, PATCH /api/admin/bookings/:id, POST /api/admin/promotions | Admin |

## Security


• Passwords are hashed with bcrypt; login uses signed tokens that expire after 7 days..
• Every protected route checks the token; admin routes also check the admin role..
• All database queries use placeholders (no SQL injection). All input is validated with zod..
• Prices and availability are worked out on the server, never trusted from the browser..
• Card details go straight to Stripe and are never stored..
• Helmet headers, CORS limited to the frontend, request size limit, rate limits (20 login attempts per 15 minutes), compression, and plain error messages..
• Secrets live in `.env` files, which are ignored by Git..

## Privacy (POPIA)

Privacy policy page, consent tick box at sign-up (time saved), "Download my data" (JSON file) and "Delete my account" (personal details erased; booking records kept without personal details).

## Performance and scaling

Database indexes, paged search results, response compression, a limited database connection pool, lazy-loaded photos. The backend keeps no visitor data in memory (login proof is in the token), so several copies can run behind a load balancer.

## Tests and CI/CD

`npm test` in `backend` runs the guard tests. GitHub Actions runs the type check, tests, lint and build on every push and pull request (`ci.yml`), and packages the website when `main` changes (`cd.yml`).

## Known limitations


• Not deployed: the pipeline stops at "package the website". Deploying needs a hosting account and secrets..
• Sign-in uses GitHub OAuth (Google can be added the same way)..
• Payment is confirmed by asking Stripe when the guest returns; a Stripe webhook would be the next improvement..
• Reviews require a confirmed booking but do not yet check that the stay is over..
• Notifications are shown in the app only (no email or push)..
• Rate limits are counted in server memory, so they reset when the server restarts..
- Offers are displayed, but the discount is not yet applied to the Stripe price.
- Changing an email or password does not sign out other devices, and emails are not verified.
- The currency switcher uses fixed approximate rates. All payments are charged in rand (ZAR).
- Place search uses OpenStreetMap's free service, which is meant for light use.