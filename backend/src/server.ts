// 1. Imports
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { env } from './config/env';
import { pool } from './config/db';
import authRoutes from './routes/authRoutes';
import hotelRoutes from './routes/hotelRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import favouriteRoutes from './routes/favouriteRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import offerRoutes from './routes/offerRoutes';

// 2. Configuration
const app = express();

// Render puts a proxy in front of the server. Trusting it lets the rate limiters
// see each visitor's real address instead of the proxy's address.
app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  message: { error: 'Too many requests. Please slow down.' },
});

// 3. app.use (middleware)
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '50kb' }));
app.use('/api', apiLimiter);

// 4. Endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users/me/password', credentialLimiter);
app.use('/api/users/me/email', credentialLimiter);
app.use('/api/users', userRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 5. Any error nobody handled
app.use((err: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.status === 413) return res.status(413).json({ error: 'That request is too large.' });
  if (err.status === 400) return res.status(400).json({ error: 'The request could not be read.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// 6. Start the server and check the database connection
app.listen(env.PORT, async () => {
  console.log(`Server is running on port ${env.PORT}`);
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Connected to the database at:', result.rows[0].now);
  } catch (err) {
    console.error('Could not connect to the database:', err);
  }
});