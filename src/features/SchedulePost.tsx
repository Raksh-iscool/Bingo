"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";

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

        if (!text.trim() || !scheduledFor) {
            setError("Please provide both text and a valid date/time.");
            return;
        }

        try {
            const scheduledDate = new Date(scheduledFor);
            if (isNaN(scheduledDate.getTime())) {
                setError("Invalid date/time format.");
                return;
            }

            const result = await scheduleTweetMutation.mutateAsync({
                text,
                scheduledFor: scheduledDate.toISOString(),
            });

            if (result.success) {
                setSuccessMessage("Post scheduled successfully!");
                setText("");
                setScheduledFor("");
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message ?? "Failed to schedule post.");
            } else {
                setError("Failed to schedule post.");
            }
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
