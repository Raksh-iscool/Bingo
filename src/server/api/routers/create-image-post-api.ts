import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { protectedProcedure } from "@/server/api/trpc";

const SocialPlatform = z.enum([
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
]);

const ImageSize = z.enum([
  "square", // 1080x1080 - Instagram optimal
  "portrait", // 1080x1350 - Instagram portrait
  "landscape", // 1200x630 - Facebook/LinkedIn optimal
  "twitter", // 1600x900 - Twitter optimal
]);

export const generateSocialImage = protectedProcedure
  .input(
    z.object({
      platform: SocialPlatform,
      prompt: z.string().min(1, "Prompt cannot be empty"),
      size: ImageSize.default("square"),
      style: z.string().optional(),
    }),
  )
  .output(
    z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
      altText: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const stylePrompt = input.style 
        ? `Style: ${input.style}. `
        : "Style: Professional, high-quality, modern. ";

      const prompt = `Create a social media image for ${input.platform}. 
      ${stylePrompt}
      Image details: ${input.prompt}
      
      Requirements:
      - Ensure the image is visually appealing and social media-ready
      - Maintain brand-safe content
      - Optimize for ${input.platform} viewing
      - Create clear focal points
      - Use appropriate color harmony`;

      const result = await generateText({
        model: google('gemini-2.0-flash-exp'),
        providerOptions: {
          google: { responseModalities: ['TEXT', 'IMAGE'] },
        },
        prompt: prompt,
      });

      if (!result.files || result.files.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate image",
        });
      }

      const imageFile = result.files.find(file => file.mimeType.startsWith('image/'));
      if (!imageFile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image was generated",
        });
      }

      // Generate SEO-friendly alt text
      const altTextResult = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `Generate a concise, descriptive alt text for this image: ${input.prompt}`,
        maxTokens: 100,
      });

      return {
        imageBase64: imageFile.base64,
        mimeType: imageFile.mimeType,
        altText: altTextResult.text?.trim() || input.prompt,
      };
    } catch (error) {
      console.error("Error generating social media image:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate social media image",
        cause: error,
      });
    }
  });