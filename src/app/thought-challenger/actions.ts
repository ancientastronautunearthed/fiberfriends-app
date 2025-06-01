'use server';

import {
  challengeThought,
  type ThoughtChallengerInput,
  type ThoughtChallengerOutput,
} from '@/ai/flows/thought-challenger-flow';

export async function analyzeThoughtAction(
  input: ThoughtChallengerInput
): Promise<ThoughtChallengerOutput> {
  try {
    const result = await challengeThought(input);
    return result;
  } catch (error) {
    console.error("Error in analyzeThoughtAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze thought: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during thought analysis.");
  }
}