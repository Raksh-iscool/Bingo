"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { api } from "@/trpc/react";

export default function ScheduleLinkedInPost() {
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to 24 hours from now
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const scheduleMutation = api.linkedinSchedule.schedulePost.useMutation({
    onSuccess: () => {
      toast.success("LinkedIn post scheduled successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error scheduling post: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const resetForm = () => {
    setContent("");
    setTitle("");
    setImageUrl("");
    setScheduledDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Post content is required");
      return;
    }
    
    if (!scheduledDate) {
      toast.error("Please select a date and time to schedule");
      return;
    }
    
    setIsSubmitting(true);
    
    scheduleMutation.mutate({
      content,
      title: title || undefined,
      imageUrl: imageUrl || undefined,
      scheduledFor: scheduledDate,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Schedule LinkedIn Post</CardTitle>
        <CardDescription>
          Schedule a post to be published to your LinkedIn profile at a specific date and time.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Post title or headline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What would you like to share?"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/3000 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Schedule Date and Time</Label>
            <DateTimePicker
              date={scheduledDate}
              setDate={setScheduledDate}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        
        <CardFooter className="justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={resetForm} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !content.trim() || !scheduledDate}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}