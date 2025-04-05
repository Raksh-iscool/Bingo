import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { scheduledYoutubeVideos } from "@/server/db/schema";
import { 
    createSchedule, 
    deleteSchedule,
} from "@/server/services/qstash-service";
import { env } from "@/env";

// Define input validation schemas
const scheduleVideoSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    privacyStatus: z.enum(['private', 'public', 'unlisted']).default('private'),
    videoUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    scheduledFor: z.date(),
});

const updateScheduleSchema = z.object({
    id: z.number(),
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    privacyStatus: z.enum(['private', 'public', 'unlisted']).optional(),
    thumbnailUrl: z.string().url().optional(),
    scheduledFor: z.date().optional(),
});

export const youtubeScheduleRouter = createTRPCRouter({
    // Schedule a new video upload
    scheduleVideo: protectedProcedure
        .input(scheduleVideoSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            try {
                // Insert into database first
                const [scheduledVideo] = await db.insert(scheduledYoutubeVideos)
                    .values({
                        userId,
                        title: input.title,
                        description: input.description,
                        tags: input.tags ?? [],
                        privacyStatus: input.privacyStatus,
                        videoUrl: input.videoUrl,
                        thumbnailUrl: input.thumbnailUrl,
                        scheduledFor: input.scheduledFor,
                        status: "scheduled",
                    })
                    .returning();

                if (!scheduledVideo) {
                    throw new Error("Failed to create scheduled video record");
                }
                
                // Create QStash schedule
                const scheduleResponse = await createSchedule({
                    destination: `https://bingo-social.vercel.app/api/youtube/publish-video`,
                    scheduledFor: input.scheduledFor,
                    payload: {
                        scheduledVideoId: scheduledVideo.id,
                    },
                });
                
                if (!scheduleResponse.success) {
                    throw new Error(`Failed to create schedule: ${scheduleResponse.message}`);
                }
                
                // Update the record with schedule ID
                await db.update(scheduledYoutubeVideos)
                    .set({ scheduleId: scheduleResponse.scheduleId })
                    .where(eq(scheduledYoutubeVideos.id, scheduledVideo.id));
                
                return {
                    ...scheduledVideo,
                    scheduleId: scheduleResponse.scheduleId,
                };
            } catch (error) {
                console.error("Error scheduling video:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to schedule video: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }),

    // Get all scheduled videos for a user
    getScheduledVideos: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.session.user.id;
            
            return db.query.scheduledYoutubeVideos.findMany({
                where: eq(scheduledYoutubeVideos.userId, userId),
                orderBy: (videos) => [videos.scheduledFor],
            });
        }),

    // Get a specific scheduled video
    getScheduledVideo: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        
        const video = await db.query.scheduledYoutubeVideos.findFirst({
            where: (videos) => 
            eq(videos.id, input.id) && 
            eq(videos.userId, userId),
        });
        
        if (!video) {
            throw new TRPCError({
            code: "NOT_FOUND",
            message: "Scheduled video not found",
            });
        }
        
        return video;
    }),

    // Update a scheduled video
    updateScheduledVideo: protectedProcedure
        .input(updateScheduleSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            // Check if the video exists and belongs to the user
            const existingVideo = await db.query.scheduledYoutubeVideos.findFirst({
                where: (videos) => 
                eq(videos.id, input.id) && 
                eq(videos.userId, userId),
            });
            
            if (!existingVideo) {
                throw new TRPCError({
                code: "NOT_FOUND",
                message: "Scheduled video not found",
                });
            }
            
            try {
                // If scheduledFor changed, update the QStash schedule
                if (input.scheduledFor && existingVideo.scheduleId) {
                    // Delete the existing schedule
                    await deleteSchedule(existingVideo.scheduleId);
                    
                    // Create a new schedule
                    const scheduleResponse = await createSchedule({
                        destination: `${env.NEXT_PUBLIC_APP_URL}/api/youtube/scheduled-upload`,
                        scheduledFor: input.scheduledFor,
                        payload: {
                        scheduledVideoId: existingVideo.id,
                        },
                    });
                    
                    if (!scheduleResponse.success) {
                        throw new Error(`Failed to update schedule: ${scheduleResponse.message}`);
                    }
                    
                    // Update the record
                    const [updatedVideo] = await db.update(scheduledYoutubeVideos)
                        .set({
                            title: input.title ?? existingVideo.title,
                            description: input.description ?? existingVideo.description,
                            tags: input.tags ?? existingVideo.tags,
                            privacyStatus: input.privacyStatus ?? existingVideo.privacyStatus,
                            thumbnailUrl: input.thumbnailUrl ?? existingVideo.thumbnailUrl,
                            scheduledFor: input.scheduledFor,
                            scheduleId: scheduleResponse.scheduleId,
                            updatedAt: new Date(),
                        })
                        .where(eq(scheduledYoutubeVideos.id, input.id))
                        .returning();
                    
                    return updatedVideo;
                } else {
                // Just update the database record without changing the schedule
                    const [updatedVideo] = await db.update(scheduledYoutubeVideos)
                        .set({
                            title: input.title ?? existingVideo.title,
                            description: input.description ?? existingVideo.description,
                            tags: input.tags ?? existingVideo.tags,
                            privacyStatus: input.privacyStatus ?? existingVideo.privacyStatus,
                            thumbnailUrl: input.thumbnailUrl ?? existingVideo.thumbnailUrl,
                            updatedAt: new Date(),
                        })
                        .where(eq(scheduledYoutubeVideos.id, input.id))
                        .returning();
                    
                    return updatedVideo;
                }
            } catch (error) {
                console.error("Error updating scheduled video:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to update scheduled video: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }),

    // Cancel a scheduled video upload
    cancelScheduledVideo: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            // Check if the video exists and belongs to the user
            const existingVideo = await db.query.scheduledYoutubeVideos.findFirst({
                where: (videos) => 
                eq(videos.id, input.id) && 
                eq(videos.userId, userId),
            });
            
            if (!existingVideo) {
                throw new TRPCError({
                code: "NOT_FOUND",
                message: "Scheduled video not found",
                });
            }
            
            try {
                // Delete the QStash schedule if it exists
                if (existingVideo.scheduleId) {
                    await deleteSchedule(existingVideo.scheduleId);
                }
                
                // Update the database record
                await db.update(scheduledYoutubeVideos)
                .set({
                    status: "cancelled",
                    updatedAt: new Date(),
                })
                .where(eq(scheduledYoutubeVideos.id, input.id));
                
                return { success: true };
            } catch (error) {
                console.error("Error cancelling scheduled video:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to cancel scheduled video: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }),

  // Delete a scheduled video
    deleteScheduledVideo: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            // Check if the video exists and belongs to the user
            const existingVideo = await db.query.scheduledYoutubeVideos.findFirst({
                where: (videos) => 
                eq(videos.id, input.id) && 
                eq(videos.userId, userId),
            });
            
            if (!existingVideo) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Scheduled video not found",
                });
            }
            
            try {
                // Delete the QStash schedule if it exists
                if (existingVideo.scheduleId) {
                    await deleteSchedule(existingVideo.scheduleId);
                }
                
                // Delete the database record
                await db.delete(scheduledYoutubeVideos)
                    .where(eq(scheduledYoutubeVideos.id, input.id));
                
                return { success: true };
            } catch (error) {
                console.error("Error deleting scheduled video:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to delete scheduled video: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }
    ),
});