
'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, Sparkles, Skull, HandHeart, CheckCircle, Zap, Trophy } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { showSocialProofToast } from '@/lib/social-proof-toast';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';

const KINDNESS_CHALLENGE_CURRENT_TASK_KEY = 'kindnessChallengeCurrentTask';
const KINDNESS_CHALLENGE_STREAK_KEY = 'kindnessChallengeStreak';
const KINDNESS_CHALLENGE_BONUS_DAMAGE_KEY = 'kindnessChallengeBonusDamage';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

interface TaskDefinition {
  id: string;
  text: string;
  level: number;
  points: number;
  monsterBaseHPDamage: number;
}

const taskDefinitions: TaskDefinition[] = [
  { id: 'grateful1', text: "Log one small thing you're grateful for today (even if it's tiny!).", level: 1, points: 15, monsterBaseHPDamage: 2 },
  { id: 'encourage_self1', text: "Think of an encouraging thought for yourself. What would you tell a friend in your shoes?", level: 1, points: 15, monsterBaseHPDamage: 2 },
  { id: 'kind_act_small1', text: "Perform a very small act of kindness (e.g., smile at a stranger, let someone go ahead of you).", level: 1, points: 15, monsterBaseHPDamage: 2 },
  { id: 'positive_memory1', text: "Briefly recall a positive memory, even a simple one. How did it make you feel?", level: 2, points: 15, monsterBaseHPDamage: 2 },
  { id: 'community_support1', text: "Read a post in the Belief Circle and send positive thoughts to the author.", level: 2, points: 15, monsterBaseHPDamage: 2 },
  // Add more tasks for levels 1-3 as desired
];


interface StoredTask {
    date: string; // YYYY-MM-DD
    taskId: string;
    isCompleted: boolean;
}

interface StreakData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Kindness Challenge...</p>
    </div>
  );
}

