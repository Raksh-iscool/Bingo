// "use client";
// import { api } from '@/trpc/react';
// import React, { useState } from 'react';

// const YouTubeForm = () => {
//   // Authentication states
//   const [authUrl, setAuthUrl] = useState("");
//   const [authCode, setAuthCode] = useState("");
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
  
//   // Video management states
//   const [userVideos, setUserVideos] = useState([]);
//   const [selectedVideo, setSelectedVideo] = useState(null);
//   const [videoStats, setVideoStats] = useState(null);
  
//   // Video upload states
//   const [videoFile, setVideoFile] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);
//   const [videoTitle, setVideoTitle] = useState("");
//   const [videoDescription, setVideoDescription] = useState("");
//   const [videoTags, setVideoTags] = useState("");
//   const [privacyStatus, setPrivacyStatus] = useState("private");
  
//   // Video update states
//   const [updatedTitle, setUpdatedTitle] = useState("");
//   const [updatedDescription, setUpdatedDescription] = useState("");
//   const [updatedTags, setUpdatedTags] = useState("");
//   const [updatedPrivacyStatus, setUpdatedPrivacyStatus] = useState("");
  
//   // UI states
//   const [activeTab, setActiveTab] = useState("auth");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // tRPC Queries and Mutations
//   const getAuthUrlQuery = api.generateYoutube.getAuthUrl.useQuery(undefined, {
//     onSuccess: (data) => {
//       setAuthUrl(data.url);
//     },
//     onError: (error) => {
//       setError(error.message);
//     },
//     enabled: false
//   });

//   const saveAuthToken = api.generateYoutube.saveAuthToken.useMutation({
//     onSuccess: () => {
//       setIsAuthenticated(true);
//       setIsLoading(false);
//       setError("");
//       setSuccess("Successfully authenticated with YouTube!");
//       // Fetch videos after successful authentication
//       getUserVideosQuery.refetch();
//     },
//     onError: (error) => {
//       setError(error.message);
//       setIsLoading(false);
//     }
//   });

//   const getUserVideosQuery = api.generateYoutube.getUserVideos.useQuery(undefined, {
//     onSuccess: (data) => {
//       setUserVideos(data);
//     },
//     onError: (error) => {
//       setError(error.message);
//     },
//     enabled: false
//   });

//   const getVideoQuery = api.generateYoutube.getVideo.useMutation({
//     onSuccess: (data) => {
//       setSelectedVideo(data);
//       // Pre-fill update form with current values
//       setUpdatedTitle(data.title || "");
//       setUpdatedDescription(data.description || "");
//       setUpdatedTags(data.tags?.join(", ") || "");
//       setUpdatedPrivacyStatus(data.privacyStatus || "private");
//     },
//     onError: (error) => {
//       setError(error.message);
//     }
//   });

//   const getVideoStatsQuery = api.generateYoutube.getVideoStatistics.useMutation({
//     onSuccess: (data) => {
//       setVideoStats(data);
//     },
//     onError: (error) => {
//       setError(error.message);
//     }
//   });

//   const uploadVideoMutation = api.generateYoutube.uploadVideo.useMutation({
//     onSuccess: (data) => {
//       setSuccess(`Video uploaded successfully! Video ID: ${data.videoId}`);
//       setIsLoading(false);
//       resetUploadForm();
//       getUserVideosQuery.refetch();
//     },
//     onError: (error) => {
//       setError(error.message);
//       setIsLoading(false);
//     }
//   });

//   const updateVideoMutation = api.generateYoutube.updateVideo.useMutation({
//     onSuccess: (data) => {
//       setSuccess(`Video updated successfully!`);
//       setIsLoading(false);
//       getUserVideosQuery.refetch();
//     },
//     onError: (error) => {
//       setError(error.message);
//       setIsLoading(false);
//     }
//   });

//   // Helper functions
//   const resetUploadForm = () => {
//     setVideoFile(null);
//     setThumbnailFile(null);
//     setVideoTitle("");
//     setVideoDescription("");
//     setVideoTags("");
//     setPrivacyStatus("private");
//   };

//   const handleGetAuthUrl = () => {
//     setError("");
//     getAuthUrlQuery.refetch();
//   };

//   const handleSaveToken = (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");
//     saveAuthToken.mutate({ code: authCode });
//   };

//   const handleVideoSelection = (videoId) => {
//     setError("");
//     setSuccess("");
//     setSelectedVideo(null);
//     setVideoStats(null);
//     getVideoQuery.mutate({ videoId });
//     getVideoStatsQuery.mutate({ videoId });
//   };

//   const handleVideoUpload = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");
//     setSuccess("");

//     try {
//       // Convert files to buffers
//       const videoBuffer = await fileToBuffer(videoFile);
//       let thumbnailBuffer = null;
//       if (thumbnailFile) {
//         thumbnailBuffer = await fileToBuffer(thumbnailFile);
//       }

