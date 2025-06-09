'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Apple, ThumbsUp, ThumbsDown, MinusCircle, Info, Sparkles, Skull, Ghost, Sunrise, Sun, Moon, Coffee, ChefHat, ShoppingCart, HelpCircle, FileQuestion, Edit3, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MonsterRiddleModal from '@/components/features/monster-riddle-modal';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { formatDistanceToNow } from 'date-fns';

// Import all actions from the server actions file
import { 
  getFoodLogPageData, 
  processFoodSubmission, 
  processRiddleResult,
  mealSuggestionFlow,
  recipeGenerationFlow 
} from './actions';

// Interfaces to type the data fetched from Firestore
interface Monster {
  id: string;
  name: string;
  imageUrl: string;
  health: number;
}
interface FoodLog {
  id: string;
  foodName: string;
  loggedAt: string; // Is now an ISO string
  grade: 'good' | 'bad' | 'neutral' | 'pending';
  reasoning: string;
  healthImpactPercentage: number;
  healthBefore: number;
  healthAfter: number;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMilligrams?: number;
  servingDescription?: string;
  nutritionDisclaimer?: string;
  clarifyingQuestions?: string[];
}
interface Recipe {
    recipeName: string;
    prepTime?: string;
    cookTime?: string;
    servings?: string;
    ingredients: { name: string; quantity: number; unit: string; notes?: string; isLinkable?: boolean; }[];
    instructions: string[];
    recipeNotes?: string;
}

// Constants
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;

