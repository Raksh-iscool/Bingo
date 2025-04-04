import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";
import { updateWithGemini } from "../models/gemini-handler";
import { updateWithDeepseek } from "../models/deepseek-handler";

const SocialPlatform = z.enum([
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
]);

const AIModel = z.enum(["gemini", "deepseek"]);

export const updateSocialPost = protectedProcedure
  .input(
    z.object({
      platform: SocialPlatform,
      originalContent: z.string().min(1, "Original content cannot be empty"),
      updatePrompt: z.string().min(1, "Update prompt cannot be empty"),
      model: AIModel.default("gemini"),
    }),
  )
  .output(
    z.object({
      updatedContent: z.string(),
      isSignificantChange: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const platformGuidelines = {
        twitter: "280 characters max, casual tone, use hashtags",
        linkedin: "Professional tone, industry-focused, longer form",
        facebook: "Engaging, conversational, can include calls-to-action",
        instagram: "Visual-first description, heavy on hashtags, emoji-friendly",
      };

      const prompt = `You are a professional social media content editor. Update the following ${input.platform} post based on the update instructions.

      Original Post:
      "${input.originalContent}"

      Platform Guidelines:
      ${platformGuidelines[input.platform]}

      Update Instructions:
      ${input.updatePrompt}

      Rules:
      1. Maintain the original post's core message while incorporating the updates
      2. Keep the platform's tone and style
      3. Ensure any existing hashtags are preserved unless explicitly asked to change
      4. Stay within platform character limits
      5. Return ONLY the updated post content
      6. Maintain brand consistency
      7. Preserve any important mentions or links from the original post`;

      let text: string | null = null;

      if (input.model === "gemini") {
        text = await updateWithGemini(prompt);
      } else {
        text = await updateWithDeepseek(prompt);
      }

      if (!text) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update social media content",
        });
      }

      const updatedContent = text.trim();

      if (input.platform === "twitter" && updatedContent.length > 280) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Updated content exceeds Twitter's character limit",
        });
      }

      const isSignificantChange = calculateContentDifference(
        input.originalContent,
        updatedContent
      ) > 0.3;

      return { 
        updatedContent,
        isSignificantChange,
      };
    } catch (error) {
      console.error("Error updating social media content:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update social media content",
        cause: error,
      });
    }
  });

function calculateContentDifference(original: string, updated: string): number {
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const updatedWords = new Set(updated.toLowerCase().split(/\s+/));
  
  const differentWords = new Set(
    [...updatedWords].filter(x => !originalWords.has(x))
  );
  
  return differentWords.size / updatedWords.size;
}