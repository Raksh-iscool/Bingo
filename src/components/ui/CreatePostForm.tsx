"use client"
import { api } from '@/trpc/react';
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CreatePostForm = () => {
  const [platform, setPlatform] = useState<"twitter" | "linkedin" | "facebook" | "instagram">("twitter");
  const [topic, setTopic] = useState("");
  const [model, setModel] = useState<"gemini" | "deepseek">("gemini");
  const [tone, setTone] = useState<"professional" | "casual" | "enthusiastic" | "informative" | "humorous" | "serious">("professional");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const createPost = api.createPost.useMutation({
    onSuccess: (data) => {
      setResult(data.content);
      setIsLoading(false);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    createPost.mutate({ platform, topic, model, tone, keyPoints, includeHashtags, includeEmojis, maxLength });
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-col md:flex-row">
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Create Social Media Post</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <Select value={platform} onValueChange={(value: "twitter" | "linkedin" | "facebook" | "instagram") => setPlatform(value)}>
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <textarea 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="w-full p-2 border rounded h-24"
                placeholder="Write a post about..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">AI Model</label>
              <Select value={model} onValueChange={(value: "gemini" | "deepseek") => setModel(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <Select value={tone} onValueChange={(value: "professional" | "casual" | "enthusiastic" | "informative" | "humorous" | "serious") => setTone(value)}>
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
                value={keyPoints.join("\n")} 
                onChange={(e) => setKeyPoints(e.target.value.split("\n"))} 
                className="w-full p-2 border rounded h-24"
                placeholder="Enter key points, one per line..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Include Hashtags</label>
              <input 
                type="checkbox" 
                checked={includeHashtags} 
                onChange={(e) => setIncludeHashtags(e.target.checked)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Include Emojis</label>
              <input 
                type="checkbox" 
                checked={includeEmojis} 
                onChange={(e) => setIncludeEmojis(e.target.checked)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Length</label>
              <input 
                type="number" 
                value={maxLength ?? ""} 
                onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)} 
                className="w-full p-2 border rounded"
                placeholder="Enter max length (optional)"
              />
            </div>
          </form>
          <div className="mt-4 flex items-center justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Post"}
            </Button>
          </div>
          {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-2">
            {isLoading ? "Generating..." : result ? "Generated" : "Generated Content:"}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded whitespace-pre-wrap">
              {result ?? "Output will appear here..."}
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default CreatePostForm;