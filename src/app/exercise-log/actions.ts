
'use server';

import {
  gradeExercise,
  ExerciseGradingInput,
  ExerciseGradingOutput,
} from '@/ai/flows/exercise-grading-flow';

export async function gradeExerciseAction(
  input: ExerciseGradingInput
): Promise<ExerciseGradingOutput> {
  try {
    const result = await gradeExercise(input);
    return result;
  } catch (error) {
    console.error("Error in gradeExerciseAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to grade exercise: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during exercise grading.");
  }
}
