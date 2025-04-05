/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// app/api/youtube/publish-video/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { scheduledYoutubeVideos } from "@/server/db/schema";
import { uploadVideo } from "@/server/services/youtube-service";
import { env } from '@/env';

const receiver = new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

type VideoPublishPayload = {
    youtubeId?: string;
    userId: string;
    title: string;
    description?: string;
    tags?: string[];
    privacyStatus?: 'private' | 'unlisted' | 'public';
    scheduledVideoId?: number;
    videoUrl?: string;
    thumbnailUrl?: string;
};

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const signature = req.headers.get("Upstash-Signature") ?? "";
    
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText) as VideoPublishPayload;

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

        // Handle scheduled upload
        if (payload.scheduledVideoId) {
            return await handleScheduledUpload(payload);
        }
        
        return NextResponse.json(
            { message: 'Video published successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in publish video webhook:', error);
        return NextResponse.json(
            { 
                message: 'Failed to publish video',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

async function handleScheduledUpload(payload: VideoPublishPayload) {
    const { scheduledVideoId } = payload;
    
    if (!scheduledVideoId) {
        return NextResponse.json(
            { error: "Missing scheduledVideoId" },
            { status: 400 }
        );
    }

    // Find the scheduled video
    const scheduledVideo = await db.query.scheduledYoutubeVideos.findFirst({
        where: eq(scheduledYoutubeVideos.id, scheduledVideoId),
    });

    if (!scheduledVideo) {
        return NextResponse.json(
            { error: "Scheduled video not found" },
            { status: 404 }
        );
    }

    try {
        // Update status to processing
        await db
            .update(scheduledYoutubeVideos)
            .set({ status: "processing" })
            .where(eq(scheduledYoutubeVideos.id, scheduledVideoId));

        // Fetch video file
        const videoResponse = await fetch(scheduledVideo.videoUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video file: ${videoResponse.statusText}`);
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Fetch thumbnail if available
        let thumbnailBuffer = null;
        if (scheduledVideo.thumbnailUrl) {
            const thumbnailResponse = await fetch(scheduledVideo.thumbnailUrl);
            if (thumbnailResponse.ok) {
                thumbnailBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());
            }
        }

        // Upload to YouTube
        const result = await uploadVideo({
            videoBuffer,
            title: scheduledVideo.title,
            description: scheduledVideo.description ?? undefined,
            tags: scheduledVideo.tags as string[] || undefined,
            privacyStatus: scheduledVideo.privacyStatus as 'private' | 'public' | 'unlisted',
            userId: scheduledVideo.userId,
            thumbnailBuffer,
        });

        // Update database with result
        await db
            .update(scheduledYoutubeVideos)
            .set({
                status: "completed",
                youtubeId: result.videoId,
                uploadResult: result,
                updatedAt: new Date(),
            })
            .where(eq(scheduledYoutubeVideos.id, scheduledVideoId));

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Error processing scheduled upload:", error);

        // Update database with error
        await db
            .update(scheduledYoutubeVideos)
            .set({
                status: "failed",
                uploadResult: { error: error instanceof Error ? error.message : String(error) },
                updatedAt: new Date(),
            })
            .where(eq(scheduledYoutubeVideos.id, scheduledVideoId));

        throw error; // Let the main error handler deal with the response
    }
}