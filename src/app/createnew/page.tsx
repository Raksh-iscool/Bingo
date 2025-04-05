"use client";
import React from 'react';
import CreatePostForm from '@/features/CreatePostForm';
import GenerateImageForm from '@/features/GenerateImageForm';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import useFormStore from '../store/FormStore';
import { useRouter } from 'next/navigation';
import { IconRight } from 'react-day-picker';

const Page: React.FC = () => {
  const { 
    showImageForm, 
    showPostForm, 
    toggleImageForm, 
    togglePostForm 
  } = useFormStore();
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Creation Dashboard</CardTitle>
        </CardHeader>
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showImageForm}
                onChange={toggleImageForm}
                className="mr-2"
              />
              Create Image Post
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPostForm}
                onChange={togglePostForm}
                className="mr-2"
              />
              Create Normal Post
            </label>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/chooseplatform')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <div className='flex items-center justify-between'>Post Now <IconRight className=''/></div>
            </button>
            <button
              onClick={() => router.push('/youtube-manager')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              YouTube Manager
            </button>
          </div>
        </div>
      </Card>

      {(showImageForm || showPostForm) && (
        <Tabs defaultValue={showImageForm ? "image" : "post"} className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="post" disabled={!showPostForm}>Text Post</TabsTrigger>
            <TabsTrigger value="image" disabled={!showImageForm}>Image Post</TabsTrigger>
          </TabsList>
          {showPostForm && (
            <TabsContent value="post">
              <CreatePostForm onPostGenerated={function (content: string): void {
                throw new Error('Function not implemented.');
              } } />
            </TabsContent>
          )}
          {showImageForm && (
            <TabsContent value="image">
              <GenerateImageForm />
            </TabsContent>
          )}
        </Tabs>
      )}

      {!showImageForm && !showPostForm && (
        <div className="text-center py-12 text-gray-500">
          Select content type to start creating
        </div>
      )}
    </div>
  );
};

export default Page;