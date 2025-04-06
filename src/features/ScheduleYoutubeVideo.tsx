"use client";
import React, { useState } from "react";
import { api } from "@/trpc/react";

const ScheduleYoutubeVideo: React.FC = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [privacyStatus, setPrivacyStatus] = useState<"private" | "public" | "unlisted">("private");
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const scheduleVideoMutation = api.youtubeSchedule.scheduleVideo.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!title.trim() || !videoUrl.trim() || !scheduledFor) {
            setError("Please provide a title, video URL, and a valid date/time.");
            return;
        }

        try {
            const scheduledDate = new Date(scheduledFor);
            if (isNaN(scheduledDate.getTime())) {
                setError("Invalid date/time format.");
                return;
            }

            const result = await scheduleVideoMutation.mutateAsync({
                title,
                description,
                tags,
                privacyStatus,
                videoUrl,
                thumbnailUrl,
                scheduledFor: scheduledDate,
            });

            if (result) {
                setSuccessMessage("Video scheduled successfully!");
                setTitle("");
                setDescription("");
                setTags([]);
                setPrivacyStatus("private");
                setVideoUrl("");
                setThumbnailUrl("");
                setScheduledFor("");
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message ?? "Failed to schedule video.");
            } else {
                setError("Failed to schedule video.");
            }
        }
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTags(e.target.value.split(",").map((tag) => tag.trim()));
    };

    return (
        <div>
            <h2>Schedule a YouTube Video</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Title:</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="tags">Tags (comma-separated):</label>
                    <input
                        id="tags"
                        type="text"
                        value={tags.join(", ")}
                        onChange={handleTagsChange}
                    />
                </div>
                <div>
                    <label htmlFor="privacyStatus">Privacy Status:</label>
                    <select
                        id="privacyStatus"
                        value={privacyStatus}
                        onChange={(e) => setPrivacyStatus(e.target.value as "private" | "public" | "unlisted")}
                    >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                         <option value="unlisted">Unlisted</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="videoUrl">Video URL:</label>
                    <input
                        id="videoUrl"
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="thumbnailUrl">Thumbnail URL:</label>
                    <input
                        id="thumbnailUrl"
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
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
                    Schedule Video
                </button>
            </form>
        </div>
    );
};

export default ScheduleYoutubeVideo;
