import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) throw new Error("Twitter Client ID not configured");

  // 1. Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // 2. Generate random state
  const state = crypto.randomBytes(16).toString('hex');
 
  // 3. Build authorization URL (matches working pattern)
  const authUrl = new URL('https://x.com/i/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read offline.access');
  authUrl.searchParams.append('redirect_uri', 'http://localhost:3000/api/auth/twitter/callback');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
 
  // 4. Set secure cookies
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600 // 10 minutes
  });
  response.cookies.set('twitter_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600 // 10 minutes
  });

  return response;
}