export default function FoodLogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Page data state
    const [monster, setMonster] = useState<Monster | null>(null);
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);

    // UI state
    const [foodInput, setFoodInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDamageEffect, setShowDamageEffect] = useState(false);
    const [isRiddleModalOpen, setIsRiddleModalOpen] = useState(false);
    
    // Suggestion/Recipe state
    const [suggestedMeal, setSuggestedMeal] = useState<{ suggestedMealName: string, monsterImpactStatement: string, shortDescription: string } | null>(null);
    const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
    const [recipePreparationNotes, setRecipePreparationNotes] = useState('');
    
    // Transition (loading) states
    const [isPageLoading, startPageLoadTransition] = useTransition();
    const [isProcessing, startProcessingTransition] = useTransition();
    const [isGenerating, startGeneratingTransition] = useTransition();

    // Fetch initial data
    useEffect(() => {
        if (user?.uid) {
            startPageLoadTransition(async () => {
                const data = await getFoodLogPageData(user.uid);
                if (data.error) {
                    toast({ title: "Error", description: data.error, variant: "destructive" });
                } else {
                    setMonster(data.monster as Monster | null);
                    setFoodLogs(data.foodLogs as FoodLog[]);
                }
            });
        }
    }, [user, toast]);

    const handleFoodSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user?.uid) { toast({ title: "Not logged in", variant: "destructive" }); return; }
        const currentFoodInput = foodInput.trim();
        if (!currentFoodInput) { setError("Please enter a food item."); return; }
        
        setError(null);
        startProcessingTransition(async () => {
            const result = await processFoodSubmission(currentFoodInput, user.uid);
            
            if (result.error) {
                setError(result.error);
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else if (result.monsterDied && result.monsterName) {
                toast({
                    title: `${result.monsterName} Has Perished!`,
                    description: `Its reign ends at ${result.newHealth.toFixed(1)}% health, due to ${result.cause}. A new shadow stirs...`,
                    variant: "destructive",
                    duration: 10000,
                });
                router.push('/create-monster');
            } else if (result.success && result.newHealth !== undefined && result.gradingResult) {
                setMonster(prev => prev ? { ...prev, health: result.newHealth } : null);
                // Optimistically add new log
                const newLog = {
                    id: String(Date.now()), // temp id
                    loggedAt: new Date().toISOString(),
                    healthAfter: result.newHealth,
                    ...result.gradingResult,
                    foodName: currentFoodInput,
                }
                setFoodLogs(prev => [newLog as unknown as FoodLog, ...prev]);

                if (result.gradingResult.healthImpactPercentage < 0) {
                     setShowDamageEffect(true);
                     setTimeout(() => setShowDamageEffect(false), 700);
                }

                toast({
                    title: result.gradingResult.grade === 'good' ? `${monster?.name} wails!` : result.gradingResult.grade === 'bad' ? `${monster?.name} rejoices!` : `${monster?.name} is indifferent.`,
                    description: `${monster?.name} says: "${result.gradingResult.reasoning}". Health is now ${result.newHealth.toFixed(1)}%.`,
                    variant: result.gradingResult.grade === 'bad' ? 'destructive' : 'default',
                    duration: 8000
                });
                setFoodInput('');
            }
        });
    };
    
    const handleRiddleChallengeComplete = (wasCorrect: boolean) => {
        if (!user?.uid) return;
        
        startProcessingTransition(async () => {
            const result = await processRiddleResult(wasCorrect, user.uid);
             if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else if (result.monsterDied && result.monsterName) {
                toast({
                    title: `${result.monsterName} Has Perished!`,
                    description: `Its reign ends at ${result.newHealth.toFixed(1)}% due to a riddle's outcome. A new shadow stirs...`,
                    variant: "destructive",
                    duration: 10000,
                });
                router.push('/create-monster');
            } else if (result.success && result.newHealth !== undefined && result.healthChange !== undefined) {
                 setMonster(prev => prev ? { ...prev, health: result.newHealth } : null);
                 const toastTitle = result.healthChange < 0 ? `${monster?.name} is FUMING!` : `${monster?.name} exults!`;
                 const healthDesc = result.healthChange < 0 ? `My health drops to ${result.newHealth.toFixed(1)}%!` : `My health surges to ${result.newHealth.toFixed(1)}%!`
                 toast({ title: toastTitle, description: `"${healthDesc}"`, variant: result.healthChange > 0 ? "destructive" : "default", duration: 8000 });
                 
                 if(result.pointsAwarded && result.pointsAwarded > 0) {
                     toast({ title: `${monster?.name} grumbles: 'Bonus Points?'`, description: `Hmph. So my first words earned you ${result.pointsAwarded} points. Don't get used to it.`, duration: 7000 });
                 }
            }
        });
    };

    const handleSuggestMeal = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
        setError(null);
        setSuggestedMeal(null);
        setGeneratedRecipe(null);
        startGeneratingTransition(async () => {
             try {
                const result = await mealSuggestionFlow({ mealType });
                setSuggestedMeal(result);
             } catch(e) {
                 const err = e instanceof Error ? e.message : "AI Chef is on strike.";
                 setError(err);
             }
        });
    };

    const handleGenerateRecipe = (mealName: string) => {
        setError(null);
        setGeneratedRecipe(null);
        startGeneratingTransition(async () => {
            try {
                const result = await recipeGenerationFlow({ mealName });
                setGeneratedRecipe(result);
            } catch(e) {
                const err = e instanceof Error ? e.message : "The recipe scroll turned to dust.";
                setError(err);
            }
        });
    };
    
    const getMonsterStatusMessage = () => {
        if (!monster) return "Awaiting its creation...";
        if (monster.health <= MONSTER_DEATH_THRESHOLD) return `${monster.name} has perished!`;
        if (monster.health < 0) return `${monster.name} is critically weak at ${monster.health.toFixed(1)}%!`;
        if (monster.health < 50) return `${monster.name} is feeling quite weak (${monster.health.toFixed(1)}%).`;
        if (monster.health > 150) return `${monster.name} is overwhelmingly powerful (${monster.health.toFixed(1)}%)!`;
        return `${monster.name}'s health is ${monster.health.toFixed(1)}%... stable, for now.`;
    };
    
    const getHealthBarValue = () => {
        if (monster === null) return 0;
        const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
        const currentValInRange = monster.health - MONSTER_DEATH_THRESHOLD;
        return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
    }
    
    // Loading state for initial data fetch
    if (isPageLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin"/></div>
    }

    // If no monster exists for the user
    if (!monster) {
      return (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Monster Not Found or Perished</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You need to create your Morgellon Monster, or your previous one has fallen.
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
    
    // Main component render
    return (
      <TooltipProvider>
      <>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
              <CardHeader className="items-center text-center">
                <Image src={monster.imageUrl} alt={monster.name} width={128} height={128} className="rounded-full border-2 border-primary shadow-md mx-auto" />
                <CardTitle className="font-headline text-2xl pt-2">{monster.name}</CardTitle>
                <CardDescription>{getMonsterStatusMessage()}</CardDescription>
              </CardHeader>
              <CardContent>
                 <Label htmlFor="monster-health-progress" className="text-sm font-medium text-center block mb-1">
                   Monster Health: {monster.health.toFixed(1)}%
                 </Label>
                 <Progress id="monster-health-progress" value={getHealthBarValue()} className="w-full h-3" />
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
                  <CardDescription>Enter a food. {monster.name} will react, and the AI may provide nutritional info.</CardDescription>
              </CardHeader>
              <form onSubmit={handleFoodSubmit}>
                  <CardContent>
                      <Label htmlFor="food-item">Food Item</Label>
                      <Input id="food-item" value={foodInput} onChange={(e) => setFoodInput(e.target.value)} placeholder="e.g., Spinach, Chocolate Croissant" disabled={isProcessing}/>
                      {error && <Alert variant="destructive" className="mt-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                  </CardContent>
                  <CardFooter>
                      <Button type="submit" disabled={isProcessing || !foodInput.trim()} className="w-full">
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Apple className="mr-2 h-4 w-4" />}
                          {isProcessing ? `Asking ${monster.name}...` : `Log & See Reaction`}
                      </Button>
                  </CardFooter>
              </form>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><ChefHat className="h-6 w-6 text-primary"/>AI Chef: Meal & Recipe Creation</CardTitle>
                    <CardDescription>
                      First, create your personalized AI Dietician. Then, ask for meal suggestions and generate recipes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Button asChild className="w-full">
                            <Link href="/create-dietician">
                                <UserPlus className="mr-2 h-4 w-4" /> Create or View Your AI Dietician
                            </Link>
                        </Button>
                        <Separator />
                        <div>
                            <p className="text-center text-sm text-muted-foreground mb-4">Or get a quick meal suggestion:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(["breakfast", "lunch", "dinner", "snack"] as const).map((mealType) => {
                                    const Icon = mealType === "breakfast" ? Sunrise : mealType === "lunch" ? Sun : mealType === "dinner" ? Moon : Coffee;
                                    return (
                                        <Button key={mealType} variant="outline" onClick={() => handleSuggestMeal(mealType)} disabled={isGenerating}>
                                            <Icon className="mr-2 h-4 w-4" />
                                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {isGenerating && <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-5 w-5 animate-spin"/> AI Chef is thinking...</div>}
                    
                    {suggestedMeal && !generatedRecipe && (
                      <Card className="mt-4 p-4 bg-accent/10">
                        <CardTitle className="text-lg mb-1">{suggestedMeal.suggestedMealName}</CardTitle>
                        <CardDescription className="mb-2">{suggestedMeal.shortDescription}</CardDescription>
                        <p className="italic text-sm text-muted-foreground mb-3">"{suggestedMeal.monsterImpactStatement}"</p>
                        <Button onClick={() => handleGenerateRecipe(suggestedMeal.suggestedMealName)} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ChefHat className="mr-2 h-4 w-4"/>}
                            Get Recipe
                        </Button>
                      </Card>
                    )}

                    {generatedRecipe && (
                      <Card className="mt-4"> 
                        <CardHeader><CardTitle>{generatedRecipe.recipeName}</CardTitle></CardHeader>
                        <CardContent>
                             <h4 className="font-semibold mb-1">Ingredients:</h4>
                             <ul className="list-disc list-inside space-y-1 text-sm">
                                 {generatedRecipe.ingredients.map((ing, idx) => <li key={idx}>{ing.quantity} {ing.unit} {ing.name}</li>)}
                             </ul>
                             <Separator className="my-3"/>
                             <h4 className="font-semibold mb-1">Instructions:</h4>
                             <ol className="list-decimal list-inside space-y-1 text-sm">
                                 {generatedRecipe.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
                             </ol>
                        </CardContent>
                      </Card>
                    )}
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Recent Food Log</CardTitle>
                <CardDescription>Your last 20 food entries and their impact.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {foodLogs.length === 0 && <p className="text-sm text-muted-foreground">No food logged yet.</p>}
                  {foodLogs.map(entry => (
                    <Card key={entry.id} className="p-3 bg-card/60">
                      <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-semibold flex items-center gap-1.5">
                              {entry.grade === 'good' && <ThumbsUp className="h-4 w-4 text-green-500" />}
                              {entry.grade === 'bad' && <ThumbsDown className="h-4 w-4 text-red-500" />}
                              {entry.grade === 'neutral' && <MinusCircle className="h-4 w-4 text-muted-foreground" />}
                              {entry.foodName}
                            </h4>
                            <p className="text-xs text-muted-foreground">Logged: {formatDistanceToNow(new Date(entry.loggedAt), { addSuffix: true })}</p>
                          </div>
                          <p className="text-xs text-right flex-shrink-0">Health: {entry.healthAfter.toFixed(1)}%</p>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1 pl-1 border-l-2">"{entry.reasoning}"</p>
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
