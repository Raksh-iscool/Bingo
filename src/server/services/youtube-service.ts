/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { google } from 'googleapis';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { youtubeTokens, youtubeVideos } from '@/server/db/schema';
import { env } from '@/env';
import { TRPCError } from '@trpc/server';
import { Readable } from 'stream';
import type { OAuth2Client, Credentials } from 'google-auth-library';

// YouTube API credentials - store these in your environment variables
const CLIENT_ID = env.YOUTUBE_CLIENT_ID as string;
const CLIENT_SECRET = env.YOUTUBE_CLIENT_SECRET as string;
const REDIRECT_URI = (env.YOUTUBE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/youtube/callback') as string;

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
    'https://www.googleapis.com/auth/youtube.force-ssl'
];

// Create OAuth2 client
export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

// Get authorization URL for the given user
export function getAuthUrl(userId: string, state?: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force to always get refresh_token
    scope: SCOPES,
    state: state ?? userId, // Pass userId as state to retrieve it in callback
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
        accessToken: token.access_token as string,
        refreshToken: token.refresh_token ?? existingToken.refreshToken, // Keep existing refresh_token if new one isn't provided
        expiryDate: new Date(token.expiry_date as number),
        updatedAt: new Date()
      })
      .where(eq(youtubeTokens.userId, userId));
  } else {
    await db.insert(youtubeTokens).values({
      userId,
      accessToken: token.access_token as string,
      refreshToken: token.refresh_token as string,
      expiryDate: new Date(token.expiry_date as number)
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
    if (thumbnailBuffer && videoId) {
      await uploadThumbnail(videoId as string, thumbnailBuffer, userId);
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