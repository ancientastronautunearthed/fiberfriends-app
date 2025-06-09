'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, Sparkles, Skull, Brain, Wind, Zap, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSocialProofToast } from '@/lib/social-proof-toast';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData, type StreakData } from '@/lib/firestore-service';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;
const MAX_MINDFUL_MINUTES_PER_DAY = 3;

const BREATHING_CYCLE = { inhale: 4, hold: 4, exhale: 6 }; 
const TOTAL_CYCLE_DURATION = BREATHING_CYCLE.inhale + BREATHING_CYCLE.hold + BREATHING_CYCLE.exhale;

const DURATION_OPTIONS = [
  { value: 1, label: "1 Minute", baseDamage: 3, points: 10 },
  { value: 2, label: "2 Minutes", baseDamage: 7, points: 25 },
  { value: 3, label: "3 Minutes", baseDamage: 12, points: 45 },
];

interface DailyUsageData {
    date: string; // YYYY-MM-DD
    minutesCompletedToday: number;
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Mindful Moment...</p>
    </div>
  );
}

export default function MindfulMomentPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0].value);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCompletion, startProcessingCompletionTransition] = useTransition();
  
  const { toast } = useToast();
  const router = useRouter();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [mindfulStreak, setMindfulStreak] = useState<StreakData | null>(null);
  const [streakBonusDamage, setStreakBonusDamage] = useState(0);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData>({ date: '', minutesCompletedToday: 0 });

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
        description: `Heh. While you slept, I regained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`,
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
        const streak = await firestoreService.getStreak(user.uid, 'mindful');
        setMindfulStreak(streak);
        
        // Calculate streak bonus damage
        if (streak) {
          const newBonusDamage = Math.min(5, Math.floor(streak.count / 3));
          setStreakBonusDamage(newBonusDamage);
        }

        // Load daily usage data
        const todayStr = new Date().toISOString().split('T')[0];
        const completion = await firestoreService.getCompletion(user.uid, 'mindful', todayStr);
        if (completion && completion.data?.minutesCompletedToday) {
          setDailyUsage({ 
            date: todayStr, 
            minutesCompletedToday: completion.data.minutesCompletedToday 
          });
        } else {
          setDailyUsage({ date: todayStr, minutesCompletedToday: 0 });
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
        title: `${monsterData.name} Has Vanished!`,
        description: `Its form dissipates, succumbing to ${cause} at ${currentHealth.toFixed(1)}% health. The quiet is... unsettling. A new presence may emerge.`,
        variant: "destructive", 
        duration: Number.MAX_SAFE_INTEGER,
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const runBreathingCycle = () => {
    setBreathingPhase('inhale');
    phaseTimerRef.current = setTimeout(() => {
      setBreathingPhase('hold');
      phaseTimerRef.current = setTimeout(() => {
        setBreathingPhase('exhale');
        phaseTimerRef.current = setTimeout(() => {
          if (timerRef.current && timeLeft > 0) { // check if session is still intended to be active
             runBreathingCycle(); 
          } else {
             setBreathingPhase('idle');
          }
        }, BREATHING_CYCLE.exhale * 1000);
      }, BREATHING_CYCLE.hold * 1000);
    }, BREATHING_CYCLE.inhale * 1000);
  };
  
  useEffect(() => {
    if (isSessionActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isSessionActive && timeLeft === 0) {
      handleSessionCompletion();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionActive, timeLeft]);

  useEffect(() => {
    if (isSessionActive && timeLeft > 0) { // Only start if session is active and time is left
        runBreathingCycle();
    } else {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        setBreathingPhase('idle');
    }
    return () => {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionActive, timeLeft > 0]); // Added timeLeft > 0

  const handleStartSession = () => {
    if (!monsterData || !user) {
      setError("Monster data not loaded. Please ensure your monster is created."); 
      return;
    }
    if (dailyUsage.minutesCompletedToday + selectedDuration > MAX_MINDFUL_MINUTES_PER_DAY) {
        setError(`You can only complete ${MAX_MINDFUL_MINUTES_PER_DAY} minutes of mindful moments per day. You have ${MAX_MINDFUL_MINUTES_PER_DAY - dailyUsage.minutesCompletedToday} minutes remaining today.`);
        return;
    }
    setTimeLeft(selectedDuration * 60);
    setIsSessionActive(true);
    setError(null);
  };

  const handleSessionCompletion = () => {
    setIsSessionActive(false);
    setBreathingPhase('idle');
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null; // Ensure timer is cleared and reset
    }

    startProcessingCompletionTransition(async () => {
      if (!monsterData || !user) return;

      try {
        const durationOption = DURATION_OPTIONS.find(opt => opt.value === selectedDuration);
        if (!durationOption) return;

        // Update daily usage
        const newMinutesCompletedToday = dailyUsage.minutesCompletedToday + durationOption.value;
        const newDailyUsage: DailyUsageData = { 
          date: new Date().toISOString().split('T')[0], 
          minutesCompletedToday: newMinutesCompletedToday 
        };
        setDailyUsage(newDailyUsage);

        // Save completion to Firestore
        await firestoreService.setCompletion(user.uid, 'mindful', newDailyUsage);

        // Update streak
        const currentStreakCount = await firestoreService.updateStreak(user.uid, 'mindful');
        const updatedStreak: StreakData = { 
          uid: user.uid, 
          type: 'mindful', 
          date: new Date().toISOString().split('T')[0], 
          count: currentStreakCount, 
          updatedAt: new Date() as any 
        };
        setMindfulStreak(updatedStreak);

        // Update streak bonus damage
        const newBonusDamage = Math.min(5, Math.floor(currentStreakCount / 3));
        setStreakBonusDamage(newBonusDamage);

        const totalDamage = durationOption.baseDamage + streakBonusDamage;
        
        // Update monster health
        const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterData.health - totalDamage);
        await firestoreService.updateMonsterData(user.uid, { health: newHealth });
        setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);

        // Add points
        await firestoreService.addPoints(user.uid, durationOption.points);
        await refreshUserProfile();

        setShowDamageEffect(true);
        setTimeout(() => setShowDamageEffect(false), 700);

        let toastMessage = `${monsterData.name} shudders! ${durationOption.label} of mindfulness dealt ${totalDamage.toFixed(1)} damage (Base: ${durationOption.baseDamage}, Streak Bonus: ${streakBonusDamage}). Its health is now ${newHealth.toFixed(1)}%. You earned ${durationOption.points} points.`;
        if (currentStreakCount > 1) {
          toastMessage += ` Mindful streak: ${currentStreakCount} days!`;
        }
        
        if (!(await checkMonsterDeath(newHealth, `a moment of calm (${durationOption.label})`))) {
          toast({
            title: "Mindful Moment Complete!",
            description: toastMessage,
            variant: "default",
            duration: Number.MAX_SAFE_INTEGER,
          });
        }
        
        if (currentStreakCount >= 3 && currentStreakCount % 3 === 0) {
          showSocialProofToast(`${currentStreakCount}-day mindful moment streak!`, undefined, true);
        }
      } catch (error) {
        console.error('Error completing session:', error);
        toast({
          title: "Error",
          description: "Failed to save mindful moment completion.",
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
          <p className="text-center text-muted-foreground mb-4">Please log in to engage in mindful moments.</p>
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
          <p className="text-center text-muted-foreground mb-4">Your inner monster must be created to engage in mindful moments.</p>
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const minutesRemainingToday = MAX_MINDFUL_MINUTES_PER_DAY - dailyUsage.minutesCompletedToday;

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
              {mindfulStreak && (
                <Badge variant="secondary" className="mt-1">
                  Mindful Streak: {mindfulStreak.count} day{mindfulStreak.count === 1 ? '' : 's'}
                </Badge>
              )}
              {streakBonusDamage > 0 && (
                <Badge variant="outline" className="mt-1 text-green-600 border-green-500">
                  +{streakBonusDamage} Bonus HP Dmg
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-mindful" className="text-sm font-medium block mb-1">
                Monster Health: {monsterData.health.toFixed(1)}%
              </Label>
              <Progress id="monster-health-mindful" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wind className="h-6 w-6 text-primary"/>
              Mindful Moment: Calm the Chaos
            </CardTitle>
            <CardDescription>
              Engage in a guided breathing exercise. Max {MAX_MINDFUL_MINUTES_PER_DAY} minutes per day. You have {minutesRemainingToday} minutes remaining today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSessionActive ? (
              <>
                <div>
                  <Label htmlFor="duration-select">Select Duration</Label>
                  <Select 
                    value={String(selectedDuration)} 
                    onValueChange={(val) => setSelectedDuration(Number(val))}
                    disabled={minutesRemainingToday <= 0}
                  >
                    <SelectTrigger id="duration-select" disabled={minutesRemainingToday <= 0}>
                      <SelectValue placeholder="Choose duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem 
                          key={opt.value} 
                          value={String(opt.value)}
                          disabled={opt.value > minutesRemainingToday}
                        >
                          {opt.label} (Monster -{opt.baseDamage + streakBonusDamage}HP, You +{opt.points}pts)
                          {opt.value > minutesRemainingToday && <span className="text-xs text-muted-foreground ml-2">(Exceeds daily limit)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {minutesRemainingToday <= 0 && (
                    <Alert variant="default" className="bg-accent/20 border-accent">
                        <Zap className="h-4 w-4 text-accent-foreground" />
                        <AlertTitle>Daily Limit Reached</AlertTitle>
                        <AlertDescription>
                        You've completed your {MAX_MINDFUL_MINUTES_PER_DAY} minutes of mindful moments for today. Great job! Come back tomorrow.
                        </AlertDescription>
                    </Alert>
                )}
                <Button 
                    onClick={handleStartSession} 
                    className="w-full" 
                    disabled={isProcessingCompletion || minutesRemainingToday <= 0 || selectedDuration > minutesRemainingToday}
                >
                  <Brain className="mr-2 h-4 w-4" /> Start Moment
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div 
                  className={cn(
                    "w-32 h-32 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center transition-all duration-1000 ease-in-out",
                    breathingPhase === 'inhale' && "scale-125",
                    breathingPhase === 'hold' && "scale-125 opacity-90",
                    breathingPhase === 'exhale' && "scale-100 opacity-70"
                  )}
                >
                  <p className="text-2xl font-semibold text-primary-foreground">
                    {breathingPhase === 'idle' ? '' : breathingPhase.charAt(0).toUpperCase() + breathingPhase.slice(1)}
                  </p>
                </div>
                <p className="text-4xl font-bold text-foreground">{formatTime(timeLeft)}</p>
                <p className="text-muted-foreground">Follow the rhythm. Focus on your breath.</p>
                <Button onClick={handleSessionCompletion} variant="outline" disabled={isProcessingCompletion}>
                  {isProcessingCompletion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {isProcessingCompletion ? "Processing..." : "End Moment Early"}
                </Button>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Completing mindful moments regularly strengthens your resolve and grants streak bonuses against your monster!</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}