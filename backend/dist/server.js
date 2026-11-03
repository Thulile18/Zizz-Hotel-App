"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 1. Imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const hotelRoutes_1 = __importDefault(require("./routes/hotelRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const favouriteRoutes_1 = __importDefault(require("./routes/favouriteRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const offerRoutes_1 = __importDefault(require("./routes/offerRoutes"));
// 2. Configuration
const app = (0, express_1.default)();
// Render puts a proxy in front of the server. Trusting it lets the rate limiters
// see each visitor's real address instead of the proxy's address.
app.set('trust proxy', 1);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});
const credentialLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 300,
    message: { error: 'Too many requests. Please slow down.' },
});
// 3. app.use (middleware)
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.CLIENT_URL }));
app.use(express_1.default.json({ limit: '50kb' }));
app.use('/api', apiLimiter);
// 4. Endpoints
app.use('/api/auth', authLimiter, authRoutes_1.default);
app.use('/api/hotels', hotelRoutes_1.default);
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/users/me/password', credentialLimiter);
app.use('/api/users/me/email', credentialLimiter);
app.use('/api/users', userRoutes_1.default);
app.use('/api/favourites', favouriteRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/offers', offerRoutes_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// 5. Any error nobody handled
app.use((err, _req, res, _next) => {
    if (err.status === 413)
        return res.status(413).json({ error: 'That request is too large.' });
    if (err.status === 400)
        return res.status(400).json({ error: 'The request could not be read.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
});
// 6. Start the server and check the database connection
app.listen(env_1.env.PORT, async () => {
    console.log(`Server is running on port ${env_1.env.PORT}`);
    try {
        const result = await db_1.pool.query('SELECT NOW()');
        console.log('Connected to the database at:', result.rows[0].now);
    }
    catch (err) {
        console.error('Could not connect to the database:', err);
    }
});
