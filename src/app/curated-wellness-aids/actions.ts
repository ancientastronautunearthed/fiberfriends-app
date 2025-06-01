
'use server';

// Changed from alias to relative path
import type { ProductSuggestionOutput, ProductSuggestionInput } from '../../../ai/flows/product-suggestion-flow';
import { suggestProductSuggestions } from '../../../ai/flows/product-suggestion-flow';
import type { WellnessAid } from './page'; // Type definition from the page component

// Interface for the data structure expected by this server action
interface SuggestProductsActionInput {
  userSymptoms: string[];
  allProducts: WellnessAid[];
}

// Interface for the product structure expected by the AI flow's ProductSchema
// This ensures we are mapping correctly.
interface ProductForAI {
  id: string;
  name: string;
  description: string;
  affiliateLink: string; 
  category: string;
  keywords?: string[];
}

export async function suggestProductsAction(
  input: SuggestProductsActionInput
): Promise<ProductSuggestionOutput> {
  try {
    // Map the WellnessAid[] from the client to ProductForAI[] expected by the AI flow
    const productsForAI: ProductForAI[] = input.allProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      affiliateLink: p.affiliateLink, // This should already be a string
      category: p.category,
      keywords: p.keywords || [], // Ensure keywords is an array, even if undefined
    }));

    // Call the corrected function name from the AI flow
    const result = await suggestProductSuggestions({
      userSymptoms: input.userSymptoms,
      allProducts: productsForAI, // Pass the mapped products
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
