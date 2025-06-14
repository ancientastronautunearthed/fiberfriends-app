'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Brain, BarChart3, Lightbulb, UtensilsCrossed, Info, AreaChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import type { NutritionDataInput, NutritionAdviceOutput } from '@/ai/flows/nutrition-advice-flow';
import { getNutritionAdviceAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NutritionalFoodLogEntry {
  id: string;
  loggedAt: Timestamp;
  foodName: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  sugarGrams?: number;
  sodiumMilligrams?: number;
  servingDescription?: string;
}

interface AggregatedNutrition {
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbGrams: number;
  totalFatGrams: number;
  totalSugarGrams: number;
  totalSodiumMilligrams: number;
  entryCount: number;
  foodSummary: string[];
}

const MACRO_COLORS = {
  protein: 'hsl(var(--chart-1))', // Blue
  carbs: 'hsl(var(--chart-2))',   // Purple/Magenta
  fat: 'hsl(var(--chart-3))',     // Muted Charcoal
};

const CHART_CONFIG = {
  calories: { label: 'Calories (kcal)', color: 'hsl(var(--chart-1))' },
  protein: { label: 'Protein (g)', color: MACRO_COLORS.protein },
  carbs: { label: 'Carbs (g)', color: MACRO_COLORS.carbs },
  fat: { label: 'Fat (g)', color: MACRO_COLORS.fat },
  sugar: { label: 'Sugar (g)', color: 'hsl(var(--chart-4))' }, // Teal
  sodium: { label: 'Sodium (mg)', color: 'hsl(var(--chart-5))' }, // Lighter Cool Blue
};

export default function NutritionTrackerPage() {
  const [allEntries, setAllEntries] = useState<NutritionalFoodLogEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [aggregatedData, setAggregatedData] = useState<AggregatedNutrition | null>(null);
  const [aiAdvice, setAiAdvice] = useState<NutritionAdviceOutput | null>(null);
  const [isLoadingAdvice, startLoadingAdviceTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch nutritional food entries from Firestore
  useEffect(() => {
    const fetchNutritionalEntries = async () => {
      if (!user?.uid || !db) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);
      setError(null);

      try {
        // Query food logs that have nutritional information
        const foodLogsQuery = query(
          collection(db!, 'foodLogs'),
          where('userId', '==', user.uid),
          where('calories', '>', 0), // Only get entries with nutritional data
          orderBy('calories', 'desc'), // Order by calories to get entries with data first
          orderBy('loggedAt', 'desc'),
          limit(200) // Limit to recent entries for performance
        );

        const foodLogsSnapshot = await getDocs(foodLogsQuery);
        const entries: NutritionalFoodLogEntry[] = [];

        foodLogsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Only include entries that have at least some nutritional data
          if (data.calories || data.proteinGrams || data.carbGrams || data.fatGrams) {
            entries.push({
              id: doc.id,
              loggedAt: data.loggedAt,
              foodName: data.foodName,
              calories: data.calories,
              proteinGrams: data.proteinGrams,
              carbGrams: data.carbGrams,
              fatGrams: data.fatGrams,
              sugarGrams: data.sugarGrams,
              sodiumMilligrams: data.sodiumMilligrams,
              servingDescription: data.servingDescription
            });
          }
        });

        setAllEntries(entries);
      } catch (error) {
        console.error('Error fetching nutritional entries:', error);
        setError('Failed to load nutritional data. Please try again.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchNutritionalEntries();
  }, [user]);

  useEffect(() => {
    if (allEntries.length >= 0) { // Process even if allEntries is empty to show "no data"
      processAndSetAggregatedData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEntries, selectedPeriod]);

  const processAndSetAggregatedData = () => {
    const now = new Date();
    let startDate: Date;

    if (selectedPeriod === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (selectedPeriod === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); // Start of current week (Sunday)
    } else { // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
    }

    const filteredEntries = allEntries.filter(entry => {
      try {
        const entryDate = entry.loggedAt.toDate();
        return !isNaN(entryDate.getTime()) && entryDate >= startDate;
      } catch (e) {
        console.warn("Skipping entry with invalid date:", entry);
        return false;
      }
    });

    if (filteredEntries.length === 0) {
      setAggregatedData({
        totalCalories: 0, totalProteinGrams: 0, totalCarbGrams: 0, totalFatGrams: 0,
        totalSugarGrams: 0, totalSodiumMilligrams: 0, entryCount: 0, foodSummary: []
      });
      return;
    }

    const totals = filteredEntries.reduce((acc, entry) => {
      acc.totalCalories += entry.calories || 0;
      acc.totalProteinGrams += entry.proteinGrams || 0;
      acc.totalCarbGrams += entry.carbGrams || 0;
      acc.totalFatGrams += entry.fatGrams || 0;
      acc.totalSugarGrams += entry.sugarGrams || 0;
      acc.totalSodiumMilligrams += entry.sodiumMilligrams || 0;
      return acc;
    }, {
      totalCalories: 0, totalProteinGrams: 0, totalCarbGrams: 0, totalFatGrams: 0,
      totalSugarGrams: 0, totalSodiumMilligrams: 0
    });

    const foodFrequency: {[key: string]: number} = {};
    filteredEntries.forEach(entry => {
      const foodName = entry.foodName ? entry.foodName.toLowerCase().trim() : "unknown food";
      foodFrequency[foodName] = (foodFrequency[foodName] || 0) + 1;
    });
    const sortedFoodSummary = Object.entries(foodFrequency)
                              .sort(([,a],[,b]) => b-a)
                              .slice(0, 5) // Top 5 most frequent
                              .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

    setAggregatedData({ ...totals, entryCount: filteredEntries.length, foodSummary: sortedFoodSummary });
  };

  const handleGetAIAdvice = () => {
    if (!aggregatedData || aggregatedData.entryCount === 0) {
      toast({ title: "Not Enough Data", description: "Please log some food items with nutritional info to get AI advice.", variant: "default" });
      return;
    }
    setError(null);
    setAiAdvice(null);
    startLoadingAdviceTransition(async () => {
      try {
        const periodMap = { daily: "Today", weekly: "This Week", monthly: "This Month" };
        const input: NutritionDataInput = {
          periodDescription: periodMap[selectedPeriod],
          aggregatedNutrition: {
            totalCalories: aggregatedData.totalCalories,
            totalProteinGrams: aggregatedData.totalProteinGrams,
            totalCarbGrams: aggregatedData.totalCarbGrams,
            totalFatGrams: aggregatedData.totalFatGrams,
            totalSugarGrams: aggregatedData.totalSugarGrams,
            totalSodiumMilligrams: aggregatedData.totalSodiumMilligrams,
            foodEntriesSummary: aggregatedData.foodSummary,
          },
          // userGoals: "Optional user goals could be added here from another input"
        };
        const result = await getNutritionAdviceAction(input);
        setAiAdvice(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to get AI advice.");
        toast({ title: "AI Advice Error", description: e instanceof Error ? e.message : "Unknown error.", variant: "destructive" });
      }
    });
  };
  
  const macroChartData = aggregatedData ? [
    { name: 'Protein', value: aggregatedData.totalProteinGrams, fill: MACRO_COLORS.protein },
    { name: 'Carbs', value: aggregatedData.totalCarbGrams, fill: MACRO_COLORS.carbs },
    { name: 'Fat', value: aggregatedData.totalFatGrams, fill: MACRO_COLORS.fat },
  ].filter(d => d.value > 0) : [];

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary"/>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Please log in to track your nutrition.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your nutritional data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UtensilsCrossed className="h-6 w-6 text-primary"/>Nutrition Tracker & AI Coach</CardTitle>
          <CardDescription>Review your nutritional intake for the selected period and get AI-powered advice. Data comes from entries with nutritional details in your Food Log.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGetAIAdvice} 
              disabled={isLoadingAdvice || !aggregatedData || aggregatedData.entryCount === 0}
              className="w-full sm:w-auto"
            >
              {isLoadingAdvice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Get AI Coach Advice
            </Button>
          </div>
          {error && <Alert variant="destructive" className="mt-2"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {!aggregatedData || aggregatedData.entryCount === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
            <Info className="mx-auto h-10 w-10 mb-3 text-primary" />
            <p className="text-lg font-medium mb-1">No Nutritional Data Found</p>
            <p className="text-sm max-w-md mx-auto">
              No food entries with nutritional details found for the selected period. 
              Please ensure you've logged foods with nutritional information in your{' '}
              <Button variant="link" asChild className="p-0 h-auto text-sm inline">
                <Link href="/food-log">Food Log</Link>
              </Button>
              {' '}so they can appear here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/food-log">Go to Food Log</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Total Calories</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-primary">{aggregatedData.totalCalories.toLocaleString()} kcal</p><p className="text-xs text-muted-foreground">from {aggregatedData.entryCount} entries this {selectedPeriod}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Macronutrients</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Protein: <span className="font-semibold">{aggregatedData.totalProteinGrams.toFixed(1)}g</span></p>
                <p>Carbs: <span className="font-semibold">{aggregatedData.totalCarbGrams.toFixed(1)}g</span></p>
                <p>Fat: <span className="font-semibold">{aggregatedData.totalFatGrams.toFixed(1)}g</span></p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader><CardTitle className="text-lg">Other Nutrients</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Sugar: <span className="font-semibold">{aggregatedData.totalSugarGrams.toFixed(1)}g</span></p>
                <p>Sodium: <span className="font-semibold">{aggregatedData.totalSodiumMilligrams.toFixed(0)}mg</span></p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Macro Breakdown (Grams)</CardTitle>
              <CardDescription>Visual representation of Protein, Carbs, and Fat intake for the period.</CardDescription>
            </CardHeader>
            <CardContent>
              {macroChartData.length > 0 ? (
                <ChartContainer config={CHART_CONFIG} className="min-h-[250px] w-full aspect-video">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={macroChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {macroChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: "20px"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">Not enough macronutrient data (protein, carbs, fat {'>'} 0g) to display chart for this period.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isLoadingAdvice && (
        <Card className="mt-4">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[150px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">AI Nutrition Coach is analyzing your data...</p>
          </CardContent>
        </Card>
      )}

      {aiAdvice && (
        <Card className="mt-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Brain className="h-6 w-6 text-primary"/>AI Nutrition Coach Says...</CardTitle>
            <CardDescription className="text-sm">{aiAdvice.overallSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {aiAdvice.positiveObservations.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-green-700 dark:text-green-400 mb-1.5">Positive Observations:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  {aiAdvice.positiveObservations.map((obs, i) => <li key={`pos-${i}`}>{obs}</li>)}
                </ul>
              </div>
            )}
            {aiAdvice.areasForImprovement.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-amber-700 dark:text-amber-500 mb-1.5">Areas for Improvement:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  {aiAdvice.areasForImprovement.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}
                </ul>
              </div>
            )}
            {aiAdvice.actionableTips.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-blue-700 dark:text-blue-400 mb-1.5">Actionable Tips:</h3>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-muted-foreground">
                  {aiAdvice.actionableTips.map((tip, i) => <li key={`tip-${i}`}>{tip}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">{aiAdvice.disclaimer}</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}