'use server';

import {
  expandMonsterPrompt,
  MonsterWordsInput,
  MonsterPromptOutput,
} from '@/ai/flows/monster-prompt-expansion-flow';
import {
  generateMonsterImage,
  MonsterImageInput,
  MonsterImageOutput,
} from '@/ai/flows/monster-image-generation-flow';

export async function expandMonsterPromptAction(
  input: MonsterWordsInput
): Promise<MonsterPromptOutput> {
  try {
    const result = await expandMonsterPrompt(input);
    return result;
  } catch (error) {
    console.error("Error in expandMonsterPromptAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to expand monster prompt: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during prompt expansion.");
  }
}

export async function generateMonsterImageAction(
  input: MonsterImageInput
): Promise<MonsterImageOutput> {
  try {
    const result = await generateMonsterImage(input);
    return result;
  } catch (error) {
    console.error("Error in generateMonsterImageAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate monster image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during image generation.");
  }
}
