
'use server';

import {
  aiCompanionChat,
  type AiCompanionChatInput,
  type AiCompanionChatOutput,
} from '@/ai/flows/ai-companion-chat-flow';

export async function aiCompanionChatAction(
  input: AiCompanionChatInput
): Promise<AiCompanionChatOutput> {
  try {
    const result = await aiCompanionChat(input);
    return result;
  } catch (error) {
    console.error("Error in aiCompanionChatAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI Companion failed to respond: ${error.message}`);
    }
    throw new Error("An unexpected error occurred with the AI Companion.");
  }
}
