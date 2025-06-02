
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

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const EXERCISE_LOG_KEY = 'morgellonExerciseLogEntries';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

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

interface ExerciseLogEntry extends ExerciseGradingOutput {
  id: string;
  loggedAt: string;
  durationMinutes: number;
  healthBefore: number;
  healthAfter: number;
}

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

export default function ExerciseLogPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [exerciseLogEntries, setExerciseLogEntries] = useState<ExerciseLogEntry[]>([]);
  
  const [exerciseInput, setExerciseInput] = useState('');
  const [selectedPredefinedExercise, setSelectedPredefinedExercise] = useState<string>('');
  const [durationInput, setDurationInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGrading, startGradingTransition] = useTransition();
  const { toast } = useToast();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const router = useRouter();

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
        title: `${storedName} Stirs...`,
        description: `Heh. While you slept, I regained ${recoveryAmount} health. I'm now at ${newHealth.toFixed(1)}%.`,
        variant: "default",
        duration: 7000,
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

    const storedExerciseLog = localStorage.getItem(EXERCISE_LOG_KEY);
    if (storedExerciseLog) {
      setExerciseLogEntries(JSON.parse(storedExerciseLog));
    }
  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "the strain of existence"); // Default cause
    }
  }, [monsterHealth, monsterName]);

  useEffect(() => {
    if (exerciseLogEntries.length > 0 || localStorage.getItem(EXERCISE_LOG_KEY)) {
      localStorage.setItem(EXERCISE_LOG_KEY, JSON.stringify(exerciseLogEntries));
    }
  }, [exerciseLogEntries]);

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
          description: `Its reign of internal terror ends, falling to ${currentHealth.toFixed(1)}% health due to ${cause}. A new shadow will soon take its place... Create it now!`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); 
        return true; 
      }
      return false; 
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
    if (!exerciseInput.trim() || !durationInput.trim()) {
      setError("Please enter an exercise description and duration.");
      return;
    }
    const duration = parseInt(durationInput, 10);
    if (isNaN(duration) || duration <= 0) {
      setError("Please enter a valid positive number for duration.");
      return;
    }
    if (monsterHealth === null || !monsterName || !monsterImageUrl) {
        setError("Monster not found or health not initialized. Please create a monster first.");
        return;
    }
    setError(null);

    startGradingTransition(async () => {
      try {
        const result = await gradeExerciseAction({ exerciseDescription: exerciseInput, durationMinutes: duration });
        
        const healthBefore = monsterHealth;
        let newHealth = healthBefore - result.benefitScore; 
        newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth); 
        
        setMonsterHealth(newHealth);
        setExerciseInput('');
        setSelectedPredefinedExercise('');
        setDurationInput('');

        setShowDamageEffect(true);
        setTimeout(() => setShowDamageEffect(false), 700);

        const newLogEntry: ExerciseLogEntry = {
          ...result,
          durationMinutes: duration,
          id: Date.now().toString(),
          loggedAt: new Date().toISOString(),
          healthBefore,
          healthAfter: newHealth,
        };
        setExerciseLogEntries(prev => [newLogEntry, ...prev].slice(0, 20)); 

        if (!checkMonsterDeath(newHealth, `the exertion of ${result.exerciseName}`)) {
          toast({
            title: `${monsterName} Groans!`,
            description: `Exercising with ${result.exerciseName} for ${duration} minutes? My health is now ${newHealth.toFixed(1)}% (-${result.benefitScore.toFixed(1)}%). ${monsterName} says: '${result.reasoning.substring(0,70)}...' Must you?`,
            variant: "default", 
            duration: Number.MAX_SAFE_INTEGER, 
          });
        }

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to grade exercise.";
        setError(errorMessage);
        toast({
          title: "Error Grading Exercise",
          description: `${monsterName} scoffs: 'Your attempt to log exercise was pathetic and failed. Error: ${errorMessage}'`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  };
  
  const getMonsterStatusMessage = () => {
    if (monsterHealth === null || !monsterName) return "Awaiting its creation...";
    if (monsterHealth <= MONSTER_DEATH_THRESHOLD) return `${monsterName} has perished! Its reign is over.`;
    if (monsterHealth < 0) return `${monsterName} is critically weak at ${monsterHealth.toFixed(1)}%! It's on the verge of oblivion!`;
    if (monsterHealth < 20) return `${monsterName} is very weak! It can barely sustain its shadowy form.`;
    if (monsterHealth < INITIAL_HEALTH_MIN) return `${monsterName} is feeling weak! Your efforts are noticeable.`;
    if (monsterHealth > (MAX_MONSTER_HEALTH - (MAX_MONSTER_HEALTH - INITIAL_HEALTH_MAX)/2) ) return `${monsterName} is overwhelmingly powerful! Its presence is suffocating.`;
    if (monsterHealth > INITIAL_HEALTH_MAX + 20) return `${monsterName} is significantly strengthened! It crackles with dark energy.`;
    if (monsterHealth > INITIAL_HEALTH_MAX) return `${monsterName} is gaining strength. It seems pleased.`;
    return `${monsterName}'s health is stable... for now.`;
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
             <p className="text-xs text-muted-foreground text-center mt-1">Positive activities help weaken your monster.</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Dumbbell className="h-6 w-6 text-primary"/>Log Exercise</CardTitle>
            <CardDescription>Select or enter your exercise. The AI will gauge its impact on {monsterName}'s health, and {monsterName} will react!</CardDescription>
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
                {isGrading ? `Analyzing with ${monsterName}'s disdain...` : `Log Exercise & See ${monsterName}'s Reaction`}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Exercise Log</CardTitle>
            <CardDescription>Your last 20 exercise entries and their impact on {monsterName}.</CardDescription>
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
                <p className="text-sm text-foreground/80 mt-1 pl-1 border-l-2 border-accent/50 ml-1.5 "> <span className="italic text-muted-foreground">{monsterName} said:</span> "{entry.reasoning}"</p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
