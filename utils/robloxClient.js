// utils/robloxClient.js
import { Issuer, custom } from 'openid-client';
import dotenv from 'dotenv';

dotenv.config();

let client;

export async function getRobloxClient() {
  if (client) return client;

  const issuer = await Issuer.discover('https://apis.roblox.com/oauth/.well-known/openid-configuration');

  client = new issuer.Client({
    client_id: process.env.ROBLOX_CLIENT_ID,
    client_secret: process.env.ROBLOX_CLIENT_SECRET,
    redirect_uris: [`${process.env.LIVE_URL}/api/user/roblox/callback`],
    response_types: ['code'],
  });

  client[custom.clock_tolerance] = 300;

  return client;
}
