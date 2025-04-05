import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "@/server/db";
import { scheduledTweets, twitterTokens } from "@/server/db/schema";
import { scheduleTweet, deleteScheduledTweet } from "@/server/services/tweet-schedule";

export const twitterScheduleRouter = createTRPCRouter({
    // Schedule a tweet
    scheduleTweet: protectedProcedure
        .input(z.object({
            text: z.string().min(1).max(280),
            scheduledFor: z.string() // Accept string input for date
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const userId = ctx.session?.user.id;
                if (!userId) throw new Error("User not authenticated");
                
                // Convert scheduledFor to a Date object
                const scheduledForDate = new Date(input.scheduledFor);
                if (isNaN(scheduledForDate.getTime())) {
                    throw new Error("Invalid date format");
                }
                
                // Check if user has Twitter auth
                const token = await db.query.twitterTokens.findFirst({
                    where: eq(twitterTokens.userId, userId)
                });
                
                if (!token) {
                    throw new Error("Please authenticate with Twitter first");
                }
                
                // Make sure scheduled time is in the future
                const now = new Date();
                if (scheduledForDate <= now) {
                    throw new Error("Scheduled time must be in the future");
                }
                
                // Insert the scheduled tweet into database
                const [scheduledTweet] = await db
                    .insert(scheduledTweets)
                    .values({
                        userId,
                        content: input.text,
                        scheduledFor: scheduledForDate,
                        status: "scheduled",
                        createdAt: now,
                    }) 
                    .returning();
                
                if (!scheduledTweet) {
                    throw new Error("Failed to schedule tweet");
                }
                    
                // Create the schedule in QStash
                const scheduleResult = await scheduleTweet({
                    scheduledFor: scheduledForDate,
                    scheduledTweetId: scheduledTweet.id,
                    userId,
                    text: input.text,
                });
                
                if (!scheduleResult.success) {
                    await db
                        .update(scheduledTweets)
                        .set({ 
                            status: "failed",
                            postResult: { error: scheduleResult.message },
                        })
                        .where(eq(scheduledTweets.id, scheduledTweet.id));
                        
                    throw new Error(scheduleResult.message ?? "Failed to schedule tweet");
                }
                
                await db
                    .update(scheduledTweets)
                    .set({ scheduleId: scheduleResult.scheduleId })
                    .where(eq(scheduledTweets.id, scheduledTweet.id));
                    
                return {
                    success: true,
                    scheduledTweetId: scheduledTweet.id,
                    scheduleId: scheduleResult.scheduleId,
                    scheduledFor: scheduledForDate,
                };
            } catch (error) {
                console.error("Tweet scheduling failed:", error);
                throw new Error(
                    error instanceof Error ? error.message : "Failed to schedule tweet"
                );
            }
        }),
    
    // Get scheduled tweets
    getScheduledTweets: protectedProcedure
        .input(z.object({
            status: z.enum(["scheduled", "processing", "completed", "failed"]).optional(),
            limit: z.number().min(1).max(100).default(10),
            cursor: z.number().optional(),
        }))
        .query(async ({ input, ctx }) => {
            const userId = ctx.session?.user.id;
            if (!userId) throw new Error("User not authenticated");
            
            try {
                const { status, limit, cursor } = input;
                const whereConditions = [eq(scheduledTweets.userId, userId)];
                
                if (status) {
                    whereConditions.push(eq(scheduledTweets.status, status));
                }
                
                if (cursor) {
                    whereConditions.push(gte(scheduledTweets.id, cursor));
                }
                
                const tweets = await db.query.scheduledTweets.findMany({
                    where: and(...whereConditions),
                    orderBy: [desc(scheduledTweets.scheduledFor)],
                    limit: limit + 1,
                });
                
                let nextCursor: number | undefined = undefined;
                if (tweets.length > limit) {
                    const nextItem = tweets.pop();
                    nextCursor = nextItem?.id;
                }
                
                return {
                    tweets,
                    nextCursor,
                };
            } catch (error) {
                console.error("Failed to fetch scheduled tweets:", error);
                throw new Error(
                    error instanceof Error ? error.message : "Failed to fetch scheduled tweets"
                );
            }
        }),
    
    // Cancel scheduled tweet
    cancelScheduledTweet: protectedProcedure
        .input(z.object({
            scheduledTweetId: z.number(),
        }))
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session?.user.id;
            if (!userId) throw new Error("User not authenticated");
            
            try {
                const scheduledTweet = await db.query.scheduledTweets.findFirst({
                    where: and(
                        eq(scheduledTweets.id, input.scheduledTweetId),
                        eq(scheduledTweets.userId, userId)
                    ),
                });
                
                if (!scheduledTweet) {
                    throw new Error("Scheduled tweet not found");
                }
                
                if (scheduledTweet.status !== "scheduled") {
                    throw new Error(`Cannot cancel tweet with status: ${scheduledTweet.status}`);
                }
                
                if (scheduledTweet.scheduleId) {
                    await deleteScheduledTweet(scheduledTweet.scheduleId);
                }
                
                await db
                    .update(scheduledTweets)
                    .set({ 
                        status: "cancelled",
                        updatedAt: new Date(),
                    })
                    .where(eq(scheduledTweets.id, input.scheduledTweetId));
                    
                return {
                    success: true,
                    message: "Tweet cancelled successfully",
                };
            } catch (error) {
                console.error("Failed to cancel scheduled tweet:", error);
                throw new Error(
                    error instanceof Error ? error.message : "Failed to cancel scheduled tweet"
                );
            }
        }),
});