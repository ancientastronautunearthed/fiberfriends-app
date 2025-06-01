
'use server';

import {
  generateAffirmation,
  type AffirmationOutput,
} from '@/ai/flows/affirmation-generation-flow';

export async function generateAffirmationAction(): Promise<AffirmationOutput> {
  try {
    const result = await generateAffirmation();
    return result;
  } catch (error) {
    console.error("Error in generateAffirmationAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate affirmation: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during affirmation generation.");
  }
}
