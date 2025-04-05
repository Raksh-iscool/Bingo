import { db } from "@/server/db";
import { linkedinTokens } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type PublishLinkedInPostParams = {
  content: string;
  title?: string;
  userId: string;
  imageBuffer?: Buffer | null;
};

type LinkedInPostResult = {
  postId: string;
  success: boolean;
  message?: string;
  url?: string;
};

/**
 * Publishes a post to LinkedIn
 */
export async function publishLinkedInPost({
  content,
  title,
  userId,
  imageBuffer,
}: PublishLinkedInPostParams): Promise<LinkedInPostResult> {
  try {
    // 1. Get the user's LinkedIn access token
    const token = await db.query.linkedinTokens.findFirst({
      where: eq(linkedinTokens.userId, userId),
    });

    if (!token) {
      throw new Error("LinkedIn token not found for user");
    }

    // Check token expiry
    if (new Date() > token.expiryDate) {
      throw new Error("LinkedIn token expired");
    }

    // 2. Get LinkedIn user ID
    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202304",
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`Failed to get LinkedIn user info: ${errorText}`);
    }
    
    const userData = await userResponse.json() as { sub: string };
    const linkedinUserId = userData.sub;

    // 3. Prepare post content
    const postBody: {
      author: string;
      commentary: string;
      visibility: "PUBLIC";
      distribution: {
        feedDistribution: "MAIN_FEED";
        targetEntities: never[];
        thirdPartyDistributionChannels: never[];
      };
      lifecycleState: "PUBLISHED";
      isReshareDisabledByAuthor: boolean;
      content?: {
        media: {
          id: string;
        };
        title?: string;
      };
    } = {
      author: `urn:li:person:${linkedinUserId}`,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    };

    // 4. Handle image upload if provided
    let assetUrn = null;
    if (imageBuffer) {
      // Register the image upload
      const registerUploadResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202411",
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: `urn:li:person:${linkedinUserId}`,
          }
        }),
      });

      if (!registerUploadResponse.ok) {
        throw new Error(`Failed to register image upload: ${await registerUploadResponse.text()}`);
      }

      const registerData = await registerUploadResponse.json() as {
        value: {
          uploadUrl: string;
          image: string;
        }
      };
      const uploadUrl = registerData.value.uploadUrl;
      assetUrn = registerData.value.image;

      // Upload the image
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token.accessToken}`,
        },
        body: imageBuffer,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${await uploadResponse.text()}`);
      }

      // Add the image to the post content
      if (assetUrn) {
        postBody.content = {
          media: {
            id: assetUrn,
          }
        };
        
        // If title is provided, add it as media title for the image
        if (title) {
          postBody.content.title = title;
        }
      }
    }

    // 5. Create LinkedIn post
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202411",
      },
      body: JSON.stringify(postBody),
    });

    // 6. Handle response
    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Failed to post to LinkedIn");
    }

    // Get the post ID from the header
    const postId = response.headers.get('x-restli-id');
    if (!postId) {
      throw new Error("Failed to get LinkedIn post ID");
    }

    // 7. Return success result
    return {
      postId,
      success: true,
      message: "Post published successfully",
      url: `https://www.linkedin.com/feed/update/${postId}`, // This is an approximation of the URL
    };
  } catch (error) {
    console.error("LinkedIn post publication failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to publish LinkedIn post"
    );
  }
}