//       // Parse tags
//       const tagArray = videoTags.split(",").map(tag => tag.trim()).filter(tag => tag);

//       // Upload the video
//       uploadVideoMutation.mutate({
//         videoBuffer,
//         title: videoTitle,
//         description: videoDescription,
//         tags: tagArray,
//         privacyStatus: privacyStatus,
//         thumbnailBuffer
//       });
//     } catch (err) {
//       setError("Error processing files: " + err.message);
//       setIsLoading(false);
//     }
//   };

//   const handleVideoUpdate = (e) => {
//     e.preventDefault();
//     if (!selectedVideo?.id) {
//       setError("No video selected for update");
//       return;
//     }

//     setIsLoading(true);
//     setError("");
//     setSuccess("");

//     // Parse tags
//     const tagArray = updatedTags.split(",").map(tag => tag.trim()).filter(tag => tag);

//     updateVideoMutation.mutate({
//       videoId: selectedVideo.id,
//       title: updatedTitle,
//       description: updatedDescription,
//       tags: tagArray,
//       privacyStatus: updatedPrivacyStatus
//     });
//   };

//   const fileToBuffer = (file) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         const arrayBuffer = reader.result;
//         const buffer = Buffer.from(arrayBuffer);
//         resolve(buffer);
//       };
//       reader.onerror = (error) => reject(error);
//       reader.readAsArrayBuffer(file);
//     });
//   };

//   const refreshVideos = () => {
//     setError("");
//     getUserVideosQuery.refetch();
//   };

//   return (
//     <div className="p-6 bg-white rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold mb-6">YouTube Integration</h2>
      
//       {/* Tab Navigation */}
//       <div className="flex mb-6 border-b">
//         <button 
//           className={`px-4 py-2 ${activeTab === 'auth' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
//           onClick={() => setActiveTab('auth')}
//         >
//           Authentication
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'videos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
//           onClick={() => {
//             setActiveTab('videos');
//             if (isAuthenticated) {
//               refreshVideos();
//             }
//           }}
//           disabled={!isAuthenticated}
//         >
//           My Videos
//         </button>
//         <button 
//           className={`px-4 py-2 ${activeTab === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
//           onClick={() => setActiveTab('upload')}
//           disabled={!isAuthenticated}
//         >
//           Upload Video
//         </button>
//       </div>
      
//       {/* Status Messages */}
//       {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
//       {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
      
//       {/* Authentication Tab */}
//       {activeTab === 'auth' && (
//         <div className="space-y-6">
//           {!isAuthenticated ? (
//             <div className="space-y-4">
//               <div>
//                 <button 
//                   onClick={handleGetAuthUrl} 
//                   className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//                   disabled={getAuthUrlQuery.isFetching}
//                 >
//                   {getAuthUrlQuery.isFetching ? "Generating..." : "Get Authorization URL"}
//                 </button>
//               </div>
              
//               {authUrl && (
//                 <div>
//                   <p className="mb-2">Please authenticate with YouTube:</p>
//                   <a 
//                     href={authUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:underline"
//                   >
//                     Click here to authorize
//                   </a>
                  
//                   <form onSubmit={handleSaveToken} className="mt-4 space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium mb-1">Authorization Code</label>
//                       <input 
//                         type="text"
//                         value={authCode} 
//                         onChange={(e) => setAuthCode(e.target.value)} 
//                         className="w-full p-2 border rounded"
//                         placeholder="Paste the code from YouTube here"
//                         required
//                       />
//                     </div>
                    
//                     <button 
//                       type="submit" 
//                       className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                       disabled={isLoading}
//                     >
//                       {isLoading ? "Saving..." : "Save Authorization"}
//                     </button>
//                   </form>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="p-3 bg-green-100 text-green-700 rounded">
//               You are successfully authenticated with YouTube!
//               <button 
//                 className="ml-4 px-3 py-1 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50"
//                 onClick={() => setIsAuthenticated(false)}
//               >
//                 Disconnect
//               </button>
//             </div>
//           )}
//         </div>
//       )}
      
//       {/* Videos Tab */}
//       {activeTab === 'videos' && isAuthenticated && (
//         <div className="space-y-6">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-medium">My YouTube Videos</h3>
//             <button 
//               onClick={refreshVideos}
//               className="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200"
//               disabled={getUserVideosQuery.isFetching}
//             >
//               {getUserVideosQuery.isFetching ? "Refreshing..." : "Refresh"}
//             </button>
//           </div>
          
//           {getUserVideosQuery.isFetching ? (
//             <div className="text-center py-4">Loading videos...</div>
//           ) : userVideos.length > 0 ? (
//             <div className="grid md:grid-cols-2 gap-4">
//               {userVideos.map((video) => (
//                 <div 
//                   key={video.id} 
//                   className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${selectedVideo?.id === video.id ? 'border-blue-500 bg-blue-50' : ''}`}
//                   onClick={() => handleVideoSelection(video.id)}
//                 >
//                   <h4 className="font-medium">{video.title}</h4>
//                   <p className="text-sm text-gray-600 truncate">{video.description}</p>
//                   <div className="mt-2 text-xs text-gray-500">
//                     {video.privacyStatus} • {new Date(video.publishedAt).toLocaleDateString()}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-6 text-gray-500">No videos found</div>
//           )}
          
