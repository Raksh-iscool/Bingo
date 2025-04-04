// src/pages/api/auth/twitter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  
  // Store code verifier in session or cookie
  res.setHeader(
    "Set-Cookie", 
    `codeVerifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
  );
  
  // Generate code challenge using SHA-256
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  
  // Create Twitter authorization URL
  const clientId = process.env.TWITTER_CLIENT_ID as string;
  const redirectUri = encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`);
  const scope = encodeURIComponent("tweet.read tweet.write offline.access");
  const state = crypto.randomBytes(16).toString("hex");
  
  const authUrl = `https://x.com/i/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  res.redirect(authUrl);
}