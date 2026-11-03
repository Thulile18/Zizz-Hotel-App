"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithGitHub = loginWithGitHub;
const zod_1 = require("zod");
const env_1 = require("../config/env");
const hotelService_1 = require("./hotelService");
const authService_1 = require("./authService");
const userModal_1 = require("../modals/userModal");
const codeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Missing GitHub code'),
});
async function loginWithGitHub(body) {
    const parsed = codeSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    // Step 1: swap the one-time code for an access token (this uses our secret)
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            client_id: env_1.env.GITHUB_CLIENT_ID,
            client_secret: env_1.env.GITHUB_CLIENT_SECRET,
            code: parsed.data.code,
        }),
    });
    const tokenData = (await tokenResponse.json());
    if (!tokenData.access_token) {
        console.error('GitHub said:', tokenData.error); // helps us find set-up mistakes
        throw new hotelService_1.HttpError(401, 'GitHub did not accept the login. Please try again.');
    }
    const headers = {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'zizz-hotels',
    };
    // Step 2: who is this person?
    const userResponse = await fetch('https://api.github.com/user', { headers });
    if (!userResponse.ok)
        throw new hotelService_1.HttpError(401, 'Could not read your GitHub profile.');
    const gitHubUser = (await userResponse.json());
    // Step 3: get their VERIFIED email (never trust the email typed on a profile)
    const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
    const emails = emailResponse.ok ? (await emailResponse.json()) : [];
    const verified = emails.find((e) => e.primary && e.verified);
    if (!verified)
        throw new hotelService_1.HttpError(400, 'Your GitHub account needs a verified email address.');
    // Step 4: find their account, or create one
    let user = await (0, userModal_1.findUserByEmail)(verified.email);
    if (!user) {
        user = await (0, userModal_1.createOAuthUser)(gitHubUser.name || gitHubUser.login, verified.email);
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { user: safeUser, token: (0, authService_1.makeToken)(safeUser) };
}
