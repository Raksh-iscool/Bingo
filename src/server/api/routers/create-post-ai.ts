/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  "all"  // Add "all" option
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
      platform: SocialPlatform.default("all"),  // Make platform optional with default "all"
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
      contents: z.array(z.object({
        platform: z.string(),
        content: z.string(),
        contentId: z.number(),
      })),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Determine which platforms to generate content for
      const platformsToUse = input.platform === "all" 
        ? ["twitter", "linkedin", "facebook", "instagram"] 
        : [input.platform];

      const generatedContents = [];

      // Generate content for each platform
      for (const platform of platformsToUse) {
        const platformConstraints = {
          twitter: {
            maxLength: 280,
            hashtagCount: 3,
            format: "Short, concise text with optional media"
          },
          linkedin: {
            maxLength: 3000,
            hashtagCount: 5,
            format: "Professional, detailed content with optional media"
          },
          facebook: {
            maxLength: 63206,
            hashtagCount: 4,
            format: "Flexible format with rich media support"
          },
          instagram: {
            maxLength: 2200,
            hashtagCount: 30,
            format: "Visual-focused with extended caption"
          }
        };
        const constraints = platformConstraints[platform as keyof typeof platformConstraints];
        
        const prompt = `Create a ${platform} post about "${input.topic}".

        Tone: ${input.tone}
        Platform: ${platform}
        Maximum length: ${constraints.maxLength} characters
        Include hashtags: ${input.includeHashtags ? 'Yes' : 'No'}
        Include emojis: ${input.includeEmojis ? 'Yes' : 'No'}
        Format requirements: ${constraints.format}
        
        ${input.keyPoints?.length 
          ? `Key points to include:\n${input.keyPoints.map(point => `- ${point}`).join('\n')}`
          : ""}
        
        Rules:
        1. Match the tone and style typical for ${platform}
        2. Stay under the character limit of ${constraints.maxLength}
        3. ${input.includeHashtags ? `Include ${constraints.hashtagCount} relevant hashtags` : 'Do not include hashtags'}
        4. ${input.includeEmojis ? 'Include appropriate emojis to enhance engagement' : 'Do not include emojis'}
        5. Focus on creating engaging, shareable content
        6. Write in a conversational style appropriate for social media
        7. Return ONLY the social media post content`;

        let content: string = input.model === "gemini"
          ? await generateWithGemini(prompt)
          : await generateWithDeepseek(prompt);

        if (!content) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to generate content for ${platform}`,
          });
        }

        // Apply platform-specific constraints
        if (platform === "twitter" && content.length > 280) {
          content = content.length <= 300
            ? content.substring(0, 277) + "..."
            : content.substring(0, 277) + "...";
        }

        // Store in database
        const [savedContent] = await db.insert(socialContent).values({
          userId: ctx.user.id,
          platform: platform,
          content: content,
          status: "draft",
        }).returning();

        generatedContents.push({
          platform,
          content,
          contentId: savedContent?.id ?? -1,
        });
      }

      return { contents: generatedContents };
    } catch (error) {
      console.error("Error creating social media posts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create social media posts",
        cause: error,
      });
    }
  });