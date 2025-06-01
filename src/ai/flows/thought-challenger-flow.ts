'use server';
/**
 * @fileOverview A Genkit flow for assisting users with Cognitive Behavioral Therapy (CBT)
 * by challenging distressing thoughts.
 *
 * - challengeThought - Analyzes a distressing thought and user inputs, identifies cognitive distortions,
 *                      provides feedback, and suggests reframe starters.
 * - ThoughtChallengerInput - The input type for the challengeThought function.
 * - ThoughtChallengerOutput - The return type for the challengeThought function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThoughtChallengerInputSchema = z.object({
  distressingThought: z.string().describe('The user\'s distressing thought they want to challenge.'),
  evidenceFor: z.string().optional().describe('User-provided evidence supporting the distressing thought.'),
  evidenceAgainst: z.string().optional().describe('User-provided evidence contradicting the distressing thought.'),
  alternativePerspective: z.string().optional().describe('User-provided alternative way of looking at the situation.'),
  adviceToFriend: z.string().optional().describe('What the user would tell a friend who had this thought.'),
});
export type ThoughtChallengerInput = z.infer<typeof ThoughtChallengerInputSchema>;

const ThoughtChallengerOutputSchema = z.object({
  cognitiveDistortionsIdentified: z.array(z.string()).describe('A list of common cognitive distortions potentially present in the thought (e.g., "Catastrophizing", "All-or-Nothing Thinking", "Mind Reading"). Keep these concise (1-3 words).').max(3),
  analysisFeedback: z.string().describe('Gentle, empathetic feedback on the user\'s analysis (their evidence for/against, alternative perspective, advice to friend). Offer encouragement and highlight any strengths in their analysis. If some fields are blank, gently acknowledge that and focus on the provided info. Frame this as a supportive reflection.'),
  suggestedReframeStarters: z.array(z.string()).describe('A few (2-3) distinct starter phrases to help the user formulate a more balanced reframe. These should be open-ended.').max(3),
  reframeSupportMessage: z.string().describe('A brief, encouraging message to support the user as they write their balanced reframe (e.g., "You\'re doing great taking this step. Remember to be kind to yourself as you reframe.").'),
});
export type ThoughtChallengerOutput = z.infer<typeof ThoughtChallengerOutputSchema>;

export async function challengeThought(input: ThoughtChallengerInput): Promise<ThoughtChallengerOutput> {
  return thoughtChallengerFlow(input);
}

const thoughtChallengerPrompt = ai.definePrompt({
  name: 'thoughtChallengerPrompt',
  input: {schema: ThoughtChallengerInputSchema},
  output: {schema: ThoughtChallengerOutputSchema},
  prompt: `You are an empathetic AI assistant trained in basic Cognitive Behavioral Therapy (CBT) principles. Your role is to help a user challenge a distressing thought. Be supportive, gentle, and non-judgmental.

The user is working through the following:
Distressing Thought: "{{{distressingThought}}}"

User's initial analysis (some fields may be blank):
- Evidence FOR the thought: "{{{evidenceFor}}}"
- Evidence AGAINST the thought: "{{{evidenceAgainst}}}"
- Alternative Perspective: "{{{alternativePerspective}}}"
- Advice they'd give to a friend with this thought: "{{{adviceToFriend}}}"

Your tasks:
1.  **Identify Cognitive Distortions**: Based on the "Distressing Thought", list 1-3 common cognitive distortions that might be at play (e.g., Catastrophizing, Overgeneralization, Mind Reading, Emotional Reasoning, All-or-Nothing Thinking, Personalization, Labeling, Should Statements, Magnification/Minimization). If none seem obvious, you can return an empty array or a general statement. Keep distortion names concise (1-3 words).
2.  **Provide Analysis Feedback**: Gently comment on the user's provided analysis (evidence, alternative, advice).
    *   Acknowledge their effort.
    *   If they've provided strong counter-evidence or good advice to a friend, praise that.
    *   If some fields are blank, that's okay; focus on what they provided.
    *   Keep this feedback supportive and concise (2-3 sentences).
3.  **Suggest Reframe Starters**: Offer 2-3 distinct, open-ended sentence starters to help them write a more balanced thought. Examples: "It's possible that...", "While it feels like X, it might also be true that...", "Even if X happens, I can still...", "A more helpful way to see this is..."
4.  **Provide Reframe Support Message**: Write a brief, encouraging message for the user as they prepare to write their reframe.

Return ONLY the JSON object based on the ThoughtChallengerOutputSchema.
`,
});

const thoughtChallengerFlow = ai.defineFlow(
  {
    name: 'thoughtChallengerFlow',
    inputSchema: ThoughtChallengerInputSchema,
    outputSchema: ThoughtChallengerOutputSchema,
  },
  async (input) => {
    const {output} = await thoughtChallengerPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid analysis for the thought challenge.");
    }
    return output;
  }
);
