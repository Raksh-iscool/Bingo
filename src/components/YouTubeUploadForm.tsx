/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/YouTubeUploadForm.tsx
"use client"
import { api } from '@/trpc/react';
import { useState, useRef } from 'react';

type PrivacyStatus = 'private' | 'public' | 'unlisted';

export default function YouTubeUploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyStatus>('private');
  const [video, setVideo] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // tRPC mutation
  const uploadMutation = api.youtube.uploadVideo.useMutation({
    onSuccess: (data) => {
      setUploadResult(data);
      setUploading(false);
      setProgress(100);
      resetForm();
    },
    onError: (error) => {
      setError(error.message);
      setUploading(false);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !title) {
      setError('Video file and title are required');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Convert video file to buffer
      if (!video) throw new Error('Video file is required');
      const videoBuffer = await fileToBuffer(video);
      
      // Convert thumbnail to buffer if present
      let thumbnailBuffer = null;
      if (thumbnail) {
        thumbnailBuffer = await fileToBuffer(thumbnail);
      }
      
      // Parse tags
      const tagArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload video
      uploadMutation.mutate({
        videoBuffer,
        title,
        description,
        tags: tagArray,
        privacyStatus: privacy,
        thumbnailBuffer
      });
      
      // Simulate progress (since we don't have real-time progress)
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= 95) {
          clearInterval(progressInterval);
        } else {
          setProgress(currentProgress);
        }
      }, 1000);
      
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };
  
  // Helper function to convert File to Buffer
  const fileToBuffer = (file: File): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          const buffer = Buffer.from(reader.result);
          resolve(buffer);
        } else {
          reject(new Error('Failed to convert file to buffer'));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setPrivacy('private');
    setVideo(null);
    setThumbnail(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload to YouTube</h2>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {uploadResult && (
        <div className="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded">
          Video uploaded successfully! <a href={uploadResult?.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">View on YouTube</a>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Video File</label>
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            className="w-full p-2 border rounded"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Thumbnail (Optional)</label>
          <input
            type="file"
            ref={thumbnailInputRef}
            accept="image/*"
            className="w-full p-2 border rounded"
            onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
            disabled={uploading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-32"
            disabled={uploading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="tag1, tag2, tag3"
            disabled={uploading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Privacy Setting</label>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as PrivacyStatus)}
            className="w-full p-2 border rounded"
            disabled={uploading}
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </div>
        
        {uploading && (
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center mt-2">{progress}%</p>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={uploading ?? !video ?? !title}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
}