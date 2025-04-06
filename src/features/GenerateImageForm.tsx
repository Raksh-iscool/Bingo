
"use client"
import { api } from '@/trpc/react';
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import useFormStore, { type Platform, type ImageSize } from '@/app/store/FormStore';
const GenerateImageForm: React.FC = () => {
  const {
    image,
    isLoading,
    error,
    setImagePlatform,
    setPrompt,
    setSize,
    setStyle,
    setContentId, 
    setImageResult,
    setLoading,
    setError
  } = useFormStore();

  const generateImage = api.generateImagePost.useMutation({
    onSuccess: (data) => {
      setImageResult(data);
      setLoading(false);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    generateImage.mutate({ 
      platform: image.platform, 
      prompt: image.prompt, 
      size: image.size, 
      style: image.style, 
      contentId: image.contentId ?? undefined 
    });
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-col md:flex-row">
      <ResizablePanel className="w-full md:w-1/2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Generate Social Media Image</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <Select 
                value={image.platform} 
                onValueChange={(value: Platform) => setImagePlatform(value)}
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image Description</label>
              <textarea 
                value={image.prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                className="w-full p-2 border rounded h-24"
                placeholder="Create an image showing..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image Size</label>
              <Select 
                value={image.size} 
                onValueChange={(value: ImageSize) => setSize(value)}
              >
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
                value={image.style} 
                onChange={(e) => setStyle(e.target.value)} 
                className="w-full p-2 border rounded"
                placeholder="e.g., Minimalist, Colorful, Corporate, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content ID (Optional)</label>
              <input 
                type="number"
                value={image.contentId ?? ""}
                onChange={(e) => setContentId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-2 border rounded"
                placeholder="Enter content ID if applicable"
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
            {isLoading ? "Generating..." : image.result ? "Generated" : "Generated Image:"}
          </h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ) : image.result ? (
            <>
              <Image 
                src={`data:${image.result.mimeType};base64,${image.result.imageBase64}`} 
                alt={image.result.altText}
                width={500}
                height={500}
                className="max-w-full h-auto rounded"
              />
              <p className="mt-2 text-sm text-gray-600">Alt text: {image.result.altText}</p>
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
