"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";

export const schedulePost = async (
    text: string,
    scheduledFor: string,
    scheduleTweetMutation: ReturnType<typeof api.twitterSchedule.scheduleTweet.useMutation>
): Promise<{ success: boolean; message: string }> => {
    if (!text.trim() || !scheduledFor) {
        return { success: false, message: "Please provide both text and a valid date/time." };
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
        return { success: false, message: "Invalid date/time format." };
    }

    try {
        const result = await scheduleTweetMutation.mutateAsync({
            text,
            scheduledFor: scheduledDate.toISOString(),
        });

        if (result.success) {
            return { success: true, message: "Post scheduled successfully!" };
        } else {
            return { success: false, message: "Failed to schedule post." };
        }
    } catch (err) {
        if (err instanceof Error) {
            return { success: false, message: err.message ?? "Failed to schedule post." };
        } else {
            return { success: false, message: "Failed to schedule post." };
        }
    }
};

const ScheduleTweetPost: React.FC = () => {
    const [text, setText] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const scheduleTweetMutation = api.twitterSchedule.scheduleTweet.useMutation();
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const result = await schedulePost(text, scheduledFor, scheduleTweetMutation);

        if (result.success) {
            setSuccessMessage(result.message);
            setText("");
            setScheduledFor("");
        } else {
            setError(result.message);
        }
    };

    return (
        <div>
            <h2>Schedule a Post</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="text">Post Content:</label>
                    <textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={280}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="scheduledFor">Schedule For:</label>
                    <input
                        type="datetime-local"
                        id="scheduledFor"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
                <button type="submit">
                    Schedule Post
                </button>
            </form>
        </div>
    );
};

export default ScheduleTweetPost;
