
'use server';

// Changed from alias to relative path
import type { ProductSuggestionOutput, ProductSuggestionInput, ProductForAI } from '../../ai/flows/product-suggestion-flow'; // Corrected path, importing ProductForAI directly
import { suggestProductSuggestions } from '../../ai/flows/product-suggestion-flow'; // Corrected path
import type { WellnessAid } from './page'; // Type definition from the page component

// Interface for the data structure expected by this server action
interface SuggestProductsActionInput {
  userSymptoms: string[];
  allProducts: WellnessAid[];
}

export async function suggestProductsAction(
  input: SuggestProductsActionInput
): Promise<ProductSuggestionOutput> {
  try {
    // Map the WellnessAid[] from the client to ProductForAI[] expected by the AI flow
    const productsForAI: ProductForAI[] = input.allProducts.map(p => ({ // Using ProductForAI directly
      id: p.id,
      name: p.name,
      description: p.description,
      affiliateLink: p.affiliateLink,
      category: p.category,
      keywords: p.keywords || [],
    }));

    const result = await suggestProductSuggestions({
      userSymptoms: input.userSymptoms,
      allProducts: productsForAI,
    });
    return result;
  } catch (error) {
    console.error("Error in suggestProductsAction:", error);
    if (error instanceof Error) {
      throw new Error(`AI failed to suggest products: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while fetching AI product suggestions.");
  }
}
