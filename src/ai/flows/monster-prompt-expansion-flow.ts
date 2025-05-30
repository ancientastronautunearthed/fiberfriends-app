
'use server';
/**
 * @fileOverview A Genkit flow for expanding user-provided words into a detailed image prompt and a name for a Morgellon Monster.
 *
 * - expandMonsterPrompt - Takes 5 words and generates a detailed image prompt and a monster name.
 * - MonsterWordsInput - The input type for the expandMonsterPrompt function.
 * - MonsterPromptOutput - The return type for the expandMonsterPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterWordsInputSchema = z.object({
  words: z
    .array(z.string())
    .length(5, { message: "Please provide exactly 5 words." })
    .describe('An array of exactly 5 words describing the user\'s inner Morgellon Monster.'),
});
export type MonsterWordsInput = z.infer<typeof MonsterWordsInputSchema>;

const MonsterPromptOutputSchema = z.object({
  monsterName: z.string().describe('A cool, thematic, and unchangeable name for the Morgellon Monster based on the 5 words and dungeon-like vibe.'),
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
  prompt: `You are a highly creative AI assistant specializing in crafting vivid image generation prompts and thematic names.
A user will provide 5 words to describe their personal, metaphorical 'Morgellon Monster'.
Your tasks are:
1. Generate a cool, thematic, and unchangeable name for the Morgellon Monster. The name should evoke a 'dungeon-like, but really cool vibe', reflecting its unique nature based on the 5 words.
2. Take these 5 words and expand them into a single, detailed, and evocative paragraph that can be used as a prompt for an image generation model.

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

Based on these words, generate a monsterName and a detailedPrompt.
Example of a good detailed prompt structure: "An immense, shadowy beast composed of [word1-inspired material] and [word2-inspired feature], its eyes glowing with [word3-inspired color] light. It lurks within a [word4-inspired dungeon element] chamber, where ancient [word5-inspired symbols/textures] cover the damp stone walls. Ethereal mist clings to the ground, and a cool, otherworldly luminescence emanates from strange crystals embedded in the rock."

Return the monsterName and the detailedPrompt. Do not add any preamble or explanation, just the JSON output with monsterName and detailedPrompt fields.
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
    if (!output || !output.detailedPrompt || !output.monsterName) {
      throw new Error("The AI model did not return a detailed prompt and/or a monster name.");
    }
    return output;
  }
);
