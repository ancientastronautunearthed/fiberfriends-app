'use server';
/**
 * @fileOverview A Genkit flow for expanding user-provided words into a detailed image prompt for a Morgellon Monster.
 *
 * - expandMonsterPrompt - Takes 5 words and generates a detailed image prompt.
 * - MonsterWordsInput - The input type for the expandMonsterPrompt function.
 * - MonsterPromptOutput - The return type for the expandMonsterPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const MonsterWordsInputSchema = z.object({
  words: z
    .array(z.string())
    .length(5, { message: "Please provide exactly 5 words." })
    .describe('An array of exactly 5 words describing the user\'s inner Morgellon Monster.'),
});
export type MonsterWordsInput = z.infer<typeof MonsterWordsInputSchema>;

export const MonsterPromptOutputSchema = z.object({
  detailedPrompt: z.string().describe('A detailed and vivid image generation prompt based on the 5 words.'),
});
export type MonsterPromptOutput = z.infer<typeof MonsterPromptOutputSchema>;

export async function expandMonsterPrompt(input: MonsterWordsInput): Promise<MonsterPromptOutput> {
  return monsterPromptExpansionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monsterPromptExpansion',
  input: {schema: MonsterWordsInputSchema},
  output: {schema: MonsterPromptOutputSchema},
  prompt: `You are a highly creative AI assistant specializing in crafting vivid image generation prompts.
A user will provide 5 words to describe their personal, metaphorical 'Morgellon Monster'.
Your task is to take these 5 words and expand them into a single, detailed, and evocative paragraph that can be used as a prompt for an image generation model.

The image should have a 'dungeon-like, but really cool vibe'. This means:
- Atmosphere: Dark, mysterious, ancient, possibly with a sense of confinement but also awe.
- Lighting: Consider low-key lighting, perhaps with sources like magical glows, bioluminescence, eerie torchlight, or light filtering through cracks.
- Textures: Emphasize textures like rough stone, aged metal, crystalline formations, strange growths, or ethereal energy.
- Colors: A palette of deep, desaturated colors (dark blues, purples, greys, mossy greens) accented by vibrant, cool highlights (electric blues, spectral purples, glowing ambers, or acidic greens).
- Mood: The monster should be a powerful metaphor, not necessarily terrifying but definitely impactful, representing an inner struggle or a hidden aspect. It should feel 'cool' and visually striking.

User's 5 words:
{{#each words}}
- {{{this}}}
{{/each}}

Based on these words, generate a single paragraph prompt. The prompt should be rich in sensory details and descriptive language to inspire a unique and compelling image. Focus on translating the essence of the 5 words into this specific aesthetic.
Example of a good prompt structure: "An immense, shadowy beast composed of [word1-inspired material] and [word2-inspired feature], its eyes glowing with [word3-inspired color] light. It lurks within a [word4-inspired dungeon element] chamber, where ancient [word5-inspired symbols/textures] cover the damp stone walls. Ethereal mist clings to the ground, and a cool, otherworldly luminescence emanates from strange crystals embedded in the rock."

Do not add any preamble or explanation, just the detailed prompt.
`,
});

const monsterPromptExpansionFlow = ai.defineFlow(
  {
    name: 'monsterPromptExpansionFlow',
    inputSchema: MonsterWordsInputSchema,
    outputSchema: MonsterPromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a detailed prompt.");
    }
    return output;
  }
);
