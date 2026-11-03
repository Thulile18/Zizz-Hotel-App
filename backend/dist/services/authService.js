"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeToken = makeToken;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const userModal_1 = require("../modals/userModal");
// A login token: proof that the user logged in, valid for 7 days
function makeToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
}
async function registerUser(name, email, password) {
    const existing = await (0, userModal_1.findUserByEmail)(email);
    if (existing)
        throw new Error('That email is already registered');
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    const user = await (0, userModal_1.createUser)(name, email, passwordHash);
    return { user, token: makeToken(user) };
}
async function loginUser(email, password) {
    const user = await (0, userModal_1.findUserByEmail)(email);
    const passwordOk = user?.password_hash && (await bcrypt_1.default.compare(password, user.password_hash));
    if (!passwordOk)
        throw new Error('Wrong email or password');
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: makeToken(user),
    };
}
