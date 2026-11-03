"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    PORT: Number(process.env.PORT) || 3000,
    CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    // Set to "true" when the database needs an encrypted connection (Render, Neon)
    DATABASE_SSL: process.env.DATABASE_SSL || '',
};
// Database guardrail
if (!exports.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Add your database connection string to your environment config.');
}
// Security guardrail
if (!exports.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Add it to your environment config.');
}
if (exports.env.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET is short. Use at least 32 random characters.');
}
