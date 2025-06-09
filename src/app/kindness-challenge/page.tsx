'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData, type StreakData } from '@/lib/firestore-service';

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
];

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Kindness Challenge...</p>
    </div>
  );
}

export default function KindnessChallengePage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  
  const [currentTask, setCurrentTask] = useState<TaskDefinition | null>(null);
  const [hasCompletedTaskToday, setHasCompletedTaskToday] = useState(false);
  const [kindnessStreak, setKindnessStreak] = useState<StreakData | null>(null);
  const [streakBonusDamage, setStreakBonusDamage] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isProcessingCompletion, startProcessingCompletionTransition] = useTransition();
  
  const { toast } = useToast();
  const router = useRouter();
  const [showDamageEffect, setShowDamageEffect] = useState(false);

  const { user, refreshUserProfile } = useAuth();

  const getCurrentDateString = () => new Date().toISOString().split('T')[0];

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
        description: `Heh. While you were resting, I regained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`,
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

        // Load streak data
        const streak = await firestoreService.getStreak(user.uid, 'kindness');
        setKindnessStreak(streak);

        // Calculate streak bonus damage
        if (streak) {
          const newBonusDamage = Math.min(3, Math.floor(streak.count / 3));
          setStreakBonusDamage(newBonusDamage);
        }

        // Check if task completed today and load current task
        const todayStr = getCurrentDateString();
        const completion = await firestoreService.getCompletion(user.uid, 'kindness', todayStr);
        
        if (completion && completion.completed) {
          setHasCompletedTaskToday(true);
          if (completion.data?.currentTask) {
            const foundTask = taskDefinitions.find(t => t.id === completion.data.currentTask.id);
            if (foundTask) setCurrentTask(foundTask);
          }
        } else {
          setHasCompletedTaskToday(false);
          
          // Generate a new task for today if none exists
          const availableTasks = taskDefinitions.filter(t => t.level <= 3);
          const newTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
          setCurrentTask(newTask);
        }

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
        title: `${monsterData.name} Dissolves!`,
        description: `Its negativity couldn't withstand ${cause}. Current health: ${currentHealth.toFixed(1)}%. A new presence begins to form...`,
        variant: "destructive", 
        duration: Number.MAX_SAFE_INTEGER,
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const handleCompleteTask = () => {
    if (!currentTask || hasCompletedTaskToday || !monsterData || !user) return;

    startProcessingCompletionTransition(async () => {
      try {
        // Add points
        await firestoreService.addPoints(user.uid, currentTask.points);
        await refreshUserProfile();

        const totalDamage = currentTask.monsterBaseHPDamage + streakBonusDamage;
        
        // Update monster health
        const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterData.health - totalDamage);
        await firestoreService.updateMonsterData(user.uid, { health: newHealth });
        setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);
        
        setShowDamageEffect(true);
        setTimeout(() => setShowDamageEffect(false), 700);

        // Update streak
        const currentStreakCount = await firestoreService.updateStreak(user.uid, 'kindness');
        const updatedStreak: StreakData = { 
          uid: user.uid, 
          type: 'kindness', 
          date: new Date().toISOString().split('T')[0], 
          count: currentStreakCount, 
          updatedAt: new Date() as any 
        };
        setKindnessStreak(updatedStreak);

        // Update streak bonus damage
        const newBonusDamage = Math.min(3, Math.floor(currentStreakCount / 3));
        setStreakBonusDamage(newBonusDamage);

        setHasCompletedTaskToday(true);
        
        // Save completion to Firestore
        const todayStr = getCurrentDateString();
        await firestoreService.setCompletion(user.uid, 'kindness', {
          currentTask: currentTask,
          completedAt: new Date().toISOString()
        });
        
        let toastMessage = `${monsterData.name} feels a pang! Kindness dealt ${totalDamage.toFixed(0)} damage (Base: ${currentTask.monsterBaseHPDamage}, Streak: ${streakBonusDamage}). Its health: ${newHealth.toFixed(1)}%. You earned ${currentTask.points} points.`;
        if (currentStreakCount > 1) {
          toastMessage += ` Kindness streak: ${currentStreakCount} days!`;
        }

        if (!(await checkMonsterDeath(newHealth, `the power of kindness (Task: ${currentTask.text.substring(0,20)}...)`))) {
          toast({
            title: "Kindness Radiated!",
            description: toastMessage,
            duration: Number.MAX_SAFE_INTEGER,
          });
        }
        
        if (currentStreakCount >= 3 && currentStreakCount % 3 === 0) {
          showSocialProofToast(`${currentStreakCount}-day kindness streak!`, currentTask.points, true);
        }
      } catch (error) {
        console.error('Error completing task:', error);
        toast({
          title: "Error",
          description: "Failed to complete kindness task.",
          variant: "destructive"
        });
      }
    });
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
            <Info className="h-6 w-6 text-primary" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Please log in to connect with kindness.</p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isMonsterActuallyGenerated) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Monster Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Your inner monster must be created to connect with kindness.</p>
          <Button asChild className="w-full">
            <Link href="/create-monster">
              <Sparkles className="mr-2 h-4 w-4"/>
              Create Your Monster
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {monsterData && (
          <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
            <CardHeader className="items-center text-center">
              <Link href="/my-profile">
                <Image 
                  src={monsterData.imageUrl} 
                  alt={monsterData.name} 
                  width={100} 
                  height={100} 
                  className="rounded-full border-2 border-primary shadow-md mx-auto cursor-pointer hover:opacity-80 transition-opacity" 
                  data-ai-hint="generated monster"
                />
              </Link>
              <CardTitle className="font-headline text-xl pt-2">{monsterData.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-kindness" className="text-sm font-medium block mb-1">
                Monster Health: {monsterData.health.toFixed(1)}%
              </Label>
              <Progress id="monster-health-kindness" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Trophy className="text-amber-500"/>
                  Your Progress
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Kindness Streak:</span>
                    <Badge variant="secondary">
                      {kindnessStreak ? kindnessStreak.count : 0} day{(!kindnessStreak || kindnessStreak.count === 1) ? '' : 's'}
                    </Badge>
                </div>
                 <div className="flex justify-between">
                    <span>Streak Bonus Damage:</span>
                    <Badge variant="outline" className={cn(streakBonusDamage > 0 && "text-green-600 border-green-500")}>
                      +{streakBonusDamage} HP
                    </Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <HandHeart className="h-6 w-6 text-primary"/>
              Kindness Connection Challenge
            </CardTitle>
            <CardDescription>
              Complete one small act of kindness or positive reflection daily. Strengthen yourself and weaken your monster!
            </CardDescription>
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