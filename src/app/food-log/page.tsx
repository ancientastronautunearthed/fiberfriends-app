
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Apple, ThumbsUp, ThumbsDown, MinusCircle, Info, Sparkles, Skull, Ghost } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gradeFoodItemAction } from './actions';
import type { FoodGradingOutput } from '@/ai/flows/food-grading-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MonsterRiddleModal from '@/components/features/monster-riddle-modal';


const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const FOOD_LOG_KEY = 'morgellonFoodLogEntries';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const MONSTER_HAS_SPOKEN_KEY = 'monsterHasSpokenFirstTime';
const USER_POINTS_KEY = 'userPoints'; // Key for product tracker points

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const RIDDLE_HEALTH_IMPACT = 25;
const FIRST_SPEAK_BONUS_POINTS = 50;

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

export default function FoodLogPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [foodLogEntries, setFoodLogEntries] = useState<FoodLogEntry[]>([]);
  
  const [foodInput, setFoodInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGrading, startGradingTransition] = useTransition();
  const { toast } = useToast();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const router = useRouter();

  const [isRiddleModalOpen, setIsRiddleModalOpen] = useState(false);


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
    } else {
      setMonsterImageUrl(null);
      setMonsterName(null);
      setMonsterHealth(null);
    }

    const storedFoodLog = localStorage.getItem(FOOD_LOG_KEY);
    if (storedFoodLog) {
      setFoodLogEntries(JSON.parse(storedFoodLog));
    }
  }, []);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true') {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "Initial health check");
    }
  }, [monsterHealth]);

  useEffect(() => {
    if (foodLogEntries.length > 0 || localStorage.getItem(FOOD_LOG_KEY)) {
      localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(foodLogEntries));
    }
  }, [foodLogEntries]);

  const checkMonsterDeath = (currentHealth: number, foodNameForToast: string) => {
     if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
        const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
        tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
        localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));

        localStorage.removeItem(MONSTER_IMAGE_KEY);
        localStorage.removeItem(MONSTER_NAME_KEY);
        localStorage.removeItem(MONSTER_HEALTH_KEY);
        localStorage.removeItem(MONSTER_GENERATED_KEY);
        // Keep MONSTER_HAS_SPOKEN_KEY and USER_POINTS_KEY as they are user-specific, not monster-specific.
        
        setMonsterImageUrl(null);
        setMonsterName(null);
        setMonsterHealth(null); // This will trigger the "Monster Not Found" UI

        toast({
          title: "Your Monster Has Perished!",
          description: `${foodNameForToast} contributed to its demise. ${monsterName} has fallen with ${currentHealth.toFixed(1)}% health. Visit the Tomb of Monsters. You can now create a new monster.`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); // Redirect to create a new one
        return true; // Monster died
      }
      return false; // Monster is alive
  };


  const handleFoodSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!foodInput.trim()) {
      setError("Please enter a food item.");
      return;
    }
    if (monsterHealth === null || !monsterName || !monsterImageUrl) {
        setError("Monster not found or health not initialized. Please create a monster first.");
        return;
    }
    setError(null);

    startGradingTransition(async () => {
      try {
        const result = await gradeFoodItemAction({ foodItem: foodInput });
        
        const healthBefore = monsterHealth;
        let newHealth = healthBefore + result.healthImpactPercentage;
        newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth); 
        
        setMonsterHealth(newHealth);
        setFoodInput('');

        if (result.grade === 'bad') {
          setShowDamageEffect(true);
          setTimeout(() => setShowDamageEffect(false), 700);
        }

        const newLogEntry: FoodLogEntry = {
          ...result,
          id: Date.now().toString(),
          loggedAt: new Date().toISOString(),
          healthBefore,
          healthAfter: newHealth,
        };
        setFoodLogEntries(prev => [newLogEntry, ...prev].slice(0, 20)); 

        if (!checkMonsterDeath(newHealth, result.foodName)) {
          toast({
            title: `${result.foodName} Logged!`,
            description: `Monster health changed by ${result.healthImpactPercentage.toFixed(1)}%. Current: ${newHealth.toFixed(1)}%. Reason: ${result.reasoning}`,
            variant: result.grade === "good" ? "default" : result.grade === "bad" ? "destructive" : "default",
            duration: Number.MAX_SAFE_INTEGER, 
          });
        }

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade food item.";
        setError(errorMessage);
        toast({
          title: "Error Grading Food",
          description: errorMessage,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  };

  const handleRiddleChallengeComplete = (wasCorrect: boolean) => {
    if (monsterHealth === null) return;

    let healthChangeDescription = "";
    let newHealth = monsterHealth;

    if (wasCorrect) {
      newHealth -= RIDDLE_HEALTH_IMPACT;
      healthChangeDescription = `Correct! Monster health decreased by ${RIDDLE_HEALTH_IMPACT}%.`;
      toast({ title: "Riddle Solved!", description: healthChangeDescription, variant: "default", duration: 5000});
    } else {
      newHealth += RIDDLE_HEALTH_IMPACT;
      healthChangeDescription = `Incorrect! Monster health increased by ${RIDDLE_HEALTH_IMPACT}%.`;
      toast({ title: "Riddle Failed!", description: healthChangeDescription, variant: "destructive", duration: 5000});
    }
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);
    setMonsterHealth(newHealth);

    const hasSpoken = localStorage.getItem(MONSTER_HAS_SPOKEN_KEY);
    if (hasSpoken === 'false') {
      const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0');
      localStorage.setItem(USER_POINTS_KEY, String(currentPoints + FIRST_SPEAK_BONUS_POINTS));
      localStorage.setItem(MONSTER_HAS_SPOKEN_KEY, 'true');
      toast({
        title: "Bonus Points!",
        description: `Your monster spoke for the first time! You earned ${FIRST_SPEAK_BONUS_POINTS} contribution points.`,
        variant: "default",
        duration: 7000,
      });
    }
    checkMonsterDeath(newHealth, "a riddle's outcome");
  };


  const getMonsterStatusMessage = () => {
    if (monsterHealth === null) return "";
    if (monsterHealth <= MONSTER_DEATH_THRESHOLD) return "Your monster has perished!";
    if (monsterHealth < 0) return `Your monster is critically weak at ${monsterHealth.toFixed(1)}%!`;
    if (monsterHealth < 20) return "Your monster is very weak!";
    if (monsterHealth < INITIAL_HEALTH_MIN) return "Your monster is feeling weak!";
    if (monsterHealth > (MAX_MONSTER_HEALTH - (MAX_MONSTER_HEALTH - INITIAL_HEALTH_MAX)/2) ) return "Your monster is overwhelmingly powerful!";
    if (monsterHealth > INITIAL_HEALTH_MAX + 20) return "Your monster is significantly strengthened!";
    if (monsterHealth > INITIAL_HEALTH_MAX) return "Your monster is gaining strength.";
    return "Your monster's health is stable.";
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      return Math.max(0, monsterHealth) / MAX_MONSTER_HEALTH * 100;
  }

  if (!monsterName || !monsterImageUrl || monsterHealth === null) {
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

  return (
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
              Monster Health: {monsterHealth.toFixed(1)}% (Max: {MAX_MONSTER_HEALTH}%)
            </Label>
            <Progress id="monster-health-progress" value={getHealthBarValue()} className="w-full h-3" 
                aria-label={`Monster health: ${monsterHealth.toFixed(1)}%`} />
             <p className="text-xs text-muted-foreground text-center mt-1">Dies at: {MONSTER_DEATH_THRESHOLD}%</p>
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
    <MonsterRiddleModal
        isOpen={isRiddleModalOpen}
        onClose={() => setIsRiddleModalOpen(false)}
        onChallengeComplete={handleRiddleChallengeComplete}
    />
    </>
  );
}
