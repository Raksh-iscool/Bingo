"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

export default function TwitterPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const authStatusQuery = api.twitter.checkToken.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log(authStatusQuery)
  useEffect(() => {
    if (authStatusQuery?.data?.isValid) {
      setIsConnected(true);
      setIsLoading(false);
    } else {
      setIsConnected(false); 
    }
  }, []);
  
  

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      {isLoading ? (
        <div>Checking connection status...</div>
      ) : isConnected ? (
        <div className="text-green-600 font-semibold">Connected to Twitter</div>
      ) : (
        <button
          disabled={isLoading}
          className="rounded-full bg-[#1DA1F2] px-6 py-3 font-semibold text-white hover:bg-[#1a8cd8] disabled:opacity-50"
        >
          Connect to Twitter
        </button>
      )}
    </div>
  );
}