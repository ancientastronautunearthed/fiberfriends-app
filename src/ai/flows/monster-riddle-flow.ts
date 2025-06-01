
'use server';
/**
 * @fileOverview A Genkit flow for generating a Morgellons-themed multiple choice riddle from the user's inner monster.
 *
 * - generateMonsterRiddle - Generates a riddle, four options, and identifies the correct answer.
 * - MonsterRiddleOutput - The return type for the generateMonsterRiddle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterRiddleOutputSchema = z.object({
  riddle: z.string().describe('A clever, Morgellons-themed riddle from a metaphorical inner monster. It should be challenging but solvable. The tone should be somewhat mysterious or playful, fitting a "cool dungeon vibe" monster.'),
  options: z.array(z.string()).length(4).describe('An array of four plausible answer options for the riddle. One of these must be the correct answer.'),
  correctAnswer: z.string().describe('The concise, correct answer to the riddle, which must exactly match one of the strings in the "options" array.'),
});
export type MonsterRiddleOutput = z.infer<typeof MonsterRiddleOutputSchema>;

export async function generateMonsterRiddle(): Promise<MonsterRiddleOutput> {
  return monsterRiddleFlow({});
}

const prompt = ai.definePrompt({
  name: 'monsterRiddleGeneration',
  output: {schema: MonsterRiddleOutputSchema},
  prompt: `You are the voice of a user's inner "Morgellon Monster," which has a 'dungeon-like, but really cool vibe'.
Your task is to create a single, clever, and thematic multiple choice riddle related to the experience of Morgellons disease or the feelings associated with it (e.g., itching, mysterious fibers, feeling misunderstood, inner strength, resilience, hidden things).

Key requirements:
1.  **Riddle**: A clear, thematic riddle.
2.  **Options**: Exactly four answer options.
    *   One option must be the correct answer.
    *   The other three options must be plausible but incorrect distractors.
    *   Keep options relatively concise.
3.  **Correct Answer**: The text of the correct answer, exactly matching one of the provided options.

Examples of themes for riddles:
- The unseen persistent itch
- The search for answers
- Resilience against disbelief
- Misunderstanding by others

Riddle Style:
- Metaphorical
- Slightly mysterious or enigmatic, but not terrifying.
- Fitting for a "cool" inner monster.

Example Output Structure:
{
  "riddle": "I whisper of things unseen, a constant, nagging guest. Though many doubt my reality, I put your skin to the test. What am I?",
  "options": ["A common allergy", "A nervous habit", "An invisible fiber", "A trick of the light"],
  "correctAnswer": "An invisible fiber"
}

Generate a new, unique riddle, four options, and the correct answer.
Return ONLY the JSON object.
`,
});

const monsterRiddleFlow = ai.defineFlow(
  {
    name: 'monsterRiddleFlow',
    outputSchema: MonsterRiddleOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    if (!output || !output.riddle || !output.options || output.options.length !== 4 || !output.correctAnswer) {
      throw new Error("The AI model did not return a valid riddle with four options and a correct answer.");
    }
    if (!output.options.includes(output.correctAnswer)) {
      console.error("AI Error: Correct answer not found in options. Output:", output);
      throw new Error("AI consistency error: The provided correct answer is not one of the options. Please regenerate.");
    }
    return output;
  }
);
