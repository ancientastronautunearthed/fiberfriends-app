
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing symptom patterns,
 * potentially incorporating weather data if user location is provided.
 *
 * - analyzeSymptomPatterns - A function that takes symptom journal entries and identifies potential patterns, triggers, or correlations.
 * - SymptomPatternAnalysisInput - The input type for the analyzeSymptomPatterns function.
 * - SymptomPatternAnalysisOutput - The output type for the analyzeSymptomPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getHistoricalWeather } from '@/services/weather-service';

const SymptomEntrySchema = z.object({
  date: z.string().describe('The date of the symptom entry in YYYY-MM-DD format.'),
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
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional().describe("The user's general latitude and longitude for weather correlation."),
  includeCommunityData: z
    .boolean()
    .default(false)
    .describe('Whether to include anonymized community data in the analysis.'),
  communitySymptomEntries: z.array(SymptomEntrySchema).optional().describe('Anonymized symptom journal entries from other users.'),
});
export type SymptomPatternAnalysisInput = z.infer<typeof SymptomPatternAnalysisInputSchema>;

const PatternIdentificationSchema = z.object({
  identifiedPatterns: z.array(z.string()).describe('Patterns found among symptoms, potentially considering weather.'),
  potentialTriggers: z.array(z.string()).describe('Possible triggers identified, including environmental factors like weather if applicable.'),
  correlations: z.array(z.string()).describe('Correlations between symptoms, or symptoms and triggers (e.g., weather conditions).'),
  summary: z.string().describe('A summary of the analysis, incorporating weather insights if available and relevant.'),
});

const SymptomPatternAnalysisOutputSchema = z.object({
  patternAnalysis: PatternIdentificationSchema.describe('The analysis of symptom patterns, possibly including weather impact.'),
});
export type SymptomPatternAnalysisOutput = z.infer<typeof SymptomPatternAnalysisOutputSchema>;


const GetHistoricalWeatherInputSchema = z.object({
  date: z.string().describe("The date for which to fetch weather data, in YYYY-MM-DD format."),
  latitude: z.number().describe("The latitude of the location."),
  longitude: z.number().describe("The longitude of the location."),
});

const GetHistoricalWeatherOutputSchema = z.object({
  temperature: z.number().describe("Average temperature in Celsius."),
  humidity: z.number().describe("Average relative humidity in percentage."),
}).nullable();

const getHistoricalWeatherTool = ai.defineTool(
  {
    name: 'getHistoricalWeatherTool',
    description: 'Fetches historical daily average temperature and relative humidity for a specific date and location. Returns null if data cannot be fetched.',
    inputSchema: GetHistoricalWeatherInputSchema,
    outputSchema: GetHistoricalWeatherOutputSchema,
  },
  async ({ date, latitude, longitude }) => {
    return await getHistoricalWeather(date, latitude, longitude);
  }
);

export async function analyzeSymptomPatterns(input: SymptomPatternAnalysisInput): Promise<SymptomPatternAnalysisOutput> {
  return symptomPatternAnalysisFlow(input);
}

const symptomPatternAnalysisPrompt = ai.definePrompt({
  name: 'symptomPatternAnalysisPrompt',
  input: {schema: SymptomPatternAnalysisInputSchema},
  output: {schema: SymptomPatternAnalysisOutputSchema},
  tools: [getHistoricalWeatherTool],
  prompt: `You are an AI assistant specialized in analyzing symptom journal entries to identify potential patterns, triggers, or correlations.

  User's general location (if provided, use for weather data):
  {{#if userLocation}}
  Latitude: {{userLocation.latitude}}, Longitude: {{userLocation.longitude}}
  If the userLocation is provided, you MUST use the 'getHistoricalWeatherTool' for EACH symptom entry date to fetch the weather data (average temperature and humidity).
  The tool requires the 'date' from the symptom entry (in YYYY-MM-DD format) and the 'latitude' and 'longitude' from the 'userLocation' provided above.
  Incorporate this weather data into your analysis.
  {{else}}
  No user location provided for weather correlation. Analyze symptoms based on provided entries only.
  {{/if}}

  Analyze the following user symptom entries:
  {{#each userSymptomEntries}}
  Entry:
  Date: {{date}}
  Symptoms: {{#each symptoms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{#if notes}}Notes: {{notes}}{{/if}}
  {{#if photoDataUri}}
  (Image provided for this entry)
  Photo: {{media url=photoDataUri}}
  {{/if}}
  ---
  {{/each}}

  {{#if includeCommunityData}}
  Also, analyze the following anonymized community symptom entries (do not fetch weather for these, only for the primary user's entries if location is available):
  {{#each communitySymptomEntries}}
  Date: {{date}}
  Symptoms: {{#each symptoms}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{#if notes}}Notes: {{notes}}{{/if}}
  ---
  {{/each}}
  {{/if}}

  Based on all available information (symptoms, notes, images, and weather data if fetched), identify patterns, potential triggers, and correlations.
  Patterns are recurring sets of symptoms.
  Triggers are events or conditions (like weather) that seem to cause symptoms to appear or worsen.
  Correlations are symptoms that often appear together, or symptoms that correlate with specific weather conditions.

  Provide a comprehensive summary of your analysis.
  Format the output using JSON, making sure to populate the identifiedPatterns, potentialTriggers, correlations, and summary fields in the patternAnalysis object.
  If weather data was fetched and used, ensure your findings reflect its influence. If no significant weather correlation is found despite data being available, state that.
  `,
});

const symptomPatternAnalysisFlow = ai.defineFlow(
  {
    name: 'symptomPatternAnalysisFlow',
    inputSchema: SymptomPatternAnalysisInputSchema,
    outputSchema: SymptomPatternAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await symptomPatternAnalysisPrompt(input);
    if (!output) {
        throw new Error("The AI model did not return an output. Please try again.");
    }
    return output;
  }
);

