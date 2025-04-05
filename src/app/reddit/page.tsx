// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { headers } from "next/headers";
// import { db } from "@/server/db";
// import { Tokens } from "@/server/db/schema";
// import { auth } from "@/lib/auth";

// export async function GET(request: NextRequest) {
//   try {
//     // Define credentials and parameters
//     const clientId = process.env.REDDIT_CLIENT_ID!;
//     const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
//     const username = process.env.REDDIT_USERNAME!;
//     const password = process.env.REDDIT_PASSWORD!;
    
//     // Prepare the request body as form data
//     const params = new URLSearchParams();
//     params.append('grant_type', 'password');
//     params.append('username', username);
//     params.append('password', password);
    
//     // Make the token request
//     const response = await fetch('https://www.reddit.com/api/v1/access_token', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'User-Agent': 'bingo/1.0.0' // Required by Reddit API
//       },
//       body: params
//     });

//     // Debug response
//     const responseText = await response.text();
//     console.log("Reddit API Response:", responseText);
    
//     let tokens;
//     try {
//       tokens = JSON.parse(responseText);
//     } catch (e) {
//       console.error("Failed to parse response as JSON:", e);
//       return NextResponse.json({ error: "Invalid response from Reddit API" }, { status: 500 });
//     }
//     console.log(tokens);
    
//     if (!tokens.access_token) {
//       console.error("No access token in response:", tokens);
//       return NextResponse.json({ 
//         error: "No access token received", 
//         response: tokens 
//       }, { status: 400 });
//     }

//     // Get user ID from session
//     const session = await auth.api.getSession({
//       headers: await headers()
//     });
//     const userId = session?.user?.id || "default_user";

//     // Store tokens in database
//     await db.insert(redditTokens).values({
//       accessToken: tokens.access_token,
//       refreshToken: tokens.refresh_token || "", // May not be present
//       expiryDate: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
//       userId: userId,
//       scope: tokens.scope || "",
//       tokenType: tokens.token_type || "bearer",
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     return NextResponse.json({ 
//       success: true, 
//       accessToken: tokens.access_token,
//       expiresIn: tokens.expires_in
//     });

//   } catch (err) {
//     console.error("Reddit auth error:", err);
//     return NextResponse.json(
//       { error: err instanceof Error ? err.message : "Authentication failed" }, 
//       { status: 500 }
//     );
//   }
// }