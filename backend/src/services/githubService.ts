import { z } from 'zod';
import { env } from '../config/env';
import { HttpError } from './hotelService';
import { makeToken } from './authService';
import { findUserByEmail, createOAuthUser } from '../modals/userModal';

const codeSchema = z.object({
  code: z.string().min(1, 'Missing GitHub code'),
});

interface GitHubUser {
  login: string;
  name: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function loginWithGitHub(body: unknown) {
  const parsed = codeSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

  // Step 1: swap the one-time code for an access token (this uses our secret)
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: parsed.data.code,
    }),
  });
  const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    console.error('GitHub said:', tokenData.error); // helps us find set-up mistakes
    throw new HttpError(401, 'GitHub did not accept the login. Please try again.');
  }

  const headers = {
    Authorization: `Bearer ${tokenData.access_token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zizz-hotels',
  };

  // Step 2: who is this person?
  const userResponse = await fetch('https://api.github.com/user', { headers });
  if (!userResponse.ok) throw new HttpError(401, 'Could not read your GitHub profile.');
  const gitHubUser = (await userResponse.json()) as GitHubUser;

  // Step 3: get their VERIFIED email (never trust the email typed on a profile)
  const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
  const emails = emailResponse.ok ? ((await emailResponse.json()) as GitHubEmail[]) : [];
  const verified = emails.find((e) => e.primary && e.verified);
  if (!verified) throw new HttpError(400, 'Your GitHub account needs a verified email address.');

  // Step 4: find their account, or create one
  let user = await findUserByEmail(verified.email);
  if (!user) {
    user = await createOAuthUser(gitHubUser.name || gitHubUser.login, verified.email);
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { user: safeUser, token: makeToken(safeUser) };
}