"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubLogin = githubLogin;
const hotelService_1 = require("../services/hotelService");
const githubService_1 = require("../services/githubService");
async function githubLogin(req, res) {
    try {
        res.json(await (0, githubService_1.loginWithGitHub)(req.body));
    }
    catch (err) {
        if (err instanceof hotelService_1.HttpError) {
            return res.status(err.status).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}
