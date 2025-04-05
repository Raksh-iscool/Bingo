import {  NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from Twitter
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Missing auth parameters", request.url)
    );
  }

  // Verify state matches
  const cookieStore = await cookies();
  const savedState = cookieStore.get("twitter_auth_state")?.value;
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;

  if (!savedState || !codeVerifier || state !== savedState) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Invalid state", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`,
        code_verifier: codeVerifier,
        client_id: process.env.TWITTER_CLIENT_ID!,
      }),
    });

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
    };

    if (!tokenResponse.ok || !tokens.access_token) {
      throw new Error(tokens.error_description ?? "Failed to get access token");
    }

    // Store tokens in session (adapt to your auth system)
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // Set cookies (or use your session management)
    response.cookies.set("twitter_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in ?? 7200,
    });

    if (tokens.refresh_token) {
      response.cookies.set("twitter_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Clean up PKCE cookies
    response.cookies.delete("twitter_code_verifier");
    response.cookies.delete("twitter_auth_state");

    return response;

  } catch (err) {
    console.error("Twitter callback error:", err);
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(err instanceof Error ? err.message : "Authentication failed")}`, 
      request.url)
    );
  }
}