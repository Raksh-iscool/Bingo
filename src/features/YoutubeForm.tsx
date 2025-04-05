"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Upload, Edit2, FileVideo, Youtube, BarChart2 } from "lucide-react"
import { api } from "@/trpc/react"

const YouTubeComponent = () => {
  // Local state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [videoTags, setVideoTags] = useState("")
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "public" | "unlisted">("private")
  const [selectedVideoId, setSelectedVideoId] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // TRPC queries and mutations
  const authStatus = api.youtube.checkAuthentication.useQuery()
  const authUrlQuery = api.youtube.getAuthUrl.useQuery()
  const saveAuthToken = api.youtube.saveAuthToken.useMutation()
  const userVideos = api.youtube.getUserVideos.useQuery(undefined, {
    enabled: authStatus.data?.isAuthenticated === true,
  })
  const videoStatistics = api.youtube.getVideoStatistics.useQuery(
    { videoId: selectedVideoId },
    { enabled: !!selectedVideoId && authStatus.data?.isAuthenticated === true },
  )
  // Remove unused mutation declaration
  const updateVideoMutation = api.youtube.updateVideo.useMutation()
  const channelStats = api.youtube.getChannelStatistics.useQuery(undefined, {
    enabled: authStatus.data?.isAuthenticated === true,
  })
  const allVideosWithStats = api.youtube.getAllVideosWithStatistics.useQuery(undefined, {
    enabled: authStatus.data?.isAuthenticated === true,
  })

  // Handle OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")

    if (code && authStatus.data?.isAuthenticated === false) {
      // Fix floating promise
      void saveAuthToken
        .mutateAsync({ code })
        .then(() => {
          // Remove code from URL
          window.history.replaceState({}, document.title, window.location.pathname)
          // Refetch auth status
          void authStatus.refetch()
        })
        .catch((error) => {
          console.error("Error saving auth token:", error)
        })
    }
    // Fix dependency array
  }, [authStatus.data?.isAuthenticated, saveAuthToken, authStatus])

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Fix optional chain
    if (event.target?.files?.[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  // Handle thumbnail selection
  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Fix optional chain
    if (event.target?.files?.[0]) {
      setSelectedThumbnail(event.target.files[0])
    }
  }

  // Handle video upload
  const handleUpload = async () => {
    if (!selectedFile || !videoTitle) return

    setIsUploading(true)
    try {
      // Extract tags array from the comma-separated string
      const tagsArray = videoTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Create FormData
      const formData = new FormData()
      formData.append("video", selectedFile)
      if (selectedThumbnail) {
        formData.append("thumbnail", selectedThumbnail)
      }

      // Create a payload with text data
      const payload = {
        title: videoTitle,
        description: videoDescription,
        tags: tagsArray,
        privacyStatus,
      }

      // Convert metadata to JSON string and append to formData
      formData.append("metadata", JSON.stringify(payload))

      // Send the form data to your API endpoint
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        // Fix unsafe assignment and member access
        const errorData = (await response.json()) as { message?: string }
        throw new Error(errorData.message ?? "Failed to upload video")
      }

      // Reset form
      setSelectedFile(null)
      setSelectedThumbnail(null)
      setVideoTitle("")
      setVideoDescription("")
      setVideoTags("")
      setPrivacyStatus("private")

      if (fileInputRef.current) fileInputRef.current.value = ""
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""

      // Fix floating promises
      void userVideos.refetch()
      void allVideosWithStats.refetch()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle video update
  const handleUpdate = async () => {
    if (!selectedVideoId || !videoTitle) return

    setIsUpdating(true)

    try {
      // Prepare tags array
      const tags = videoTags ? videoTags.split(",").map((tag) => tag.trim()) : []

      // Update video
      await updateVideoMutation.mutateAsync({
        videoId: selectedVideoId,
        title: videoTitle,
        description: videoDescription,
        tags,
        privacyStatus,
      })

      // Reset form
      setVideoTitle("")
      setVideoDescription("")
      setVideoTags("")
      setPrivacyStatus("private")
      setSelectedVideoId("")

      // Fix floating promises
      void userVideos.refetch()
      void allVideosWithStats.refetch()
    } catch (error) {
      console.error("Update failed:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Fill form with selected video data
  const selectVideoForEdit = (videoId: string) => {
    if (!userVideos.data) return

    const video = userVideos.data.find((v) => String(v.youtubeId) === videoId)
    if (video) {
      setSelectedVideoId(videoId)
      setVideoTitle(video.title)
      // Fix nullish coalescing
      setVideoDescription(video.description ?? "")
      // Fix toString issue
      setVideoTags(Array.isArray(video.tags) ? video.tags.join(",") : typeof video.tags === "string" ? video.tags : "")
      setPrivacyStatus(video.privacyStatus as "private" | "public" | "unlisted")
    }
  }

  // Format numbers for readability
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  // Render authentication section
  const renderAuthSection = () => {
    if (authStatus.isLoading) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (authStatus.data?.isAuthenticated) {
      return (
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-md mb-6">
          <p className="flex items-center text-green-700 dark:text-green-300">
            <Youtube className="mr-2" /> Connected to YouTube
          </p>
        </div>
      )
    }

    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-md mb-6">
        <p className="mb-4 text-yellow-800 dark:text-yellow-200">You need to connect to YouTube to use this feature.</p>
        {authUrlQuery.data && (
          <Button asChild>
            <a href={authUrlQuery.data.url} className="flex items-center">
              <Youtube className="mr-2" /> Connect to YouTube
            </a>
          </Button>
        )}
      </div>
    )
  }

  // Render YouTube component
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Youtube className="mr-2" /> YouTube Manager
      </h1>

      {renderAuthSection()}

      {authStatus.data?.isAuthenticated && (
        <Tabs defaultValue="videos">
          <TabsList className="mb-6">
            <TabsTrigger value="videos">
              <FileVideo className="mr-2" /> Videos
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2" /> Upload
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit2 className="mr-2" /> Edit
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart2 className="mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Your YouTube Videos</CardTitle>
                <CardDescription>Manage your YouTube content</CardDescription>
              </CardHeader>
              <CardContent>
                {userVideos.isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : userVideos.data && userVideos.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thumbnail</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userVideos.data.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            {video.thumbnailUrl ? (
                              // Fix <img> warning with next/image
                              <Image
                                src={video.thumbnailUrl || "/placeholder.svg"}
                                alt={video.title}
                                width={80}
                                height={45}
                                className="rounded"
                              />
                            ) : (
                              <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                <FileVideo size={16} />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{video.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(video.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                video.privacyStatus === "public"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : video.privacyStatus === "unlisted"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" +
                                      " px-2 py-1 rounded-full text-xs"
                              }
                            >
                              {video.privacyStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => selectVideoForEdit(String(video.id))}>
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No videos found. Upload your first video!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Video</CardTitle>
                <CardDescription>Share your content on YouTube</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Video File</label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,.mov"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                        Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Thumbnail (Optional)</label>
                    <Input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="cursor-pointer"
                    />
                    {selectedThumbnail && (
                      <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                        Selected: {selectedThumbnail.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      placeholder="Enter video description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                    <Input
                      value={videoTags}
                      onChange={(e) => setVideoTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Privacy Status</label>
                    <Select
                      value={privacyStatus}
                      onValueChange={(value: "private" | "public" | "unlisted") => setPrivacyStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !videoTitle || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Video
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Edit Video</CardTitle>
                <CardDescription>Update your YouTube video details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Video</label>
                    <Select value={selectedVideoId} onValueChange={selectVideoForEdit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a video to edit" />
                      </SelectTrigger>
                      <SelectContent>
                        {userVideos.data?.map((video) => (
                          <SelectItem key={video.id} value={String(video.id)}>
                            {video.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedVideoId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="Enter video title"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          placeholder="Enter video description"
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                        <Input
                          value={videoTags}
                          onChange={(e) => setVideoTags(e.target.value)}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Privacy Status</label>
                        <Select
                          value={privacyStatus}
                          onValueChange={(value: "private" | "public" | "unlisted") => setPrivacyStatus(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select privacy status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleUpdate}
                  disabled={!selectedVideoId || !videoTitle || isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Update Video
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Channel Analytics</CardTitle>
                  <CardDescription>Overall channel performance</CardDescription>
                </CardHeader>
                <CardContent>
                  {channelStats.isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : channelStats.data ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Subscribers</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(Number(channelStats.data.channel?.statistics?.subscriberCount ?? 0))}
                        </p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(Number(channelStats.data.channel?.statistics?.viewCount ?? 0))}
                        </p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Videos</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(Number(channelStats.data.channel?.statistics?.videoCount ?? 0))}
                        </p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(Number(channelStats.data.channel?.statistics?.commentCount ?? 0))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Unable to fetch channel statistics
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Video Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Analytics</CardTitle>
                  <CardDescription>Select a video to view statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a video" />
                      </SelectTrigger>
                      <SelectContent>
                        {userVideos.data?.map((video) => (
                          <SelectItem key={video.id} value={String(video.id)}>
                            {video.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedVideoId &&
                    (videoStatistics.isLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : videoStatistics.data ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
                          {/* Fix unsafe member access */}
                          <p className="text-2xl font-bold">
                            {formatNumber(Number(videoStatistics.data.statistics?.viewCount ?? 0))}
                          </p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Likes</p>
                          {/* Fix unsafe member access */}
                          <p className="text-2xl font-bold">
                            {formatNumber(Number(videoStatistics.data.statistics?.likeCount ?? 0))}
                          </p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
                          {/* Fix unsafe member access */}
                          <p className="text-2xl font-bold">
                            {formatNumber(Number(videoStatistics.data.statistics?.commentCount ?? 0))}
                          </p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
                          <p className="text-2xl font-bold">
                            {formatNumber(Number(videoStatistics.data.statistics?.favoriteCount ?? 0))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Select a video to view statistics
                      </p>
                    ))}
                </CardContent>
              </Card>

              {/* All Videos Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>All Videos Performance</CardTitle>
                  <CardDescription>Compare performance across all videos</CardDescription>
                </CardHeader>
                <CardContent>
                  {allVideosWithStats.isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : allVideosWithStats.data && allVideosWithStats.data.videos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Video</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Likes</TableHead>
                            <TableHead className="text-right">Comments</TableHead>
                            <TableHead>Published</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVideosWithStats.data.videos.map((video) => {
                            const youtubeDetails = video.youtubeDetails as {
                              statistics?: {
                                viewCount?: string
                                likeCount?: string
                                commentCount?: string
                              }
                            }
                            const statistics = youtubeDetails?.statistics ?? {
                              viewCount: "0",
                              likeCount: "0",
                              commentCount: "0",
                            }

                            return (
                              <TableRow key={video.title}>
                                <TableCell>{video.title}</TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(Number(statistics.viewCount ?? 0))}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(Number(statistics.likeCount ?? 0))}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatNumber(Number(statistics.commentCount ?? 0))}
                                </TableCell>
                                <TableCell>{new Date(video.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">No video statistics available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default YouTubeComponent

