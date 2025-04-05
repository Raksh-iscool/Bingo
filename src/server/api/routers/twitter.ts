// src/server/api/routers/twitter.ts

import {cookies} from "next/headers";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { twitterTokens } from "@/server/db/schema";
import { db } from "@/server/db";

export const twitterRouter = createTRPCRouter({
  createTweet: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(280)
    }))
    .mutation(async ({ input, ctx}) => {
      try {
        console.log(input);
        
        const userId = ctx.session?.user.id;
        if (!userId) throw new Error("User not authenticated");
        
        const token = await db.query.twitterTokens.findFirst({
          where: eq(twitterTokens.userId, userId)
        });
        
        const accessToken = token?.accessToken;
        // 1. Verify authentication
        console.log(accessToken);
        
        if (!accessToken) {
          throw new Error("Please authenticate with Twitter first");
        }
        if(!input){
          throw new Error("No input provided");
        }

        // 2. Validate input (redundant check since Zod already validated)
        if (!input.text || typeof input.text !== 'string') {
          throw new Error("Invalid tweet text");
        }
        
        // 3. Create tweet
        const response = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-client-uuid": crypto.randomUUID(),
          },
          body: JSON.stringify({
            text: input.text,
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
    getUser: publicProcedure
    .query(async () => {
      try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('twitterAccessToken')?.value;

        if (!accessToken) {
          throw new Error("Please authenticate with Twitter first");
        }

        const response = await fetch('https://api.twitter.com/2/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorResponse = await response.json() as { detail?: string };
          throw new Error(errorResponse.detail ?? "Failed to fetch user data");
        }

        const userData = await response.json() as {
          data: {
            id: string;
            name: string;
            username: string;
          }
        };

        return userData;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch user data"
        );
      }
    }),
    getFollowers: publicProcedure
      .query(async () => {
        try {
          const cookieStore = await cookies();
          const accessToken = cookieStore.get('twitterAccessToken')?.value;

          if (!accessToken) {
            throw new Error("Please authenticate with Twitter first");
          }

          // First, get the user's ID
          const userResponse = await fetch('https://api.twitter.com/2/users/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          });

          const userData = await userResponse.json() as { data: { id: string } };
          const userId = userData.data.id;

          // Then, get the followers
          const followersResponse = await fetch(`https://api.twitter.com/2/users/${userId}/followers`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!followersResponse.ok) {
            const errorResponse = await followersResponse.json() as { detail?: string };
            throw new Error(errorResponse.detail ?? "Failed to fetch followers");
          }

          const followersData = await followersResponse.json() as {
            data: Array<{
              id: string;
              name: string;
              username: string;
            }>
          };

          return followersData;
        } catch (error) {
          console.error("Failed to fetch followers:", error);
          throw new Error(
            error instanceof Error ? error.message : "Failed to fetch followers"
          );
        }
      }),
      getInsights: publicProcedure
      .query(async () => {
        try {
          const cookieStore = await cookies();
          const accessToken = cookieStore.get('twitterAccessToken')?.value;

          if (!accessToken) {
            throw new Error("Please authenticate with Twitter first");
          }

          const response = await fetch('https://api.twitter.com/2/insights/historical', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const errorResponse = await response.json() as { detail?: string };
            throw new Error(errorResponse.detail ?? "Failed to fetch insights");
          }

          const insightsData = await response.json() as {
            data: {
              start: string;
              end: string;
              metrics: Array<{
                name: string;
                value: number;
              }>;
            }
          };

          return insightsData;
        } catch (error) {
          console.error("Failed to fetch insights:", error);
          throw new Error(
            error instanceof Error ? error.message : "Failed to fetch insights"
          );
        }
      }),
      checkToken: protectedProcedure
        .query(async ({ ctx, input }) => {
          try {
            const userId = ctx.session?.user.id;

            // Get token from database using userId
            const token = await db.query.twitterTokens.findFirst({
              where: eq(twitterTokens.userId, userId)
            });

            if (!token) {
              return { isValid: false, message: "No token found in database" };
            }

            // Check if token is expired
            const now = new Date();
            const isExpired = token.expiryDate < now;

            return {
              isValid: !isExpired,
              message: isExpired ? "Token has expired" : "Token is valid",
              expiresAt: token.expiryDate,
              accessToken: token.accessToken
            };

          } catch (error) {
            console.error("Token check failed:", error);
            return {
              isValid: false,
              message: "Failed to verify token",
              error: error instanceof Error ? error.message : "Unknown error"
            };
          }
        }),
  
});