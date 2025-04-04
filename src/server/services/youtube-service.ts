import { google } from 'googleapis';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { youtubeTokens, youtubeVideos } from '@/server/db/schema';
import { env } from '@/env';
import { TRPCError } from '@trpc/server';
import { Readable } from 'stream';
import type { OAuth2Client, Credentials } from 'google-auth-library';

// YouTube API credentials - store these in your environment variables
const CLIENT_ID = env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = env.YOUTUBE_REDIRECT_URI ?? 'http://localhost:3000/api/youtube/oauthcallback';

// Define interface for token storage
interface YouTubeToken {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}

// Scopes needed for YouTube operations
const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    'https://www.googleapis.com/auth/youtubepartner',
];

// Create OAuth2 client
export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export async function checkAuthentication(userId: string): Promise<{ isAuthenticated: boolean }> {
  try {
    const token = await db.query.youtubeTokens.findFirst({
      where: eq(youtubeTokens.userId, userId)
    });
    
    if (!token) {
      return { isAuthenticated: false };
    }
    
    // Check if token is expired and try to refresh
    if (token.expiryDate.getTime() < Date.now()) {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken
      });
      
      try {
        await oauth2Client.refreshAccessToken();
        return { isAuthenticated: true };
      } catch {
        return { isAuthenticated: false };
      }
    }
    
    return { isAuthenticated: true };
  } catch {
    return { isAuthenticated: false };
  }
}

// Get authorization URL for the given user
export function getAuthUrl(userId: string, state?: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

// Save token to database
export async function saveToken(token: Credentials, userId: string): Promise<void> {
  const existingToken = await db.query.youtubeTokens.findFirst({
    where: eq(youtubeTokens.userId, userId)
  });

  if (existingToken) {
    await db.update(youtubeTokens)
      .set({

        accessToken: token.access_token!,
        refreshToken: token.refresh_token ?? existingToken.refreshToken, // Keep existing refresh_token if new one isn't provided
        expiryDate: new Date(token.expiry_date!),

        updatedAt: new Date()
      })
      .where(eq(youtubeTokens.userId, userId));
  } else {
    await db.insert(youtubeTokens).values({
      userId,

      accessToken: token.access_token!,
      refreshToken: token.refresh_token!,
      expiryDate: new Date(token.expiry_date!)

    });
  }
}

// Get token from code during OAuth callback
export async function getTokenFromCode(code: string, userId: string): Promise<Credentials> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  await saveToken(tokens, userId);
  return tokens;
}

// Get authenticated client for a user
export async function getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
  const oauth2Client = getOAuth2Client();
  
  // Check if we have a stored token
  const token = await db.query.youtubeTokens.findFirst({
    where: eq(youtubeTokens.userId, userId)
  });
  
  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authentication token found. Please authenticate first.'
    });
  }
  
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate.getTime()
  });
  
  // Check if token is expired and refresh if necessary
  if (token.expiryDate.getTime() < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveToken(credentials, userId);
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error('Error refreshing token:', err);
      throw new TRPCError({
        code: 'UNAUTHORIZED', 
        message: 'Failed to refresh authentication token.'
      });
    }
  }
  
  return oauth2Client;
}

