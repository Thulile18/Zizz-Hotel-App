// 1. Imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

// 2. Configuration
const app = express();

// 3. app.use (middleware)
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

// 4. Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => console.log(`Server is running at http://localhost:${env.PORT}`));