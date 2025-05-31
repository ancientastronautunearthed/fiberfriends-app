
'use server';
/**
 * @fileOverview Server actions for the Product Tracker feature.
 *
 * - gradeProductEffectAction - Calls the AI flow to grade a product's effect.
 */

import {
  gradeProductEffect,
  ProductEffectGradingInput,
  ProductEffectGradingOutput,
} from '@/ai/flows/product-effect-grading-flow';

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
