// 'use client'

// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
// import { ChevronDown, ChevronUp, Eye, ThumbsUp, MessageSquare, Play, Users, Clock } from 'lucide-react';
// import { api } from '@/trpc/react';

// const YoutubeAnalyticsDashboard = () => {
//   const [activeTab, setActiveTab] = useState('overview');

//   // Fetch all videos with statistics
//   const videosQuery = api.youtube.getAllVideosWithStatistics.useQuery();

//   // Fetch channel statistics
//   const channelQuery = api.youtube.getChannelStatistics.useQuery();

//   // Check authentication status
//   const authQuery = api.youtube.checkAuthentication.useQuery();

//   // Loading state
//   const isLoading = videosQuery.isLoading || channelQuery.isLoading || authQuery.isLoading;

//   // Error handling
//   const isError = videosQuery.isError || channelQuery.isError || authQuery.isError;
//   const errorMessage = videosQuery.error?.message ?? channelQuery.error?.message ?? authQuery.error?.message;

//   // Handle authentication
//   const handleAuth = () => {
//     const authUrl = authQuery.data?.url;
//     window.location.href = authUrl ?? '/api/youtube/auth';
//   };

//   // Format date for display
//   const formatDate = (dateString: string | Date | undefined): string => {
//     if (!dateString) return 'N/A';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   // Format numbers
//   const formatNumber = (num: number | string | undefined): string => {
//     if (num === undefined || num === null) return '0';
//     const numValue = typeof num === 'string' ? parseInt(num, 10) : num;
//     return new Intl.NumberFormat('en-US').format(numValue);
//   };

//   // Format duration (ISO 8601 duration to readable format)
//   const formatDuration = (duration: string | undefined): string => {
//     if (!duration) return 'Unknown';

//     try {
//       // Parse PT#H#M#S format more safely
//       const durationRegex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
//       const matches = duration.match(durationRegex);

//       if (!matches) return 'Invalid';

//       const [, hours, minutes, seconds] = matches;

//       const hoursStr = hours ? `${hours}:` : '';
//       const minutesStr = `${minutes ?? '0'}`.padStart(2, '0');
//       const secondsStr = `${seconds ?? '0'}`.padStart(2, '0');

//       return `${hoursStr}${minutesStr}:${secondsStr}`;
//     } catch (error) {
//       return 'Invalid';
//     }
//   };

//   // If not authenticated
//   if (authQuery.data && !authQuery.data.isAuthenticated) {
//     return (
//       <div className="flex flex-col items-center justify-center p-8 h-64">
//         <h2 className="text-2xl font-bold mb-4">YouTube Integration</h2>
//         <p className="mb-6 text-gray-600">Connect your YouTube account to view analytics and manage videos.</p>
//         <button 
//           onClick={handleAuth}
//           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
//         >
//           <Play className="mr-2 h-4 w-4" /> Connect YouTube Account
//         </button>
//       </div>
//     );
//   }

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center p-8 h-64">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
//           <p className="mt-4">Loading YouTube analytics...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (isError) {
//     return (
//       <div className="flex items-center justify-center p-8 h-64">
//         <div className="text-center">
//           <p className="text-red-500 font-bold">Error loading YouTube analytics</p>
//           <p className="mt-2">{errorMessage || "Please try again later"}</p>
//         </div>
//       </div>
//     );
//   }

//   // Extract data
//   const videos = videosQuery.data?.videos ?? [];
//   const videoStats = videosQuery.data?.statistics ?? { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0 };
//   const channelData = channelQuery.data?.channel;
//   const channelStats = channelData?.statistics ?? {};
//   const analyticsData = channelQuery.data?.analytics;

//   // Prepare analytics data for charts if available
//   const viewsChartData = analyticsData?.rows?.map((row, index) => ({
//     date: row[0],
//     views: Number(row[1] ?? 0),
//     watchTime: Number(row[2] ?? 0) / 60, // Convert minutes to hours
//   })) ?? [];

//   const subscribersChartData = analyticsData?.rows?.map((row, index) => ({
//     date: row[0],
//     gained: Number(row[6] || 0),
//     lost: Number(row[7] || 0),
//     net: Number(row[6] || 0) - Number(row[7] || 0),
//   })) || [];

