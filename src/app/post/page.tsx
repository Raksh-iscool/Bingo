"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useFormStore from '../store/FormStore';
import { api } from '@/trpc/react'; // Import TRPC API

const cardData = [
  {
    platformName: "LinkedIn",
    imageUrl: "https://img.icons8.com/?size=100&id=447&format=png&color=000000",
    color: "bg-blue-600",
    lightColor: "bg-blue-300"
  }, 
  {
    platformName: "Twitter",
    imageUrl: "https://img.icons8.com/?size=100&id=6Fsj3rv2DCmG&format=png&color=000000",
    color: "bg-blue-400",
    lightColor: "bg-blue-200"
  },
  // Add more platforms as needed
];

const PostPage = () => {
  const { post, image } = useFormStore();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPostingToLinkedIn, setIsPostingToLinkedIn] = useState(false); // LinkedIn posting state
  const [linkedInError, setLinkedInError] = useState<string | null>(null); // LinkedIn error state
  const [isPostingToTwitter, setIsPostingToTwitter] = useState(false); // Twitter posting state
  const [twitterError, setTwitterError] = useState<string | null>(null); // Twitter error state
  const router = useRouter();

  const createLinkedInPost = api.linkedin.createPost.useMutation({
    onSuccess: () => {
      setIsPostingToLinkedIn(false);
      setLinkedInError(null);
      console.log("Posted to LinkedIn successfully.");
    },
    onError: (err) => {
      setIsPostingToLinkedIn(false);
      setLinkedInError(err.message);
    },
  });

  const createTwitterPost = api.twitter.createTweet.useMutation({
    onSuccess: () => {
      setIsPostingToTwitter(false);
      setTwitterError(null);
      console.log("Posted to Twitter successfully.");
    },
    onError: (err) => {
      setIsPostingToTwitter(false);
      setTwitterError(err.message);
    },
  });

  useEffect(() => {
    if (post.topic || post.result) {
      console.log("Post Data:", post);
    } else {
      console.log("Post Data is empty or incomplete.");
    }

    if (image.prompt || image.result) {
      console.log("Image Data:", image);
    } else {
      console.log("Image Data is empty or incomplete.");
    }
  }, [post, image]);

  const togglePlatformSelection = (platformName: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformName)
        ? prev.filter((name) => name !== platformName)
        : [...prev, platformName]
    );
  };

  const handlePost = () => {
    const postData = {
      selectedPlatforms,
      postContent: post.result,
      hashtags: post.topic,
      image,
      fullData: { post, image }
    };
    console.log("Posting Data:", postData);

    // Iterate through selected platforms and call respective APIs
    selectedPlatforms.forEach((platform) => {
      if (platform === "LinkedIn") {
        setIsPostingToLinkedIn(true);
        setLinkedInError(null);
        createLinkedInPost.mutate({
          text: post.result,
          visibility: "PUBLIC",
        });
      }
      if (platform === "Twitter") {
        setIsPostingToTwitter(true);
        setTwitterError(null);
        createTwitterPost.mutate({
          text: post.result,
        });
      }
      // Add more platform-specific API calls as needed
    });

    router.push('/post');
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-center text-blue-600 mb-6">Post Summary</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Content:</h2>
        {post.result ? (
          <p className="text-gray-700 text-lg bg-gray-100 p-4 rounded border border-gray-300">
            {post.result}
          </p>
        ) : (
          <p className="text-gray-500 italic">No post content available.</p>
        )}
      </div>
      {/* <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Hashtags:</h2>
        {post.topic ? (
          <p className="text-gray-700 text-lg bg-gray-100 p-4 rounded border border-gray-300">
            {post.topic}
          </p>
        ) : (
          <p className="text-gray-500 italic">No hashtags available.</p>
        )}
      </div> */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Image:</h2>
        {image.result ? (
          <img 
            src={`data:${image.result.mimeType};base64,${image.result.imageBase64}`} 
            alt={image.result.altText || "Image"} 
            className="rounded shadow-md border border-gray-300"
          />
        ) : (
          <p className="text-gray-500 italic">No image available.</p>
        )}
      </div>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Selected Platforms:</h2>
        <div className="grid grid-cols-2 gap-4">
          {cardData.map((platform) => (
            <div
              key={platform.platformName}
              className={`p-4 rounded-lg cursor-pointer flex items-center justify-between ${
                selectedPlatforms.includes(platform.platformName)
                  ? platform.color
                  : platform.lightColor
              }`}
              onClick={() => togglePlatformSelection(platform.platformName)}
            >
              <img src={platform.imageUrl} alt={platform.platformName} className="w-12 h-12" />
              <span className="text-white font-semibold">{platform.platformName}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-gray-600">
          Selected Platforms: {selectedPlatforms.length > 0 ? selectedPlatforms.join(", ") : "None"}
        </p>
      </div>
      <div className="text-center mt-8">
        <button
          onClick={handlePost}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
          disabled={isPostingToLinkedIn || isPostingToTwitter}
        >
          {(isPostingToLinkedIn || isPostingToTwitter) ? "Posting..." : "Post"}
        </button>
        {linkedInError && (
          <p className="text-red-500 mt-2">{linkedInError}</p>
        )}
        {twitterError && (
          <p className="text-red-500 mt-2">{twitterError}</p>
        )}
      </div>
    </div>
  );
};

export default PostPage;