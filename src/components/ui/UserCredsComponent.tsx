"use client"

import React, { useState } from 'react';
import { DataTable } from './DataTable';

interface Credential {
  username: string;
  password: string;
}

interface UserData {
  id: string;
  status: "Available" | "Not Available";
  platform: string;
  credentials?: Credential;
}

const UserCredsComponent = () => {
  const [userData, setUserData] = useState<UserData[]>([
    {
      id: "user1",
      status: "Available",
      platform: "Facebook",
      credentials: { username: "fbuser", password: "********" }
    },
    {
      id: "user2",
      status: "Not Available",
      platform: "Twitter",
    },
    {
      id: "user3",
      status: "Available",
      platform: "Instagram",
      credentials: { username: "insta_user", password: "********" }
    },
    {
      id: "user4",
      status: "Available",
      platform: "LinkedIn",
      credentials: { username: "professional", password: "********" }
    },
    {
      id: "user5",
      status: "Not Available",
      platform: "YouTube",
    },
    {
      id: "user6",
      status: "Available",
      platform: "TikTok",
      credentials: { username: "tiktok_user", password: "********" }
    },
    {
      id: "user7",
      status: "Not Available",
      platform: "Pinterest",
    },
    {
      id: "user8",
      status: "Available",
      platform: "Reddit",
      credentials: { username: "reddit_user", password: "********" }
    }
  ]);

  const handleUpdateCredentials = (id: string, platform: string, credentials: Credential) => {
    setUserData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, credentials } : item
      )
    );
    
    console.log(`Updated credentials for ${platform}:`, credentials);
    
  };

  return (
    <div className='w-full'>
      <h1>User Platforms</h1>
      <DataTable 
        data={userData} 
        onUpdateCredentials={handleUpdateCredentials} 
      />
    </div>
  );
};

export default UserCredsComponent;