
'use server';
/**
 * @fileOverview A Genkit flow for analyzing the quality of a chat message in a romantic/connecting context.
 *
 * - analyzeMessageQuality - Takes message text and returns a quality score.
 * - MessageQualityInput - The input type for the analyzeMessageQuality function.
 * - MessageQualityOutput - The return type for the analyzeMessageQuality function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const MessageQualityInputSchema = z.object({
  messageText: z.string().describe('The chat message text to be analyzed.'),
});
export type MessageQualityInput = z.infer<typeof MessageQualityInputSchema>;

export const MessageQualityOutputSchema = z.object({
  score: z.number().min(-5).max(10).describe('A score from -5 (poor/negative) to +10 (excellent/engaging), representing the quality of the message for fostering connection.'),
  reasoning: z.string().optional().describe('A brief justification for the score, if applicable.'),
});
export type MessageQualityOutput = z.infer<typeof MessageQualityOutputSchema>;

export async function analyzeMessageQuality(input: MessageQualityInput): Promise<MessageQualityOutput> {
  return messageQualityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'messageQualityAnalysisPrompt',
  input: {schema: MessageQualityInputSchema},
  output: {schema: MessageQualityOutputSchema},
  prompt: `You are an AI assistant evaluating the quality of a chat message sent in a dating/connection context between two individuals.
The goal is to assess how well the message fosters positive interaction, engagement, and connection.

Message Text: "{{{messageText}}}"

Analyze this message based on the following criteria:
- Positivity: Is the tone positive, neutral, or negative?
- Engagement: Does it ask questions, show interest, or invite further conversation?
- Kindness & Respect: Is it polite and respectful?
- Creativity/Effort: Does it show thought or is it very generic?
- Constructiveness: Does it build on previous conversation (if implied) or offer something new?

Assign a score from -5 to +10:
-   (-5 to -1): Negative, rude, dismissive, or offensive.
-   (0): Very low effort, generic, hard to respond to (e.g., "ok", "lol").
-   (1 to 3): Neutral or polite but very basic, doesn't add much.
-   (4 to 6): Good, positive, shows some interest or effort.
-   (7 to 8): Very good, engaging, thoughtful, asks good questions.
-   (9 to 10): Excellent, creative, very engaging, shows strong interest and fosters connection well.

Provide a score and an optional brief reasoning for the score.
Return ONLY the JSON object.
`,
});

const messageQualityFlow = ai.defineFlow(
  {
    name: 'messageQualityFlow',
    inputSchema: MessageQualityInputSchema,
    outputSchema: MessageQualityOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a message quality score.");
    }
    return output;
  }
);
