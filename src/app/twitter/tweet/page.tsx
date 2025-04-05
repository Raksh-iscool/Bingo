"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function CreateTweetPage() {
  const [tweetContent, setTweetContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

  const createTweet = api.twitter.createTweet.useMutation({
    onSuccess: () => {
      setTweetContent("");
      setError(null);
      setIsPosting(false);
    },
    onError: (err) => {
      setError(err.message);
      setIsPosting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    setError(null);
    console.log(tweetContent);
    
    // Call the mutation function
    createTweet.mutate({ text: tweetContent });
  };

 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Create Tweet</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={tweetContent}
            onChange={(e) => setTweetContent(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg resize-none"
            placeholder="What's happening?"
            maxLength={280}
          />
          
          <div className="flex justify-between items-center">
            <span className={`text-sm ${tweetContent.length > 280 ? 'text-red-500' : 'text-gray-500'}`}>
              {tweetContent.length}/280
            </span>
            
            <button
              type="submit"
              disabled={isPosting || tweetContent.length === 0 || tweetContent.length > 280}
              className="rounded-full bg-[#1DA1F2] px-6 py-2 font-semibold text-white hover:bg-[#1a8cd8] disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Tweet'}
            </button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}