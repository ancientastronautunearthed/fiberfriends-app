'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Dumbbell, Activity, Info, Sparkles, Skull, HeartPulse } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gradeExerciseAction } from './actions';
import type { ExerciseGradingOutput } from '@/ai/flows/exercise-grading-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData, type ExerciseEntry } from '@/lib/firestore-service';

const predefinedExercises = [
  "Walking (Brisk)", "Running/Jogging", "Cycling (Outdoor)", "Cycling (Stationary)",
  "Swimming", "Yoga (Gentle)", "Yoga (Vigorous)", "Pilates",
  "Strength Training (Weights)", "Strength Training (Bodyweight)",
  "HIIT (High-Intensity Interval Training)", "Dancing", "Hiking",
  "Stretching/Flexibility", "Tai Chi", "Water Aerobics", "Rowing",
  "Elliptical Trainer", "Stair Climbing", "Gardening/Yard Work",
  "House Cleaning (Active)", "Sports (e.g., Tennis, Basketball)",
  "Martial Arts", "Jump Rope", "Core Exercises (e.g., Planks, Crunches)"
];
const CUSTOM_EXERCISE_VALUE = "custom";

const EXERCISE_GRADE_CACHE_PREFIX = 'exercise_grade_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAIResponse<T> {
  timestamp: number;
  data: T;
}

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

interface ExerciseLogEntryClient extends ExerciseGradingOutput {
  id: string;
  loggedAt: string;
  durationMinutes: number;
  healthBefore: number;
  healthAfter: number;
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Exercise Log...</p>
    </div>
  );
}