// Upload a video to YouTube
export async function uploadVideo({
  videoBuffer,
  title,
  description,
  tags,
  privacyStatus = 'private',
  userId,
  thumbnailBuffer = null
}: {
  videoBuffer: Buffer,
  title: string,
  description?: string,
  tags?: string[],
  privacyStatus?: 'private' | 'public' | 'unlisted',
  userId: string,
  thumbnailBuffer?: Buffer | null
}) {
  // Get authorized client
  const oauth2Client = await getAuthenticatedClient(userId);
  
  // Create YouTube client
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  // Prepare upload parameters
  const requestBody = {
    snippet: {
      title,
      description: description ?? '',
      tags: tags ?? [],
      categoryId: '22', // People & Blogs category
    },
    status: {
      privacyStatus,
    },
  };

  try {
    console.log('Uploading video...');
    
    // Create readable stream from buffer
    const readable = new Readable();
    readable._read = function() { return null; }; // Required implementation
    readable.push(videoBuffer);
    readable.push(null);
    
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: readable,
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      throw new Error('No video ID returned from YouTube API');
    }
    
    console.log(`Video uploaded! Video ID: ${videoId}`);
    
    // Save to database
    const videoData = await db.insert(youtubeVideos)
      .values({
        youtubeId: videoId,
        title,
        description: description ?? '',
        tags: tags ?? [],
        privacyStatus,
        userId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        status: 'uploaded'
      })
      .returning();
    

    // Upload thumbnail if provided
    if (thumbnailBuffer) {
      await uploadThumbnail(videoId, thumbnailBuffer, userId);
    }

    
    return {
      success: true,
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      dbRecord: videoData[0]
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Error uploading video: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// Upload a thumbnail for a video
export async function uploadThumbnail(
  videoId: string,
  thumbnailBuffer: Buffer, 
  userId: string
) {
  const oauth2Client = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  try {
    // Create readable stream from buffer
    const readable = new Readable();
    readable._read = function() { return null; }; // Required implementation
    readable.push(thumbnailBuffer);
    readable.push(null);
    
    const response = await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: readable,
      },
    });
    
    const thumbnailUrl = response.data.items?.[0]?.default?.url;
    
    if (thumbnailUrl) {
      // Update video record with thumbnail URL
      await db.update(youtubeVideos)
        .set({ thumbnailUrl })
        .where(eq(youtubeVideos.youtubeId, videoId));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Error uploading thumbnail: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// Update a video's metadata on YouTube
export async function updateVideo({
  videoId,
  title,
  description,
  tags,
  privacyStatus,
  userId
}: {
  videoId: string,
  title: string,
  description?: string,
  tags?: string[],
  privacyStatus?: 'private' | 'public' | 'unlisted',
  userId: string
}) {
  // Get authorized client
  const oauth2Client = await getAuthenticatedClient(userId);
  
  // Create YouTube client
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  try {
    // First get current video data to avoid partial updates
    const currentVideo = await youtube.videos.list({
      id: [videoId],
      part: ['snippet', 'status']
    });
    
    const currentSnippet = currentVideo.data.items?.[0]?.snippet ?? {};
    const currentStatus = currentVideo.data.items?.[0]?.status ?? {};
    
    // Prepare update parameters
    const requestBody = {
      id: videoId,
      snippet: {
        title: title ?? currentSnippet.title,
        description: description ?? (currentSnippet.description ?? ''),
        tags: tags ?? currentSnippet.tags ?? [],
        categoryId: currentSnippet.categoryId ?? '22', // People & Blogs category
      },
      status: {
        privacyStatus: privacyStatus ?? currentStatus.privacyStatus ?? 'private',
      },
    };

    console.log('Updating video details...');
    
    const response = await youtube.videos.update({
      part: ['snippet', 'status'],
      requestBody,
    });

    // Update in database
    await db.update(youtubeVideos)
      .set({
        title: title ?? currentSnippet.title,
        description: description ?? (currentSnippet.description ?? ''),
        tags: tags ?? currentSnippet.tags ?? [],
        privacyStatus: (privacyStatus ?? currentStatus.privacyStatus ?? 'private') as 'private' | 'public' | 'unlisted',
        updatedAt: new Date()
      })
      .where(eq(youtubeVideos.youtubeId, videoId));

    console.log(`Video updated! Video ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('Error updating video:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Error updating video: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// Get videos uploaded by a user
export async function getUserVideos(userId: string) {
  return db.query.youtubeVideos.findMany({
    where: eq(youtubeVideos.userId, userId),
    orderBy: (videos) => [desc(videos.createdAt)]
  });
}

// Get a specific video
export async function getVideo(videoId: string, userId: string) {
  return db.query.youtubeVideos.findFirst({
    where: (videos) => 
      eq(videos.youtubeId, videoId) && 
      eq(videos.userId, userId)
  });
}

// Get video statistics from YouTube
export async function getVideoStatistics(videoId: string, userId: string) {
  const oauth2Client = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  try {
    const response = await youtube.videos.list({
      id: [videoId],
      part: ['statistics', 'snippet', 'status']
    });
    
    return response.data.items?.[0];
  } catch (error) {
    console.error('Error getting video statistics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to retrieve video statistics: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// Get channel statistics
export async function getChannelStatistics(userId: string) {
  const oauth2Client = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  try {
    // First get the channel ID for the authenticated user
    const channelResponse = await youtube.channels.list({
      part: ['id', 'snippet', 'statistics', 'contentDetails'],
      mine: true
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('No channel found for authenticated user');
    }
    
    const channelData = channelResponse.data.items[0];
    
    // Get analytics data for the channel if possible
    let analyticsData = null;
    try {
      const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
      
      // Get last 30 days of data
      const endDate = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateString = startDate.toISOString().split('T')[0]; // 30 days ago
      
      const analyticsResponse = await youtubeAnalytics.reports.query({
        dimensions: 'day',
        ids: `channel==${channelData?.id ?? ''}`,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,dislikes,subscribersGained,subscribersLost',
        startDate: startDateString,
        endDate: endDate,
        sort: 'day'
      });
      
      analyticsData = analyticsResponse.data;
    } catch (analyticsError) {
      console.warn('Could not fetch analytics data:', analyticsError);
      // Continue without analytics data
    }
    
    return {
      channel: channelData,
      analytics: analyticsData
    };
  } catch (error) {
    console.error('Error getting channel statistics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to retrieve channel statistics: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// Get all videos with their statistics
export async function getAllVideosWithStatistics(userId: string) {
  // First get all videos from our database
  const videos = await getUserVideos(userId);
  
  if (!videos || videos.length === 0) {
    return { videos: [] };
  }
  
  // Get authenticated client
  const oauth2Client = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  
  try {
    // Get statistics for all videos in batches of 50 (YouTube API limit)
    const allVideoIds = videos.map(video => video.youtubeId);
    const videoDetailsMap = new Map();
    
    // Process in batches of 50
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50);
      
      const response = await youtube.videos.list({
        id: batchIds,
        part: ['statistics', 'snippet', 'status', 'contentDetails']
      });
      
      if (response.data.items) {
        for (const item of response.data.items) {
          if (item.id) {
            videoDetailsMap.set(item.id, item);
          }
        }
      }
    }
    
    // Merge our database info with YouTube API info
    const enrichedVideos = videos.map(video => {
      const youtubeDetails = videoDetailsMap.get(video.youtubeId) ?? null;
      return {
        ...video,
        youtubeDetails
      };
    });
    
    // Get aggregate statistics
    const totalViews = enrichedVideos.reduce((sum, video) => {
      return sum + (parseInt(String(video.youtubeDetails?.statistics?.viewCount ?? '0'), 10) || 0);
    }, 0);
    
    const totalLikes = enrichedVideos.reduce((sum, video) => {
      return sum + (parseInt(String(video.youtubeDetails?.statistics?.likeCount ?? '0'), 10) || 0);
    }, 0);
    
    const totalComments = enrichedVideos.reduce((sum, video) => {
      return sum + (parseInt(String(video.youtubeDetails?.statistics?.commentCount ?? '0'), 10) || 0);
    }, 0);
    
    // Sort by most recent first
    enrichedVideos.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return {
      videos: enrichedVideos,
      statistics: {
        totalVideos: enrichedVideos.length,
        totalViews,
        totalLikes,
        totalComments
      }
    };
  } catch (error) {
    console.error('Error getting all videos with statistics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to retrieve videos with statistics: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}