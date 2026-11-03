"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireLogin = requireLogin;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
// Guard 1: you must be logged in
function requireLogin(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    try {
        req.user = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        next();
    }
    catch {
        res.status(401).json({ error: 'Please log in' });
    }
}
// Guard 2: you must be an admin (always used after requireLogin)
function requireAdmin(req, res, next) {
    if (req.user?.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ error: 'Admins only' });
    }
}
