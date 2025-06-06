
'use server';

import { 
    generateAssistantImage, 
    type AssistantImageInput, 
    type AssistantImageOutput 
} from '@/ai/flows/assistant-image-generation-flow';

export async function generateAssistantImageAction(
    input: AssistantImageInput
): Promise<AssistantImageOutput> {
    try {
        const result = await generateAssistantImage(input);
        return result;
    } catch (error) {
        console.error("Error in generateAssistantImageAction:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate AI assistant image: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during AI assistant image generation.");
    }
}
