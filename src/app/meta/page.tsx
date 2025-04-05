"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";

export default function TwitterPage() {



  const handleTwitterConnect = async () => {
    try {
      // Redirect to our backend auth route
      window.location.href = "/api/auth/meta";
    } catch (error) {
      console.error('Meta auth error:', error);
    } finally {
    }
  };
  
  

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div>Checking connection status...</div>
        <div className="text-green-600 font-semibold">Connected to Twitter</div>
        <button
          onClick={handleTwitterConnect}
          className="rounded-full bg-[#1DA1F2] px-6 py-3 font-semibold text-white hover:bg-[#1a8cd8] disabled:opacity-50"
        >
          Connect to Meta
        </button>
    </div>
  );
}