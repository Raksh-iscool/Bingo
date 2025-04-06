"use client";

import * as React from "react";
import { useState } from "react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function ScheduleTweetForm() {
  const [tweetText, setTweetText] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [characterCount, setCharacterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scheduleTweetMutation = api.twitterSchedule.scheduleTweet.useMutation({
    onSuccess: () => {
      toast.success("Tweet scheduled successfully");
      // Reset form
      setTweetText("");
      setScheduledDate(undefined);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error("Error scheduling tweet");
      setIsSubmitting(false);
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTweetText(text);
    setCharacterCount(text.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      toast.error("Please select a date and time for the tweet.");
      return;
    }

    if (tweetText.trim().length === 0) {
      toast.error("Tweet text cannot be empty.");
      return;
    }

    if (tweetText.length > 280) {
      toast.error("Tweet text cannot exceed 280 characters.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await scheduleTweetMutation.mutateAsync({
        text: tweetText,
        scheduledFor: scheduledDate.toISOString(),
      });
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Error scheduling tweet:", error);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Schedule a Tweet</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="What's happening?"
              value={tweetText}
              onChange={handleTextChange}
              className="resize-none h-32"
            />
            <div className="text-right text-sm text-muted-foreground">
              <span className={characterCount > 280 ? "text-red-500 font-semibold" : ""}>
                {characterCount}
              </span>
              /280
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">When to post</label>
            <DateTimePicker 
              date={scheduledDate} 
              setDate={setScheduledDate} 
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || characterCount > 280 || characterCount === 0 || !scheduledDate}
          >
            {isSubmitting ? "Scheduling..." : "Schedule Tweet"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}