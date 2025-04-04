import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "@/server/api/trpc";
import { generateWithGemini } from "../models/gemini-handler";
import { generateWithDeepseek } from "../models/deepseek-handler";

const SocialPlatform = z.enum([
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
]);

const AIModel = z.enum(["gemini", "deepseek"]);

export const generateSocialPost = protectedProcedure
  .input(
    z.object({
      platform: SocialPlatform,
      prompt: z.string().min(1, "Prompt cannot be empty"),
      model: AIModel.default("gemini"),
    }),
  )
  .output(
    z.object({
      content: z.string(),
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

      const prompt = `You are a professional social media content creator. Create a ${input.platform} post based on the following prompt.

      Platform-specific guidelines:
      ${platformGuidelines[input.platform]}

      Additional rules:
      1. Match the tone and style typical for ${input.platform}
      2. Include appropriate hashtags where relevant
      3. Stay within platform character limits
      4. Make content engaging and shareable
      5. Ensure content is brand-safe and professional
      6. Return ONLY the post content, no explanations

      Prompt: ${input.prompt}`;

      let text: string | null = null;

      if (input.model === "gemini") {
        text = await generateWithGemini(prompt);
      } else {
        text = await generateWithDeepseek(prompt);
      }

      if (!text) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate social media content",
        });
      }

      const content = text.trim();

      if (input.platform === "twitter" && content.length > 280) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generated content exceeds Twitter's character limit",
        });
      }

      return { content };
    } catch (error) {
      console.error("Error generating social media content:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate social media content",
        cause: error,
      });
    }
  });
