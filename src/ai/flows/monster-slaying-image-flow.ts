
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a user's monster in a victorious or empowered state.
 *
 * - generateMonsterSlayingImage - Takes monster details and an achievement, returns an image URL.
 * - MonsterSlayingImageInput - The input type for the generateMonsterSlayingImage function.
 * - MonsterSlayingImageOutput - The return type for the generateMonsterSlayingImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterSlayingImageInputSchema = z.object({
  monsterName: z.string().describe("The name of the user's monster."),
  monsterInitialImageUrl: z.string().url().optional().describe("The existing image URL of the monster, if available, to provide context for image generation (as a data URI)."),
  achievement: z.string().describe("A description of the achievement or victory, e.g., 'Completed Daily Battle Plan!', 'Reached Level 10 in Quiz'."),
});
export type MonsterSlayingImageInput = z.infer<typeof MonsterSlayingImageInputSchema>;

const MonsterSlayingImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The generated image of the victorious monster as a data URI.'),
});
export type MonsterSlayingImageOutput = z.infer<typeof MonsterSlayingImageOutputSchema>;

export async function generateMonsterSlayingImage(input: MonsterSlayingImageInput): Promise<MonsterSlayingImageOutput> {
  return monsterSlayingImageFlow(input);
}

const monsterSlayingImageFlow = ai.defineFlow(
  {
    name: 'monsterSlayingImageFlow',
    inputSchema: MonsterSlayingImageInputSchema,
    outputSchema: MonsterSlayingImageOutputSchema,
  },
  async ({ monsterName, monsterInitialImageUrl, achievement }) => {
    let imagePromptParts = [];
    imagePromptParts.push(`Generate a visually striking image of the monster named "${monsterName}" looking victorious and empowered.`);
    imagePromptParts.push(`The monster has just achieved: "${achievement}".`);
    
    let generationInput: string | (object | {text: string})[] = "";

    if (monsterInitialImageUrl) {
      // Construct a prompt that uses the initial image as context
      // Note: The exact structure for multi-modal prompts (image + text) can vary slightly by model version.
      // This structure is a common way to represent it.
      generationInput = [
        { media: { url: monsterInitialImageUrl } },
        { text: `Based on the provided image of "${monsterName}", depict it as victorious and empowered after achieving: "${achievement}". Enhance its look with a sense of triumph, perhaps a glowing aura, powerful pose, or surrounded by symbols of its victory. Style: epic, slightly fantastical, digital painting.` }
      ];
    } else {
      // Text-only prompt if no initial image
      generationInput = imagePromptParts.join(" ") + ` The monster should look cool, perhaps a bit dark or mysterious but ultimately a representation of the user's inner strength overcoming a challenge. Style: epic, slightly fantastical, digital painting.`;
    }
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: generationInput,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [ 
           { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
           { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
           { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
           { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
         ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Monster slaying image generation failed or did not return an image URL.');
    }
    
    return { imageUrl: media.url };
  }
);

