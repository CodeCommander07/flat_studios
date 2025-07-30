import { getRobloxClient } from '@/utils/robloxClient';
import { generators } from 'openid-client';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  const client = await getRobloxClient();

  const state = generators.state();
  const nonce = generators.nonce();

  // Set cookies for state/nonce
  res.setHeader('Set-Cookie', [
    serialize('state', state, { httpOnly: true, secure: true, path: '/', sameSite: 'lax' }),
    serialize('nonce', nonce, { httpOnly: true, secure: true, path: '/', sameSite: 'lax' }),
  ]);

  const redirectUrl = client.authorizationUrl({ state, nonce });

  res.redirect(redirectUrl);
}