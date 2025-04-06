import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { linkedinTokens } from "@/server/db/schema";
import { db } from "@/server/db";

export const linkedinRouter = createTRPCRouter({
  createPost: protectedProcedure
    .input(z.object({
      text: z.string().min(1),
      visibility: z.enum(["PUBLIC", "CONNECTIONS"]).default("PUBLIC"),
      organizationId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(input);
        
        const userId = ctx.session?.user.id;
        if (!userId) throw new Error("User not authenticated");
        
        const token = await db.query.linkedinTokens.findFirst({
          where: eq(linkedinTokens.userId, userId)
        });
        
        const accessToken = token?.accessToken;
        // 1. Verify authentication
        console.log(accessToken);
        
        if (!accessToken) {
          throw new Error("Please authenticate with LinkedIn first");
        }
        
        if (!input) {
          throw new Error("No input provided");
        }

        // 2. Validate input (redundant check since Zod already validated)
        if (!input.text || typeof input.text !== 'string') {
          throw new Error("Invalid post text");
        }
        const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token.accessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
              "LinkedIn-Version": "202304",
            }
          });
          const userData = await userResponse.json() as { sub: string };
          const linkedinUserId = userData.sub;

        // Determine if posting as user or organization
        let author = `urn:li:person:${linkedinUserId}`;
        if (input.organizationId) {
          author = `urn:li:organization:${input.organizationId}`;
        }
        
        // 3. Create LinkedIn post
        const response = await fetch("https://api.linkedin.com/rest/posts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202411",
          },
          body: JSON.stringify({
            author: author,
            commentary: input.text,
            visibility: input.visibility,
            distribution: {
              feedDistribution: "MAIN_FEED",
              targetEntities: [],
              thirdPartyDistributionChannels: []
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false
          }),
        });

        // 4. Handle response
        if (!response.ok) {
          const errorResponse = await response.text();
          console.error("LinkedIn API Error:", errorResponse);
          throw new Error(errorResponse || "Failed to post to LinkedIn");
        }

        // Get the post ID from the header
        const postId = response.headers.get('x-restli-id');
        
        return {
          success: true,
          postId: postId,
          message: "Post created successfully"
        };

      } catch (error) {
        console.error("LinkedIn post creation failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to create LinkedIn post"
        );
      }
    }),

});