
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Apple, ThumbsUp, ThumbsDown, MinusCircle, Info, Sparkles, Skull, Ghost, Sunrise, Sun, Moon, Coffee, ChefHat, ShoppingCart, HelpCircle, FileQuestion, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gradeFoodItemAction, suggestMealAction, generateRecipeAction } from '../food-log/actions';
import type { FoodGradingOutput } from '@/ai/flows/food-grading-flow';
import type { MealSuggestionOutput } from '@/ai/flows/meal-suggestion-flow';
import type { RecipeGenerationOutput } from '@/ai/flows/recipe-generation-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MonsterRiddleModal from '@/components/features/monster-riddle-modal';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';


const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const FOOD_LOG_KEY = 'morgellonFoodLogEntries';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const MONSTER_HAS_SPOKEN_KEY = 'monsterHasSpokenFirstTime';
const USER_POINTS_KEY = 'userPoints'; 
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';
const ALL_NUTRITIONAL_FOOD_ENTRIES_KEY = 'allNutritionalFoodEntries';

const FOOD_GRADE_CACHE_PREFIX = 'food_grade_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAIResponse<T> {
  timestamp: number;
  data: T;
}

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const RIDDLE_HEALTH_IMPACT = 25;
const FIRST_SPEAK_BONUS_POINTS = 50;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

interface FoodLogEntry extends FoodGradingOutput {
  id: string;
  loggedAt: string;
  healthBefore: number;
  healthAfter: number;
}

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

interface NutritionalFoodLogEntry {
  id: string;
  loggedAt: string; // ISO string
  foodName: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMilligrams?: number;
  servingDescription?: string;
}

