"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function CreateLinkedInPost() {
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = api.linkedin.createPost.useMutation({
    onSuccess: () => {
      setPostContent("");
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
    console.log(postContent);
    
    // Call the mutation function
    createPost.mutate({ 
      text: postContent,
      visibility: "PUBLIC"
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Create LinkedIn Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg resize-none"
            placeholder="What do you want to share?"
            maxLength={3000}
          />
          
          <div className="flex justify-between items-center">
            <span className={`text-sm ${postContent.length > 3000 ? 'text-red-500' : 'text-gray-500'}`}>
              {postContent.length}/3000
            </span>
            
            <button
              type="submit"
              disabled={isPosting || postContent.length === 0 || postContent.length > 3000}
              className="rounded bg-[#0A66C2] px-6 py-2 font-semibold text-white hover:bg-[#004182] disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Post to LinkedIn'}
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