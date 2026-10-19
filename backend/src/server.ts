// 1. Imports
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import hotelRoutes from './routes/hotelRoutes';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import favouriteRoutes from './routes/favouriteRoutes';
import reviewRoutes from './routes/reviewRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

// 2. Configuration
const app = express();

// Stops one visitor from guessing passwords or flooding the server
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/users', userRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 5. Last stop for any error nobody handled: never show technical details to visitors
app.use((err: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.status === 413) return res.status(413).json({ error: 'That request is too large.' });
  if (err.status === 400) return res.status(400).json({ error: 'The request could not be read.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(env.PORT, () => console.log(`Server is running at http://localhost:${env.PORT}`));