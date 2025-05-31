
import { config } from 'dotenv';
config();

import '@/ai/flows/symptom-pattern-analysis.ts';
import '@/ai/flows/monster-prompt-expansion-flow.ts';
import '@/ai/flows/monster-image-generation-flow.ts';
import '@/ai/flows/food-grading-flow.ts';
import '@/ai/flows/monster-riddle-flow.ts';
import '@/ai/flows/product-effect-grading-flow.ts';
import '@/ai/flows/exercise-grading-flow.ts';
import '@/ai/flows/meal-suggestion-flow.ts';
import '@/ai/flows/recipe-generation-flow.ts';
