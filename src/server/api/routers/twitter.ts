// src/server/api/routers/twitter.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const twitterRouter = createTRPCRouter({
  createTweet: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        tweetText: z.string(),
        forSuperFollowersOnly: z.boolean().default(false),
        nullcast: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${input.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: input.tweetText,
            for_super_followers_only: input.forSuperFollowersOnly,
            nullcast: input.nullcast,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(JSON.stringify(error));
        }

        return await response.json();
      } catch (error) {
        console.error("Error creating tweet:", error);
        throw error;
      }
    }),
});