
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a Romantic Monster based on a detailed prompt.
 *
 * - generateRomanticMonsterImage - Takes a detailed prompt and returns an image URL.
 * - RomanticMonsterImageInput - The input type for the generateRomanticMonsterImage function.
 * - RomanticMonsterImageOutput - The return type for the generateRomanticMonsterImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RomanticMonsterImageInputSchema = z.object({
  detailedPrompt: z.string().describe('A detailed and vivid image generation prompt for the Romantic Monster.'),
});
export type RomanticMonsterImageInput = z.infer<typeof RomanticMonsterImageInputSchema>;

const RomanticMonsterImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The generated image as a data URI.'),
});
export type RomanticMonsterImageOutput = z.infer<typeof RomanticMonsterImageOutputSchema>;

export async function generateRomanticMonsterImage(input: RomanticMonsterImageInput): Promise<RomanticMonsterImageOutput> {
  return romanticMonsterImageGenerationFlow(input);
}

const romanticMonsterImageGenerationFlow = ai.defineFlow(
  {
    name: 'romanticMonsterImageGenerationFlow',
    inputSchema: RomanticMonsterImageInputSchema,
    outputSchema: RomanticMonsterImageOutputSchema,
  },
  async ({ detailedPrompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: detailedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Safety settings might be adjusted if needed for more artistic interpretations
        // For romantic monsters, we generally want to avoid anything harmful or explicit.
         safetySettings: [
           { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
           { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
         ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Romantic monster image generation failed or did not return an image URL.');
    }
    
    return { imageUrl: media.url };
  }
);

