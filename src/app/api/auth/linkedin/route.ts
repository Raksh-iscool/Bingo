import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error("LinkedIn Client ID not configured");

  // 1. Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // 2. Build authorization URL with updated scopes
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/linkedin/callback')}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent('openid profile email w_member_social rw_events r_events')}`;

  // 3. Set secure cookies
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('linkedin_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600 // 10 minutes
  });

  return response;
}