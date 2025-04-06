/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { useState, useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {DateTimePicker}  from "@/components/ui/date-time-picker";
import { toast } from "sonner"
import { api } from "@/trpc/react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Upload, FileVideo } from "lucide-react";

type UploadResult = {
  public_id: string;
  secure_url: string;
};

export default function VideoUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "public" | "unlisted">("private");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Reference to the submit button
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  
  // tRPC mutations
  const uploadMutation = api.youtubeSchedule.scheduleVideo.useMutation({
    onSuccess: () => {
      toast.success("Video scheduled successfully");
      // Reset form
      setVideoUrl(null);
      setThumbnailUrl(null);
      setTitle("");
      setDescription("");
      setTags("");
      setPrivacyStatus("private");
      setScheduledFor(undefined);
      setIsScheduled(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl) {
      toast.error("Please upload a video");
      return;
    }
    
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    
    // Prepare the tags array
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    
    // If scheduling, we need a date
    if (isScheduled && !scheduledFor) {
      toast.error("Please select a date")
      return;
    }
    
    const scheduleDate = isScheduled ? scheduledFor : new Date();
    
    try {
      setUploading(true);
      
      // Schedule the video upload
      await uploadMutation.mutateAsync({
        title,
        description,
        tags: tagArray,
        privacyStatus,
        videoUrl,
        thumbnailUrl: thumbnailUrl ?? undefined,
        scheduledFor: scheduleDate!,
      });
    } catch (error) {
      console.error("Failed to schedule upload:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Upload a YouTube Video</CardTitle>
          <CardDescription>
            Upload and schedule your video to be published on YouTube.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Video Upload */}
            <div className="space-y-2">
              <Label htmlFor="video">Video File</Label>
              {!videoUrl ? (
                <CldUploadWidget
                  uploadPreset="devshouse"
                  onSuccess={(result) => {
                    const uploadResult = result.info as UploadResult;
                    setVideoUrl(uploadResult.secure_url);
                  }}
                  options={{
                    maxFiles: 1,
                    resourceType: "video",
                  }}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed flex flex-col items-center justify-center gap-2"
                      onClick={() => open()}
                    >
                      <UploadCloud className="h-8 w-8" />
                      <span>Upload Video</span>
                    </Button>
                  )}
                </CldUploadWidget>
              ) : (
                <div className="relative border rounded-md p-4 flex items-center gap-4">
                  <FileVideo className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">Video uploaded successfully</p>
                    <p className="text-sm text-muted-foreground truncate">{videoUrl}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoUrl(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
              {!thumbnailUrl ? (
                <CldUploadWidget
                  uploadPreset="devshouse"
                  onSuccess={(result) => {
                    const uploadResult = result.info as UploadResult;
                    setThumbnailUrl(uploadResult.secure_url);
                  }}
                  options={{
                    maxFiles: 1,
                    resourceType: "image",
                  }}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2"
                      onClick={() => open()}
                    >
                      <Upload className="h-6 w-6" />
                      <span>Upload Thumbnail</span>
                    </Button>
                  )}
                </CldUploadWidget>
              ) : (
                <div className="relative border rounded-md p-4 flex items-center gap-4">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-16 w-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Thumbnail uploaded</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setThumbnailUrl(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Video Details */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Video description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy Status</Label>
              <Select 
                value={privacyStatus} 
                onValueChange={(value) => setPrivacyStatus(value as "private" | "public" | "unlisted")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduling */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="schedule"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded text-primary"
                />
                <Label htmlFor="schedule" className="cursor-pointer">
                  Schedule for later
                </Label>
              </div>

              {isScheduled && (
                <div className="space-y-2">
                  <Label htmlFor="scheduleDate">Publication Date & Time</Label>
                  <DateTimePicker 
                    date={scheduledFor} 
                    setDate={setScheduledFor}
                  />
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              ref={submitButtonRef}
              disabled={uploading || !videoUrl || !title}
            >
              {uploading ? "Processing..." : isScheduled ? "Schedule Upload" : "Upload Now"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}