export default function KindnessChallengePage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [monsterGeneratedState, setMonsterGeneratedState] = useState<boolean | null>(null);
  
  const [currentTask, setCurrentTask] = useState<TaskDefinition | null>(null);
  const [hasCompletedTaskToday, setHasCompletedTaskToday] = useState(false);
  const [kindnessStreak, setKindnessStreak] = useState<StreakData>({ date: '', count: 0 });
  const [streakBonusDamage, setStreakBonusDamage] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isProcessingCompletion, startProcessingCompletionTransition] = useTransition();
  
  const { toast } = useToast();
  const router = useRouter();
  const [showDamageEffect, setShowDamageEffect] = useState(false);

  const getCurrentDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    setMonsterGeneratedState(localStorage.getItem(MONSTER_GENERATED_KEY) === 'true');
  }, []);

  const performNightlyRecovery = useCallback(() => {
    const isMonsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY) === 'true';
    if (!isMonsterGenerated) return;

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
        description: `Heh. While you were resting, I regained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`,
        variant: "default", duration: 7000,
      });
    }
  }, [toast]);
  
  const updateKindnessStreak = useCallback(() => {
    const today = getCurrentDateString();
    const storedStreak = localStorage.getItem(KINDNESS_CHALLENGE_STREAK_KEY);
    let currentStreakData: StreakData = { date: today, count: 0 };

    if (storedStreak) {
        currentStreakData = JSON.parse(storedStreak);
        if (currentStreakData.date !== today) { // Check if it's a new day
            const lastDate = new Date(currentStreakData.date);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreakData.count += 1;
            } else {
                currentStreakData.count = 1; // Streak broken
            }
            currentStreakData.date = today;
        }
        // If currentStreakData.date is already today, count doesn't change here, it's just maintained.
    } else {
        currentStreakData.count = 1; // First time
    }
    
    localStorage.setItem(KINDNESS_CHALLENGE_STREAK_KEY, JSON.stringify(currentStreakData));
    setKindnessStreak(currentStreakData);

    // Calculate and store bonus damage
    // Example: +1 bonus damage for every 3 streak days, max +3
    const newBonusDamage = Math.min(3, Math.floor(currentStreakData.count / 3));
    localStorage.setItem(KINDNESS_CHALLENGE_BONUS_DAMAGE_KEY, String(newBonusDamage));
    setStreakBonusDamage(newBonusDamage);

    return currentStreakData.count;
  }, []);


  useEffect(() => {
    const isMonsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY) === 'true';
    if (isMonsterGenerated) {
      setMonsterImageUrl(localStorage.getItem(MONSTER_IMAGE_KEY));
      setMonsterName(localStorage.getItem(MONSTER_NAME_KEY));
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) setMonsterHealth(parseFloat(storedHealth));
      else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth); localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
      performNightlyRecovery();
    }

    // Load streak and bonus damage
    const storedStreak = localStorage.getItem(KINDNESS_CHALLENGE_STREAK_KEY);
    if (storedStreak) setKindnessStreak(JSON.parse(storedStreak));
    const storedBonus = localStorage.getItem(KINDNESS_CHALLENGE_BONUS_DAMAGE_KEY);
    if (storedBonus) setStreakBonusDamage(parseInt(storedBonus, 10));

    // Daily task logic
    const todayStr = getCurrentDateString();
    const storedTaskData = localStorage.getItem(KINDNESS_CHALLENGE_CURRENT_TASK_KEY);
    let taskForToday: StoredTask | null = null;
    let resolvedCurrentTask: TaskDefinition | null = null;

    if (storedTaskData) {
        taskForToday = JSON.parse(storedTaskData);
        if (taskForToday && taskForToday.date === todayStr) {
            const foundTask = taskDefinitions.find(t => t.id === taskForToday!.taskId);
            if (foundTask) resolvedCurrentTask = foundTask;
            setHasCompletedTaskToday(taskForToday.isCompleted);
        } else {
            taskForToday = null; // Stored task is for a previous day
        }
    }

    if (!taskForToday || !resolvedCurrentTask) { // If no task for today or currentTask not set
        // Select a new task (initially from level 1)
        const availableTasks = taskDefinitions.filter(t => t.level <= 3); // For now, up to level 3
        const newTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        resolvedCurrentTask = newTask;
        setHasCompletedTaskToday(false);
        localStorage.setItem(KINDNESS_CHALLENGE_CURRENT_TASK_KEY, JSON.stringify({ date: todayStr, taskId: newTask.id, isCompleted: false }));
    }
    setCurrentTask(resolvedCurrentTask); // Set the state for currentTask
    updateKindnessStreak(); // Update streak status on load
  }, [performNightlyRecovery, updateKindnessStreak]);


  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "an overwhelming act of kindness"); 
    }
  }, [monsterHealth, monsterName]);


  const checkMonsterDeath = (currentHealth: number, cause: string) => {
     if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
        const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
        tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
        localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));
        localStorage.removeItem(MONSTER_IMAGE_KEY); localStorage.removeItem(MONSTER_NAME_KEY);
        localStorage.removeItem(MONSTER_HEALTH_KEY); localStorage.removeItem(MONSTER_GENERATED_KEY);
        setMonsterImageUrl(null); setMonsterName(null); setMonsterHealth(null);
        toast({
          title: `${monsterName} Dissolves!`,
          description: `Its negativity couldn't withstand ${cause}. Current health: ${currentHealth.toFixed(1)}%. A new presence begins to form...`,
          variant: "destructive", duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const handleCompleteTask = () => {
    if (!currentTask || hasCompletedTaskToday || monsterHealth === null || !monsterName) return;

    startProcessingCompletionTransition(async () => {
      addPoints(currentTask.points);
      const totalDamage = currentTask.monsterBaseHPDamage + streakBonusDamage;
      const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterHealth - totalDamage);
      setMonsterHealth(newHealth);
      
      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);

      const currentStreak = updateKindnessStreak(); // This updates streak and bonus damage

      setHasCompletedTaskToday(true);
      const todayStr = getCurrentDateString();
      localStorage.setItem(KINDNESS_CHALLENGE_CURRENT_TASK_KEY, JSON.stringify({ date: todayStr, taskId: currentTask.id, isCompleted: true }));
      
      let toastMessage = `${monsterName} feels a pang! Kindness dealt ${totalDamage.toFixed(0)} damage (Base: ${currentTask.monsterBaseHPDamage}, Streak: ${streakBonusDamage}). Its health: ${newHealth.toFixed(1)}%. You earned ${currentTask.points} points.`;
      if (currentStreak > 1) {
        toastMessage += ` Kindness streak: ${currentStreak} days!`;
      }

      if (!checkMonsterDeath(newHealth, `the power of kindness (Task: ${currentTask.text.substring(0,20)}...)`)) {
        toast({
          title: "Kindness Radiated!",
          description: toastMessage,
          duration: Number.MAX_SAFE_INTEGER,
        });
      }
      
      if (currentStreak >= 3 && currentStreak % 3 === 0) {
          showSocialProofToast(`${currentStreak}-day kindness streak!`, currentTask.points, true);
      }
    });
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  if (monsterGeneratedState === null) {
    return <LoadingPlaceholder />;
  }

  if (!monsterGeneratedState) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Your inner monster must be created to connect with kindness.</p>
          <Button asChild className="w-full"><Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create Your Monster</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {monsterName && monsterImageUrl && monsterHealth !== null && (
          <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
            <CardHeader className="items-center text-center">
              <Link href="/my-profile">
                <Image src={monsterImageUrl} alt={monsterName} width={100} height={100} className="rounded-full border-2 border-primary shadow-md mx-auto cursor-pointer hover:opacity-80 transition-opacity" data-ai-hint="generated monster"/>
              </Link>
              <CardTitle className="font-headline text-xl pt-2">{monsterName}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-kindness" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-kindness" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2"><Trophy className="text-amber-500"/>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Kindness Streak:</span>
                    <Badge variant="secondary">{kindnessStreak.count} day{kindnessStreak.count === 1 ? '' : 's'}</Badge>
                </div>
                 <div className="flex justify-between">
                    <span>Streak Bonus Damage:</span>
                    <Badge variant="outline" className={cn(streakBonusDamage > 0 && "text-green-600 border-green-500")}>+{streakBonusDamage} HP</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><HandHeart className="h-6 w-6 text-primary"/>Kindness Connection Challenge</CardTitle>
            <CardDescription>Complete one small act of kindness or positive reflection daily. Strengthen yourself and weaken your monster!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isProcessingCompletion && (
              <div className="flex flex-col items-center justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-muted-foreground">Processing your act of kindness...</p>
              </div>
            )}
            {!isProcessingCompletion && currentTask && (
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/30 shadow-lg">
                    <p className="text-xl font-medium text-primary-foreground text-center leading-relaxed">
                      Today's Kindness Task (Level {currentTask.level}): <span className="font-semibold block mt-1">"{currentTask.text}"</span>
                    </p>
                </Card>
                 <p className="text-sm text-muted-foreground">
                    Impact: Weakens monster by {currentTask.monsterBaseHPDamage + streakBonusDamage} HP, Earns {currentTask.points} Points.
                </p>

                {hasCompletedTaskToday && (
                    <Alert variant="default" className="bg-accent/20 border-accent text-accent-foreground">
                        <Zap className="h-4 w-4"/>
                        <AlertTitle>Daily Task Complete!</AlertTitle>
                        <AlertDescription>
                        You've spread kindness today. Come back tomorrow for a new challenge!
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            )}
             {!isProcessingCompletion && !currentTask && (
                <p className="text-muted-foreground p-6">Loading today's kindness challenge...</p>
             )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={handleCompleteTask} 
              disabled={isProcessingCompletion || hasCompletedTaskToday || !currentTask} 
              className="w-full sm:w-auto text-base py-3 px-6"
              size="lg"
            >
              {isProcessingCompletion ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5"/>}
              {isProcessingCompletion ? "Processing..." : hasCompletedTaskToday ? "Kindness Shared Today!" : "I've Completed This Task"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

