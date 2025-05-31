
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
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
const USER_POINTS_KEY = 'userPoints'; 
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';


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

        if (result.grade === 'bad' || result.healthImpactPercentage > 0) { // Monster is pleased
          // No damage flash for bad food (monster likes it)
        } else if (result.grade === 'good' || result.healthImpactPercentage < 0) { // Monster is hurt
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

        let toastTitle = "";
        let monsterQuote = result.reasoning;
        let toastVariant: "default" | "destructive" = "default";

        // Modify monster quote based on health
        if (newHealth < 0) {
            monsterQuote = `No... please... ${result.reasoning} It's too much... I'm fading...`;
        } else if (newHealth < 25) {
            monsterQuote = `Why are you doing this to me?! ${result.reasoning} I feel so weak...`;
        } else if (newHealth < 50 && result.grade === 'good') {
            monsterQuote = `Stop! ${result.reasoning} That actually hurts, you know!`;
        }


        if (result.grade === "good") {
          toastTitle = `${monsterName} wails!`;
          toastDescription = `My health drops to ${newHealth.toFixed(1)}% (-${Math.abs(result.healthImpactPercentage).toFixed(1)}%). ${monsterName} cries: "${monsterQuote}"`;
          toastVariant = "default"; 
        } else if (result.grade === "bad") {
          toastTitle = `${monsterName} rejoices!`;
          toastDescription = `My power surges to ${newHealth.toFixed(1)}% (+${result.healthImpactPercentage.toFixed(1)}%)! ${monsterName} gloats: "${monsterQuote}"`;
          toastVariant = "destructive";
        } else { 
          toastTitle = `${monsterName} is indifferent.`;
          toastDescription = `${result.foodName}? Means nothing to me. Health remains ${newHealth.toFixed(1)}%. ${monsterName} mutters: "${monsterQuote}"`;
          toastVariant = "default";
        }
        
        // Specific reaction for garlic
        if (result.foodName.toLowerCase().includes('garlic') && result.grade === 'good') {
            toastTitle = `${monsterName} HISSES about the Garlic!`;
            toastDescription = `THAT STUFF AGAIN?! My health is now ${newHealth.toFixed(1)}%! ${monsterName} shrieks: "${monsterQuote}"`;
        }


        if (!checkMonsterDeath(newHealth, result.foodName)) {
          toast({
            title: toastTitle,
            description: toastDescription,
            variant: toastVariant,
            duration: Number.MAX_SAFE_INTEGER, 
          });
        }

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
    newHealth = Math.max(MONSTER_DEATH_THRESHOLD - 1, newHealth); // Prevent going too far below death for toast logic
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
            <CardDescription>Enter a food item. {monsterName} will react to how it affects its health, based on AI grading!</CardDescription>
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
                {isGrading ? `Asking ${monsterName} about ${foodInput}...` : `Log Food & See ${monsterName}'s Reaction`}
              </Button>
            </CardFooter>
          </form>
        </Card>

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

