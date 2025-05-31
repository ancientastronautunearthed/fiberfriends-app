
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Apple, ThumbsUp, ThumbsDown, MinusCircle, Info, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { gradeFoodItemAction } from './actions';
import type { FoodGradingOutput } from '@/ai/flows/food-grading-flow';
import { useToast } from '@/hooks/use-toast';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const FOOD_LOG_KEY = 'morgellonFoodLogEntries';

const MIN_MONSTER_HEALTH = 20;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;

interface FoodLogEntry extends FoodGradingOutput {
  id: string;
  loggedAt: string;
  healthBefore: number;
  healthAfter: number;
}

export default function FoodLogPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [foodLogEntries, setFoodLogEntries] = useState<FoodLogEntry[]>([]);
  
  const [foodInput, setFoodInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGrading, startGradingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    setMonsterImageUrl(storedImage);
    setMonsterName(storedName);

    if (storedName && storedImage) { // Only initialize health if monster exists
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) {
        setMonsterHealth(parseFloat(storedHealth));
      } else {
        // Monster exists but no health - initialize it
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth);
        localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
    }

    const storedFoodLog = localStorage.getItem(FOOD_LOG_KEY);
    if (storedFoodLog) {
      setFoodLogEntries(JSON.parse(storedFoodLog));
    }
  }, []);

  useEffect(() => {
    if (monsterHealth !== null) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
    }
  }, [monsterHealth]);

  useEffect(() => {
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(foodLogEntries));
  }, [foodLogEntries]);

  const handleFoodSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!foodInput.trim()) {
      setError("Please enter a food item.");
      return;
    }
    if (monsterHealth === null) {
        setError("Monster health not initialized. This shouldn't happen if a monster exists.");
        return;
    }
    setError(null);

    startGradingTransition(async () => {
      try {
        const result = await gradeFoodItemAction({ foodItem: foodInput });
        
        const healthBefore = monsterHealth;
        let newHealth = healthBefore + result.healthImpactPercentage;
        newHealth = Math.max(MIN_MONSTER_HEALTH, Math.min(MAX_MONSTER_HEALTH, newHealth));
        
        setMonsterHealth(newHealth);

        const newLogEntry: FoodLogEntry = {
          ...result,
          id: Date.now().toString(),
          loggedAt: new Date().toISOString(),
          healthBefore,
          healthAfter: newHealth,
        };
        setFoodLogEntries(prev => [newLogEntry, ...prev].slice(0, 20)); // Keep last 20 entries
        setFoodInput('');
        toast({
          title: `${result.foodName} Logged!`,
          description: `Monster health changed by ${result.healthImpactPercentage.toFixed(1)}%. Current: ${newHealth.toFixed(1)}%. Reason: ${result.reasoning}`,
          variant: result.grade === "good" ? "default" : result.grade === "bad" ? "destructive" : "default"
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade food item.";
        setError(errorMessage);
        toast({
          title: "Error Grading Food",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  const getMonsterStatusMessage = () => {
    if (monsterHealth === null) return "";
    if (monsterHealth < (MIN_MONSTER_HEALTH + (INITIAL_HEALTH_MIN - MIN_MONSTER_HEALTH) / 2) ) return "Your monster is critically weak!";
    if (monsterHealth < INITIAL_HEALTH_MIN) return "Your monster is feeling weak!";
    if (monsterHealth > (MAX_MONSTER_HEALTH - (MAX_MONSTER_HEALTH - INITIAL_HEALTH_MAX)/2) ) return "Your monster is overwhelmingly powerful!";
    if (monsterHealth > INITIAL_HEALTH_MAX + 20) return "Your monster is significantly strengthened!";
    if (monsterHealth > INITIAL_HEALTH_MAX) return "Your monster is gaining strength.";
    return "Your monster's health is stable.";
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      return (monsterHealth / MAX_MONSTER_HEALTH) * 100;
  }

  if (!monsterName || !monsterImageUrl) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Monster Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            You need to create your Morgellon Monster before you can log food and track its health.
          </p>
          <Button asChild className="w-full">
            <Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create Your Monster</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="items-center text-center">
            {monsterImageUrl && monsterName && (
              <Image src={monsterImageUrl} alt={monsterName} width={128} height={128} className="rounded-full border-2 border-primary shadow-md mx-auto" data-ai-hint="generated monster" />
            )}
            <CardTitle className="font-headline text-2xl pt-2">{monsterName}</CardTitle>
            {monsterHealth !== null && (
                <CardDescription>{getMonsterStatusMessage()}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {monsterHealth !== null ? (
              <>
                <Label htmlFor="monster-health-progress" className="text-sm font-medium text-center block mb-1">
                  Monster Health: {monsterHealth.toFixed(1)}% / {MAX_MONSTER_HEALTH}%
                </Label>
                <Progress id="monster-health-progress" value={getHealthBarValue()} className="w-full h-3" 
                    aria-label={`Monster health: ${monsterHealth.toFixed(1)}%`} />
                 <p className="text-xs text-muted-foreground text-center mt-1">Min: {MIN_MONSTER_HEALTH}%, Max: {MAX_MONSTER_HEALTH}%</p>
              </>
            ) : (
              <p className="text-center text-muted-foreground">Loading monster health...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Apple className="h-6 w-6 text-primary"/>Log Food Item</CardTitle>
            <CardDescription>Enter a food item to see how it affects your monster's health. The AI will grade it.</CardDescription>
          </CardHeader>
          <form onSubmit={handleFoodSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="food-item">Food Item</Label>
                <Input
                  id="food-item"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder="e.g., Spinach, Chocolate Croissant, Apple"
                  disabled={isGrading}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGrading || !foodInput.trim()} className="w-full sm:w-auto">
                {isGrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Apple className="mr-2 h-4 w-4" />}
                {isGrading ? 'Analyzing Food...' : 'Log Food & See Impact'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Food Log</CardTitle>
            <CardDescription>Your last 20 food entries and their impact.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {foodLogEntries.length === 0 && <p className="text-sm text-muted-foreground">No food items logged yet.</p>}
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
                      Logged: {new Date(entry.loggedAt).toLocaleTimeString()} - Health Impact: <span className={entry.healthImpactPercentage > 0 ? "text-red-500" : entry.healthImpactPercentage < 0 ? "text-green-500" : ""}>{entry.healthImpactPercentage.toFixed(1)}%</span>
                      {/* (Before: {entry.healthBefore.toFixed(1)}% -> After: {entry.healthAfter.toFixed(1)}%) */}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 text-right flex-shrink-0">Now: {entry.healthAfter.toFixed(1)}%</p>
                </div>
                <p className="text-sm text-foreground/80 mt-1 pl-1 border-l-2 border-accent/50 ml-1.5 "> <span className="italic text-muted-foreground">AI says:</span> {entry.reasoning}</p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
