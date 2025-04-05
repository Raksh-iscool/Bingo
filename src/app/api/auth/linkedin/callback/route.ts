import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import { db } from "@/server/db";
import { linkedinTokens } from "@/server/db/schema";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from LinkedIn
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

  // Verify state matches to prevent CSRF attacks
  const cookieStore = await cookies();
  const savedState = cookieStore.get("linkedin_auth_state")?.value;

  if (!savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Invalid state", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `http://localhost:3000/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const session = await auth.api.getSession({
      headers: await headers()
    });
    const userId = session?.user?.id;

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !tokens.access_token) {
      throw new Error(tokens.error_description ?? "Failed to get LinkedIn access token");
    }

    console.log("LinkedIn tokens received:", tokens);

    // Store tokens in database using Drizzle ORM
    // Only include refreshToken if it exists
    const tokenData = {
      accessToken: tokens.access_token,
      expiryDate: new Date(Date.now() + (tokens.expires_in ?? 7200) * 1000), // Default to 2 hours if not provided
      scope: tokens.scope ?? '',
      userId: userId ?? "user_id",
    };
    
    // Only add refreshToken if it exists
    if (tokens.refresh_token) {
      await db.insert(linkedinTokens).values({
        ...tokenData,
        refreshToken: tokens.refresh_token
      });
    } else {
      await db.insert(linkedinTokens).values(tokenData);
    }

    // Redirect to home page with success
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // Clean up state cookie
    response.cookies.delete("linkedin_auth_state");

    return response;

  } catch (err) {
    console.error("LinkedIn callback error:", err);
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(err instanceof Error ? err.message : "LinkedIn authentication failed")}`, 
      request.url)
    );
  }
}