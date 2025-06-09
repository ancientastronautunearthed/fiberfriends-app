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
import { Loader2, ChefHat, UserPlus, ArrowLeft, ArrowRight, Sparkles, Calendar, Heart, Utensils, AlertCircle, Check } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateDieticianAction, createDietPlanAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AI_DIETICIAN_KEY = 'aiDietician';
const AI_DIET_PLAN_KEY = 'aiDietPlan';

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

export default function CreateDieticianPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isCreatingPlan, startCreatingPlanTransition] = useTransition();
  const [dietician, setDietician] = useState<AIDietician | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  
  // Dietician creation form state
  const [gender, setGender] = useState('');
  const [dieticianType, setDieticianType] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [additionalTraits, setAdditionalTraits] = useState('');
  
  // Diet plan questionnaire state
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState('');
  const [badFoodFrequency, setBadFoodFrequency] = useState('');
  const [healthGoals, setHealthGoals] = useState('');
  const [mealPrepTime, setMealPrepTime] = useState('');
  const [budget, setBudget] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if dietician already exists
    const storedDietician = localStorage.getItem(AI_DIETICIAN_KEY);
    if (storedDietician) {
      setDietician(JSON.parse(storedDietician));
      setCurrentStep(3); // Skip to diet plan creation
    }
    
    // Check if diet plan exists
    const storedDietPlan = localStorage.getItem(AI_DIET_PLAN_KEY);
    if (storedDietPlan) {
      setDietPlan(JSON.parse(storedDietPlan));
    }
  }, []);

  const handleCreateDietician = () => {
    if (!gender || !dieticianType || !specialization || !communicationStyle) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    startGeneratingTransition(async () => {
      try {
        const result = await generateDieticianAction({
          gender,
          type: dieticianType,
          specialization,
          communicationStyle,
          additionalTraits
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
          dietaryRestrictions,
          allergies,
          favoriteFoods,
          dislikedFoods,
          badFoodFrequency,
          healthGoals,
          mealPrepTime,
          budget,
          dieticianName: dietician?.name || 'Your AI Dietician'
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

  const progressValue = dietician ? 100 : (currentStep === 1 ? 33 : 66);

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
            <CardDescription>Let's start with the basics of your AI dietician</CardDescription>
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

            <div>
              <Label htmlFor="specialization" className="text-base font-semibold mb-3 block">
                Specialization *
              </Label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anti-inflammatory">Anti-Inflammatory Specialist</SelectItem>
                  <SelectItem value="gut-health">Gut Health Expert</SelectItem>
                  <SelectItem value="immune-support">Immune System Support</SelectItem>
                  <SelectItem value="holistic">Holistic Nutrition</SelectItem>
                  <SelectItem value="functional">Functional Medicine</SelectItem>
                  <SelectItem value="plant-based">Plant-Based Specialist</SelectItem>
                  <SelectItem value="traditional">Traditional Medicine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!gender || !dieticianType || !specialization}
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
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basics" className="space-y-4">
                  <div>
                    <Label htmlFor="restrictions" className="font-semibold">
                      Dietary Restrictions *
                    </Label>
                    <Textarea
                      id="restrictions"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      placeholder="e.g., Vegetarian, Vegan, Gluten-free, Keto, Low-sodium..."
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="allergies" className="font-semibold">
                      Allergies & Intolerances
                    </Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g., Nuts, Dairy, Shellfish, Eggs..."
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4">
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
                  </div>
                </TabsContent>
                
                <TabsContent value="lifestyle" className="space-y-4">
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
                      placeholder="e.g., Reduce inflammation, improve energy, better digestion..."
                      className="mt-2"
                    />
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
            <CardFooter className="flex gap-2">
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
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}