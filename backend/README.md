# Velour: backend

Node.js, Express and TypeScript API for the hotel booking app. It talks to PostgreSQL, Stripe and GitHub.

## Run it

```
cd backend
npm install
npm run dev        # http://localhost:3000, restarts when you save a file
npm test           # 5 tests for the login and admin guards
npx tsc --noEmit   # type check, prints nothing when it is clean
npm run build      # compiles to the dist folder
npm start          # runs the compiled server (what Render uses)
npm run db:setup   # runs database/schema.sql (add -- seed.sql for the sample hotels)
```

You need an empty PostgreSQL database. Create the tables with `npm run db:setup`.

`backend/.env` (names only):

```
PORT, CLIENT_URL, DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, DATABASE_SSL
```

`JWT_SECRET` must be set and should be 32 or more random characters. The server stops at start-up if it is missing.

## Folders

| Folder | Job |
|---|---|
| `routes/` | Lists the URLs and the guards in front of each one |
| `middleware/auth.ts` | `requireLogin` checks the token, `requireAdmin` checks the role |
| `controllers/` | Reads the request and sends the answer with the right status code |
| `services/` | The rules: validation with zod, prices, availability, who may do what |
| `modals/` | The SQL queries (the only place that talks to the database) |
| `config/` | `env.ts` reads settings, `db.ts` holds the connection pool (10 connections) |
| `tests/` | Automated tests |

`server.ts` is written in a fixed order: imports, configuration, middleware (`app.use`), endpoints.

## Endpoints

"Guest" means any logged-in user. "Admin" means a logged-in user with the admin role. A request without a valid token gets 401, and a guest on an admin route gets 403.

| Method and path | Who | What it does |
|---|---|---|
| POST `/api/auth/register` | Anyone | Create an account (needs `consent: true`) |
| POST `/api/auth/login` | Anyone | Log in, returns user and token |
| POST `/api/auth/github` | Anyone | Log in with a GitHub code |
| GET `/api/hotels` | Anyone | List and search (`q`, `maxPrice`, `minStars`, `page`) |
| GET `/api/hotels/:id` | Anyone | One hotel with photos, rooms and reviews |
| POST `/api/hotels` | Admin | Add a hotel with photos and rooms |
| PUT `/api/hotels/:id` | Admin | Edit hotel details |
| PUT `/api/hotels/:id/images` | Admin | Replace a hotel's photos |
| POST `/api/hotels/:id/rooms` | Admin | Add a room type |
| PUT `/api/hotels/rooms/:id` | Admin | Change room price and availability |
| DELETE `/api/hotels/:id` | Admin | Delete a hotel (409 if it has bookings) |
| POST `/api/bookings` | Guest | Book a room, returns the Stripe payment link |
| GET `/api/bookings` | Guest | My bookings |
| POST `/api/bookings/:id/confirm` | Guest | After paying: ask Stripe, then confirm |
| DELETE `/api/bookings/:id` | Guest | Cancel my own booking |
| GET, PUT `/api/users/me` | Guest | View or edit my profile |
| PUT `/api/users/me/email` | Guest | Change email (needs current password) |
| PUT `/api/users/me/password` | Guest | Change password (needs current password) |
| GET `/api/users/me/export` | Guest | Download everything held about me |
| DELETE `/api/users/me` | Guest | Delete (anonymise) my account |
| GET `/api/favourites` | Guest | My saved stays |
| PUT, DELETE `/api/favourites/:hotelId` | Guest | Save or remove a stay |
| PUT `/api/reviews/:hotelId` | Guest | Write or update my review (needs a completed stay there) |
| GET `/api/notifications` | Guest | My latest 20 notifications |
| GET `/api/admin/bookings` | Admin | Every reservation with guest and room details |
| PATCH `/api/admin/bookings/:id` | Admin | Approve, cancel, move the dates, check in or check out |
| POST `/api/admin/promotions` | Admin | Send a message to all guests |
| GET `/api/offers` | Anyone | Active offers |
| POST, DELETE `/api/offers`,