/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/server/services/twitter-scheduling-service.ts

import { Client } from "@upstash/qstash";
import { env } from "@/env";

// Initialize QStash client
const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
});

export type ScheduleTweetResponse = {
  scheduleId: string;
  success: boolean;
  message?: string;
};

/**
 * Schedule a tweet for posting at a specific time
 */
export async function scheduleTweet({
  scheduledFor,
  scheduledTweetId,
  userId,
  text,
}: {
  scheduledFor: Date;
  scheduledTweetId: number;
  userId: string;
  text: string;
}): Promise<ScheduleTweetResponse> {
  try {
    // Convert Date to cron expression for a specific time
    // Format for cron: minute hour day month day-of-week
    const minute = scheduledFor.getUTCMinutes();
    const hour = scheduledFor.getUTCHours();
    const day = scheduledFor.getUTCDate();
    const month = scheduledFor.getUTCMonth() + 1; // Months are 0-indexed in JS
    const cronExpression = `${minute} ${hour} ${day} ${month} *`;

    // The API endpoint that will handle posting the tweet
    const destination = `https://bingo-social.vercel.app/api/twitter/publish-tweet`;

    const response = await qstashClient.schedules.create({
      destination,
      cron: cronExpression,
      body: JSON.stringify({
        scheduledTweetId,
        userId,
        text,
      }),
    });

    return {
      scheduleId: response.scheduleId,
      success: true,
    };
  } catch (error) {
    console.error("Error scheduling tweet:", error);
    return {
      scheduleId: "",
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a scheduled tweet
 */
export async function deleteScheduledTweet(
  scheduleId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await qstashClient.schedules.delete(scheduleId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting scheduled tweet:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}