import express from 'express';

const app = express();

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok'});
});

app.listen(4000, () => console.log('API running on http://localhost:3000'));
