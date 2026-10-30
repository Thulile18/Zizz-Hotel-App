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
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,                  -- Added for Lovable's URLs
  tagline       TEXT,                         -- Added for hotel descriptions
  description   TEXT,
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  region        TEXT,                         -- Added for state/province
  country       TEXT NOT NULL DEFAULT 'South Africa', -- Added for country
  lat           NUMERIC(9,6),
  lng           NUMERIC(9,6),
  stars         INT CHECK (stars BETWEEN 1 AND 5),
  is_featured   BOOLEAN DEFAULT false,        -- Added for featured badges
  property_type TEXT,                         -- Added (e.g., 'Hotel', 'Resort')
  tags          TEXT[] DEFAULT '{}',          -- Added for search filters
  facilities    TEXT[] DEFAULT '{}',
  policies      TEXT
);

-- 3. HOTEL_IMAGES: many photos for one hotel
CREATE TABLE hotel_images (
  id            SERIAL PRIMARY KEY,
  hotel_id      INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  caption       TEXT,                         -- Added for image descriptions
  category      TEXT,                         -- Added (e.g., 'room', 'pool', 'lobby')
  display_order INT NOT NULL DEFAULT 0        -- Added to sort which image shows up first
);


-- 4. ROOMS: many room types for one hotel
CREATE TABLE rooms (
  id              SERIAL PRIMARY KEY,
  hotel_id        INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  capacity        INT NOT NULL,
  price_per_night NUMERIC(10,2) NOT NULL,
  total_rooms     INT NOT NULL,
  image_path      TEXT
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
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(id),
  hotel_id      INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL DEFAULT 'Anonymous', -- Added to show who wrote it
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),         -- Added to sort by newest review
  UNIQUE (user_id, hotel_id)
);

-- 8. NOTIFICATIONS: messages sent to a user
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. OFFERS: promotional deals for specific hotels
CREATE TABLE offers (
  id               SERIAL PRIMARY KEY,
  hotel_id         INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  is_published     BOOLEAN DEFAULT false,
  booking_start    DATE NOT NULL,
  booking_end      DATE NOT NULL,
  stay_end         DATE NOT NULL,
  quantity         INT, -- NULL means unlimited coupons available
  used             INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- INDEXES: keep searches fast as the data grows
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels (city);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_price ON rooms (hotel_id, price_per_night);
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel ON hotel_images (hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings (room_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON reviews (hotel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels (slug);
CREATE INDEX IF NOT EXISTS idx_offers_dates ON offers (is_published, booking_start, booking_end, stay_end);

-- PRIVACY: the time a user agreed to the privacy policy
ALTER TABLE users ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;