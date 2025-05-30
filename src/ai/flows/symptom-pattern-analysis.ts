'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing symptom patterns.
 *
 * - analyzeSymptomPatterns - A function that takes symptom journal entries and identifies potential patterns, triggers, or correlations.
 * - SymptomPatternAnalysisInput - The input type for the analyzeSymptomPatterns function.
 * - SymptomPatternAnalysisOutput - The output type for the analyzeSymptomPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomEntrySchema = z.object({
  date: z.string().describe('The date of the symptom entry.'),
  symptoms: z.array(z.string()).describe('A list of symptoms experienced.'),
  notes: z.string().optional().describe('Any additional notes or observations.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo related to the symptom entry, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const SymptomPatternAnalysisInputSchema = z.object({
  userSymptomEntries: z.array(SymptomEntrySchema).describe('The user’s symptom journal entries.'),
  includeCommunityData: z
    .boolean()
    .default(false)
    .describe('Whether to include anonymized community data in the analysis.'),
  communitySymptomEntries: z.array(SymptomEntrySchema).optional().describe('Anonymized symptom journal entries from other users.'),
});
export type SymptomPatternAnalysisInput = z.infer<typeof SymptomPatternAnalysisInputSchema>;

const PatternIdentificationSchema = z.object({
  identifiedPatterns: z.array(z.string()).describe('Patterns found.'),
  potentialTriggers: z.array(z.string()).describe('Possible triggers identified.'),
  correlations: z.array(z.string()).describe('Correlations between symptoms or triggers.'),
  summary: z.string().describe('A summary of the analysis.'),
});

const SymptomPatternAnalysisOutputSchema = z.object({
  patternAnalysis: PatternIdentificationSchema.describe('The analysis of symptom patterns.'),
});
export type SymptomPatternAnalysisOutput = z.infer<typeof SymptomPatternAnalysisOutputSchema>;

export async function analyzeSymptomPatterns(input: SymptomPatternAnalysisInput): Promise<SymptomPatternAnalysisOutput> {
  return symptomPatternAnalysisFlow(input);
}

const symptomPatternAnalysisPrompt = ai.definePrompt({
  name: 'symptomPatternAnalysisPrompt',
  input: {schema: SymptomPatternAnalysisInputSchema},
  output: {schema: SymptomPatternAnalysisOutputSchema},
  prompt: `You are an AI assistant designed to analyze symptom journal entries and identify potential patterns, triggers, or correlations.

  Analyze the following user symptom entries:
  {{#each userSymptomEntries}}
  Date: {{date}}
  Symptoms: {{symptoms}}
  Notes: {{notes}}
  {{#if photoDataUri}}
  Photo: {{media url=photoDataUri}}
  {{/if}}
  {{/each}}

  {{#if includeCommunityData}}
  Also, analyze the following anonymized community symptom entries:
  {{#each communitySymptomEntries}}
  Date: {{date}}
  Symptoms: {{symptoms}}
  Notes: {{notes}}
  {{/each}}
  {{/if}}

  Identify any patterns, potential triggers, and correlations in the data. Provide a summary of your analysis.
  Patterns are recurring sets of symptoms. Triggers are events that seem to cause a symptom to appear. Correlations are symptoms that seem to appear together.

  Format the output using JSON, making sure to populate the identifiedPatterns, potentialTriggers, correlations, and summary fields.
  `, // Prompt content
});

const symptomPatternAnalysisFlow = ai.defineFlow(
  {
    name: 'symptomPatternAnalysisFlow',
    inputSchema: SymptomPatternAnalysisInputSchema,
    outputSchema: SymptomPatternAnalysisOutputSchema,
  },
  async input => {
    const {output} = await symptomPatternAnalysisPrompt(input);
    return output!;
  }
);
