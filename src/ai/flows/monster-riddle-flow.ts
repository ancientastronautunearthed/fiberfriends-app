
'use server';
/**
 * @fileOverview A Genkit flow for generating a Morgellons-themed riddle from the user's inner monster.
 *
 * - generateMonsterRiddle - Generates a riddle and its answer.
 * - MonsterRiddleOutput - The return type for the generateMonsterRiddle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterRiddleOutputSchema = z.object({
  riddle: z.string().describe('A clever, Morgellons-themed riddle from a metaphorical inner monster. It should be challenging but solvable within a short time. The tone should be somewhat mysterious or playful, fitting a "cool dungeon vibe" monster. The riddle must contain three distinct clues, spread evenly throughout its text.'),
  answer: z.string().describe('The concise answer to the riddle. This should be a single word or a very short phrase.'),
});
export type MonsterRiddleOutput = z.infer<typeof MonsterRiddleOutputSchema>;

// No input schema needed for this version as the monster context is implicit.
// If we wanted to personalize riddles based on monster type/words, we'd add an input schema.

export async function generateMonsterRiddle(): Promise<MonsterRiddleOutput> {
  return monsterRiddleFlow({}); // Pass empty object if no input schema
}

const prompt = ai.definePrompt({
  name: 'monsterRiddleGeneration',
  // No input schema defined here, but you could add one if the riddle needs context
  // input: {schema: z.object({})}, 
  output: {schema: MonsterRiddleOutputSchema},
  prompt: `You are the voice of a user's inner "Morgellon Monster," which has a 'dungeon-like, but really cool vibe'.
Your task is to create a single, clever, and thematic riddle related to the experience of Morgellons disease or the feelings associated with it (e.g., itching, mysterious fibers, feeling misunderstood, inner strength, resilience, hidden things).

Key requirements for the riddle:
1.  **Three Distinct Clues**: The riddle MUST contain exactly three distinct clues that help lead to the answer.
2.  **Evenly Spread Clues**: These three clues should be woven into the riddle, appearing at different points (e.g., one near the beginning, one in the middle, and one towards the end) to guide the solver gradually. Do not cluster all clues together.
3.  **Solvable**: The riddle should be challenging yet solvable within about 10-15 seconds given the clues.
4.  **Concise Answer**: The answer should be a single word or a very short phrase.

Examples of themes for riddles:
- The unseen
- The persistent itch
- The search for answers
- Resilience
- Misunderstanding by others
- The body as a landscape

Riddle Style:
- Metaphorical
- Slightly mysterious or enigmatic, but not terrifying.
- Fitting for a "cool" inner monster, not just a scary one.

Example Riddle Structure with 3 clues (but be creative!):
Riddle: "I am an unseen irritation, often dismissed with a sigh (Clue 1). I leave tiny mysteries upon your skin, though some say they are a lie (Clue 2). I test your will and seek validation, a constant, invisible try (Clue 3). What am I?"
Answer: "Fibers"

Generate a new, unique riddle and its concise answer, following all the above requirements.
Return ONLY the JSON object with "riddle" and "answer" fields.
`,
});

const monsterRiddleFlow = ai.defineFlow(
  {
    name: 'monsterRiddleFlow',
    // inputSchema: z.object({}), // No specific input needed from client for this version
    outputSchema: MonsterRiddleOutputSchema,
    // Add safety settings if desired, e.g., to prevent overly distressing riddles.
    // config: {
    //   safetySettings: [
    //     { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    //   ]
    // }
  },
  async () => { // No input parameter needed here if no inputSchema
    const {output} = await prompt({}); // Call prompt with empty object
    if (!output || !output.riddle || !output.answer) {
      throw new Error("The AI model did not return a valid riddle and answer.");
    }
    return output;
  }
);

