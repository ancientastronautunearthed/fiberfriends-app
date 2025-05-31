
'use server';
/**
 * @fileOverview A Genkit flow for generating humorous or thematic banter between two Romantic Monsters,
 * reflecting the tone of the human users' conversation.
 *
 * - generateMonsterBanter - Takes context and returns a snippet of monster banter.
 * - MonsterBanterInput - The input type for the generateMonsterBanter function.
 * - MonsterBanterOutput - The return type for the generateMonsterBanter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MonsterBanterInputSchema = z.object({
  userMessageText: z.string().describe("The latest message sent by the human user, which sets the immediate context."),
  userMonsterName: z.string().describe("The name of the user's Romantic Monster."),
  opponentMonsterName: z.string().describe("The name of the opponent's Romantic Monster."),
  currentConversationTone: z.enum(["positive", "neutral", "negative", "flirty", "awkward"]).describe("The overall tone of the human conversation, derived from message quality."),
  previousBanter: z.array(z.object({
    speakerMonsterName: z.string().optional().describe("The monster previously featured or 'speaking' in the banter."), // Making this optional as AI might describe a general scene
    banterText: z.string().describe("The previous line of monster banter.")
  })).max(3).optional().describe("The last few lines of monster banter, if any, for context. Maximum of 3 entries."),
});
export type MonsterBanterInput = z.infer<typeof MonsterBanterInputSchema>;

const MonsterBanterOutputSchema = z.object({
  banter: z.string().describe("A short, descriptive piece of banter (1-2 sentences) describing the Romantic Monsters' interaction or reaction. This should not be direct dialogue in quotes, but rather a narrative description. e.g., 'Velvet Whisperwind shivers with excitement, its antlers glowing faintly.' or 'Starlight Dreamer lets out a soft, melodic hum in response to the positive vibe.'"),
});
export type MonsterBanterOutput = z.infer<typeof MonsterBanterOutputSchema>;

export async function generateMonsterBanter(input: MonsterBanterInput): Promise<MonsterBanterOutput> {
  return monsterBanterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monsterBanterGenerationPrompt',
  input: {schema: MonsterBanterInputSchema},
  output: {schema: MonsterBanterOutputSchema},
  prompt: `You are a witty and imaginative "Monster Banter Director" for a dating app where users have Romantic Monster personas.
Your task is to generate a short, thematic piece of banter or a descriptive reaction (1-2 sentences, NOT direct dialogue in quotes) for the monsters named {{userMonsterName}} and {{opponentMonsterName}}.
This banter should humorously, oddly, or thematically reflect the latest human message and the overall conversation tone.

Human User's Message: "{{userMessageText}}"
Conversation Tone: {{currentConversationTone}}
User's Monster: {{userMonsterName}}
Opponent's Monster: {{opponentMonsterName}}

{{#if previousBanter}}
Previous Banter for context:
{{#each previousBanter}}
- {{#if speakerMonsterName}}{{speakerMonsterName}}: {{/if}}{{banterText}}
{{/each}}
{{/if}}

Instructions:
- The banter should be from an observational perspective, describing what the monsters are doing or feeling.
- Examples:
    - If tone is "flirty" & message is positive: "{{userMonsterName}} seems to puff up its iridescent feathers, while {{opponentMonsterName}} lets out a series of happy chirps."
    - If tone is "awkward" & message is hesitant: "{{userMonsterName}} shuffles its shadowy paws nervously, as {{opponentMonsterName}} stares blankly for a moment before its single eye blinks slowly."
    - If tone is "positive": "{{opponentMonsterName}}'s bioluminescent spots pulse warmly, seemingly in approval of {{userMonsterName}}'s words."
- Be creative and keep it concise and SFW (safe for work). It can be humorous, odd, cute, or even a little mysteriously "monster-like".
- Do NOT generate dialogue for the human opponent. Focus only on the monsters' reactions or interactions.
- Decide which monster is primarily featured or if it's a mutual reaction.

Generate the banter based on the MonsterBanterOutputSchema.
`,
});

const monsterBanterFlow = ai.defineFlow(
  {
    name: 'monsterBanterFlow',
    inputSchema: MonsterBanterInputSchema,
    outputSchema: MonsterBanterOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI Monster Banter Director is stumped and didn't return any banter.");
    }
    return output;
  }
);

