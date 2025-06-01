
'use server';

import {
  generateQuizQuestion,
  type QuizQuestionOutput,
} from '@/ai/flows/knowledge-nugget-quiz-flow';

export async function generateQuizQuestionAction(): Promise<QuizQuestionOutput> {
  try {
    const result = await generateQuizQuestion();
    return result;
  } catch (error) {
    console.error("Error in generateQuizQuestionAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate quiz question: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during quiz question generation.");
  }
}
