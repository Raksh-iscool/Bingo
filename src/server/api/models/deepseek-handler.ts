import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function generateWithDeepseek(prompt: string) {
    const { text } = await generateText({
        model: openrouter("deepseek/deepseek-v3-base"),
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
    });

    return text;
}

export async function updateWithDeepseek(prompt: string) {
    const { text } = await generateText({
        model: openrouter("deepseek/deepseek-v3-base"),
        prompt,
        temperature: 0.5,
        maxTokens: 1000,
    });

    return text;
}