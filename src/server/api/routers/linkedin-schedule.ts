import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { scheduledLinkedinPosts } from "@/server/db/schema";
import { createSchedule } from "@/server/services/qstash-service";
import { eq } from "drizzle-orm";

// Define input validation schema
const schedulePostSchema = z.object({
    content: z.string().min(1).max(3000),
    title: z.string().max(300).optional(),
    imageUrl: z.string().url().optional(),
    scheduledFor: z.date(),
});

export const linkedinScheduleRouter = createTRPCRouter({
    // Schedule a new LinkedIn post
    schedulePost: protectedProcedure
        .input(schedulePostSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            try {
                // Insert into database first
                const [scheduledPost] = await db.insert(scheduledLinkedinPosts)
                    .values({
                        userId,
                        content: input.content,
                        title: input.title,
                        imageUrl: input.imageUrl,
                        scheduledFor: input.scheduledFor,
                        status: "scheduled",
                    })
                    .returning();

                if (!scheduledPost) {
                    throw new Error("Failed to create scheduled post record");
                }
                
                // Create QStash schedule
                const scheduleResponse = await createSchedule({
                    destination: `https://bingo-social.vercel.app/api/linkedin/publish-post`,
                    scheduledFor: input.scheduledFor,
                    payload: {
                        scheduledPostId: scheduledPost.id,
                    },
                });
                
                if (!scheduleResponse.success) {
                    throw new Error(`Failed to create schedule: ${scheduleResponse.message}`);
                }
                
                // Update the record with schedule ID
                await db.update(scheduledLinkedinPosts)
                    .set({ scheduleId: scheduleResponse.scheduleId })
                    .where(eq(scheduledLinkedinPosts.id, scheduledPost.id));
                
                return {
                    ...scheduledPost,
                    scheduleId: scheduleResponse.scheduleId,
                };
            } catch (error) {
                console.error("Error scheduling LinkedIn post:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to schedule LinkedIn post: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }),
});