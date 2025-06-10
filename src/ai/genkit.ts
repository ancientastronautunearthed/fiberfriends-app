// src/ai/genkit.ts
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Create and export the Genkit instance
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    })
  ],
  model: 'googleai/gemini-2.0-flash',
});

// CRITICAL: Also export z for use in flow files
export { z };