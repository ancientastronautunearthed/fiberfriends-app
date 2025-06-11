
'use server';
/**
 * @fileOverview Server actions for the Product Tracker feature.
 *
 * - generateAffirmationAction - Calls the AI flow to generate an affirmation.
 * - gradeProductEffectAction - Calls the AI flow to grade a product's effect.
 */

import {
  gradeProductEffect,
  ProductEffectGradingInput,
  ProductEffectGradingOutput,
} from '@/ai/flows/product-effect-grading-flow';
// Assuming your affirmation generation flow exports these:
import {
  generateAffirmation,
  type AffirmationOutput,
} from '@/ai/flows/affirmation-generation-flow';

export async function gradeProductEffectAction(
  input: ProductEffectGradingInput
): Promise<ProductEffectGradingOutput> {
  try {
    const result = await gradeProductEffect(input);
    return result;
  } catch (error) {
    console.error("Error in gradeProductEffectAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to grade product effect: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during product effect grading.");
  }
}

export async function generateAffirmationAction(): Promise<AffirmationOutput> {
  try {
    // Assuming runAffirmationGenerationFlow takes no arguments or has defaults
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
