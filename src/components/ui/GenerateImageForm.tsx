"use client"
import { api } from '@/trpc/react';
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from "next/image"; // Import next/image

const GenerateImageForm = () => {
  const [platform, setPlatform] = useState<"twitter" | "linkedin" | "facebook" | "instagram">("instagram");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"square" | "portrait" | "landscape" | "twitter">("square");
  const [style, setStyle] = useState("");
  const [result, setResult] = useState<{
    imageBase64: string;
    mimeType: string;
    altText: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateImage = api.generateImagePost.useMutation({
    onSuccess: (data) => {
      setResult(data);
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
    generateImage.mutate({ platform, prompt, size, style });
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-col md:flex-row">
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Generate Social Media Image</h2>
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
              <label className="block text-sm font-medium mb-1">Image Description</label>
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                className="w-full p-2 border rounded h-24"
                placeholder="Create an image showing..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image Size</label>
              <Select value={size} onValueChange={(value: "square" | "portrait" | "landscape" | "twitter") => setSize(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square (1080×1080)</SelectItem>
                  <SelectItem value="portrait">Portrait (1080×1350)</SelectItem>
                  <SelectItem value="landscape">Landscape (1200×630)</SelectItem>
                  <SelectItem value="twitter">Twitter (1600×900)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Style (Optional)</label>
              <input 
                type="text"
                value={style} 
                onChange={(e) => setStyle(e.target.value)} 
                className="w-full p-2 border rounded"
                placeholder="e.g., Minimalist, Colorful, Corporate, etc."
              />
            </div>
          </form>

          <div className="mt-4 flex items-center justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Image"}
            </Button>
          </div>

          {error && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-gray-100 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-2">
            {isLoading ? "Generating..." : result ? "Generated" : "Generated Image:"}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ) : result ? (
            <>
              <Image 
                src={`data:${result.mimeType};base64,${result.imageBase64}`} 
                alt={result.altText}
                width={500}
                height={500}
                className="max-w-full h-auto rounded"
              />
              <p className="mt-2 text-sm text-gray-600">Alt text: {result.altText}</p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Output will appear here...</p>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default GenerateImageForm;