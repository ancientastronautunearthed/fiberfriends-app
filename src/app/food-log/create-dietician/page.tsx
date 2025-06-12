'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ChefHat, UserPlus, ArrowLeft, ArrowRight, Sparkles, Calendar, Heart, Utensils, AlertCircle, Check, Trash2, PlusCircle, NotebookPen } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateDieticianAction, createDietPlanAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AI_DIETICIAN_KEY = 'aiDietician';
const AI_DIET_PLAN_KEY = 'aiDietPlan';
// This key now matches the one used in the Symptom Journal page.
const SYMPTOM_JOURNAL_ENTRIES_KEY = 'fiberFriendsSymptomJournalEntries';

interface AIDietician {
  name: string;
  imageUrl: string;
  personality: string;
  specialization: string;
  catchphrase: string;
  communicationStyle: string;
}

interface DietPlan {
  planName: string;
  duration: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  weeklySchedule: any;
  shoppingList: string[];
  tips: string[];
  restrictions: string[];
}

// This interface matches the data structure from the Symptom Journal.
interface SymptomEntry {
  id: string;
  date: string;
  symptoms: string[];
  notes: string;
  photoDataUri?: string;
  photoAiHint?: string;
}


// Data for the selection menus
const dietaryRestrictionOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-FODMAP', 'Soy-Free', 'Nut-Free'];
const allergyOptions = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Shellfish', 'Fish', 'Nightshades', 'Histamine Intolerance'];
const favoriteFoodOptions = ['Grilled Chicken', 'Salmon', 'Avocado', 'Sweet Potatoes', 'Broccoli', 'Berries', 'Quinoa', 'Leafy Greens', 'Nuts & Seeds'];
const dislikedFoodOptions = ['Tofu', 'Mushrooms', 'Olives', 'Cilantro', 'Beets', 'Onions', 'Bell Peppers', 'Spicy Foods', 'Organ Meats'];
const healthGoalOptions = ['Reduce Inflammation', 'Improve Gut Health', 'Boost Energy', 'Enhance Mental Clarity', 'Strengthen Immune System', 'Improve Skin Health', 'Weight Management'];


