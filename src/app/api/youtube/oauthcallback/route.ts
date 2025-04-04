import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTokenFromCode } from "@/server/services/youtube-service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session?.user) {
        return NextResponse.redirect(
            new URL(`/login?error=Unauthorized&callbackUrl=${encodeURIComponent('/youtube/connect')}`, request.url)
        );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
        return NextResponse.redirect(
            new URL('/youtube/connect?error=MissingAuthCode', request.url)
        );
    }
    
    try {
        // The state parameter should contain the userId or other relevant data
        const userId = state ?? session.user.id;
        
        // Exchange the code for tokens
        await getTokenFromCode(code, userId);
        
        // Redirect to success page
        return NextResponse.redirect(
            new URL('/youtube/dashboard?status=connected', request.url)
        );
    } catch (error) {
        console.error('Error during YouTube authentication:', error);
        return NextResponse.redirect(
            new URL('/youtube/connect?error=AuthenticationFailed', request.url)
        );
    }
}