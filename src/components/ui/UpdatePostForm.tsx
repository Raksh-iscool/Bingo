"use client"
import { api } from '@/trpc/react';
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const UpdatePostForm = () => {
  const [platform, setPlatform] = useState<"twitter" | "linkedin" | "facebook" | "instagram">("twitter");
  const [originalContent, setOriginalContent] = useState("");
  const [updatePrompt, setUpdatePrompt] = useState("");
  const [model, setModel] = useState<"gemini" | "deepseek">("gemini");
  const [result, setResult] = useState("");
  const [isSignificantChange, setIsSignificantChange] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveHistory, setSaveHistory] = useState(true); // New state for saveHistory

  const updatePost = api.updatePost.useMutation({
    onSuccess: (data) => {
      setResult(data.updatedContent);
      setIsSignificantChange(data.isSignificantChange);
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
    updatePost.mutate({ platform, originalContent, updatePrompt, model, saveHistory }); // Pass saveHistory
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-col md:flex-row">
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Update Social Media Post</h2>
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
              <label className="block text-sm font-medium mb-1">Original Content</label>
              <textarea 
                value={originalContent} 
                onChange={(e) => setOriginalContent(e.target.value)} 
                className="w-full p-2 border rounded h-24"
                placeholder="Original post content..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Update Instructions</label>
              <textarea 
                value={updatePrompt} 
                onChange={(e) => setUpdatePrompt(e.target.value)} 
                className="w-full p-2 border rounded h-24"
                placeholder="Make it more engaging by..."
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
              <label className="block text-sm font-medium mb-1">Save History</label>
              <input 
                type="checkbox" 
                checked={saveHistory} 
                onChange={(e) => setSaveHistory(e.target.checked)} 
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">Enable saving update history</span>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Post"}
            </Button>
          </div>

          {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-2">
            {isLoading ? "Generating..." : result ? "Generated" : "Updated Content:"}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded whitespace-pre-wrap">
              {result || "Output will appear here..."}
            </div>
          )}
          {result && !isLoading && (
            <p className="mt-2 text-sm">
              {isSignificantChange 
                ? "This update represents a significant change to the original content." 
                : "This update maintains most of the original content."}
            </p>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default UpdatePostForm;