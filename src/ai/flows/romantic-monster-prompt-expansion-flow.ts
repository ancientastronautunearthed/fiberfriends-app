
'use server';
/**
 * @fileOverview A Genkit flow for expanding user-provided words into a detailed image prompt and a name for a Romantic Monster.
 *
 * - expandRomanticMonsterPrompt - Takes 5 words and generates a detailed image prompt and a monster name.
 * - RomanticMonsterWordsInput - The input type for the expandRomanticMonsterPrompt function.
 * - RomanticMonsterPromptOutput - The return type for the expandRomanticMonsterPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const RomanticMonsterWordsInputSchema = z.object({
  words: z
    .array(z.string())
    .length(5, { message: "Please provide exactly 5 words." })
    .describe('An array of exactly 5 words describing the user\'s Romantic Monster persona.'),
});
export type RomanticMonsterWordsInput = z.infer<typeof RomanticMonsterWordsInputSchema>;

export const RomanticMonsterPromptOutputSchema = z.object({
  monsterName: z.string().describe('A charming, whimsical, or alluring name for the Romantic Monster, based on the 5 words and a romantic vibe.'),
  detailedPrompt: z.string().describe('A detailed and vivid image generation prompt for a Romantic Monster, based on the 5 words. The style should be more whimsical, charming, or alluring than a typical dungeon monster.'),
});
export type RomanticMonsterPromptOutput = z.infer<typeof RomanticMonsterPromptOutputSchema>;

export async function expandRomanticMonsterPrompt(input: RomanticMonsterWordsInput): Promise<RomanticMonsterPromptOutput> {
  return romanticMonsterPromptExpansionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'romanticMonsterPromptExpansion',
  input: {schema: RomanticMonsterWordsInputSchema},
  output: {schema: RomanticMonsterPromptOutputSchema},
  prompt: `You are a highly creative AI assistant specializing in crafting charming image generation prompts and thematic names for romantic monster personas.
A user will provide 5 words to describe their personal 'Romantic Monster' for a dating profile context.
Your tasks are:
1. Generate a charming, whimsical, or alluring name for the Romantic Monster. The name should evoke a sense of romance, mystery, or unique charm, reflecting its nature based on the 5 words. It should NOT be dark or scary.
2. Take these 5 words and expand them into a single, detailed, and evocative paragraph for an image generation model.

The image should have a 'romantic, charming, or alluring but still monster-like vibe'. This means:
- Atmosphere: Enchanting, mysterious, perhaps a little playful or elegant. Avoid anything grotesque or overly frightening.
- Lighting: Consider soft glows, magical sparkles, moonlight, or warm, inviting light.
- Textures: Could be soft fur, iridescent scales, flowing silks, bioluminescent patterns, or polished gemstones.
- Colors: A palette that could include pastels, jewel tones, deep romantic reds/purples, or ethereal blues/silvers, accented by highlights.
- Mood: The monster should be appealing and intriguing, a fantasy companion. It represents a unique romantic aspect.

User's 5 words:
{{#each words}}
- {{{this}}}
{{/each}}

Based on these words, generate a monsterName and a detailedPrompt.
Example of a good detailed prompt structure: "A graceful creature with [word1-inspired feature, e.g., velvet antlers] and [word2-inspired eyes, e.g., eyes like shimmering amethysts], adorned with [word3-inspired element, e.g., bioluminescent floral patterns]. It stands in a [word4-inspired setting, e.g., moonlit, crystalline cave] where [word5-inspired details, e.g., glowing motes of light drift through the air]. Its expression is gentle and inviting."

Return the monsterName and the detailedPrompt. Do not add any preamble or explanation, just the JSON output.
`,
});

const romanticMonsterPromptExpansionFlow = ai.defineFlow(
  {
    name: 'romanticMonsterPromptExpansionFlow',
    inputSchema: RomanticMonsterWordsInputSchema,
    outputSchema: RomanticMonsterPromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.detailedPrompt || !output.monsterName) {
      throw new Error("The AI model did not return a detailed prompt and/or a monster name for the romantic monster.");
    }
    return output;
  }
);
