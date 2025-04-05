import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { socialContent } from "@/server/db/schema";
import { generateWithGemini } from "../models/gemini-handler";
import { generateWithDeepseek } from "../models/deepseek-handler";

const SocialPlatform = z.enum([
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
]);

const AIModel = z.enum(["gemini", "deepseek"]);

const ToneOptions = z.enum([
  "professional",
  "casual",
  "enthusiastic",
  "informative",
  "humorous",
  "serious",
]);

export const generateSocialPost = protectedProcedure
  .input(
    z.object({
      platform: SocialPlatform,
      topic: z.string().min(1, "Topic cannot be empty"),
      keyPoints: z.array(z.string()).optional(),
      tone: ToneOptions.default("professional"),
      includeHashtags: z.boolean().default(true),
      includeEmojis: z.boolean().default(true),
      maxLength: z.number().optional(),
      model: AIModel.default("gemini"),
    }),
  )
  .output(
    z.object({
      content: z.string(),
      contentId: z.number(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Set platform-specific constraints
      const platformConstraints = {
        twitter: {
          maxLength: input.maxLength ?? 280,
          hashtagCount: 2,
          format: "Short, concise sentences with strategic hashtag placement",
        },
        linkedin: {
          maxLength: input.maxLength ?? 3000,
          hashtagCount: 3,
          format: "Professional tone with paragraphs, bullet points acceptable, hashtags at end",
        },
        facebook: {
          maxLength: input.maxLength ?? 500,
          hashtagCount: 2,
          format: "Conversational with clear call-to-action when appropriate",
        },
        instagram: {
          maxLength: input.maxLength ?? 2200,
          hashtagCount: 5,
          format: "Engaging caption that complements visual content, hashtags typically at the end",
        },
      };

      const constraints = platformConstraints[input.platform];
      
      // Build key points string
      const keyPointsText = input.keyPoints?.length
        ? `Key points to include:\n${input.keyPoints.map(point => `- ${point}`).join('\n')}`
        : "";

      // Build prompt for content generation
      const prompt = `Create a ${input.platform} post about "${input.topic}".

      Tone: ${input.tone}
      Platform: ${input.platform}
      Maximum length: ${constraints.maxLength} characters
      Include hashtags: ${input.includeHashtags ? 'Yes' : 'No'}
      Include emojis: ${input.includeEmojis ? 'Yes' : 'No'}
      Format requirements: ${constraints.format}
      
      ${keyPointsText}
      
      Rules:
      1. Match the tone and style typical for ${input.platform}
      2. Stay under the character limit of ${constraints.maxLength}
      3. ${input.includeHashtags ? `Include ${constraints.hashtagCount} relevant hashtags` : 'Do not include hashtags'}
      4. ${input.includeEmojis ? 'Include appropriate emojis to enhance engagement' : 'Do not include emojis'}
      5. Focus on creating engaging, shareable content
      6. Write in a conversational style appropriate for social media
      7. Return ONLY the social media post content`;

      // Generate content based on the model selection
      let content: string;
      
      if (input.model === "gemini") {
        content = await generateWithGemini(prompt);
      } else {
        content = await generateWithDeepseek(prompt);
      }

      if (content === undefined || content === "") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate social media content",
        });
      }

      // Check for platform-specific constraints
      if (input.platform === "twitter" && content.length > 280) {
        // Truncate or regenerate for Twitter's character limit
        if (content.length <= 300) {
          // If it's close, just truncate
          content = content.substring(0, 277) + "...";
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Generated content exceeds Twitter's character limit",
          });
        }
      }

      // Store the content in the database
      const [savedContent] = await db.insert(socialContent).values({
        userId: ctx.user.id,
        platform: input.platform,
        content: content,
        status: "draft",
      }).returning();

      return {
        content,
        contentId: savedContent?.id ?? -1,
      };
    } catch (error) {
      console.error("Error creating social media post:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create social media post",
        cause: error,
      });
    }
  });