//   return (
//     <div className="w-full px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">YouTube Analytics Dashboard</h1>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="mb-6">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="videos">Videos</TabsTrigger>
//           <TabsTrigger value="channel">Channel</TabsTrigger>
//         </TabsList>

//         {/* Overview Tab */}
//         <TabsContent value="overview">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium text-gray-500">Total Videos</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center">
//                   <Play className="h-5 w-5 text-gray-500 mr-2" />
//                   <p className="text-2xl font-bold">{videoStats.totalVideos}</p>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium text-gray-500">Total Views</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center">
//                   <Eye className="h-5 w-5 text-gray-500 mr-2" />
//                   <p className="text-2xl font-bold">{formatNumber(videoStats.totalViews)}</p>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium text-gray-500">Total Likes</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center">
//                   <ThumbsUp className="h-5 w-5 text-gray-500 mr-2" />
//                   <p className="text-2xl font-bold">{formatNumber(videoStats.totalLikes)}</p>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-sm font-medium text-gray-500">Total Comments</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center">
//                   <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
//                   <p className="text-2xl font-bold">{formatNumber(videoStats.totalComments)}</p>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Views Over Time (Last 30 Days)</CardTitle>
//               </CardHeader>
//               <CardContent className="h-64">
//                 {viewsChartData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={viewsChartData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="date" />
//                       <YAxis />
//                       <Tooltip />
//                       <Legend />
//                       <Line type="monotone" dataKey="views" stroke="#3b82f6" activeDot={{ r: 8 }} />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex items-center justify-center h-full">
//                     <p className="text-gray-500">No analytics data available</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Subscribers (Last 30 Days)</CardTitle>
//               </CardHeader>
//               <CardContent className="h-64">
//                 {subscribersChartData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={subscribersChartData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="date" />
//                       <YAxis />
//                       <Tooltip />
//                       <Legend />
//                       <Bar dataKey="gained" fill="#4ade80" name="Gained" />
//                       <Bar dataKey="lost" fill="#f87171" name="Lost" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex items-center justify-center h-full">
//                     <p className="text-gray-500">No analytics data available</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>Top Videos</CardTitle>
//               <CardDescription>Your best performing videos by views</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr>
//                       <th className="text-left py-2">Title</th>
//                       <th className="text-right py-2">Views</th>
//                       <th className="text-right py-2">Likes</th>
//                       <th className="text-right py-2">Comments</th>
//                       <th className="text-right py-2">Published</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {videos.slice(0, 5)
//                       .sort((a, b) => {
//                         const aViews = parseInt(a.youtubeDetails?.statistics?.viewCount || '0');
//                         const bViews = parseInt(b.youtubeDetails?.statistics?.viewCount || '0');
//                         return bViews - aViews;
//                       })
//                       .map((video) => (
//                         <tr key={video.id} className="border-t">
//                           <td className="py-3">
//                             <div className="flex items-center">
//                               <div className="ml-2">
//                                 <p className="font-medium">{video.title}</p>
//                                 <p className="text-sm text-gray-500 truncate max-w-md">{video.description}</p>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="text-right">
//                             <div className="flex items-center justify-end">
//                               <Eye className="h-4 w-4 mr-1 text-gray-500" />
//                               {formatNumber(video.youtubeDetails?.statistics?.viewCount || 0)}
//                             </div>
//                           </td>
//                           <td className="text-right">
//                             <div className="flex items-center justify-end">
//                               <ThumbsUp className="h-4 w-4 mr-1 text-gray-500" />
//                               {formatNumber(video.youtubeDetails?.statistics?.likeCount || 0)}
//                             </div>
//                           </td>
//                           <td className="text-right">
//                             <div className="flex items-center justify-end">
//                               <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
//                               {formatNumber(video.youtubeDetails?.statistics?.commentCount || 0)}
//                             </div>
//                           </td>
//                           <td className="text-right text-gray-500">
//                             {formatDate(video.createdAt)}
//                           </td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Videos Tab */}
//         <TabsContent value="videos">
//           <Card>
//             <CardHeader>
//               <CardTitle>All Videos</CardTitle>
//               <CardDescription>Performance metrics for all uploaded videos</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr>
//                       <th className="text-left py-2">Title</th>
//                       <th className="text-center py-2">Privacy</th>
//                       <th className="text-right py-2">Duration</th>
//                       <th className="text-right py-2">Views</th>
//                       <th className="text-right py-2">Likes</th>
//                       <th className="text-right py-2">Comments</th>
//                       <th className="text-right py-2">Published</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {videos.map((video) => (
//                       <tr key={video.id} className="border-t">
//                         <td className="py-3">
//                           <div className="flex items-start">
//                             <div>
//                               <p className="font-medium">{video.title}</p>
//                               <a 
//                                 href={video.videoUrl} 
//                                 target="_blank" 
//                                 rel="noopener noreferrer" 
//                                 className="text-sm text-blue-500 hover:underline"
//                               >
//                                 Watch on YouTube
//                               </a>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="text-center">
//                           <span className={`inline-block px-2 py-1 text-xs rounded ${
//                             video.privacyStatus === 'public' 
//                               ? 'bg-green-100 text-green-800' 
//                               : video.privacyStatus === 'unlisted'
//                                 ? 'bg-yellow-100 text-yellow-800'
//                                 : 'bg-gray-100 text-gray-800'
//                           }`}>
//                             {video.privacyStatus}
//                           </span>
//                         </td>
//                         <td className="text-right">
//                           {formatDuration(video.youtubeDetails?.contentDetails?.duration)}
//                         </td>
//                         <td className="text-right">
//                           <div className="flex items-center justify-end">
//                             <Eye className="h-4 w-4 mr-1 text-gray-500" />
//                             {formatNumber(video.youtubeDetails?.statistics?.viewCount || 0)}
//                           </div>
//                         </td>
//                         <td className="text-right">
//                           <div className="flex items-center justify-end">
//                             <ThumbsUp className="h-4 w-4 mr-1 text-gray-500" />
//                             {formatNumber(video.youtubeDetails?.statistics?.likeCount || 0)}
//                           </div>
//                         </td>
//                         <td className="text-right">
//                           <div className="flex items-center justify-end">
//                             <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
//                             {formatNumber(video.youtubeDetails?.statistics?.commentCount ?? 0)}
//                           </div>
//                         </td>
//                         <td className="text-right text-gray-500">
//                           {formatDate(video.createdAt)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Channel Tab */}
//         <TabsContent value="channel">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Channel Information</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {channelData ? (
//                   <div>
//                     <div className="flex items-center mb-4">
//                       {channelData.snippet?.thumbnails?.default?.url && (
//                         <img 
//                           src="/api/placeholder/64/64" 
//                           alt="Channel thumbnail"
//                           className="w-16 h-16 rounded-full mr-4"
//                         />
//                       )}
//                       <div>
//                         <h3 className="font-bold text-lg">{channelData.snippet?.title}</h3>
//                         <p className="text-gray-500">{channelData.snippet?.customUrl}</p>
//                       </div>
//                     </div>

