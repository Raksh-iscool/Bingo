// pages/api/auth/youtube/callback.ts
import { type NextApiRequest, type NextApiResponse } from "next";
import { getTokenFromCode } from "@/server/services/youtube-service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session?.user) {
        return res.redirect(`/login?error=Unauthorized&callbackUrl=${encodeURIComponent('/youtube/connect')}`);
    }
    
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
        return res.redirect('/youtube/connect?error=MissingAuthCode');
    }
    
    try {
        // The state parameter should contain the userId or other relevant data
        const userId = state && typeof state === 'string' ? state : session.user.id;
        
        // Exchange the code for tokens
        await getTokenFromCode(code, userId);
        
        // Redirect to success page
        res.redirect('/youtube/dashboard?status=connected');
    } catch (error) {
        console.error('Error during YouTube authentication:', error);
        res.redirect('/youtube/connect?error=AuthenticationFailed');
    }
}