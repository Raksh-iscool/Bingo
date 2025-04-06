"use client";                                                                                            
import React, { useEffect, useState } from 'react';
import useFormStore from '../store/FormStore';
import { api } from "@/trpc/react"; // Import API for posting logic

const PostPage = () => {
  const { post, selectedPlatforms } = useFormStore(); // Removed image and hashtags
  const [statusMessage, setStatusMessage] = useState<string | null>(null); // State for status message

  const createPost = api.twitter.createTweet.useMutation({
    onSuccess: () => {
      setStatusMessage("Post successful!"); // Set success message
    },
    onError: (err) => {
      setStatusMessage(`Post failed: ${err.message}`); // Set error message
    },
  });

  const createLinkedInPost = api.linkedin.createPost.useMutation({
    onSuccess: () => {
        setStatusMessage("Posted to LinkedIn successfully!"); // Set success message
    },
    onError: (err) => {
        setStatusMessage(`LinkedIn post failed: ${err.message}`); // Set error message
    },
  });

  useEffect(() => {
    console.log("Post Data:", post);
    console.log("Selected Platforms:", selectedPlatforms);
  }, [post, selectedPlatforms]);

  const handlePostToPlatforms = () => {
    setStatusMessage(null); // Clear previous status message
    selectedPlatforms.forEach((platform) => {
      if (platform === "Twitter") {
        createPost.mutate({ text: post.result }); // Post to Twitter
      }
      if (platform === "LinkedIn") {
        createLinkedInPost.mutate({ text: post.result, visibility: "PUBLIC" }); // Post to LinkedIn
      }
      // Add logic for other platforms if needed
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-center text-blue-600 mb-6">Post Summary</h1>
      
      {post.result && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Content:</h2>
          <p className="text-gray-700 text-lg bg-gray-100 p-4 rounded border border-gray-300">
            {post.result}
          </p>
        </div>
      )}

      {selectedPlatforms.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Selected Platforms:</h2>
          <ul className="list-disc list-inside text-gray-700">
            {selectedPlatforms.map((platform) => (
              <li key={platform}>{platform}</li>
            ))}
          </ul>
        </div>
      )}
 
      {statusMessage && (
        <div
          className={`mt-4 p-4 rounded ${
            statusMessage.startsWith("Post successful")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <button
        onClick={handlePostToPlatforms}
        className="mt-4 rounded-full bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-500"
      >
        Post to Platforms
      </button>
    </div>
  );
};

export default PostPage;
