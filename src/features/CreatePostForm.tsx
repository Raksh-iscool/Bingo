"use client";
import { api } from '@/trpc/react';
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import useFormStore, { type Platform, type Model, type Tone } from '@/app/store/FormStore';

// Update the type definition
const CreatePostForm = ({ onPostGenerated }: { 
  onPostGenerated: (content: Array<{ platform: string; content: string; contentId: number }>) => void 
}) => {
  const {
    post,
    setPostPlatform,
    setTopic,
    setModel,
    setTone,
    setKeyPoints,
    setIncludeHashtags,
    setIncludeEmojis,
    setMaxLength,
    setPostResult,
    setLoading,
    setError,
    isLoading,
    error,
  } = useFormStore();

  const createPost = api.createPost.useMutation({
    onSuccess: (data) => {
      setPostResult(data.contents[0]?.content ?? ''); // Set first content to result
      onPostGenerated(data.contents); // Pass the entire contents array
      setLoading(false);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    createPost.mutate({
      platform: post.platform,
      topic: post.topic,
      model: post.model,
      tone: post.tone,
      keyPoints: post.keyPoints,
      includeHashtags: post.includeHashtags,
      includeEmojis: post.includeEmojis,
      maxLength: post.maxLength,
    });
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-col md:flex-row">
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Create Social Media Post</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <Select
                value={post.platform}
                onValueChange={(value: Platform) => setPostPlatform(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <textarea
                value={post.topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 border rounded h-24"
                placeholder="Write a post about..."
                required
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium mb-1">AI Model</label>
              <Select
                value={post.model}
                onValueChange={(value: Model) => setModel(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <Select
                value={post.tone}
                onValueChange={(value: Tone) => setTone(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Key Points</label>
              <textarea
                value={post.keyPoints.join("\n")}
                onChange={(e) => setKeyPoints(e.target.value.split("\n"))}
                className="w-full p-2 border rounded h-24"
                placeholder="Enter key points, one per line..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Include Hashtags</label>
              <input
                type="checkbox"
                checked={post.includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Include Emojis</label>
              <input
                type="checkbox"
                checked={post.includeEmojis}
                onChange={(e) => setIncludeEmojis(e.target.checked)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Length</label>
              <input
                type="number"
                value={post.maxLength ?? ""}
                onChange={(e) =>
                  setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full p-2 border rounded"
                placeholder="Enter max length (optional)"
              />
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Post"}
              </Button>
            </div>
            {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
          </form>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-2">
            {isLoading ? "Generating..." : post.result ? "Generated" : "Generated Content:"}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded"></div>
            </div>
          ) : ( 
            <div>
              <textarea
                value={post.result || ""}
                onChange={(e) => setPostResult(e.target.value)}
                className="w-full p-3 bg-white rounded border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={10}
                placeholder="Edit your generated post here..."
              />
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CreatePostForm;