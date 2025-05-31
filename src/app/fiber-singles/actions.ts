
'use server';

import {
  expandRomanticMonsterPrompt,
  RomanticMonsterWordsInput,
  RomanticMonsterPromptOutput,
} from '@/ai/flows/romantic-monster-prompt-expansion-flow';
import {
  generateRomanticMonsterImage,
  RomanticMonsterImageInput,
  RomanticMonsterImageOutput,
} from '@/ai/flows/romantic-monster-image-generation-flow';
import {
  analyzeMessageQuality,
  MessageQualityInput,
  MessageQualityOutput,
} from '@/ai/flows/message-quality-flow';

export async function expandRomanticMonsterPromptAction(
  input: RomanticMonsterWordsInput
): Promise<RomanticMonsterPromptOutput> {
  try {
    const result = await expandRomanticMonsterPrompt(input);
    return result;
  } catch (error) {
    console.error("Error in expandRomanticMonsterPromptAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to expand romantic monster prompt: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during romantic prompt expansion.");
  }
}

export async function generateRomanticMonsterImageAction(
  input: RomanticMonsterImageInput
): Promise<RomanticMonsterImageOutput> {
  try {
    const result = await generateRomanticMonsterImage(input);
    return result;
  } catch (error) {
    console.error("Error in generateRomanticMonsterImageAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate romantic monster image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during romantic image generation.");
  }
}

export async function analyzeMessageQualityAction(
  input: MessageQualityInput
): Promise<MessageQualityOutput> {
  try {
    const result = await analyzeMessageQuality(input);
    return result;
  } catch (error) {
    console.error("Error in analyzeMessageQualityAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze message quality: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during message quality analysis.");
  }
}