export default function ExerciseLogPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  const [exerciseLogEntries, setExerciseLogEntries] = useState<ExerciseLogEntryClient[]>([]);
  
  const [exerciseInput, setExerciseInput] = useState('');
  const [selectedPredefinedExercise, setSelectedPredefinedExercise] = useState<string>('');
  const [durationInput, setDurationInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGrading, startGradingTransition] = useTransition();
  const { toast } = useToast();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const router = useRouter();

  const { user, refreshUserProfile } = useAuth();

  const performNightlyRecovery = useCallback(async () => {
    if (!user || !monsterData) return;

    const lastRecoveryDate = monsterData.lastRecoveryDate;
    const todayDateStr = new Date().toDateString();

    if (lastRecoveryDate !== todayDateStr && monsterData.health > MONSTER_DEATH_THRESHOLD) {
      const recoveryAmount = Math.floor(Math.random() * (MAX_RECOVERY - MIN_RECOVERY + 1)) + MIN_RECOVERY;
      const newHealth = Math.min(monsterData.health + recoveryAmount, MAX_MONSTER_HEALTH);

      await firestoreService.updateMonsterData(user.uid, {
        health: newHealth,
        lastRecoveryDate: todayDateStr
      });

      setMonsterData(prev => prev ? { ...prev, health: newHealth, lastRecoveryDate: todayDateStr } : null);

      toast({
        title: `${monsterData.name} Stirs...`,
        description: `Heh. While you slept, I regained ${recoveryAmount} health. I'm now at ${newHealth.toFixed(1)}%.`,
        variant: "default",
        duration: 7000,
      });
    }
  }, [user, monsterData, toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsClientReady(true);
      
      if (!user) {
        setIsMonsterActuallyGenerated(false);
        return;
      }

      try {
        // Load monster data
        const monster = await firestoreService.getMonsterData(user.uid);
        if (monster && monster.generated) {
          setMonsterData(monster);
          setIsMonsterActuallyGenerated(true);

          // If no health is set, initialize it
          if (monster.health === undefined || monster.health === null) {
            const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
            await firestoreService.updateMonsterData(user.uid, { health: initialHealth });
            setMonsterData(prev => prev ? { ...prev, health: initialHealth } : null);
          }
        } else {
          setIsMonsterActuallyGenerated(false);
        }

        // Load exercise entries
        const exerciseEntries = await firestoreService.getUserExercises(user.uid);
        const entriesConverted = exerciseEntries.map(entry => ({
          id: entry.id,
          exerciseName: entry.exerciseName,
          durationMinutes: entry.durationMinutes,
          benefitScore: entry.benefitScore,
          reasoning: entry.reasoning,
          healthBefore: entry.healthBefore,
          healthAfter: entry.healthAfter,
          loggedAt: entry.createdAt.toDate().toISOString()
        }));
        setExerciseLogEntries(entriesConverted);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load your data. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, [user, toast]);

  useEffect(() => {
    if (isMonsterActuallyGenerated && monsterData) {
      performNightlyRecovery();
    }
  }, [isMonsterActuallyGenerated, monsterData, performNightlyRecovery]);

  const checkMonsterDeath = useCallback(async (currentHealth: number, cause: string) => {
    if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterData && user) {
      // Add to tomb
      await firestoreService.addToTomb(user.uid, {
        name: monsterData.name,
        imageUrl: monsterData.imageUrl,
        cause
      });

      // Delete current monster
      await firestoreService.deleteMonster(user.uid);

      setMonsterData(null);
      setIsMonsterActuallyGenerated(false);

      toast({
        title: `${monsterData.name} Has Perished!`,
        description: `Its reign of internal terror ends, falling to ${currentHealth.toFixed(1)}% health due to ${cause}. A new shadow will soon take its place... Create it now!`,
        variant: "destructive",
        duration: Number.MAX_SAFE_INTEGER,
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const processExerciseGradingResult = async (result: ExerciseGradingOutput, duration: number, isCached: boolean) => {
    if (!monsterData || !user) return;

    const healthBefore = monsterData.health;
    let newHealth = healthBefore - result.benefitScore;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    // Update monster health
    await firestoreService.updateMonsterData(user.uid, { health: newHealth });
    setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);

    setShowDamageEffect(true);
    setTimeout(() => setShowDamageEffect(false), 700);

    // Add exercise entry to Firestore
    await firestoreService.addExercise(user.uid, {
      exerciseName: result.exerciseName,
      durationMinutes: duration,
      benefitScore: result.benefitScore,
      reasoning: result.reasoning,
      healthBefore,
      healthAfter: newHealth
    });

    // Add to local state for immediate display
    const newLogEntry: ExerciseLogEntryClient = {
      id: Date.now().toString(), // Temporary ID for display
      exerciseName: result.exerciseName,
      durationMinutes: duration,
      benefitScore: result.benefitScore,
      reasoning: result.reasoning,
      healthBefore,
      healthAfter: newHealth,
      loggedAt: new Date().toISOString(),
    };
    setExerciseLogEntries(prev => [newLogEntry, ...prev].slice(0, 20));

    if (!(await checkMonsterDeath(newHealth, `the exertion of ${result.exerciseName}`))) {
      toast({
        title: (isCached ? "[Cache] " : "") + `${monsterData.name} Groans!`,
        description: `Exercising with ${result.exerciseName} for ${duration} minutes? My health is now ${newHealth.toFixed(1)}% (-${result.benefitScore.toFixed(1)}%). ${monsterData.name} says: '${result.reasoning.substring(0, 70)}...' Must you?`,
        variant: "default",
        duration: Number.MAX_SAFE_INTEGER,
      });
    }
  };

  const handlePredefinedExerciseChange = (value: string) => {
    setSelectedPredefinedExercise(value);
    if (value === CUSTOM_EXERCISE_VALUE) {
      setExerciseInput('');
    } else {
      setExerciseInput(value);
    }
  };

  const handleExerciseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentExerciseInput = exerciseInput.trim();
    const currentDurationInput = durationInput.trim();

    if (!currentExerciseInput || !currentDurationInput) {
      setError("Please enter an exercise description and duration.");
      return;
    }
    const duration = parseInt(currentDurationInput, 10);
    if (isNaN(duration) || duration <= 0) {
      setError("Please enter a valid positive number for duration.");
      return;
    }
    if (!monsterData || !user) {
        setError("Monster not found or health not initialized. Please create a monster first.");
        return;
    }
    setError(null);

    const cacheKey = `${EXERCISE_GRADE_CACHE_PREFIX}${currentExerciseInput.toLowerCase()}_${duration}`;
    if (typeof window !== 'undefined') {
      const cachedItemRaw = localStorage.getItem(cacheKey);
      if (cachedItemRaw) {
        try {
          const cachedItem: CachedAIResponse<ExerciseGradingOutput> = JSON.parse(cachedItemRaw);
          if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
            await processExerciseGradingResult(cachedItem.data, duration, true);
            setExerciseInput(''); 
            setSelectedPredefinedExercise(''); 
            setDurationInput('');
            return;
          } else {
            localStorage.removeItem(cacheKey); // Stale cache
          }
        } catch(e) {
            console.error("Error parsing exercise cache:", e);
            localStorage.removeItem(cacheKey);
        }
      }
    }

    startGradingTransition(async () => {
      try {
        const result = await gradeExerciseAction({ exerciseDescription: currentExerciseInput, durationMinutes: duration });
        if (typeof window !== 'undefined') {
          const newCachedItem: CachedAIResponse<ExerciseGradingOutput> = { timestamp: Date.now(), data: result };
          localStorage.setItem(cacheKey, JSON.stringify(newCachedItem));
        }
        await processExerciseGradingResult(result, duration, false);
        setExerciseInput(''); 
        setSelectedPredefinedExercise(''); 
        setDurationInput('');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade exercise.";
        setError(errorMessage);
        toast({
          title: "Error Grading Exercise",
          description: `${monsterData?.name || 'The monster'} scoffs: 'Your attempt to log exercise was pathetic and failed. Error: ${errorMessage}'`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  };
  
  const getMonsterStatusMessage = () => {
    if (!monsterData) return "Awaiting its creation...";
    if (monsterData.health <= MONSTER_DEATH_THRESHOLD) return `${monsterData.name} has perished! Its reign is over.`;
    if (monsterData.health < 0) return `${monsterData.name} is critically weak at ${monsterData.health.toFixed(1)}%! It's on the verge of oblivion!`;
    if (monsterData.health < 20) return `${monsterData.name} is very weak! It can barely sustain its shadowy form.`;
    if (monsterData.health < INITIAL_HEALTH_MIN) return `${monsterData.name} is feeling weak! Your efforts are noticeable.`;
    if (monsterData.health > (MAX_MONSTER_HEALTH - (MAX_MONSTER_HEALTH - INITIAL_HEALTH_MAX)/2) ) return `${monsterData.name} is overwhelmingly powerful! Its presence is suffocating.`;
    if (monsterData.health > INITIAL_HEALTH_MAX + 20) return `${monsterData.name} is significantly strengthened! It crackles with dark energy.`;
    if (monsterData.health > INITIAL_HEALTH_MAX) return `${monsterData.name} is gaining strength. It seems pleased.`;
    return `${monsterData.name}'s health is stable... for now.`;
  };
  
  const getHealthBarValue = () => {
      if (!monsterData) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterData.health - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  if (!isClientReady) {
    return <LoadingPlaceholder />;
  }

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Info className="h-6 w-6 text-primary"/>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Please log in to track your exercises.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isMonsterActuallyGenerated || !monsterData) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Info className="h-6 w-6 text-primary"/>
            Monster Not Found or Perished
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            You need to create your Morgellon Monster, or your previous one has fallen.
          </p>
          <Button asChild className="w-full mb-2">
            <Link href="/create-monster">
              <Sparkles className="mr-2 h-4 w-4"/>
              Create a New Monster
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/monster-tomb">
              <Skull className="mr-2 h-4 w-4"/>
              View Tomb of Monsters
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
          <CardHeader className="items-center text-center">
            <Image 
              src={monsterData.imageUrl} 
              alt={monsterData.name} 
              width={128} 
              height={128} 
              className="rounded-full border-2 border-primary shadow-md mx-auto" 
              data-ai-hint="generated monster" 
            />
            <CardTitle className="font-headline text-2xl pt-2">{monsterData.name}</CardTitle>
            <CardDescription>{getMonsterStatusMessage()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="monster-health-progress" className="text-sm font-medium text-center block mb-1">
              Monster Health: {monsterData.health.toFixed(1)}% (Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%)
            </Label>
            <Progress 
              id="monster-health-progress" 
              value={getHealthBarValue()} 
              className="w-full h-3" 
              aria-label={`Monster health: ${monsterData.health.toFixed(1)}%`} 
            />
             <p className="text-xs text-muted-foreground text-center mt-1">Positive activities help weaken your monster.</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary"/>
              Log Exercise
            </CardTitle>
            <CardDescription>
              Select or enter your exercise. The AI will gauge its impact on {monsterData.name}'s health (cached for 24hrs for same exercise/duration), and {monsterData.name} will react!
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleExerciseSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exercise-select">Select Exercise or Choose "Other"</Label>
                <Select value={selectedPredefinedExercise} onValueChange={handlePredefinedExerciseChange}>
                  <SelectTrigger id="exercise-select">
                    <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedExercises.map(ex => (
                      <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_EXERCISE_VALUE}>Other (Specify below)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(selectedPredefinedExercise === CUSTOM_EXERCISE_VALUE || !selectedPredefinedExercise) && (
                <div>
                  <Label htmlFor="exercise-description">Custom Exercise Description</Label>
                  <Input
                    id="exercise-description"
                    value={exerciseInput}
                    onChange={(e) => setExerciseInput(e.target.value)}
                    placeholder="e.g., Intense gardening"
                    disabled={isGrading || (!!selectedPredefinedExercise && selectedPredefinedExercise !== CUSTOM_EXERCISE_VALUE)}
                  />
                </div>
              )}
               {selectedPredefinedExercise && selectedPredefinedExercise !== CUSTOM_EXERCISE_VALUE && (
                 <div>
                    <Label htmlFor="exercise-display">Selected Exercise</Label>
                    <Input
                        id="exercise-display"
                        value={exerciseInput}
                        readOnly
                        className="bg-muted/50"
                    />
                 </div>
               )}
              <div>
                <Label htmlFor="duration-minutes">Duration (minutes)</Label>
                <Input
                  id="duration-minutes"
                  type="number"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="e.g., 30"
                  disabled={isGrading}
                  min="1"
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
              <Button type="submit" disabled={isGrading || !exerciseInput.trim() || !durationInput.trim()} className="w-full sm:w-auto">
                {isGrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                {isGrading ? `Analyzing with ${monsterData.name}'s disdain...` : `Log Exercise & See ${monsterData.name}'s Reaction`}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Exercise Log</CardTitle>
            <CardDescription>Your last 20 exercise entries and their impact on {monsterData.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {exerciseLogEntries.length === 0 && <p className="text-sm text-muted-foreground">No exercises logged yet.</p>}
            {exerciseLogEntries.map(entry => (
              <Card key={entry.id} className="p-3 bg-card/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                      <HeartPulse className="h-4 w-4 text-green-500" />
                      {entry.exerciseName} ({entry.durationMinutes} min)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Logged: {new Date(entry.loggedAt).toLocaleTimeString()} - Impact: <span className="text-green-500">-{entry.benefitScore.toFixed(1)}%</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 text-right flex-shrink-0">Health After: {entry.healthAfter.toFixed(1)}%</p>
                </div>
                <p className="text-sm text-foreground/80 mt-1 pl-1 border-l-2 border-accent/50 ml-1.5 "> 
                  <span className="italic text-muted-foreground">{monsterData.name} said:</span> "{entry.reasoning}"
                </p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}