//           {/* Selected Video Details */}
//           {selectedVideo && (
//             <div className="mt-8 border-t pt-6">
//               <h3 className="text-lg font-medium mb-4">Video Details</h3>
              
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="font-medium mb-2">Information</h4>
//                   <div className="space-y-2">
//                     <p><span className="font-medium">Title:</span> {selectedVideo.title}</p>
//                     <p><span className="font-medium">Description:</span> {selectedVideo.description}</p>
//                     <p><span className="font-medium">Status:</span> {selectedVideo.privacyStatus}</p>
//                     <p><span className="font-medium">Published:</span> {new Date(selectedVideo.publishedAt).toLocaleString()}</p>
//                     <p><span className="font-medium">Video ID:</span> {selectedVideo.id}</p>
//                     {selectedVideo.tags && selectedVideo.tags.length > 0 && (
//                       <div>
//                         <span className="font-medium">Tags:</span> 
//                         <div className="flex flex-wrap gap-1 mt-1">
//                           {selectedVideo.tags.map((tag, index) => (
//                             <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
//                               {tag}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
                
//                 {videoStats && (
//                   <div>
//                     <h4 className="font-medium mb-2">Statistics</h4>
//                     <div className="space-y-2">
//                       <p><span className="font-medium">Views:</span> {videoStats.viewCount}</p>
//                       <p><span className="font-medium">Likes:</span> {videoStats.likeCount}</p>
//                       <p><span className="font-medium">Comments:</span> {videoStats.commentCount}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
              
//               {/* Update Form */}
//               <div className="mt-8 pt-6 border-t">
//                 <h4 className="font-medium mb-4">Update Video</h4>
//                 <form onSubmit={handleVideoUpdate} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Title</label>
//                     <input
//                       type="text"
//                       value={updatedTitle}
//                       onChange={(e) => setUpdatedTitle(e.target.value)}
//                       className="w-full p-2 border rounded"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Description</label>
//                     <textarea
//                       value={updatedDescription}
//                       onChange={(e) => setUpdatedDescription(e.target.value)}
//                       className="w-full p-2 border rounded"
//                       rows={4}
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
//                     <input
//                       type="text"
//                       value={updatedTags}
//                       onChange={(e) => setUpdatedTags(e.target.value)}
//                       className="w-full p-2 border rounded"
//                       placeholder="tag1, tag2, tag3"
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Privacy Status</label>
//                     <select
//                       value={updatedPrivacyStatus}
//                       onChange={(e) => setUpdatedPrivacyStatus(e.target.value)}
//                       className="w-full p-2 border rounded"
//                     >
//                       <option value="private">Private</option>
//                       <option value="unlisted">Unlisted</option>
//                       <option value="public">Public</option>
//                     </select>
//                   </div>
                  
//                   <button
//                     type="submit"
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                     disabled={isLoading || updateVideoMutation.isLoading}
//                   >
//                     {isLoading || updateVideoMutation.isLoading ? "Updating..." : "Update Video"}
//                   </button>
//                 </form>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
      
//       {/* Upload Tab */}
//       {activeTab === 'upload' && isAuthenticated && (
//         <div className="space-y-6">
//           <h3 className="text-lg font-medium">Upload New Video</h3>
//           <form onSubmit={handleVideoUpload} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Video File</label>
//               <input
//                 type="file"
//                 accept="video/*"
//                 onChange={(e) => setVideoFile(e.target.files[0])}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Title</label>
//               <input
//                 type="text"
//                 value={videoTitle}
//                 onChange={(e) => setVideoTitle(e.target.value)}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Description</label>
//               <textarea
//                 value={videoDescription}
//                 onChange={(e) => setVideoDescription(e.target.value)}
//                 className="w-full p-2 border rounded"
//                 rows={4}
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
//               <input
//                 type="text"
//                 value={videoTags}
//                 onChange={(e) => setVideoTags(e.target.value)}
//                 className="w-full p-2 border rounded"
//                 placeholder="tag1, tag2, tag3"
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Privacy Status</label>
//               <select
//                 value={privacyStatus}
//                 onChange={(e) => setPrivacyStatus(e.target.value)}
//                 className="w-full p-2 border rounded"
//               >
//                 <option value="private">Private</option>
//                 <option value="unlisted">Unlisted</option>
//                 <option value="public">Public</option>
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1">Thumbnail (optional)</label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setThumbnailFile(e.target.files[0])}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
            
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               disabled={isLoading || uploadVideoMutation.isLoading}
//             >
//               {isLoading || uploadVideoMutation.isLoading ? "Uploading..." : "Upload Video"}
//             </button>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default YouTubeForm;