export default function CreateDieticianPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isCreatingPlan, startCreatingPlanTransition] = useTransition();
  const [dietician, setDietician] = useState<AIDietician | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);

  const [age, setAge] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  
  const [gender, setGender] = useState('');
  const [dieticianType, setDieticianType] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [additionalTraits, setAdditionalTraits] = useState('');
  
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [badFoodFrequency, setBadFoodFrequency] = useState('');
  const [healthGoals, setHealthGoals] = useState('');
  const [mealPrepTime, setMealPrepTime] = useState('');
  const [budget, setBudget] = useState('');
  const [ongoingSymptoms, setOngoingSymptoms] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState<number | ''>('');
  const [waterPerDay, setWaterPerDay] = useState<number | ''>('');
  
  const [error, setError] = useState<string | null>(null);
  
  const [symptoms, setSymptoms] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    // Correctly load and parse symptoms from the Symptom Journal's localStorage.
    const storedEntriesRaw = localStorage.getItem(SYMPTOM_JOURNAL_ENTRIES_KEY);
    if (storedEntriesRaw) {
      try {
        const parsedEntries = JSON.parse(storedEntriesRaw) as SymptomEntry[];
        // We use a Set to ensure we only have unique symptom names.
        const allSymptoms = new Set<string>();
        parsedEntries.forEach(entry => {
          entry.symptoms.forEach(symptom => allSymptoms.add(symptom));
        });
        setSymptoms(Array.from(allSymptoms));
      } catch (error) {
        console.error("Failed to parse symptom journal entries:", error);
        setSymptoms([]);
      }
    } else {
      setSymptoms([]);
    }

    const storedDietician = localStorage.getItem(AI_DIETICIAN_KEY);
    if (storedDietician) {
      setDietician(JSON.parse(storedDietician));
      setCurrentStep(3);
    }

    const storedDietPlan = localStorage.getItem(AI_DIET_PLAN_KEY);
    if (storedDietPlan) {
      setDietPlan(JSON.parse(storedDietPlan));
    }
  }, []);

  const handleCreateDietician = () => {
    if (!gender || !dieticianType || !communicationStyle || !age || !height || !weight) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    startGeneratingTransition(async () => {
      try {
        const result = await generateDieticianAction({
 age: Number(age),
 height: Number(height),
 weight: Number(weight),
          gender,
          type: dieticianType,
          communicationStyle,
          additionalTraits,
          symptoms: symptoms || [],
        });
        
        setDietician(result);
        localStorage.setItem(AI_DIETICIAN_KEY, JSON.stringify(result));
        setCurrentStep(3);
        
        toast({
          title: `Meet ${result.name}!`,
          description: result.catchphrase,
          duration: 7000,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to create dietician";
        setError(errorMessage);
        toast({
          title: "Creation Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  };

  const handleCreateDietPlan = () => {
    if (!dietaryRestrictions || !favoriteFoods || !badFoodFrequency || !healthGoals) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    startCreatingPlanTransition(async () => {
      try {
        const result = await createDietPlanAction({
 age: Number(age),
 height: Number(height),
 weight: Number(weight),
          dietaryRestrictions,
          allergies,
          favoriteFoods,
          dislikedFoods,
          badFoodFrequency,
          healthGoals,
          mealPrepTime,
          budget,
          dieticianName: dietician?.name || 'Your AI Dietician',
          symptoms: symptoms || [],
        });
        
        setDietPlan(result);
        localStorage.setItem(AI_DIET_PLAN_KEY, JSON.stringify(result));
        
        toast({
          title: "Diet Plan Created!",
          description: `${dietician?.name} has crafted a personalized plan for you.`,
          duration: 7000,
        });
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to create diet plan";
        setError(errorMessage);
        toast({
          title: "Plan Creation Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  };

  const handleDelete = () => {
    setDietician(null);
    setDietPlan(null);
    setCurrentStep(1);
    
    setGender('');
    setDieticianType('');
    setCommunicationStyle('');
    setAdditionalTraits('');
    setDietaryRestrictions('');
    setAllergies('');
    setFavoriteFoods('');
    setDislikedFoods('');
    setBadFoodFrequency('');
    setHealthGoals('');
    setMealPrepTime('');
    setBudget('');
    
    localStorage.removeItem(AI_DIETICIAN_KEY);
    localStorage.removeItem(AI_DIET_PLAN_KEY);
    
    toast({
      title: "Deleted!",
      description: "Your AI Dietician and diet plan have been deleted. You can now create a new one.",
      duration: 5000,
    });
  };

  const handleOptionClick = (setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string, option: string) => {
    const valueSet = new Set(currentValue.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    if (!valueSet.has(option.toLowerCase())) {
      setter(currentValue ? `${currentValue}, ${option}` : option);
    }
  };

  const progressValue = dietician ? 100 : (currentStep === 1 ? 33 : 66);

  if (symptoms === undefined) {
      return (
          <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/food-log" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Progress value={progressValue} className="w-48" />
          </div>
          <CardTitle className="font-headline text-3xl text-center">
            {dietician ? `${dietician.name} - Your AI Dietician` : 'Create Your AI Dietician'}
          </CardTitle>
          <CardDescription className="text-center">
            {dietician 
              ? dietician.catchphrase
              : 'Design a personalized AI dietician to help manage your nutrition and create custom meal plans'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!dietician && currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Step 1: Basic Information
            </CardTitle>
            <CardDescription>Let's start with the basics of your AI dietician. Its specialization will be based on your logged symptoms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="gender" className="text-base font-semibold mb-3 block">
                Dietician Gender *
              </Label>
              <RadioGroup value={gender} onValueChange={setGender}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-binary" id="non-binary" />
                  <Label htmlFor="non-binary">Non-binary</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="age">Age *</Label>
              <Input id="age" type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(Number(e.target.value))} required />
            </div>

            <div>
              <Label htmlFor="height">Height (in cm) *</Label>
              <Input id="height" type="number" placeholder="Enter your height" value={height} onChange={(e) => setHeight(Number(e.target.value))} required />
            </div>

            <div>
              <Label htmlFor="weight">Weight (in kg) *</Label>
              <Input id="weight" type="number" placeholder="Enter your weight" value={weight} onChange={(e) => setWeight(Number(e.target.value))} required />
            </div>

            <div>
              <Label htmlFor="type" className="text-base font-semibold mb-3 block">
                Dietician Type *
              </Label>
              <Select value={dieticianType} onValueChange={setDieticianType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select dietician type" />
                </SelectTrigger>
                <SelectContent>
            <div>
              <Label htmlFor="type" className="text-base font-semibold mb-3 block">
                Dietician Type *
              </Label>
              <Select value={dieticianType} onValueChange={setDieticianType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dietician type" />
                </SelectTrigger>
 <SelectContent>
                  <SelectItem value="human-professional">Professional Human</SelectItem>
                  <SelectItem value="human-friendly">Friendly Neighbor</SelectItem>
                  <SelectItem value="fantasy-elf">Fantasy - Woodland Elf</SelectItem>
                  <SelectItem value="fantasy-wizard">Fantasy - Wise Wizard</SelectItem>
                  <SelectItem value="fantasy-fairy">Fantasy - Healing Fairy</SelectItem>
                  <SelectItem value="sci-fi-android">Sci-Fi - Android Chef</SelectItem>
                  <SelectItem value="sci-fi-alien">Sci-Fi - Alien Nutritionist</SelectItem>
                  <SelectItem value="mythical-dragon">Mythical - Dragon Healer</SelectItem>
                  <SelectItem value="anime-inspired">Anime-Inspired Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!gender || !dieticianType || !age || !height || !weight}
              className="w-full"
            >
              Next Step
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {!dietician && currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Step 2: Personality & Style
            </CardTitle>
            <CardDescription>Define how your dietician will communicate with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="communication" className="text-base font-semibold mb-3 block">
                Communication Style *
              </Label>
              <RadioGroup value={communicationStyle} onValueChange={setCommunicationStyle}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="encouraging" id="encouraging" />
                  <Label htmlFor="encouraging">Encouraging & Supportive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct">Direct & No-Nonsense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gentle" id="gentle" />
                  <Label htmlFor="gentle">Gentle & Understanding</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="motivational" id="motivational" />
                  <Label htmlFor="motivational">Motivational Coach</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scientific" id="scientific" />
                  <Label htmlFor="scientific">Scientific & Educational</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="traits" className="text-base font-semibold mb-3 block">
                Additional Personality Traits
              </Label>
              <Textarea
                id="traits"
                value={additionalTraits}
                onChange={(e) => setAdditionalTraits(e.target.value)}
                placeholder="e.g., Has a love for Mediterranean cuisine, speaks with wisdom of ancient healers, always includes a fun food fact..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Add any specific traits you'd like your dietician to have
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(1)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleCreateDietician} 
              disabled={!communicationStyle || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Dietician...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Dietician
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {dietician && !dietPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Image 
                src={dietician.imageUrl} 
                alt={dietician.name} 
                width={200} 
                height={200} 
                className="rounded-full mx-auto mb-4 border-4 border-primary"
              />
              <CardTitle className="font-headline text-2xl">{dietician.name}</CardTitle>
              <CardDescription className="text-lg">{dietician.specialization}</CardDescription>
              <p className="text-muted-foreground italic mt-2">"{dietician.catchphrase}"</p>
            </CardHeader>
            <CardContent>
              <div className="bg-accent/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">About {dietician.name}:</h4>
                <p className="text-sm">{dietician.personality}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" onClick={handleDelete} className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete and Start Over
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Create Your Personalized Diet Plan
              </CardTitle>
              <CardDescription>
                Let's gather some information to create a diet plan tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basics" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basics">Basics</TabsTrigger>
                  <TabsTrigger value="preferences">Food Preferences</TabsTrigger>
                  <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basics" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="restrictions" className="font-semibold">
                      Dietary Restrictions *
                    </Label>
                    <Textarea
                      id="restrictions"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      placeholder="Type here or select from common options below..."
                      className="mt-2"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dietaryRestrictionOptions.map(opt => (
                        <Button type="button" key={opt} variant="outline" size="sm" onClick={() => handleOptionClick(setDietaryRestrictions, dietaryRestrictions, opt)} className="text-xs h-7">+ {opt}</Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="allergies" className="font-semibold">
                      Allergies & Intolerances
                    </Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g., Nuts, Dairy, Shellfish..."
                      className="mt-2"
                    />
                     <div className="flex flex-wrap gap-2 mt-2">
                      {allergyOptions.map(opt => (
                        <Button type="button" key={opt} variant="outline" size="sm" onClick={() => handleOptionClick(setAllergies, allergies, opt)} className="text-xs h-7">+ {opt}</Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="favorites" className="font-semibold">
                      Favorite Foods *
                    </Label>
                    <Textarea
                      id="favorites"
                      value={favoriteFoods}
                      onChange={(e) => setFavoriteFoods(e.target.value)}
                      placeholder="List foods you enjoy eating..."
                      className="mt-2"
                    />
                     <div className="flex flex-wrap gap-2 mt-2">
                      {favoriteFoodOptions.map(opt => (
                        <Button type="button" key={opt} variant="outline" size="sm" onClick={() => handleOptionClick(setFavoriteFoods, favoriteFoods, opt)} className="text-xs h-7">+ {opt}</Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dislikes" className="font-semibold">
                      Disliked Foods
                    </Label>
                    <Textarea
                      id="dislikes"
                      value={dislikedFoods}
                      onChange={(e) => setDislikedFoods(e.target.value)}
                      placeholder="Foods you prefer to avoid..."
                      className="mt-2"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dislikedFoodOptions.map(opt => (
                        <Button type="button" key={opt} variant="outline" size="sm" onClick={() => handleOptionClick(setDislikedFoods, dislikedFoods, opt)} className="text-xs h-7">+ {opt}</Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="lifestyle" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="frequency" className="font-semibold">
                      How often do you consume foods that worsen Morgellons symptoms? *
                    </Label>
                    <Select value={badFoodFrequency} onValueChange={setBadFoodFrequency}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rarely">Rarely (less than once a week)</SelectItem>
                        <SelectItem value="sometimes">Sometimes (1-3 times a week)</SelectItem>
                        <SelectItem value="often">Often (4-6 times a week)</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="goals" className="font-semibold">
                      Health Goals *
                    </Label>
                    <Textarea
                      id="goals"
                      value={healthGoals}
                      onChange={(e) => setHealthGoals(e.target.value)}
                      placeholder="e.g., Reduce inflammation, improve energy..."
                      className="mt-2"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {healthGoalOptions.map(opt => (
                        <Button type="button" key={opt} variant="outline" size="sm" onClick={() => handleOptionClick(setHealthGoals, healthGoals, opt)} className="text-xs h-7">+ {opt}</Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="prep-time" className="font-semibold">
                      Meal Prep Time Available
                    </Label>
                    <Select value={mealPrepTime} onValueChange={setMealPrepTime}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal (15 mins or less)</SelectItem>
                        <SelectItem value="moderate">Moderate (15-30 mins)</SelectItem>
                        <SelectItem value="extensive">Extensive (30+ mins)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="budget" className="font-semibold">
                      Weekly Food Budget
                    </Label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tight">Tight (Under $50)</SelectItem>
                        <SelectItem value="moderate">Moderate ($50-$100)</SelectItem>
                        <SelectItem value="flexible">Flexible ($100-$200)</SelectItem>
                        <SelectItem value="unlimited">Unlimited ($200+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateDietPlan} 
                disabled={!dietaryRestrictions || !favoriteFoods || !badFoodFrequency || !healthGoals || isCreatingPlan}
                className="w-full"
              >
                {isCreatingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Your Plan...
                  </>
                ) : (
                  <>
                    <Utensils className="mr-2 h-4 w-4" />
                    Create Diet Plan
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {dietician && dietPlan && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="font-headline text-2xl">Your Diet Plan is Ready!</CardTitle>
              <CardDescription>{dietPlan.planName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-accent/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Duration:</h4>
                <p>{dietPlan.duration}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Key Tips from {dietician.name}:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {dietPlan.tips.map((tip, index) => (
                    <li key={index} className="text-sm">{tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                    <Button asChild className="flex-1">
                      <Link href="/food-log">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Food Log
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/food-log/diet-plan">
                        View Full Plan
                      </Link>
                    </Button>
                </div>
                <Button variant="destructive" onClick={handleDelete} className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete and Start Over
                </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}