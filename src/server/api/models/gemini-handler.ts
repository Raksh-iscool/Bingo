import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function generateWithGemini(prompt: string) {
  const { text } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
    temperature: 0.7,
    maxTokens: 1000,
  });
  
  return text;
}

export async function updateWithGemini(prompt: string) {
  const { text } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
    temperature: 0.5,
    maxTokens: 1000,
  });
  
  return text;
}