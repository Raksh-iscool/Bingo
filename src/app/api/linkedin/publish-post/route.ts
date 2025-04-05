// app/api/linkedin/publish-post/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { scheduledLinkedinPosts } from "@/server/db/schema";
import { publishLinkedInPost } from "@/server/services/linkedin-service";
import { env } from '@/env';

const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

type PostPublishPayload = {
    scheduledPostId?: number;
};

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const signature = req.headers.get("Upstash-Signature") ?? "";
    
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText) as PostPublishPayload;

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

        // Handle scheduled post
        if (payload.scheduledPostId) {
            return await handleScheduledPost(payload);
        }
        
        return NextResponse.json(
            { message: 'Invalid payload' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in publish LinkedIn post webhook:', error);
        return NextResponse.json(
            { 
                message: 'Failed to publish LinkedIn post',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

async function handleScheduledPost(payload: PostPublishPayload) {
    const { scheduledPostId } = payload;
    
    if (!scheduledPostId) {
        return NextResponse.json(
            { error: "Missing scheduledPostId" },
            { status: 400 }
        );
    }

    // Find the scheduled post
    const scheduledPost = await db.query.scheduledLinkedinPosts.findFirst({
        where: eq(scheduledLinkedinPosts.id, scheduledPostId),
    });

    if (!scheduledPost) {
        return NextResponse.json(
            { error: "Scheduled post not found" },
            { status: 404 }
        );
    }

    try {
        // Update status to processing
        await db
            .update(scheduledLinkedinPosts)
            .set({ status: "processing" })
            .where(eq(scheduledLinkedinPosts.id, scheduledPostId));

        // Fetch image if available
        let imageBuffer = null;
        if (scheduledPost.imageUrl) {
            const imageResponse = await fetch(scheduledPost.imageUrl);
            if (imageResponse.ok) {
                imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            }
        }

        // Publish to LinkedIn
        // Note: You'll need to implement this function in your linkedin-service.ts
        const result = await publishLinkedInPost({
            content: scheduledPost.content,
            title: scheduledPost.title ?? undefined,
            userId: scheduledPost.userId,
            imageBuffer,
        });

        // Update database with result
        await db
            .update(scheduledLinkedinPosts)
            .set({
                status: "completed",
                linkedinPostId: result.postId,
                postResult: result,
                updatedAt: new Date(),
            })
            .where(eq(scheduledLinkedinPosts.id, scheduledPostId));

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Error processing scheduled LinkedIn post:", error);

        // Update database with error
        await db
            .update(scheduledLinkedinPosts)
            .set({
                status: "failed",
                postResult: { error: error instanceof Error ? error.message : String(error) },
                updatedAt: new Date(),
            })
            .where(eq(scheduledLinkedinPosts.id, scheduledPostId));

        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}