
'use server';

import {
  gradePrescription,
  PrescriptionGradingInput,
  PrescriptionGradingOutput,
} from '@/ai/flows/prescription-grading-flow';

export async function gradePrescriptionAction(
  input: PrescriptionGradingInput
): Promise<PrescriptionGradingOutput> {
  try {
    const result = await gradePrescription(input);
    return result;
  } catch (error) {
    console.error("Error in gradePrescriptionAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to grade prescription: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during prescription grading.");
  }
}
