import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
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

// 6. Start Server and Test Database Connection
app.listen(env.PORT, async () => {
  console.log(`Server is running at http://localhost:${env.PORT}`);

  try {
    // 1. Verify connection
    const res = await pool.query('SELECT NOW()');
    console.log(' Connected to the Database successfully at:', res.rows[0].now);

    // 2. Automatically load your schema.sql tables into Render
    // (Assumes schema.sql is sitting in the root of your project folder)
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log(':white_tick: Database schema loaded / verified successfully!');
    } else {
      console.log(':warning: schema.sql file not found in root directory, skipping auto-migration.');
    }

  } catch (err) {
    console.error(' Failed to initialize database:', err);
  }
});