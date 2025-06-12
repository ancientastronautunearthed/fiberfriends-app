
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a Morgellon Monster based on a detailed prompt.
 *
 * - generateMonsterImage - Takes a detailed prompt and returns an image URL.
 * - MonsterImageInput - The input type for the generateMonsterImage function.
 * - MonsterImageOutput - The return type for the generateMonsterImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterImageInputSchema = z.object({
  detailedPrompt: z.string().describe('A detailed and vivid image generation prompt for the Morgellon Monster.'),
});
export type MonsterImageInput = z.infer<typeof MonsterImageInputSchema>;

const MonsterImageOutputSchema = z.object({
  imageData: z.string().describe('The generated image as a data URI or base64 string.'),
});
export type MonsterImageOutput = z.infer<typeof MonsterImageOutputSchema>;

export async function generateMonsterImage(input: MonsterImageInput): Promise<MonsterImageOutput> {
  return monsterImageGenerationFlow(input);
}

const monsterImageGenerationFlow = ai.defineFlow(
  {
    name: 'monsterImageGenerationFlow',
    inputSchema: MonsterImageInputSchema,
    outputSchema: MonsterImageOutputSchema,
  },
  async ({ detailedPrompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: detailedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Add safety settings if needed, e.g., to allow more creative/darker imagery
        // safetySettings: [
        //   { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        // ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed or did not return an image URL.');
    }
    
    return { imageData: media.url }; // Returning the data URL as imageData
  }
);
