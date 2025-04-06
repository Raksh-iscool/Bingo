'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/trpc/react';
import { 
  Loader2, 
  Youtube, 
  CheckCircle, 
  XCircle, 
  Play, 
  Clock, 
  ExternalLink, 
  Upload, 
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

export default function YouTubeConnector() {
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'public' | 'unlisted'>('private');
  const [tags, setTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Fetch authentication status and URL
const authStatusQuery = api.youtube.checkAuthentication.useQuery(undefined, {
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
  
  const authUrlQuery = api.youtube.getAuthUrl.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch videos only if authenticated
  const videosQuery = api.youtube.getUserVideos.useQuery(undefined, {
    enabled: authStatusQuery.data?.isAuthenticated === true,
    refetchOnWindowFocus: false,
  });
  
  // Function to handle OAuth redirect
  const handleConnectYouTube = () => {
    if (authUrlQuery.data?.url) {
      window.location.href = authUrlQuery.data.url;
    }
  };
  
  // Function to handle file selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoFile(e.target.files?.[0] ?? null);
  };
  
  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThumbnailFile(e.target.files?.[0] ?? null);
  };
  
  // Function to handle video upload
  const handleUploadVideo = async () => {
    if (!videoFile || !title) return;
    
    setUploadProgress(true);
    setUploadError(null);
    
    try {
      // Extract tags array from the comma-separated string
      const tagsArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Create FormData instead of using buffers directly
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Create a payload with text data
      const payload = {
        title,
        description,
        tags: tagsArray,
        privacyStatus,
      };
      
      // Convert metadata to JSON string and append to formData
      formData.append('metadata', JSON.stringify(payload));
      
      // Send the form data to your API endpoint
      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? 'Failed to upload video');
      }
      
      // Manual success handling
      setVideoFile(null);
      setThumbnailFile(null);
      setTitle('');
      setDescription('');
      setPrivacyStatus('private');
      setTags('');
      setUploadProgress(false);
      setUploadDialogOpen(false);
      
      // Refetch videos to show the new upload
      void videosQuery.refetch();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload video. Please try again.');
      setUploadProgress(false);
    }
  };
  
  // Check loading state
  useEffect(() => {
    if (!authStatusQuery.isLoading && !authUrlQuery.isLoading) {
      if (authStatusQuery.data?.isAuthenticated && videosQuery.isLoading) {
        // Still loading videos
        return;
      }
      setIsLoading(false);
    }
  }, [authStatusQuery.isLoading, authUrlQuery.isLoading, authStatusQuery.data?.isAuthenticated, videosQuery.isLoading]);
  
  // Error handling
  if (authStatusQuery.error || authUrlQuery.error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <XCircle className="mr-2" />
            Error Loading YouTube Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            There was an error connecting to YouTube. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(date));
  };
  
  // Privacy status badge component
  const PrivacyBadge = ({ status }: { status: 'private' | 'public' | 'unlisted' }) => {
    const colors = {
      private: "bg-gray-100 text-gray-800",
      public: "bg-green-100 text-green-800",
      unlisted: "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Youtube className="mr-2" />
            YouTube Integration
          </CardTitle>
          <CardDescription>
            Connect your account to upload and manage videos on YouTube
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              {authStatusQuery.data?.isAuthenticated ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-green-600 mb-2">
                    <CheckCircle className="mr-2" />
                    <span className="font-medium">Connected to YouTube</span>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Your account is connected to YouTube. You can now upload and manage videos.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-amber-600 mb-2">
                    <XCircle className="mr-2" />
                    <span className="font-medium">Not Connected</span>
                  </div>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Connect your account to YouTube to upload and manage videos directly from this application.
                  </p>
                  <Button 
                    onClick={handleConnectYouTube}
                    disabled={!authUrlQuery.data?.url}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Connect to YouTube
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-gray-50 text-xs text-gray-500 justify-center py-3">
          This integration requires YouTube permissions for video uploads and management
        </CardFooter>
      </Card>
      
      {/* Video list section - only shown when connected */}
      {authStatusQuery.data?.isAuthenticated && (
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your YouTube Videos</CardTitle>
              <CardDescription>
                Videos you&rsquo;ve uploaded through this integration
              </CardDescription>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/schedule/youtube'}
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule Video
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload to YouTube</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to upload your video to YouTube.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Video file selection */}
                  <div className="grid gap-2">
                    <Label htmlFor="video-file" className="text-right">
                      Video File*
                    </Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="video-file" 
                        ref={videoInputRef}
                        className="hidden" 
                        accept="video/*"
                        onChange={handleVideoFileChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full justify-start"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {videoFile ? videoFile.name : "Select video file"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-right">
                      Title*
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Enter video description"
                      rows={3}
                    />
                  </div>
                  
                  {/* Privacy status */}
                  <div className="grid gap-2">
                    <Label htmlFor="privacy" className="text-right">
                      Privacy
                    </Label>
                    <Select 
                      value={privacyStatus} 
                      onValueChange={(value) => setPrivacyStatus(value as 'private' | 'public' | 'unlisted')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy setting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Tags */}
                  <div className="grid gap-2">
                    <Label htmlFor="tags" className="text-right">
                      Tags (comma separated)
                    </Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  
                  {/* Thumbnail */}
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail" className="text-right">
                      Thumbnail (Optional)
                    </Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="thumbnail" 
                        ref={thumbnailInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="w-full justify-start"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {thumbnailFile ? thumbnailFile.name : "Select thumbnail image"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {uploadError && (
                    <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{uploadError}</div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadVideo} 
                    disabled={!videoFile || !title || uploadProgress}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {uploadProgress ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          
          <CardContent>
            {videosQuery.isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : videosQuery.error ? (
              <div className="text-center py-8">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-gray-500">Failed to load your videos. Please try again later.</p>
              </div>
            ) : videosQuery.data && videosQuery.data.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {videosQuery.data?.map((video) => (
                  <div key={video.id} className="border rounded-md overflow-hidden bg-white">
                    <div className="relative aspect-video bg-gray-100">
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title ?? 'Video thumbnail'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Play className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium line-clamp-2">{video.title}</h3>
                        <PrivacyBadge status={video.privacyStatus as 'private' | 'public' | 'unlisted'} />
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Uploaded on {formatDate(video.createdAt)}</span>
                      </div>
                      
                      <a 
                        href={video.videoUrl ?? undefined}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span>View on YouTube</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                  <Youtube className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No videos yet</h3>
                <p className="text-gray-500 mb-4">You haven&apos;t uploaded any videos through this integration.</p>
                <Button 
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Your First Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}