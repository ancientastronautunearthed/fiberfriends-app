
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Brain, BarChart3, Lightbulb, UtensilsCross, Info, AreaChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Tooltip as RechartsTooltip } from 'recharts';
import type { NutritionDataInput, NutritionAdviceOutput } from '@/ai/flows/nutrition-advice-flow';
import { getNutritionAdviceAction } from './actions';
import { useToast } from '@/hooks/use-toast';

// Key for storing all food log entries with nutritional data
const ALL_NUTRITIONAL_FOOD_ENTRIES_KEY = 'allNutritionalFoodEntries';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedEntries = localStorage.getItem(ALL_NUTRITIONAL_FOOD_ENTRIES_KEY);
    if (storedEntries) {
      setAllEntries(JSON.parse(storedEntries));
    }
  }, []);

  useEffect(() => {
    if (allEntries.length > 0) {
      processAndSetAggregatedData();
    } else {
      setAggregatedData(null);
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

    const filteredEntries = allEntries.filter(entry => new Date(entry.loggedAt) >= startDate);

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
        const foodName = entry.foodName.toLowerCase().trim();
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


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UtensilsCross className="h-6 w-6 text-primary"/>Nutrition Tracker & AI Coach</CardTitle>
          <CardDescription>Review your nutritional intake and get AI-powered advice to enhance your efforts. Ensure food items are logged with nutritional details for tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGetAIAdvice} disabled={isLoadingAdvice || !aggregatedData || aggregatedData.entryCount === 0}>
              {isLoadingAdvice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Get AI Coach Advice
            </Button>
          </div>
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {aggregatedData ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Total Calories</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-primary">{aggregatedData.totalCalories.toLocaleString()} kcal</p><p className="text-xs text-muted-foreground">from {aggregatedData.entryCount} entries</p></CardContent>
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
      ) : (
         <Card className="mt-4">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <Info className="mx-auto h-10 w-10 mb-2" />
                No nutritional data processed for the selected period.
                <br />
                Ensure you've logged food items with nutritional details in the <Button variant="link" asChild className="p-0 h-auto"><a href="/food-log">Food Log</a></Button>.
            </CardContent>
        </Card>
      )}
      
      {aggregatedData && aggregatedData.entryCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Macro Breakdown (Grams)</CardTitle>
          </CardHeader>
          <CardContent>
            {macroChartData.length > 0 ? (
              <ChartContainer config={CHART_CONFIG} className="min-h-[200px] w-full aspect-video">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={macroChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                       {macroChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                     <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Not enough macronutrient data to display chart.</p>
            )}
          </CardContent>
        </Card>
      )}


      {isLoadingAdvice && (
        <Card className="mt-4">
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">AI Nutrition Coach is analyzing your data...</p>
          </CardContent>
        </Card>
      )}

      {aiAdvice && (
        <Card className="mt-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Brain className="h-6 w-6 text-primary"/>AI Nutrition Coach Says...</CardTitle>
            <CardDescription>{aiAdvice.overallSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAdvice.positiveObservations.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-green-600 dark:text-green-400">Positive Observations:</h3>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                  {aiAdvice.positiveObservations.map((obs, i) => <li key={`pos-${i}`}>{obs}</li>)}
                </ul>
              </div>
            )}
            {aiAdvice.areasForImprovement.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-amber-600 dark:text-amber-400">Areas for Improvement:</h3>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                  {aiAdvice.areasForImprovement.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}
                </ul>
              </div>
            )}
            {aiAdvice.actionableTips.length > 0 && (
              <div>
                <h3 className="font-semibold text-md text-blue-600 dark:text-blue-400">Actionable Tips:</h3>
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
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