//                     <p className="text-sm mb-4 text-gray-700">
//                       {channelData.snippet?.description ?? 'No channel description'}
//                     </p>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="p-3 bg-gray-50 rounded">
//                         <div className="flex items-center mb-1">
//                           <Users className="h-4 w-4 mr-1 text-gray-500" />
//                           <span className="text-sm text-gray-500">Subscribers</span>
//                         </div>
//                         <p className="font-bold">{formatNumber(channelStats.subscriberCount ?? 0)}</p>
//                       </div>

//                       <div className="p-3 bg-gray-50 rounded">
//                         <div className="flex items-center mb-1">
//                           <Play className="h-4 w-4 mr-1 text-gray-500" />
//                           <span className="text-sm text-gray-500">Videos</span>
//                         </div>
//                         <p className="font-bold">{formatNumber(channelStats.videoCount ?? 0)}</p>
//                       </div>

//                       <div className="p-3 bg-gray-50 rounded">
//                         <div className="flex items-center mb-1">
//                           <Eye className="h-4 w-4 mr-1 text-gray-500" />
//                           <span className="text-sm text-gray-500">Total Views</span>
//                         </div>
//                         <p className="font-bold">{formatNumber(channelStats.viewCount ?? 0)}</p>
//                       </div>

//                       <div className="p-3 bg-gray-50 rounded">
//                         <div className="flex items-center mb-1">
//                           <Clock className="h-4 w-4 mr-1 text-gray-500" />
//                           <span className="text-sm text-gray-500">Created</span>
//                         </div>
//                         <p className="font-bold">{formatDate(channelData.snippet?.publishedAt ?? undefined)}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <p>No channel data available</p>
//                 )}
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Watch Time (Last 30 Days)</CardTitle>
//               </CardHeader>
//               <CardContent className="h-64">
//                 {viewsChartData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={viewsChartData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="date" />
//                       <YAxis />
//                       <Tooltip />
//                       <Legend />
//                       <Line type="monotone" dataKey="watchTime" stroke="#8b5cf6" name="Watch Time (hours)" />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex items-center justify-center h-full">
//                     <p className="text-gray-500">No watch time data available</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {analyticsData && analyticsData.rows && analyticsData.rows.length > 0 && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Daily Analytics</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr>
//                         <th className="text-left py-2">Date</th>
//                         <th className="text-right py-2">Views</th>
//                         <th className="text-right py-2">Watch Time (mins)</th>
//                         <th className="text-right py-2">Avg Duration (secs)</th>
//                         <th className="text-right py-2">Likes</th>
//                         <th className="text-right py-2">Subscribers +/-</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {analyticsData.rows.map((row, index) => (
//                         <tr key={index} className="border-t">
//                           <td className="py-2">{row[0]}</td>
//                           <td className="text-right">{formatNumber(row[1] || 0)}</td>
//                           <td className="text-right">{formatNumber(row[2] || 0)}</td>
//                           <td className="text-right">{formatNumber(row[3] || 0)}</td>
//                           <td className="text-right">{formatNumber(row[4] || 0)}</td>
//                           <td className="text-right">
//                             <span className={Number(row[6]) - Number(row[7]) >= 0 ? 'text-green-600' : 'text-red-600'}>
//                               {Number(row[6]) - Number(row[7]) >= 0 ? '+' : ''}
//                               {Number(row[6]) - Number(row[7])}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default YoutubeAnalyticsDashboard;


