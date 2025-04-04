// src/pages/api/auth/twitter/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  const cookies = parse(req.headers.cookie || "");
  const codeVerifier = cookies.codeVerifier;
  
  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  
  try {
    // Exchange authorization code for access token
    const clientId = process.env.TWITTER_CLIENT_ID as string;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET as string;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;
    
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(JSON.stringify(tokenData));
    }
    
    // Store tokens securely
    res.setHeader(
      "Set-Cookie", 
      `twitterToken=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${tokenData.expires_in || 7200}`
    );
    
    // Redirect back to the application
    res.redirect("/create-tweet");
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
}