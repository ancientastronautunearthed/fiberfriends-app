"use server";

import { analyzeSymptomPatterns, SymptomPatternAnalysisInput, SymptomPatternAnalysisOutput } from "@/ai/flows/symptom-pattern-analysis";

export async function analyzeSymptomPatternsAction(
  input: SymptomPatternAnalysisInput
): Promise<SymptomPatternAnalysisOutput> {
  try {
    const result = await analyzeSymptomPatterns(input);
    return result;
  } catch (error) {
    console.error("Error in analyzeSymptomPatternsAction:", error);
    // It's better to throw a custom error or a more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to analyze symptom patterns: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during symptom pattern analysis.");
  }
}