'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { ChevronDown, ChevronUp, Eye, ThumbsUp, MessageSquare, Play, Users, Clock, Youtube, ArrowUp, ArrowDown, BarChart2 } from 'lucide-react';
import { api } from '@/trpc/react';

const YoutubeAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data
  const { data: authData } = api.youtube.checkAuthentication.useQuery();
  const { data: videosData, isLoading: videosLoading } = api.youtube.getAllVideosWithStatistics.useQuery();
  const { data: channelData, isLoading: channelLoading } = api.youtube.getChannelStatistics.useQuery();

  const isLoading = videosLoading || channelLoading;

  // Handle authentication
  const handleAuth = () => {
    const authUrl = (authData as { isAuthenticated: boolean; url?: string })?.url;
    window.location.href = authUrl ?? '/api/youtube/auth';
  };

  // Format helpers
  const formatDate = (dateString?: string | Date | null) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  const formatNumber = (num?: number | string) => new Intl.NumberFormat('en-US').format(Number(num ?? 0));
  const formatDuration = (duration?: string) => {
    if (!duration) return '0:00';
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = regex.exec(duration);
    if (!match) return '0:00';
    const [, h, m, s] = match;
    return `${h ? `${h}:` : ''}${m?.padStart(2, '0') ?? '00'}:${s?.padStart(2, '0') ?? '00'}`;
  };

  // Data processing
  const videos = videosData?.videos?.filter(video => video) ?? [];
  const videoStats = videosData?.statistics ?? { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0 };
  const channelStats = channelData?.channel?.statistics ?? {};
  const analyticsData = channelData?.analytics;

  // Chart data processing
  const viewsChartData = (analyticsData?.rows as [string, number, number][] | undefined)?.map((row) => ({
    date: row[0],
    views: Number(row[1] ?? 0),
    watchTime: Math.round(Number(row[2] ?? 0) / 60),
  })) ?? [];

  const subscribersChartData = (analyticsData?.rows as Array<[string, number, number, number, number, number, number, number]> | undefined)?.map(row => ({
    date: row[0],
    gained: Number(row[6] ?? 0),
    lost: Number(row[7] ?? 0),
    net: Number(row[6] ?? 0) - Number(row[7] ?? 0),
  })) ?? [];

  type Video = {
    id: string;
    title: string;
    description?: string;
    createdAt?: string; // Added createdAt property
    videoUrl?: string; // Added videoUrl property
    statistics?: {
      viewCount?: string;
      likeCount?: string;
    };
    contentDetails?: {
      duration?: string;
    };
    youtubeDetails?: {
      statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
      contentDetails?: {
        duration?: string;
      };
    };
  };

  const topVideos = [...(videos.map(video => ({
    ...video,
    id: String(video.id),
    createdAt: video.createdAt instanceof Date ? video.createdAt.toISOString() : video.createdAt
  })) as Video[])].sort((a, b) =>
    (Number(b.youtubeDetails?.statistics?.viewCount) || 0) -
    (Number(a.youtubeDetails?.statistics?.viewCount) || 0)
  ).slice(0, 5);

  // UI Components
  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
          <Icon className="h-4 w-4 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{formatNumber(value)}</p>
          {trend && (
            <span className={`flex items-center text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {trendValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Auth state
  if (authData && !authData.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <Youtube className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">YouTube Integration</h2>
        <p className="mb-6 text-muted-foreground max-w-md">
          Connect your YouTube account to access advanced analytics and manage your content.
        </p>
        <button
          onClick={handleAuth}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center transition-colors"
        >
          <Play className="mr-2 h-4 w-4" /> Connect YouTube
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-muted-foreground">Loading YouTube analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">YouTube Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your YouTube channel
          </p>
        </div>
        {channelData?.channel?.snippet?.title && (
          <div className="flex items-center bg-muted/50 px-4 py-2 rounded-lg">
            <img
              src={channelData.channel.snippet.thumbnails?.default?.url ?? undefined}
              alt="Channel logo"
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <p className="font-medium">{channelData.channel.snippet.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(channelStats.subscriberCount ?? 0)} subscribers
              </p>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">
            Overview
          </TabsTrigger>
          <TabsTrigger value="videos" className="data-[state=active]:bg-background">
            Videos
          </TabsTrigger>
          <TabsTrigger value="channel" className="data-[state=active]:bg-background">
            Channel
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Videos"
              value={videoStats.totalVideos}
              icon={Play}
              trend="up"
              trendValue="12%"
            />
            <StatCard
              title="Total Views"
              value={videoStats.totalViews}
              icon={Eye}
              trend="up"
              trendValue="8%"
            />
            <StatCard
              title="Total Likes"
              value={videoStats.totalLikes}
              icon={ThumbsUp}
              trend="up"
              trendValue="5%"
            />
            <StatCard
              title="Total Comments"
              value={videoStats.totalComments}
              icon={MessageSquare}
              trend="down"
              trendValue="2%"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-red-500" />
                  Views Over Time
                </CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsChartData}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#viewsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-red-500" />
                  Subscriber Growth
                </CardTitle>
                <CardDescription>Net subscribers gained last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscribersChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow)'
                      }}
                    />
                    <Bar
                      dataKey="net"
                      name="Net Subscribers"
                      radius={[4, 4, 0, 0]}
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Top Performing Videos</CardTitle>
              <CardDescription>Your most viewed videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVideos.map((video) => (
                  <div key={video.id} className="flex items-start p-4 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="relative flex-shrink-0 mr-4">
                      <div className="w-32 h-20 bg-muted rounded-md overflow-hidden">
                        {/* Thumbnail would go here */}
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(video.youtubeDetails?.contentDetails?.duration ?? undefined)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{video.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm">
                        <span className="flex items-center text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          {formatNumber(video.youtubeDetails?.statistics?.viewCount)}
                        </span>
                        {formatNumber(video.youtubeDetails?.statistics?.likeCount ?? 0)}
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {formatNumber(video.youtubeDetails?.statistics?.likeCount)}
                        {formatDate(video.createdAt ?? null)}
                        <span className="text-muted-foreground">
                          {formatDate(video.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <a
                        href={video.videoUrl ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Video Library</CardTitle>
              <CardDescription>All your uploaded videos with performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pl-2">Video</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Views</th>
                      <th className="pb-3 text-right">Likes</th>
                      <th className="pb-3 text-right">Comments</th>
                      <th className="pb-3 pr-2 text-right">Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video) => (
                      <tr key={video.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center">
                            <div className="w-16 h-10 bg-muted rounded mr-3 overflow-hidden">
                              {/* Thumbnail placeholder */}
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">{video.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {formatDuration((video.youtubeDetails as { contentDetails?: { duration?: string } })?.contentDetails?.duration)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${video.privacyStatus === 'public'
                            ? 'bg-green-100 text-green-800'
                            : video.privacyStatus === 'private'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {video.privacyStatus}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatNumber((video.youtubeDetails as { statistics?: { viewCount?: string } })?.statistics?.viewCount)}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            <ThumbsUp className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatNumber((video.youtubeDetails as { statistics?: { likeCount?: string } })?.statistics?.likeCount)}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            <MessageSquare className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatNumber((video.youtubeDetails as { statistics?: { commentCount?: string } })?.statistics?.commentCount)}
                          </div>
                        </td>
                        <td className="text-right pr-2 text-muted-foreground">
                          {formatDate(video.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Tab */}
        <TabsContent value="channel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Channel Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-6">
                  <img
                    src={channelData?.channel?.snippet?.thumbnails?.high?.url ?? undefined}
                    alt="Channel thumbnail"
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{channelData?.channel?.snippet?.title}</h3>
                    <p className="text-muted-foreground">
                      {channelData?.channel?.snippet?.customUrl}
                    </p>
                  </div>
                </div>

                <p className="text-sm mb-6 text-muted-foreground">
                  {channelData?.channel?.snippet?.description ?? 'No channel description available'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    title="Subscribers"
                    value={channelStats.subscriberCount ?? 0}
                    icon={Users}
                    trend="up"
                    trendValue="3%"
                  />
                  <StatCard
                    title="Total Views"
                    value={channelStats.viewCount ?? 0}
                    icon={Eye}
                    trend="up"
                    trendValue="7%"
                  />
                  <StatCard
                    title="Total Videos"
                    value={channelStats.videoCount ?? 0}
                    icon={Play}
                  />
                  <StatCard
                    title="Channel Created"
                    value={formatDate(channelData?.channel?.snippet?.publishedAt)}
                    icon={Clock}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Watch Time Analytics</CardTitle>
                <CardDescription>Hours watched over last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsChartData}>
                    <defs>
                      <linearGradient id="watchTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="watchTime"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {analyticsData?.rows && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Daily Analytics</CardTitle>
                <CardDescription>Detailed performance metrics by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Views</th>
                        <th className="pb-3 text-right">Watch Time</th>
                        <th className="pb-3 text-right">Avg. View</th>
                        <th className="pb-3 text-right">Likes</th>
                        <th className="pb-3 text-right">Subscribers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.rows.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3">{row[0] as string}</td>
                          <td className="text-right">{formatNumber(row[1] as string | number | undefined)}</td>
                          <td className="text-right">{formatNumber(row[2] as string | number | undefined)} min</td>
                          <td className="text-right">{formatNumber(row[3] as string | number | undefined)} sec</td>
                          <td className="text-right">{formatNumber(row[4] as string | number | undefined)}</td>
                          <td className="text-right">
                            <span className={`flex items-center justify-end ${Number(row[6]) - Number(row[7]) >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                              {Number(row[6]) - Number(row[7]) >= 0 ? (
                                <ArrowUp className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowDown className="h-4 w-4 mr-1" />
                              )}
                              {Math.abs(Number(row[6]) - Number(row[7]))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YoutubeAnalyticsDashboard;

// // import React from 'react'

// // const Page = () => {
// //   return (
// //     <div>Page</div>
// //   )
// // }

// // export default Page