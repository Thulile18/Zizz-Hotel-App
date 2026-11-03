"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = changePassword;
exports.changeEmail = changeEmail;
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const db_1 = require("../config/db");
const passwordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Enter your current password'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
const emailSchema = zod_1.z.object({
    newEmail: zod_1.z.string().trim().email('Enter a valid email'),
    password: zod_1.z.string().min(1, 'Enter your current password'),
});
const NO_PASSWORD = 'This account signs in with GitHub, so it has no password to change.';
const WRONG_PASSWORD = 'Your current password is not correct';
async function findPasswordHash(userId) {
    const result = await db_1.pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    return result.rows[0];
}
// Change your own password (you must know the current one)
async function changePassword(req, res) {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Please log in' });
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    try {
        const user = await findPasswordHash(userId);
        if (!user)
            return res.status(404).json({ error: 'Account not found' });
        if (!user.password_hash)
            return res.status(400).json({ error: NO_PASSWORD });
        const matches = await bcrypt_1.default.compare(parsed.data.currentPassword, user.password_hash);
        if (!matches)
            return res.status(400).json({ error: WRONG_PASSWORD });
        const hash = await bcrypt_1.default.hash(parsed.data.newPassword, 12);
        await db_1.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
        res.json({ message: 'Password changed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}
// Change your own email (you must know the current password)
async function changeEmail(req, res) {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Please log in' });
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    try {
        const user = await findPasswordHash(userId);
        if (!user)
            return res.status(404).json({ error: 'Account not found' });
        if (!user.password_hash) {
            return res.status(400).json({ error: 'This account signs in with GitHub, so its email comes from GitHub.' });
        }
        const matches = await bcrypt_1.default.compare(parsed.data.password, user.password_hash);
        if (!matches)
            return res.status(400).json({ error: WRONG_PASSWORD });
        const taken = await db_1.pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2', [
            parsed.data.newEmail,
            userId,
        ]);
        if (taken.rowCount)
            return res.status(409).json({ error: 'That email is already used by another account' });
        const updated = await db_1.pool.query('UPDATE users SET email = $1 WHERE id = $2 RETURNING id, name, email, role', [parsed.data.newEmail, userId]);
        res.json(updated.rows[0]);
    }
    catch (err) {
        // 23505: the database refused a duplicate email (two requests at the same moment)
        if (err.code === '23505') {
            return res.status(409).json({ error: 'That email is already used by another account' });
        }
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}
