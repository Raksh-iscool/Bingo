import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  getAuthUrl,
  getTokenFromCode,
  uploadVideo,
  updateVideo,
  getUserVideos,
  getVideo,
  getVideoStatistics,
  checkAuthentication,
  getAllVideosWithStatistics,
  getChannelStatistics
} from "@/server/services/youtube-service";
import { TRPCError } from "@trpc/server";
 
// Define input validation schemas
const uploadVideoSchema = z.object({
  videoBuffer: z.instanceof(Buffer),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  privacyStatus: z.enum(['private', 'public', 'unlisted']).default('private'),
  thumbnailBuffer: z.instanceof(Buffer).optional().nullable(),
});

const updateVideoSchema = z.object({
  videoId: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  privacyStatus: z.enum(['private', 'public', 'unlisted']).optional(),
});

// YouTube Router with Read and Write operations
export const youtubeRouter = createTRPCRouter({
  // READ OPERATIONS
  
  // Get auth URL for YouTube integration
  getAuthUrl: protectedProcedure
    .query(() => {
      // const userId = ctx.session.user.id;
      return { url: getAuthUrl() };
    }),
  
    checkAuthentication: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await checkAuthentication(userId);
    }),
  
  // Get user's videos
  getUserVideos: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      try {
        return await getUserVideos(userId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user videos',
          cause: error
        });
      }
    }),
  
  // Get specific video
  getVideo: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const video = await getVideo(input.videoId, userId);
      
      if (!video) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Video not found',
        });
      }
      
      return video;
    }),
  
  // Get video statistics
  getVideoStatistics: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await getVideoStatistics(input.videoId, userId);
    }),
  
  // WRITE OPERATIONS
  
  // Handle OAuth callback and save token
  saveAuthToken: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await getTokenFromCode(input.code, userId);
      return { success: true };
    }),
  
  // Upload video
  uploadVideo: protectedProcedure
    .input(uploadVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await uploadVideo({
        ...input,
        userId
      });
    }),
  
  // Update video
  updateVideo: protectedProcedure
    .input(updateVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!input.title) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Title is required for video update',
        });
      }
      
      return await updateVideo({
        ...input,
        title: input.title, // Explicitly provide title to satisfy type requirement
        userId
      });
    }),

    // Add these to your youtubeRouter
    getAllVideosWithStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await getAllVideosWithStatistics(userId);
    }),

    getChannelStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await getChannelStatistics(userId);
    }),
});