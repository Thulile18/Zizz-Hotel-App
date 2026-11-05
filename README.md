# Velour

A hotel booking web app. Guests can search stays, look at photos, a map, prices, facilities and policies, save favourites, book rooms and pay, leave reviews and manage their profile. Admins manage hotels, rooms and reservations.

The project has three parts: a React frontend, a Node.js (Express, TypeScript) backend, and a PostgreSQL database.

Detailed documentation: [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## What guests can do

- Register and log in with email and password, or with GitHub (OAuth).
- Browse and search stays by name, city, region or country, and filter by price, stars, type and mood.
- Sort by distance from their location or from any place they type ("Near me", "Find nearby").
- Open a stay: photo gallery, map, price per room type, address, stars, facilities, policies and reviews.
- Share a stay and save it to favourites.
- Book one or more rooms for chosen dates and number of guests, then pay with Stripe.
- See their bookings, cancel them, edit their profile, change their email or password, see notifications.
- Leave one review per stay (only after their stay is complete).
- Download their data and delete their account.

## What admins can do

- Log in and open the admin panel (only users with the admin role).
- See every reservation with guest name, email, phone, hotel, room, dates and status.
- See dashboard figures: total bookings, active stays, guests in the hotel now and confirmed revenue.
- Check guests in and out.
- Approve, cancel or move the dates of a reservation. The guest gets a notification.
- Add hotels (with photos and a first room type), edit hotel details, replace photos, add room types, change room price and availability, delete hotels that have no bookings.
- Send a promotion message to all guests.
- Create and delete promotional offers through the API.

## Live version

- Website: https://zizz-hotel-frontend-app.vercel.app
- API health check: https://my-hotel-backend-76s2.onrender.com/api/health

Both run on free plans, so the first visit after a quiet period can be slow while the backend wakes up. Payments use Stripe test mode only.

## How it meets the brief

| Brief requirement | How it is done |
|---|---|
| Register and log in with OAuth | Email and password, plus GitHub OAuth (`POST /api/auth/github`). The backend swaps the code for a token with GitHub and only accepts a verified email. |
| Accommodation list with gallery, map, price, address, stars, facilities, policies, call to action | Hotels page and hotel page. The map is a Google Maps embed built from the hotel's coordinates (or its address), with buttons for directions in Google Maps and Waze. |
| Share button, favourites button | Share uses the phone share sheet or copies the link. Favourites are saved per user in the `favourites` table. |
| Booking with dates, rooms, guests | Booking panel. The server checks capacity and availability and works out the price. |
| Payment gateway | Stripe Checkout (test mode). Card details never reach our server. |
| User profile | Edit name and phone, change email and password, bookings, favourites, notifications. |
| Admin panel | `/admin` (reservations, promotions) and `/admin/hotels` (hotels, rooms, photos). |
| Node and TypeScript backend with API standards | Express with TypeScript, REST routes, proper HTTP methods and status codes, one JSON error format. |
| PostgreSQL with related tables | 9 tables linked by foreign keys, see "Database". |
| Redux | Redux Toolkit slices for login state and the hotel list. |
| Search with filters | Name, city, region, country, price, stars, type, mood, distance. |
| Reviews and ratings | One review per user per stay, stars 1 to 5, comment, only for guests whose stay is complete (checked out by staff, or the check-out date has passed). |
| Notifications | Created for confirmed and cancelled bookings, admin changes and promotions. Shown in the profile. |
| Security | See "Security". |
| Scalability and performance | See "Performance". |
| Compliance | POPIA: privacy policy, consent at sign-up, download my data, delete my account. |
| Responsive design | The pages use responsive grids and small-screen styles. |

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React, TypeScript, Vite, Redux Toolkit, React Router |
| Backend | Node.js, Express, TypeScript, zod, bcrypt, jsonwebtoken, helmet, express-rate-limit, compression |
| Database | PostgreSQL (`pg` driver) |
| Payments | Stripe Checkout (test mode) |
| Sign-in | Email and password, GitHub OAuth |
| Maps | Google Maps embed on hotel pages, OpenStreetMap Nominatim for place search |
| Hosting | Render (backend and PostgreSQL), Vercel (frontend) |
| Tests and CI | Node test runner, GitHub Actions |

## How a request travels

```
Browser (React + Redux)
   -> route         which URL
   -> middleware    is the user logged in, is the user an admin
   -> controller    reads the request, sends the answer
   -> service       the rules (validation, prices, availability)
   -> modal         the SQL queries
   -> PostgreSQL
```

## Project structure

```
database/        schema.sql (tables and indexes), seed.sql and upgrade.sql (sample data and updates)
backend/src
  config/        env.ts (settings), db.ts (database connection)
  routes/        the URLs
  middleware/    auth.ts (login and admin guards)
  controllers/   handle each request
  services/      business rules
  modals/        database queries
  tests/         automated tests
  server.ts      imports, configuration, middleware, endpoints
frontend/src
  pages/         one file per screen
  components/    reusable pieces
  store/         Redux
  lib/           currency, geo and mood helpers
  api.ts         one helper for every request to the backend
.github/workflows   ci.yml and cd.yml
```

## Run it on your computer

You need Node.js 20 or newer, PostgreSQL, a Stripe test account and a GitHub OAuth app.

1. Create an empty database called `hotels`. Then, in `backend`, run `npm run db:setup` to create the tables from `database/schema.sql`, and `npm run db:setup -- seed.sql` if you want the sample hotels.
2. Backend: in `backend`, create a `.env` file (see "Environment variables"), then run `npm install` and `npm run dev`. It listens on port 3000 and restarts when you save a file. Restart it yourself after changing `.env`.
3. Frontend: in `frontend`, create a `.env` file with `VITE_GITHUB_CLIENT_ID`, then run `npm install` and `npm run dev`. It runs on port 5173.
4. GitHub OAuth app: set the callback URL to `http://localhost:5173/auth/github/callback`.
5. First admin: register, then run `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';` and log in again. The role is stored in the login token, so you must log in again.
6. Test payments: card `4242 4242 4242 4242`, any future date, any CVC.

## Environment variables

Names only. Real values live in `.env` files, which Git ignores.

| File | Variables |
|---|---|
| `backend/.env` | `PORT`, `CLIENT_URL`, `DATABASE_URL`, `JWT_SECRET` (32 or more random characters), `STRIPE_SECRET_KEY` (a test key), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `DATABASE_SSL` (`true` on a hosted database such as Render, left out locally) |
| `frontend/.env` | `VITE_GITHUB_CLIENT_ID`, `VITE_API_URL` (the backend address ending in `/api`; not needed locally) |

## Database

Nine tables: `users`, `hotels`, `hotel_images`, `rooms`, `bookings`, `favourites`, `reviews`, `notifications`, `offers`.

- A hotel has many images and many rooms. A booking belongs to one user and one room, so hotel details are never copied into bookings.
- `favourites` uses both ids as its key, so a stay can be saved only once. `reviews` is unique per user and hotel.
- Checks in the database: stars 1 to 5, ratings 1 to 5, check-out after check-in, booking status limited to pending, confirmed or cancelled, role limited to user or admin.
- Deleting a hotel removes its images and rooms. A hotel with bookings cannot be deleted.
- Indexes cover city, room price, booking dates, user, reviews, notifications, hotel slug and offers.

## API

33 endpoints. The full table, with who may call each one, is in [backend/README.md](backend/README.md).

## Security

- Passwords are hashed with bcrypt. Login uses signed tokens that expire after 7 days.
- Every protected route checks the token. Admin routes also check the admin role.
- Every database query uses placeholders (no SQL injection). All input is checked with zod.
- Prices, totals and availability are worked out on the server, never trusted from the browser.
- Card details go straight to Stripe. After payment, the server asks Stripe whether the session was paid before confirming a booking.
- Review rule: only guests who completed a confirmed stay (checked out by staff, or the check-out date has passed) can review it.
- Account changes (email, password) need the current password. GitHub accounts have no password, so they are refused.
- Helmet security headers, CORS limited to the frontend address, 50 KB request size limit, plain error messages.
- Rate limits: 20 login attempts per 15 minutes, 10 email or password changes per 15 minutes, 300 requests per minute overall.
- The server refuses to start without `JWT_SECRET`.
- Secrets are kept in `.env` files and are never committed.

Data in transit: the live site is served over HTTPS by Vercel (frontend) and Render (backend). Locally it uses `http://localhost`. The backend connects to the hosted database with SSL, which encrypts the connection but does not check the server's certificate.

## Privacy and compliance (POPIA)

- A privacy policy page, linked in the footer, says what is collected, why, who else receives it and what your rights are.
- Hotel maps load from Google Maps, and typed place searches go to OpenStreetMap. The privacy page says so.
- A consent tick box at sign-up. The time of consent is saved in `users.consented_at`. GitHub sign-ins are also recorded as consented.
- "Download my data" returns a JSON file with the profile, bookings, favourites, reviews and notifications.
- "Delete my account" erases name, email, phone and password, deletes favourites and notifications, and shows "Deleted guest" on old reviews. Booking records stay without personal details, because payment records must be kept. Admin accounts cannot delete themselves.

## Performance and scalability

- Database indexes on the columns used for searching and for checking availability.
- Hotel results are paged, and the database connection pool is limited to 10 connections.
- Responses are compressed. Photos below the screen load only when scrolled to.
- The backend keeps no visitor data in memory (login proof is in the token), so several copies could run behind a load balancer.

## Testing and CI/CD

- `npm test` in `backend` runs 5 tests for the login and admin guards.
- GitHub Actions runs on every push and pull request (`ci.yml`): backend type check and tests, frontend lint and build.
- `cd.yml` runs when `main` changes. It builds the website and keeps it as a downloadable file. The live site was set up by hand on Render and Vercel, not by this pipeline.

## Git workflow

- One branch for each piece of work, always started from `dev`. Pull requests merge into `dev`. When everything was finished, `dev` was merged into `main` with a pull request.
- Branches: `feature/backend-structure`, `feature/database-schema`, `feature/fix-schema-file`, `feature/auth`, `feature/hotels-api`, `feature/frontend-home`, `feature/frontend-pages`, `feature/bookings-payments`, `feature/user-feature`, `feature/admin-panel`, `feature/github-oauth`, `feature/security-compliance`, `feature/admin-rooms-photos`, `feature/credentials`, `feature/ui-redesign-and-extras`.

## Development log

1. Backend folders, `.env` settings and `server.ts` in a fixed order (imports, configuration, middleware, endpoints).
2. Database: eight tables, later extended to nine.
3. Register, login and the login and admin guards.
4. Hotels API: read, create, update, delete, with search and filters.
5. Frontend set-up, Redux store, Header, hotel cards and search page.
6. Routing, login page and hotel details page.
7. Bookings with an availability check and Stripe payment.
8. Profile, favourites, reviews and notifications.
9. Admin panel: reservations, hotels, rooms, promotions.
10. GitHub OAuth.
11. Security, privacy features, tests and the CI/CD pipeline.
12. Admin photo replacement and extra room types.
13. New design, extra pages (mood discovery, nearby stays, currency display, surprise me), offers API, email and password change.
14. Deployment: PostgreSQL and the backend on Render, the frontend on Vercel.

## What is not built

These were considered and left out:

- No virtual tours or 360 views.
- No local guides, dining or events. "Stay nearby" shows other stays, not attractions.
- The map shows the hotel's location. It is not a map of the hotel's facilities.
- No property management system sync, housekeeping tasks, or revenue and occupancy reports.
- Only two roles exist: guest and admin. There is no front-desk role.
- No filter for cancellation terms, and no non-refundable rates.

## Known limitations

- The live site runs on free plans. The backend sleeps when idle, so the first request after a quiet period can take up to a minute.
- Cancelling a booking changes its status. It does not refund the payment through Stripe.
- Guests can cancel but not edit their own bookings. Only admins can change dates.
- Offers can be created and listed through the API, but the discount is not applied to the Stripe price.
- Payment is confirmed by asking Stripe when the guest returns. A Stripe webhook would be more robust.
- The currency switcher shows fixed approximate rates. All payments are charged in rand (ZAR).
- Notifications appear in the app only. There are no emails or push messages.
- Photos are web links, not uploads.
- Changing a password does not sign out other devices, and new email addresses are not verified.
- Rate limits are counted in memory, so they reset when the server restarts.
- Place search uses OpenStreetMap's free service, which is meant for light use.
- Tests cover the login and admin guards only.
- Availability is checked and the booking is saved in two separate steps, so two guests booking the last room at the very same moment could both succeed.
- If a payment attempt fails or is abandoned, the booking stays in the list as "Awaiting payment" until the guest or an admin cancels it. It stops blocking the rooms after 30 minutes.

## Demo order

1. Search the home or hotels page, use a filter, then "Near me".
2. Open a stay: gallery, map, rooms, facilities, share, save.
3. Log out and try to book: you are sent to log in.
4. Log in, book, and pay with the Stripe test card. Check Profile.
5. Profile: download data, change name.
6. Open `/admin` as a normal guest: refused. Open it as an admin: reservations, change dates, send a promotion.
7. GitHub: pull requests, branches and the Actions tab.