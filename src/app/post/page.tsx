"use client";

import React, { useEffect, useState } from 'react';
import useFormStore from '../store/FormStore';
import { api } from "@/trpc/react";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const PostPage = () => {
  const { post, selectedPlatforms } = useFormStore();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isScheduling, setIsScheduling] = useState(false);

  const createPost = api.twitter.createTweet.useMutation({
    onSuccess: () => {
      setStatusMessage(isScheduling ? "Tweet scheduled successfully!" : "Tweet posted successfully!");
    },
    onError: (err) => {
      setStatusMessage(`Twitter post failed: ${err.message}`);
    },
  });

  const createLinkedInPost = api.linkedin.createPost.useMutation({
    onSuccess: () => {
      setStatusMessage(isScheduling ? "LinkedIn post scheduled successfully!" : "LinkedIn post published successfully!");
    },
    onError: (err) => {
      setStatusMessage(`LinkedIn post failed: ${err.message}`);
    },
  });

  useEffect(() => {
    console.log("Post Data:", post);
    console.log("Selected Platforms:", selectedPlatforms);
  }, [post, selectedPlatforms]);

  const handlePostToPlatforms = (schedule = false) => {
    setStatusMessage(null); // Clear previous status message
    setIsScheduling(schedule);
    
    selectedPlatforms.forEach((platform) => {
      if (platform === "Twitter") {
        createPost.mutate({ 
          text: post.result, 
          ...(schedule && scheduledDate ? { scheduledFor: scheduledDate.toISOString() } : {})
        });
      }
      if (platform === "LinkedIn") {
        createLinkedInPost.mutate({ 
          text: post.result, 
          visibility: "PUBLIC",
          ...(schedule && scheduledDate && { scheduledFor: scheduledDate.toISOString() })
        });
      }
      // Add logic for other platforms if needed
    });
  };


  const isDisabled = !post.result || selectedPlatforms.length === 0;
  const canSchedule = scheduledDate && !isDisabled;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Post Summary</h2>
      
      {post.result && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Post Content:</h3>
          <div className="p-4 bg-gray-50 rounded border">
            {post.result}
          </div>
        </div>
      )}

      {selectedPlatforms.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Selected Platforms:</h3>
          <div className="flex gap-2">
            {selectedPlatforms.map((platform) => (
              <span key={platform} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Schedule Post:</h3>
        <DateTimePicker
          date={scheduledDate}
          setDate={setScheduledDate}
          disabled={isDisabled}
        />
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => handlePostToPlatforms(false)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-200"
          disabled={isDisabled}
        >
          {!isScheduling ? "Posting..." : "Post Now"}
        </button>
        
        <button
          onClick={() => handlePostToPlatforms(true)}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition duration-200"
          disabled={!canSchedule }
        >
          {isScheduling ? "Scheduling..." : `Schedule for ${scheduledDate ? scheduledDate.toLocaleString() : "later"}`}
        </button>
      </div>
    </div>
  );
};

export default PostPage;