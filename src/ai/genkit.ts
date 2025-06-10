// src/ai/genkit.ts
import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Configure Genkit with Google AI plugin
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || '',
    }),
  ],
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

// CRITICAL: Export runFlow for use in server actions
export { runFlow } from '@genkit-ai/flow';

// Export generate for use in flows
export { generate } from '@genkit-ai/ai';

// Re-export AI models for use in flows
export { gemini20Flash, gemini15Flash } from '@genkit-ai/googleai';