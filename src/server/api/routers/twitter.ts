// src/server/api/routers/twitter.ts

import {cookies} from "next/headers";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const twitterRouter = createTRPCRouter({
  createTweet: publicProcedure
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('twitterAccessToken')?.value;
        // 1. Verify authentication
        console.log(accessToken);
        
        if (!accessToken) {
          throw new Error("Please authenticate with Twitter first");
        }

        // 2. Validate input (redundant check since Zod already validated)
        // if (!input.text || typeof input.text !== 'string') {
        //   throw new Error("Invalid tweet text");
        // }
        
        // 3. Create tweet
        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-client-uuid": crypto.randomUUID(),
          },
          body: JSON.stringify({
            text: "finally witnessed kanye my goat",
            // reply_settings: input.replySettings,
          }),
        });

        // 4. Handle response
        if (!response.ok) {
          const errorResponse = await response.json() as { detail?: string };
          console.error("Twitter API Error:", errorResponse);
          throw new Error(errorResponse.detail ?? "Failed to post tweet");
        }

        const twitterResponse = (await response.json()) as { data: { id: string; text: string } };
        return twitterResponse;

      } catch (error) {
        console.error("Tweet creation failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to create tweet"
        );
      }
    }),
});