"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import UserCredsComponent from '@/components/ui/UserCredsComponent';


const UserProfile = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full py-1  mx-auto">
      <div className="flex items-center space-x-6 mb-6">
      
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">Avatar</span>
        </div>
      
        <div className="flex flex-col space-y-2">
          <div className="text-lg font-bold">Username</div>
          <div className="text-sm font-bold">Email</div>
        </div>
      </div>

      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Your Platforms</h2>
        <UserCredsComponent />
      </div>

      
      <div className="flex justify-between">
        <Button  className="bg-gray-100 ">Change Password</Button>
        <Button  className='bg-red-400 rounded'>Logout</Button>
      </div>
    </div>
  );
};

export default UserProfile;