export default function FoodLogPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [foodLogEntries, setFoodLogEntries] = useState<FoodLogEntry[]>([]);
  
  const [foodInput, setFoodInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGradingFood, startGradingFoodTransition] = useTransition();
  const { toast } = useToast();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const router = useRouter();

  const [isRiddleModalOpen, setIsRiddleModalOpen] = useState(false);

  const [suggestedMeal, setSuggestedMeal] = useState<MealSuggestionOutput | null>(null);
  const [isSuggestingMeal, startSuggestingMealTransition] = useTransition();
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeGenerationOutput | null>(null);
  const [isGeneratingRecipe, startGeneratingRecipeTransition] = useTransition();
  const [recipePreparationNotes, setRecipePreparationNotes] = useState('');


  const performNightlyRecovery = useCallback(() => {
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);
    if (monsterGenerated !== 'true') return;

    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    const storedHealthStr = localStorage.getItem(MONSTER_HEALTH_KEY);
    if (!storedHealthStr || !storedName) return;
    
    let currentHealth = parseFloat(storedHealthStr);
     if (isNaN(currentHealth) || currentHealth <= MONSTER_DEATH_THRESHOLD) return;


    const lastRecoveryDate = localStorage.getItem(MONSTER_LAST_RECOVERY_DATE_KEY);
    const todayDateStr = new Date().toDateString();

    if (lastRecoveryDate !== todayDateStr) {
      const recoveryAmount = Math.floor(Math.random() * (MAX_RECOVERY - MIN_RECOVERY + 1)) + MIN_RECOVERY;
      const newHealth = Math.min(currentHealth + recoveryAmount, MAX_MONSTER_HEALTH);
      
      setMonsterHealth(newHealth); 
      localStorage.setItem(MONSTER_HEALTH_KEY, String(newHealth));
      localStorage.setItem(MONSTER_LAST_RECOVERY_DATE_KEY, todayDateStr);
      
      toast({
        title: `${storedName} Stirs Contentedly...`,
        description: `Heh-heh... while you were sleeping, I felt a surge! Gained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%. Not bad, not bad at all.`,
        variant: "default",
        duration: Number.MAX_SAFE_INTEGER,
      });
    }
  }, [toast]);


  useEffect(() => {
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);

    if (monsterGenerated === 'true' && storedImage && storedName) {
      setMonsterImageUrl(storedImage);
      setMonsterName(storedName);
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) {
        setMonsterHealth(parseFloat(storedHealth));
      } else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth);
        localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
      performNightlyRecovery();
    } else {
      setMonsterImageUrl(null);
      setMonsterName(null);
      setMonsterHealth(null);
    }

    const storedFoodLog = localStorage.getItem(FOOD_LOG_KEY);
    if (storedFoodLog) {
      setFoodLogEntries(JSON.parse(storedFoodLog));
    }
  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "its own wretched existence"); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monsterHealth, monsterName]);

  useEffect(() => {
    if (foodLogEntries.length > 0 || localStorage.getItem(FOOD_LOG_KEY)) {
      localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(foodLogEntries));
    }
  }, [foodLogEntries]);

  const checkMonsterDeath = (currentHealth: number, cause: string) => {
     if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
        const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
        tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
        localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));

        localStorage.removeItem(MONSTER_IMAGE_KEY);
        localStorage.removeItem(MONSTER_NAME_KEY);
        localStorage.removeItem(MONSTER_HEALTH_KEY);
        localStorage.removeItem(MONSTER_GENERATED_KEY);
        
        setMonsterImageUrl(null);
        setMonsterName(null);
        setMonsterHealth(null); 
        setSuggestedMeal(null);
        setGeneratedRecipe(null);

        toast({
          title: `${monsterName} Has Perished!`,
          description: `My reign... it's over... ${currentHealth.toFixed(1)}% health... because of ${cause}?! CURSE YOU! *(A new shadow begins to stir...)*`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); 
        return true; 
      }
      return false; 
  };

  const saveNutritionalEntry = (foodName: string, gradingResult: FoodGradingOutput) => {
    if (gradingResult.calories !== undefined && (!gradingResult.clarifyingQuestions || gradingResult.clarifyingQuestions.length === 0)) {
      const newNutritionalEntry: NutritionalFoodLogEntry = {
        id: Date.now().toString() + '_nutr',
        loggedAt: new Date().toISOString(),
        foodName: foodName, 
        calories: gradingResult.calories,
        proteinGrams: gradingResult.proteinGrams,
        carbGrams: gradingResult.carbGrams,
        fatGrams: gradingResult.fatGrams,
        sugarGrams: gradingResult.sugarGrams,
        sodiumMilligrams: gradingResult.sodiumMilligrams,
        servingDescription: gradingResult.servingDescription,
      };

      const existingNutritionalEntriesRaw = localStorage.getItem(ALL_NUTRITIONAL_FOOD_ENTRIES_KEY);
      let existingNutritionalEntries: NutritionalFoodLogEntry[] = [];
      if (existingNutritionalEntriesRaw) {
        existingNutritionalEntries = JSON.parse(existingNutritionalEntriesRaw);
      }
      existingNutritionalEntries.push(newNutritionalEntry);
      localStorage.setItem(ALL_NUTRITIONAL_FOOD_ENTRIES_KEY, JSON.stringify(existingNutritionalEntries));
    }
  };

  const processFoodGradingResult = (result: FoodGradingOutput, originalFoodInput: string, isCached: boolean) => {
    if (monsterHealth === null || !monsterName) return;

    const healthBefore = monsterHealth;
    let newHealth = healthBefore + result.healthImpactPercentage;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    setMonsterHealth(newHealth);

    if (result.grade === 'bad' || result.healthImpactPercentage > 0) {
      // No damage flash
    } else if (result.grade === 'good' || result.healthImpactPercentage < 0) {
      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);
    }

    const newLogEntry: FoodLogEntry = {
      ...result,
      foodName: originalFoodInput, // Use the user's input for display in this specific log
      id: Date.now().toString(),
      loggedAt: new Date().toISOString(),
      healthBefore,
      healthAfter: newHealth,
    };
    setFoodLogEntries(prev => [newLogEntry, ...prev].slice(0, 20));
    saveNutritionalEntry(result.foodName, result); // Save AI's recognized name + nutrition

    let toastTitle = "";
    let monsterQuote = result.reasoning;
    let toastVariant: "default" | "destructive" = "default";
    let toastDescription = "";

    if (newHealth < 0 && result.grade === 'good') monsterQuote = `No... please... ${result.reasoning} It's too much... I'm fading...`;
    else if (newHealth < 25 && result.grade === 'good') monsterQuote = `Why are you doing this?! ${result.reasoning} I feel so weak...`;
    else if (newHealth < 50 && result.grade === 'good') monsterQuote = `Stop! ${result.reasoning} That actually hurts!`;

    toastTitle = result.grade === "good" ? `${monsterName} wails!` : result.grade === "bad" ? `${monsterName} rejoices!` : `${monsterName} is indifferent.`;
    toastDescription = `My health is now ${newHealth.toFixed(1)}% (${result.healthImpactPercentage >= 0 ? '+' : ''}${result.healthImpactPercentage.toFixed(1)}%). ${monsterName} says: "${monsterQuote}"`;
    toastVariant = result.grade === "bad" ? "destructive" : "default";
    
    if (result.foodName && result.foodName.toLowerCase().includes('garlic') && result.grade === 'good') {
        toastTitle = `${monsterName} HISSES about the Garlic!`;
        toastDescription = `THAT STUFF AGAIN?! My health is now ${newHealth.toFixed(1)}%! ${monsterName} shrieks: "${monsterQuote}"`;
    }

    let nutritionMessage = "";
    if (result.clarifyingQuestions && result.clarifyingQuestions.length > 0) nutritionMessage = `\n${monsterName} needs more info for nutrition: ${result.clarifyingQuestions.join(' ')}`;
    else if (result.calories !== undefined) nutritionMessage = `\nEst. Nutrition (${result.servingDescription || 'standard serving'}): ~${result.calories}kcal. ${result.nutritionDisclaimer || ''}`;

    if (!checkMonsterDeath(newHealth, result.foodName || "unknown food")) {
      toast({
        title: (isCached ? "[Cache] " : "") + toastTitle,
        description: toastDescription + nutritionMessage,
        variant: toastVariant,
        duration: Number.MAX_SAFE_INTEGER,
      });
    }
  };

  const handleFoodSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentFoodInput = foodInput.trim();
    if (!currentFoodInput) { setError("Please enter a food item."); return; }
    if (monsterHealth === null || !monsterName || !monsterImageUrl) { setError("Monster not found. Create a monster first."); return; }
    setError(null);

    const cacheKey = `${FOOD_GRADE_CACHE_PREFIX}${currentFoodInput.toLowerCase()}`;
    if (typeof window !== 'undefined') {
      const cachedItemRaw = localStorage.getItem(cacheKey);
      if (cachedItemRaw) {
        try {
          const cachedItem: CachedAIResponse<FoodGradingOutput> = JSON.parse(cachedItemRaw);
          if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
            processFoodGradingResult(cachedItem.data, currentFoodInput, true);
            setFoodInput('');
            return;
          } else {
            localStorage.removeItem(cacheKey); // Stale cache
          }
        } catch (e) {
          console.error("Error parsing cache for food item:", e);
          localStorage.removeItem(cacheKey);
        }
      }
    }

    startGradingFoodTransition(async () => {
      try {
        const result = await gradeFoodItemAction({ foodItem: currentFoodInput });
        if (typeof window !== 'undefined') {
          const newCachedItem: CachedAIResponse<FoodGradingOutput> = { timestamp: Date.now(), data: result };
          localStorage.setItem(cacheKey, JSON.stringify(newCachedItem));
        }
        processFoodGradingResult(result, currentFoodInput, false);
        setFoodInput('');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade food item.";
        setError(errorMessage);
        toast({
          title: "Error Grading Food",
          description: `${monsterName} snarls: 'Your food request confused my AI minions! Or maybe it was just incompetence.' Details: ${errorMessage}`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  };

  const handleRiddleChallengeComplete = (wasCorrect: boolean) => {
    if (monsterHealth === null || !monsterName) return;

    let healthChangeDescription = "";
    let newHealth = monsterHealth;
    let toastTitle = "";

    if (wasCorrect) {
      newHealth -= RIDDLE_HEALTH_IMPACT;
      toastTitle = `${monsterName} is FUMING!`;
      healthChangeDescription = `You solved it, you meddling pest! My health drops by ${RIDDLE_HEALTH_IMPACT} to ${newHealth.toFixed(1)}%! I'll get you next time!`;
      toast({ title: toastTitle, description: healthChangeDescription, variant: "default", duration: Number.MAX_SAFE_INTEGER});
    } else {
      newHealth += RIDDLE_HEALTH_IMPACT;
      toastTitle = `${monsterName} exults!`;
      healthChangeDescription = `HAHA, FOOL! Your ignorance empowers me! My health surges by ${RIDDLE_HEALTH_IMPACT} to ${newHealth.toFixed(1)}%!`;
      toast({ title: toastTitle, description: healthChangeDescription, variant: "destructive", duration: Number.MAX_SAFE_INTEGER});
    }
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);
    newHealth = Math.max(MONSTER_DEATH_THRESHOLD -1 , newHealth); 
    setMonsterHealth(newHealth);

    const hasSpoken = localStorage.getItem(MONSTER_HAS_SPOKEN_KEY);
    if (hasSpoken === 'false') {
      const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0');
      localStorage.setItem(USER_POINTS_KEY, String(currentPoints + FIRST_SPEAK_BONUS_POINTS));
      localStorage.setItem(MONSTER_HAS_SPOKEN_KEY, 'true');
      toast({
        title: `${monsterName} grumbles: 'Bonus Points?'`,
        description: `Hmph. So my first words earned you ${FIRST_SPEAK_BONUS_POINTS} points. Don't get used to it.`,
        variant: "default",
        duration: 7000,
      });
    }
    checkMonsterDeath(newHealth, "a riddle's outcome");
  };

  const handleSuggestMeal = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!monsterName) {
        toast({ title: "Monster Needed", description: "Create your monster first to get meal suggestions!", variant: "destructive"});
        return;
    }
    setError(null);
    setSuggestedMeal(null);
    setGeneratedRecipe(null);
    startSuggestingMealTransition(async () => {
      try {
        const result = await suggestMealAction({ mealType });
        setSuggestedMeal(result);
        toast({
            title: `AI Chef Suggests: ${result.suggestedMealName}`,
            description: `${monsterName} wants its AI Chef to remind you: "${result.monsterImpactStatement}" This meal is supposedly good for YOU...`,
            duration: Number.MAX_SAFE_INTEGER
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to suggest meal.";
        setError(errorMessage);
        toast({ title: "Meal Suggestion Error", description: `${monsterName} scoffs: "My AI chefs are on strike! ${errorMessage}"`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER });
      }
    });
  };

  const handleGenerateRecipe = (mealName: string) => {
    if (!monsterName) return;
    setError(null);
    setGeneratedRecipe(null);
    startGeneratingRecipeTransition(async () => {
      try {
        const result = await generateRecipeAction({ mealName });
        setGeneratedRecipe(result);
         toast({
            title: `AI Chef's Recipe: ${result.recipeName}`,
            description: `${monsterName} grumbles: "My AI Chef reluctantly provides the recipe for ${result.recipeName}. Try not to enjoy it."`,
            duration: Number.MAX_SAFE_INTEGER
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to generate recipe.";
        setError(errorMessage);
        toast({ title: "Recipe Error", description: `${monsterName} grumbles: "The recipe scroll turned to dust! Typical. ${errorMessage}"`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER});
      }
    });
  };

  const handleLogRecipeAsEaten = async () => {
    if (!generatedRecipe || monsterHealth === null || !monsterName) {
      setError("No recipe to log or monster data missing."); return;
    }
    setError(null);

    const foodItemDescription = `${generatedRecipe.recipeName}${recipePreparationNotes ? ` (My Notes: ${recipePreparationNotes})` : ''}`;
    const cacheKey = `${FOOD_GRADE_CACHE_PREFIX}${foodItemDescription.toLowerCase().trim()}`;

    if (typeof window !== 'undefined') {
      const cachedItemRaw = localStorage.getItem(cacheKey);
      if (cachedItemRaw) {
        try {
          const cachedItem: CachedAIResponse<FoodGradingOutput> = JSON.parse(cachedItemRaw);
          if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
            processFoodGradingResult(cachedItem.data, foodItemDescription, true);
            setRecipePreparationNotes(''); setSuggestedMeal(null); setGeneratedRecipe(null);
            return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
            console.error("Error parsing cache for recipe:", e);
            localStorage.removeItem(cacheKey);
        }
      }
    }

    startGradingFoodTransition(async () => {
      try {
        const result = await gradeFoodItemAction({ foodItem: foodItemDescription });
        if (typeof window !== 'undefined') {
          const newCachedItem: CachedAIResponse<FoodGradingOutput> = { timestamp: Date.now(), data: result };
          localStorage.setItem(cacheKey, JSON.stringify(newCachedItem));
        }
        processFoodGradingResult(result, foodItemDescription, false);
        setRecipePreparationNotes(''); setSuggestedMeal(null); setGeneratedRecipe(null);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade recipe.";
        setError(errorMessage);
        toast({
          title: "AI Chef's Verdict Error",
          description: `${monsterName} scoffs: 'My AI Chef found your version of the recipe ungradable! Error: ${errorMessage}'`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  };


  const getMonsterStatusMessage = () => {
    if (monsterHealth === null || !monsterName) return "Awaiting its creation...";
    if (monsterHealth <= MONSTER_DEATH_THRESHOLD) return `${monsterName} has perished! Its dark reign is over.`;
    if (monsterHealth < 0) return `${monsterName} is critically weak at ${monsterHealth.toFixed(1)}%! It's on the verge of oblivion! Don't push it...`;
    if (monsterHealth < 25) return `${monsterName} is very weak (${monsterHealth.toFixed(1)}%)! It can barely sustain its shadowy form. It's... pleading?`;
    if (monsterHealth < 50) return `${monsterName} is feeling quite weak (${monsterHealth.toFixed(1)}%). Your efforts are noticeable, and it's not happy.`;
    if (monsterHealth < INITIAL_HEALTH_MIN) return `${monsterName} is weakened (${monsterHealth.toFixed(1)}%). It's definitely annoyed.`;
    if (monsterHealth > (MAX_MONSTER_HEALTH - (MAX_MONSTER_HEALTH - INITIAL_HEALTH_MAX)/2) ) return `${monsterName} is overwhelmingly powerful (${monsterHealth.toFixed(1)}%)! Its presence is suffocating.`;
    if (monsterHealth > INITIAL_HEALTH_MAX + 20) return `${monsterName} is significantly strengthened (${monsterHealth.toFixed(1)}%)! It crackles with dark energy.`;
    if (monsterHealth > INITIAL_HEALTH_MAX) return `${monsterName} is gaining strength (${monsterHealth.toFixed(1)}%). It seems pleased.`;
    return `${monsterName}'s health is ${monsterHealth.toFixed(1)}%... stable, for now. It's watching you.`;
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  }

  if (!monsterName || !monsterImageUrl || monsterHealth === null) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Monster Not Found or Perished</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            You need to create your Morgellon Monster, or your previous one has fallen to its doom.
          </p>
          <Button asChild className="w-full mb-2">
            <Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create a New Monster</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/monster-tomb"><Skull className="mr-2 h-4 w-4"/>View Tomb of Monsters</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
    <>
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
          <CardHeader className="items-center text-center">
            <Image src={monsterImageUrl} alt={monsterName} width={128} height={128} className="rounded-full border-2 border-primary shadow-md mx-auto" data-ai-hint="generated monster" />
            <CardTitle className="font-headline text-2xl pt-2">{monsterName}</CardTitle>
            <CardDescription>{getMonsterStatusMessage()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="monster-health-progress" className="text-sm font-medium text-center block mb-1">
              Monster Health: {monsterHealth.toFixed(1)}% (Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%)
            </Label>
            <Progress id="monster-health-progress" value={getHealthBarValue()} className="w-full h-3" 
                aria-label={`Monster health: ${monsterHealth.toFixed(1)}%`} />
             <p className="text-xs text-muted-foreground text-center mt-1">Bad foods strengthen your monster. Good foods weaken it.</p>
          </CardContent>
           <CardFooter className="flex-col gap-2">
            <Button variant="outline" onClick={() => setIsRiddleModalOpen(true)} className="w-full">
              <Ghost className="mr-2 h-4 w-4"/> My Monster Has a Riddle!
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Apple className="h-6 w-6 text-primary"/>Log Food Item</CardTitle>
            <CardDescription>Enter a food item. {monsterName} will react to how it affects its health, based on AI grading, and may provide nutritional info or ask for clarification! Identical items are cached for 24hrs.</CardDescription>
          </CardHeader>
          <form onSubmit={handleFoodSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="food-item">Food Item</Label>
                <Input
                  id="food-item"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder="e.g., Spinach, Chocolate Croissant, Garlic"
                  disabled={isGradingFood}
                />
              </div>
              {error && !suggestedMeal && !generatedRecipe && ( 
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGradingFood || !foodInput.trim()} className="w-full sm:w-auto">
                {isGradingFood ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Apple className="mr-2 h-4 w-4" />}
                {isGradingFood ? `Asking ${monsterName} about ${foodInput}...` : `Log Food & See ${monsterName}'s Reaction`}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><ChefHat className="h-6 w-6 text-primary"/>AI Chef: Meal & Recipe Creation</CardTitle>
            <CardDescription>
              This is where {monsterName}'s "AI Chef" comes into play. First, ask the AI Chef for a meal suggestion (e.g., Breakfast).
              Once suggested, you can then ask the AI Chef to generate a full recipe for that meal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((mealType) => {
              const Icon = mealType === "breakfast" ? Sunrise : mealType === "lunch" ? Sun : mealType === "dinner" ? Moon : Coffee;
              return (
                <Button key={mealType} variant="outline" onClick={() => handleSuggestMeal(mealType)} disabled={isSuggestingMeal || isGeneratingRecipe}>
                  <Icon className="mr-2 h-4 w-4" />
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Button>
              );
            })}
          </CardContent>
          {isSuggestingMeal && (
            <CardContent className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/> Searching for a terrible meal for {monsterName}...
            </CardContent>
          )}
          {error && (suggestedMeal || generatedRecipe) && ( 
            <CardContent>
                <Alert variant="destructive">
                <AlertTitle>Suggestion/Recipe Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
          )}
           {suggestedMeal && !generatedRecipe && (
            <Card className="m-4 p-4 bg-accent/10">
              <CardTitle className="text-lg mb-1">{suggestedMeal.suggestedMealName}</CardTitle>
              <CardDescription className="mb-2">{suggestedMeal.shortDescription}</CardDescription>
              <p className="italic text-sm text-muted-foreground mb-3">"{suggestedMeal.monsterImpactStatement}"</p>
              <div className="flex gap-2">
                <Button onClick={() => handleGenerateRecipe(suggestedMeal.suggestedMealName)} disabled={isGeneratingRecipe}>
                  {isGeneratingRecipe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ChefHat className="mr-2 h-4 w-4"/>}
                  Get Recipe
                </Button>
                <Button variant="outline" onClick={() => { setSuggestedMeal(null); setGeneratedRecipe(null); setError(null); }}>Clear Suggestion</Button>
              </div>
            </Card>
          )}
          {isGeneratingRecipe && (
            <CardContent className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/> {monsterName}'s minions are scribbling a recipe...
            </CardContent>
          )}
        </Card>

        {generatedRecipe && (
          <Card> 
            <CardHeader>
              <CardTitle className="font-headline">Recipe from {monsterName}'s Lair: {generatedRecipe.recipeName}</CardTitle>
              {generatedRecipe.prepTime && <CardDescription>Prep: {generatedRecipe.prepTime} | Cook: {generatedRecipe.cookTime} | Servings: {generatedRecipe.servings}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-md mb-1">Ingredients:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {generatedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx}>
                      {ing.quantity} {ing.unit} {ing.name}
                      {ing.notes && <span className="text-xs text-muted-foreground"> ({ing.notes})</span>}
                      {ing.isLinkable && 
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ShoppingCart className="inline-block ml-1 h-3 w-3 text-primary/70 cursor-help"/>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">This item might be available on Amazon Fresh/Whole Foods.</p></TooltipContent>
                        </Tooltip>
                      }
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-md mb-1">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {generatedRecipe.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                </ol>
              </div>
              {generatedRecipe.recipeNotes && (
                <>
                <Separator />
                <div>
                    <h4 className="font-semibold text-md mb-1">Chef's Notes (from {monsterName}'s grimoire):</h4>
                    <p className="text-sm italic text-muted-foreground">{generatedRecipe.recipeNotes}</p>
                </div>
                </>
              )}
            </CardContent>
             <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={() => { setSuggestedMeal(null); setGeneratedRecipe(null); setError(null); setRecipePreparationNotes(''); }}>
                    Clear Recipe & Suggestion
                </Button>
            </CardFooter>
          </Card>
        )}

        {generatedRecipe && ( 
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2"><Edit3 className="h-5 w-5 text-primary"/>Log Your Prepared Recipe</CardTitle>
              <CardDescription>
                Did you make the "{generatedRecipe.recipeName}"? Detail any changes below.
                The AI will grade your modified meal. Direct ingredient list editing is a future enhancement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="recipe-preparation-notes" className="font-semibold">
                  My Preparation Notes & Modifications:
                </Label>
                <Textarea
                  id="recipe-preparation-notes"
                  value={recipePreparationNotes}
                  onChange={(e) => setRecipePreparationNotes(e.target.value)}
                  placeholder={`e.g., "For the ${generatedRecipe.recipeName}, I omitted garlic, used almond milk instead of dairy, and added 1/2 tsp ginger." The AI will consider these notes when grading.`}
                  className="min-h-[100px] mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Be specific! The AI uses these notes to understand your version of the meal.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleLogRecipeAsEaten} disabled={isGradingFood || !generatedRecipe} className="w-full sm:w-auto">
                {isGradingFood ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Apple className="mr-2 h-4 w-4"/>}
                Log My Version of "{generatedRecipe.recipeName}"
              </Button>
            </CardFooter>
          </Card>
        )}


        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Food Log</CardTitle>
            <CardDescription>Your last 20 food entries and their impact on {monsterName}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {foodLogEntries.length === 0 && <p className="text-sm text-muted-foreground">No food items logged yet. What are you waiting for? Feed me... or don't.</p>}
            {foodLogEntries.map(entry => (
              <Card key={entry.id} className="p-3 bg-card/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                      {entry.grade === 'good' && <ThumbsUp className="h-4 w-4 text-green-500" />}
                      {entry.grade === 'bad' && <ThumbsDown className="h-4 w-4 text-red-500" />}
                      {entry.grade === 'neutral' && <MinusCircle className="h-4 w-4 text-muted-foreground" />}
                      {entry.foodName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Logged: {new Date(entry.loggedAt).toLocaleTimeString()} - Impact: <span className={entry.healthImpactPercentage > 0 ? "text-red-500" : entry.healthImpactPercentage < 0 ? "text-green-500" : ""}>{entry.healthImpactPercentage > 0 ? '+':''}{entry.healthImpactPercentage.toFixed(1)}%</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 text-right flex-shrink-0">Health after: {entry.healthAfter.toFixed(1)}%</p>
                </div>
                <p className="text-sm text-foreground/80 mt-1 pl-1 border-l-2 border-accent/50 ml-1.5 "> <span className="italic text-muted-foreground">{monsterName} said:</span> "{entry.reasoning}"</p>
                
                {(entry.calories !== undefined || (entry.clarifyingQuestions && entry.clarifyingQuestions.length > 0)) && (
                  <div className="mt-2 pt-2 border-t border-dashed border-muted-foreground/30">
                    {entry.calories !== undefined && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                           <HelpCircle className="h-3.5 w-3.5"/> 
                           <span className="font-medium">AI Nutrition Estimate</span>
                           {entry.servingDescription && (<span> (for {entry.servingDescription})</span>)}
                        </div>
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs pl-2">
                          <li>Calories: ~{entry.calories} kcal</li>
                          {entry.proteinGrams !== undefined && <li>Protein: ~{entry.proteinGrams}g</li>}
                          {entry.carbGrams !== undefined && <li>Carbs: ~{entry.carbGrams}g</li>}
                          {entry.fatGrams !== undefined && <li>Fat: ~{entry.fatGrams}g</li>}
                          {entry.sugarGrams !== undefined && <li>Sugar: ~{entry.sugarGrams}g</li>}
                          {entry.sodiumMilligrams !== undefined && <li>Sodium: ~{entry.sodiumMilligrams}mg</li>}
                        </ul>
                        {entry.nutritionDisclaimer && (
                           <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="text-xxs text-muted-foreground/70 mt-1 cursor-help flex items-center gap-0.5">
                                    <Info className="h-2.5 w-2.5"/> {entry.nutritionDisclaimer.split('.')[0]}.
                                </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p className="text-xs">{entry.nutritionDisclaimer}</p>
                            </TooltipContent>
                           </Tooltip>
                        )}
                      </>
                    )}
                    {entry.clarifyingQuestions && entry.clarifyingQuestions.length > 0 && (
                      <div className="mt-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mb-0.5">
                          <FileQuestion className="h-3.5 w-3.5" />
                          <span className="font-medium">{monsterName} needs more info for nutrition:</span>
                        </div>
                        <ul className="list-disc list-inside pl-4 text-xs text-amber-600 dark:text-amber-500">
                          {entry.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                         <p className="text-xxs text-muted-foreground mt-0.5">Please log this food again with more details for an estimate.</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
    <MonsterRiddleModal
        isOpen={isRiddleModalOpen}
        onClose={() => setIsRiddleModalOpen(false)}
        onChallengeComplete={handleRiddleChallengeComplete}
    />
    </>
    </TooltipProvider>
  );
}

    
