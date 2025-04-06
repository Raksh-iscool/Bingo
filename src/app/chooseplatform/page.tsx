"use client";                                                                                            
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useFormStore from '../store/FormStore';

const cardData = [
  {
    platformName: "Twitter",
    imageUrl: "https://img.icons8.com/?size=100&id=6Fsj3rv2DCmG&format=png&color=000000",
    color: "bg-blue-400",
    lightColor: "bg-blue-200"
  },
  {
    platformName: "LinkedIn",
    imageUrl: "https://img.icons8.com/?size=100&id=447&format=png&color=000000",
    color: "bg-blue-600",
    lightColor: "bg-blue-300"
  },
  // Add more platforms as needed
];

const ChoosePlatform = () => {
  const { post, image, setSelectedPlatforms } = useFormStore(); // Remove YouTube data
  const [selectedPlatforms, setLocalSelectedPlatforms] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (post.topic || post.result) {
      console.log("Post Data:", post);
    } else {
      console.log("No content to post.");
    }
  }, [post]);

  const togglePlatformSelection = (platformName: string) => {
    setLocalSelectedPlatforms((prev) =>
      prev.includes(platformName)
        ? prev.filter((name) => name !== platformName)
        : [...prev, platformName]
    );
  };
 
  const handlePost = () => {
    setSelectedPlatforms(selectedPlatforms); // Store selected platforms in FormStore
    router.push('/post');
  };

  const isAllPlatformsDisabled = !post.result && !image.result; // Disable all platforms if nothing to post

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-center text-blue-600 mb-6">Choose Platforms</h1>
      <p className="text-center text-gray-600 mb-8">
        Select the platforms where you want to post your content.
      </p>
      
      {post.result && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Post Result:</h2>
          <p className="text-gray-700 text-lg bg-gray-100 p-4 rounded border border-gray-300">
            {post.result}
          </p>
        </div>
      )}

      {image.result && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Result:</h2>
          <img 
            src={`data:${image.result.mimeType};base64,${image.result.imageBase64}`} 
            alt={image.result.altText || "Image Result"} 
            className="rounded shadow-md border border-gray-300"
          />
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Platforms:</h2>
        <div className="grid grid-cols-2 gap-4">
          {cardData.map((platform) => (
            <div
              key={platform.platformName}
              className={`p-4 rounded-lg cursor-pointer flex items-center justify-between ${
                selectedPlatforms.includes(platform.platformName)
                  ? platform.color
                  : platform.lightColor
              } ${
                isAllPlatformsDisabled ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
              onClick={() =>
                !isAllPlatformsDisabled && togglePlatformSelection(platform.platformName)
              }
            >
              <img src={platform.imageUrl} alt={platform.platformName} className="w-12 h-12" />
              <span className="text-white font-semibold">{platform.platformName}</span>
            </div>
          ))}
        </div>
        {selectedPlatforms.length > 0 && (
          <p className="mt-4 text-gray-600">
            Selected Platforms: {selectedPlatforms.join(", ")}
          </p>
        )}
      </div>
      <div className="text-center mt-8">
        <button
          onClick={handlePost}
          className={`px-6 py-3 font-semibold rounded-lg shadow-md ${
            isAllPlatformsDisabled
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          disabled={isAllPlatformsDisabled}
        >
          Post 
        </button>
      </div>
    </div>
  );
};

export default ChoosePlatform;