// 1. Imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { pool } from './config/db';
import authRoutes from './routes/authRoutes';
import { requireLogin, AuthRequest } from './middleware/auth';

// 2. Configuration
const app = express();

// 3. app.use (middleware)
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

// 4. Endpoints
app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-check', async (_req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM users');
  res.json({ users: result.rows[0].count });
});

app.get('/api/me', requireLogin, (req: AuthRequest, res) => {
  res.json({ loggedInAs: req.user });
});

app.listen(env.PORT, () => console.log(`Server is running at http://localhost:${env.PORT}`));