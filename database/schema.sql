-- 1. USERS: everyone who signs up (guests and admins)
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. HOTELS: one row per hotel
CREATE TABLE hotels (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  lat         NUMERIC(9,6),
  lng         NUMERIC(9,6),
  stars       INT CHECK (stars BETWEEN 1 AND 5),
  facilities  TEXT[] DEFAULT '{}',
  policies    TEXT
);

-- 3. HOTEL_IMAGES: many photos for one hotel
CREATE TABLE hotel_images (
  id       SERIAL PRIMARY KEY,
  hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  url      TEXT NOT NULL
);

-- 4. ROOMS: many room types for one hotel
CREATE TABLE rooms (
  id              SERIAL PRIMARY KEY,
  hotel_id        INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  capacity        INT NOT NULL,
  price_per_night NUMERIC(10,2) NOT NULL,
  total_rooms     INT NOT NULL
);

-- 5. BOOKINGS: which user booked which room, and when
CREATE TABLE bookings (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(id),
  room_id           INT NOT NULL REFERENCES rooms(id),
  check_in          DATE NOT NULL,
  check_out         DATE NOT NULL CHECK (check_out > check_in),
  rooms_booked      INT NOT NULL DEFAULT 1,
  guests            INT NOT NULL,
  total_price       NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  stripe_session_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 6. FAVOURITES: which user saved which hotel
CREATE TABLE favourites (
  user_id  INT REFERENCES users(id) ON DELETE CASCADE,
  hotel_id INT REFERENCES hotels(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hotel_id)
);

-- 7. REVIEWS: one rating and comment per user per hotel
CREATE TABLE reviews (
  id       SERIAL PRIMARY KEY,
  user_id  INT NOT NULL REFERENCES users(id),
  hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rating   INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment  TEXT,
  UNIQUE (user_id, hotel_id)
);

-- 8. NOTIFICATIONS: messages sent to a user
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);