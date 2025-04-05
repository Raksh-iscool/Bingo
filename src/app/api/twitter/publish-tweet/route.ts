/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// app/api/twitter/publish-tweet/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { scheduledTweets, twitterTokens } from "@/server/db/schema";
import { env } from '@/env';

const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

type TweetPublishPayload = {
    scheduledTweetId: number;
    userId: string;
    text: string;
};

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const signature = req.headers.get("Upstash-Signature") ?? "";
    
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText) as TweetPublishPayload;

    try {
        const isValid = receiver.verify({
            body: bodyText,
            signature,
            url: url.toString()
        });

        if (!(await isValid)) {
            return NextResponse.json(
                { message: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Handle scheduled tweet
        if (payload.scheduledTweetId) {
            return await handleScheduledTweet(payload);
        }
        
        return NextResponse.json(
            { message: 'Tweet published successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in publish tweet webhook:', error);
        return NextResponse.json(
            { 
                message: 'Failed to publish tweet',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

async function handleScheduledTweet(payload: TweetPublishPayload) {
    const { scheduledTweetId, userId, text } = payload;
    
    if (!scheduledTweetId) {
        return NextResponse.json(
            { error: "Missing scheduledTweetId" },
            { status: 400 }
        );
    }

    // Find the scheduled tweet
    const scheduledTweet = await db.query.scheduledTweets.findFirst({
        where: eq(scheduledTweets.id, scheduledTweetId),
    });

    if (!scheduledTweet) {
        return NextResponse.json(
            { error: "Scheduled tweet not found" },
            { status: 404 }
        );
    }

    try {
        // Update status to processing
        await db
            .update(scheduledTweets)
            .set({ status: "processing" })
            .where(eq(scheduledTweets.id, scheduledTweetId));

        // Get the user's Twitter token
        const token = await db.query.twitterTokens.findFirst({
            where: eq(twitterTokens.userId, userId)
        });
        
        if (!token) {
            throw new Error("Twitter token not found for user");
        }

        const accessToken = token.accessToken;
        
        // Post the tweet using Twitter API
        const response = await fetch("https://api.twitter.com/2/tweets", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "x-client-uuid": crypto.randomUUID(),
            },
            body: JSON.stringify({
                text: text,
            }),
        });

        if (!response.ok) {
            const errorResponse = await response.json() as { detail?: string };
            throw new Error(errorResponse.detail ?? "Failed to post tweet");
        }

        const twitterResponse = (await response.json()) as { data: { id: string; text: string } };

        // Update database with result
        await db
            .update(scheduledTweets)
            .set({
                status: "completed",
                tweetId: twitterResponse.data.id,
                postResult: twitterResponse,
                updatedAt: new Date(),
            })
            .where(eq(scheduledTweets.id, scheduledTweetId));

        return NextResponse.json({ 
            success: true, 
            tweetId: twitterResponse.data.id,
            message: "Tweet published successfully" 
        });
    } catch (error) {
        console.error("Error processing scheduled tweet:", error);

        // Update database with error
        await db
            .update(scheduledTweets)
            .set({
                status: "failed",
                postResult: { error: error instanceof Error ? error.message : String(error) },
                updatedAt: new Date(),
            })
            .where(eq(scheduledTweets.id, scheduledTweetId));

        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to publish tweet',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}