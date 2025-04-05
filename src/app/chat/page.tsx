"use client"
import React, { useState } from 'react';
import { 
  CreatePostForm, 
  UpdatePostForm, 
  GenerateImageForm, 
  // YouTubeForm 
} from '@/components/ui';
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuTrigger 
} from "@/components/ui/navigation-menumod";
import { Button } from "@/components/ui/button";
import YouTubeComponent from '@/features/YoutubeForm';

enum ActiveTab {
  CREATE_POST = 'create_post',
  UPDATE_POST = 'update_post',
  GENERATE_IMAGE = 'generate_image',
  YOUTUBE = 'youtube'
}

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.CREATE_POST);
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Social Media Management</h1>
      
      <NavigationMenu className="mb-6 flex flex-wrap justify-center md:justify-start">
        <NavigationMenuList className="flex flex-wrap gap-2">
          <NavigationMenuItem>
            <Button asChild>
              <NavigationMenuTrigger onClick={() => setActiveTab(ActiveTab.CREATE_POST)}>
                Create Post
              </NavigationMenuTrigger>
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button asChild>
              <NavigationMenuTrigger onClick={() => setActiveTab(ActiveTab.UPDATE_POST)}>
                Update Post
              </NavigationMenuTrigger>
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button asChild>
              <NavigationMenuTrigger onClick={() => setActiveTab(ActiveTab.GENERATE_IMAGE)}>
                Generate Image
              </NavigationMenuTrigger>
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button asChild>
              <NavigationMenuTrigger onClick={() => setActiveTab(ActiveTab.YOUTUBE)}>
                YouTube Integration
              </NavigationMenuTrigger>
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        {activeTab === ActiveTab.CREATE_POST && <CreatePostForm />}
        {activeTab === ActiveTab.UPDATE_POST && <UpdatePostForm />}
        {activeTab === ActiveTab.GENERATE_IMAGE && <GenerateImageForm />}
        {activeTab === ActiveTab.YOUTUBE && <YouTubeComponent/>}
      </div>
    </div>
  );
}