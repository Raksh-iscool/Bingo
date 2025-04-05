import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { db } from "@/server/db";
import { twitterTokens } from "@/server/db/schema";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from Twitter
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(error)}`, request.url),
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Missing auth parameters", request.url),
    );
  }

  // Verify state matches
  const cookieStore = await cookies();
  const savedState = cookieStore.get("twitter_auth_state")?.value;
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;

  if (!savedState || !codeVerifier || state !== savedState) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Invalid state", request.url),
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `http://localhost:3000/onboarding`,
        code_verifier: codeVerifier,
        client_id: process.env.TWITTER_CLIENT_ID!,
      }),
    });

    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    const userId = session?.user?.id;

    const tokens = (await tokenResponse.json()) as {
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

    // Store tokens in database using Drizzle ORM

    await db.insert(twitterTokens).values({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token!,
      expiryDate: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000),
      userId: userId ?? "user_id",
    });

    // Clean up PKCE cookies
    response.cookies.delete("twitter_code_verifier");
    response.cookies.delete("twitter_auth_state");

    return response;
  } catch (err) {
    console.error("Twitter callback error:", err);
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(err instanceof Error ? err.message : "Authentication failed")}`,
        request.url,
      ),
    );
  }
}
