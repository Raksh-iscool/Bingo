/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Client } from "@upstash/qstash";
import { env } from "@/env";

// Initialize QStash client
const qstashClient = new Client({
  token: env.QSTASH_TOKEN,
});

export type ScheduleCreateResponse = {
  scheduleId: string;
  success: boolean;
  message?: string;
};

export type ScheduleDeleteResponse = {
  success: boolean;
  message?: string;
};

/**
 * Create a schedule for a specific date and time
 */
export async function createSchedule({
  destination,
  scheduledFor,
  payload,
}: {
  destination: string;
  scheduledFor: Date;
  payload: Record<string, unknown>;
}): Promise<ScheduleCreateResponse> {
  try {
    // Convert Date to cron expression for a specific time
    // Format for cron: minute hour day month day-of-week
    const minute = scheduledFor.getUTCMinutes();
    const hour = scheduledFor.getUTCHours();
    const day = scheduledFor.getUTCDate();
    const month = scheduledFor.getUTCMonth() + 1; // Months are 0-indexed in JS
    const cronExpression = `${minute} ${hour} ${day} ${month} *`;

    const response = await qstashClient.schedules.create({
      destination,
      cron: cronExpression,
      body: JSON.stringify(payload),
    });

    return {
      scheduleId: response.scheduleId,
      success: true,
    };
  } catch (error) {
    console.error("Error creating schedule:", error);
    return {
      scheduleId: "",
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(
  scheduleId: string
): Promise<ScheduleDeleteResponse> {
  try {
    await qstashClient.schedules.delete(scheduleId);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get details of a schedule
 */
export async function getSchedule(scheduleId: string) {
  try {
    return await qstashClient.schedules.get(scheduleId);
  } catch (error) {
    console.error("Error getting schedule:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

/**
 * List all schedules
 */
export async function listSchedules() {
  try {
    return await qstashClient.schedules.list();
  } catch (error) {
    console.error("Error listing schedules:", error);
    throw error;
  }
}