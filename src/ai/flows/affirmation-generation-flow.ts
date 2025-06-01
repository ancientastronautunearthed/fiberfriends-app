
'use server';
/**
 * @fileOverview A Genkit flow for generating a positive affirmation,
 * and optionally a grumpy monster counter-affirmation.
 *
 * - generateAffirmation - Generates an affirmation and a monster's counter.
 * - AffirmationOutput - The return type for the generateAffirmation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AffirmationOutputSchema = z.object({
  affirmationText: z.string().describe('A short, positive, and empowering affirmation. Should be general enough to apply to many people facing challenges.'),
  monsterCounterAffirmation: z.string().optional().describe("A brief, grumpy, dismissive, or comically negative comment from the user's inner monster about the affirmation. This is for flavor and should be short and characterful (e.g., 'Hmph, flowery words won't save you.')."),
});
export type AffirmationOutput = z.infer<typeof AffirmationOutputSchema>;

export async function generateAffirmation(): Promise<AffirmationOutput> {
  return affirmationGenerationFlow({});
}

const prompt = ai.definePrompt({
  name: 'affirmationGenerationPrompt',
  output: {schema: AffirmationOutputSchema},
  prompt: `You are an AI assistant tasked with creating a short, positive affirmation and, optionally, a humorous, grumpy counter-comment from a metaphorical "inner monster".
The affirmation should be general, empowering, and suitable for someone facing chronic health challenges or general life stress. Focus on themes like resilience, self-compassion, strength, hope, or inner peace.
The monster's counter-comment should be brief, in character (grumpy, dismissive, slightly dark but not truly harmful), and provide a bit of comic relief or contrast.

Examples of good affirmations:
- "I am capable of handling challenges with grace."
- "I choose to focus on what I can control today."
- "My inner strength is greater than any obstacle."
- "I treat myself with kindness and understanding."
- "Each day is a new opportunity for small joys."

Examples of monster counter-comments:
- "Pfft, 'grace'? Try 'grit and grumbling'."
- "Control is an illusion, morsel."
- "Obstacles are my specialty, actually."
- "Kindness? Bah! Weakness!"
- "Joy? What's that, a type of fungus?"

Generate:
1.  **affirmationText**: The positive affirmation.
2.  **monsterCounterAffirmation**: (Optional) The monster's grumpy retort. Make this about 50% of the time.

Return ONLY the JSON object.
`,
});

const affirmationGenerationFlow = ai.defineFlow(
  {
    name: 'affirmationGenerationFlow',
    outputSchema: AffirmationOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    if (!output || !output.affirmationText) {
      throw new Error("The AI model did not return a valid affirmation.");
    }
    return output;
  }
);
