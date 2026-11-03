"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
// The rules for what the website must send us
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Enter a valid email'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    consent: zod_1.z.literal(true, { message: 'Please accept the privacy policy to create an account' }),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Enter a valid email'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
async function register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    try {
        const { name, email, password } = parsed.data;
        const result = await (0, authService_1.registerUser)(name, email, password);
        res.status(201).json(result);
    }
    catch (err) {
        const message = err.message;
        // Let known, friendly messages through; hide technical ones
        const friendly = /already|exists|registered|taken/i.test(message);
        res.status(friendly ? 409 : 500).json({
            error: friendly ? message : 'Something went wrong. Please try again.',
        });
    }
}
async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    try {
        const result = await (0, authService_1.loginUser)(parsed.data.email, parsed.data.password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
