import { gemini20FlashExp, googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';

const ai = genkit({
  model: gemini20FlashExp,
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

// Input schema for diet plan generation
export const DietPlanGenerationInputSchema = z.object({
  dietaryRestrictions: z.string().describe('Dietary restrictions and preferences'),
  allergies: z.string().describe('Food allergies and intolerances'),
  favoriteFoods: z.string().describe('Foods the user enjoys'),
  dislikedFoods: z.string().describe('Foods the user dislikes'),
  badFoodFrequency: z.string().describe('How often they consume foods bad for Morgellons'),
  healthGoals: z.string().describe('Health and wellness goals'),
  mealPrepTime: z.string().describe('Available time for meal preparation'),
  budget: z.string().describe('Weekly food budget'),
  dieticianName: z.string().describe('Name of the AI dietician'),
});

// Output schema for diet plan generation
export const DietPlanGenerationOutputSchema = z.object({
  planName: z.string().describe('Name of the diet plan'),
  duration: z.string().describe('Recommended duration for the plan'),
  meals: z.object({
    breakfast: z.array(z.string()).describe('Breakfast options'),
    lunch: z.array(z.string()).describe('Lunch options'),
    dinner: z.array(z.string()).describe('Dinner options'),
    snacks: z.array(z.string()).describe('Snack options'),
  }).describe('Meal options by type'),
  weeklySchedule: z.object({
    monday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    tuesday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    wednesday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    thursday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    friday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    saturday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
    sunday: z.object({
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      snack: z.string(),
    }),
  }).describe('Weekly meal schedule'),
  shoppingList: z.array(z.string()).describe('Shopping list items'),
  tips: z.array(z.string()).describe('Helpful tips from the dietician'),
  restrictions: z.array(z.string()).describe('Foods to avoid'),
});

export type DietPlanGenerationInput = z.infer<typeof DietPlanGenerationInputSchema>;
export type DietPlanGenerationOutput = z.infer<typeof DietPlanGenerationOutputSchema>;

// Main diet plan generation flow
export const createDietPlan = ai.defineFlow(
  {
    name: 'diet-plan-generation-flow',
    inputSchema: DietPlanGenerationInputSchema,
    outputSchema: DietPlanGenerationOutputSchema,
  },
  async (input) => {
    // Default/fallback diet plan
    const defaultPlan: DietPlanGenerationOutput = {
      planName: "Anti-Inflammatory Wellness Plan",
      duration: "8 weeks",
      meals: {
        breakfast: [
          "Overnight oats with berries and chia seeds",
          "Green smoothie with spinach, banana, and almond butter",
          "Scrambled eggs with sautéed vegetables",
          "Quinoa breakfast bowl with nuts and seeds",
          "Avocado toast on gluten-free bread",
          "Greek yogurt parfait with granola and berries",
          "Sweet potato hash with poached eggs"
        ],
        lunch: [
          "Grilled chicken salad with mixed greens and olive oil dressing",
          "Lentil soup with vegetables and herbs",
          "Turkey and vegetable lettuce wraps",
          "Quinoa and roasted vegetable Buddha bowl",
          "Wild-caught salmon with steamed broccoli and brown rice",
          "Mediterranean chickpea salad",
          "Bone broth with vegetables and herbs"
        ],
        dinner: [
          "Baked chicken with roasted root vegetables",
          "Stir-fried tofu with vegetables and brown rice",
          "Grilled fish with quinoa and asparagus",
          "Turkey meatballs with zucchini noodles",
          "Vegetable curry with chickpeas and turmeric",
          "Grass-fed beef stir-fry with mixed vegetables",
          "Baked sweet potato with black beans and vegetables"
        ],
        snacks: [
          "Apple slices with almond butter",
          "Mixed nuts and seeds (walnuts, almonds, pumpkin seeds)",
          "Carrot and cucumber sticks with hummus",
          "Greek yogurt with berries",
          "Rice cakes with avocado",
          "Celery with tahini",
          "Coconut chia pudding"
        ]
      },
      weeklySchedule: {
        monday: {
          breakfast: "Overnight oats with berries and chia seeds",
          lunch: "Grilled chicken salad with mixed greens and olive oil dressing",
          dinner: "Baked chicken with roasted root vegetables",
          snack: "Apple slices with almond butter"
        },
        tuesday: {
          breakfast: "Green smoothie with spinach, banana, and almond butter",
          lunch: "Lentil soup with vegetables and herbs",
          dinner: "Stir-fried tofu with vegetables and brown rice",
          snack: "Mixed nuts and seeds"
        },
        wednesday: {
          breakfast: "Scrambled eggs with sautéed vegetables",
          lunch: "Turkey and vegetable lettuce wraps",
          dinner: "Grilled fish with quinoa and asparagus",
          snack: "Carrot and cucumber sticks with hummus"
        },
        thursday: {
          breakfast: "Quinoa breakfast bowl with nuts and seeds",
          lunch: "Quinoa and roasted vegetable Buddha bowl",
          dinner: "Turkey meatballs with zucchini noodles",
          snack: "Greek yogurt with berries"
        },
        friday: {
          breakfast: "Avocado toast on gluten-free bread",
          lunch: "Wild-caught salmon with steamed broccoli and brown rice",
          dinner: "Vegetable curry with chickpeas and turmeric",
          snack: "Rice cakes with avocado"
        },
        saturday: {
          breakfast: "Greek yogurt parfait with granola and berries",
          lunch: "Mediterranean chickpea salad",
          dinner: "Grass-fed beef stir-fry with mixed vegetables",
          snack: "Celery with tahini"
        },
        sunday: {
          breakfast: "Sweet potato hash with poached eggs",
          lunch: "Bone broth with vegetables and herbs",
          dinner: "Baked sweet potato with black beans and vegetables",
          snack: "Coconut chia pudding"
        }
      },
      shoppingList: [
        "Organic chicken breast",
        "Wild-caught salmon",
        "Grass-fed ground beef",
        "Organic eggs",
        "Organic tofu",
        "Ground turkey",
        "Quinoa",
        "Brown rice",
        "Rolled oats",
        "Chia seeds",
        "Mixed berries (blueberries, strawberries, raspberries)",
        "Spinach",
        "Mixed salad greens",
        "Broccoli",
        "Asparagus",
        "Root vegetables (carrots, beets, parsnips)",
        "Zucchini",
        "Sweet potatoes",
        "Avocados",
        "Cucumbers",
        "Celery",
        "Bell peppers",
        "Onions",
        "Garlic",
        "Ginger",
        "Almond butter",
        "Tahini",
        "Mixed nuts (almonds, walnuts, cashews)",
        "Pumpkin seeds",
        "Greek yogurt (unsweetened)",
        "Hummus",
        "Black beans",
        "Chickpeas",
        "Lentils",
        "Coconut milk",
        "Bone broth",
        "Gluten-free bread",
        "Rice cakes",
        "Olive oil",
        "Coconut oil",
        "Apple cider vinegar",
        "Turmeric",
        "Black pepper",
        "Sea salt",
        "Fresh herbs (parsley, cilantro, basil)"
      ],
      tips: [
        "Meal prep on Sundays to save time during the week - wash and chop vegetables, cook grains in bulk",
        "Stay hydrated with at least 8 glasses of filtered water daily - add lemon for extra detox benefits",
        "Choose organic produce when possible, especially for the 'Dirty Dozen' foods",
        "Listen to your body and adjust portions based on hunger and energy levels",
        "Keep healthy snacks readily available to avoid reaching for inflammatory foods",
        "Track symptoms and energy levels in a journal to identify which foods work best for you",
        "Remember: healing is a journey, not a destination - be patient and kind to yourself"
      ],
      restrictions: [
        "Processed foods with artificial additives and preservatives",
        "Refined sugars and high-fructose corn syrup",
        "Trans fats and hydrogenated oils",
        "Excessive caffeine (limit to 1 cup daily)",
        "Alcohol (minimize or avoid completely)",
        "Gluten (if sensitive - monitor your response)",
        "Conventional dairy products (opt for organic if tolerated)",
        "Nightshade vegetables if reactive (tomatoes, peppers, eggplant)",
        "High-mercury fish (tuna, swordfish, king mackerel)",
        "Artificial sweeteners and sugar alcohols"
      ]
    };

    try {
      const prompt = `
You are ${input.dieticianName}, an AI dietician specializing in nutrition for people with Morgellons disease.

Create a personalized diet plan based on:
- Dietary Restrictions: ${input.dietaryRestrictions}
- Allergies: ${input.allergies || 'None'}
- Favorite Foods: ${input.favoriteFoods}
- Disliked Foods: ${input.dislikedFoods || 'None'}
- Bad Food Frequency: ${input.badFoodFrequency}
- Health Goals: ${input.healthGoals}
- Prep Time: ${input.mealPrepTime || 'Moderate'}
- Budget: ${input.budget || 'Moderate'}

Focus on anti-inflammatory foods that help with Morgellons symptoms. Create a plan name and specify duration.
Provide 5-7 options for each meal type, a weekly schedule, shopping list, tips, and foods to avoid.

Be practical and supportive. All items should be available at regular grocery stores/Instacart.
`;

      const result = await ai.generate({
        model: gemini20FlashExp,
        prompt,
      });

      // Try to extract meal suggestions from the AI response
      const text = result.text;
      
      // Update plan name if mentioned
      const planNameMatch = text.match(/plan\s*name[:\s]+([^\n]+)/i);
      if (planNameMatch) {
        defaultPlan.planName = planNameMatch[1].trim();
      }

      // Update duration if mentioned
      const durationMatch = text.match(/duration[:\s]+([^\n]+)/i);
      if (durationMatch) {
        defaultPlan.duration = durationMatch[1].trim();
      }

      // Try to extract any specific meal recommendations and merge with defaults
      const breakfastMatch = text.match(/breakfast[:\s]+([^\n]+)/gi);
      const lunchMatch = text.match(/lunch[:\s]+([^\n]+)/gi);
      const dinnerMatch = text.match(/dinner[:\s]+([^\n]+)/gi);
      const snackMatch = text.match(/snack[:\s]+([^\n]+)/gi);

      if (breakfastMatch) {
        const customBreakfasts = breakfastMatch.map(m => m.replace(/breakfast[:\s]+/i, '').trim());
        defaultPlan.meals.breakfast = [...customBreakfasts.slice(0, 3), ...defaultPlan.meals.breakfast.slice(3)];
      }

      return defaultPlan;
    } catch (error) {
      console.error('Error generating diet plan:', error);
      return defaultPlan;
    }
  }
);