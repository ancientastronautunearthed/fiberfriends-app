
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

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';
const MINDFUL_MOMENT_STREAK_KEY = 'mindfulMomentStreak';
const MINDFUL_STREAK_BONUS_KEY = 'mindfulStreakBonusDamage';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

const BREATHING_CYCLE = { inhale: 4, hold: 4, exhale: 6 }; // seconds
const TOTAL_CYCLE_DURATION = BREATHING_CYCLE.inhale + BREATHING_CYCLE.hold + BREATHING_CYCLE.exhale;

const DURATION_OPTIONS = [
  { value: 1, label: "1 Minute", baseDamage: 3, points: 10 },
  { value: 2, label: "2 Minutes", baseDamage: 7, points: 25 },
  { value: 3, label: "3 Minutes", baseDamage: 12, points: 45 },
];

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

interface StreakData {
  date: string; // YYYY-MM-DD
  count: number;
}

export default function MindfulMomentPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  
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

  const [mindfulStreak, setMindfulStreak] = useState<StreakData>({ date: '', count: 0 });
  const [streakBonusDamage, setStreakBonusDamage] = useState(0);

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = { ...mindfulStreak };
    let currentBonus = streakBonusDamage;

    if (currentStreak.date === today) { // Already did it today, no change to streak count or bonus
      // No change to streak count if already done today
    } else {
      const lastDate = currentStreak.date ? new Date(currentStreak.date) : null;
      const currentDate = new Date(today);
      let diffDays = 99;
      if (lastDate) {
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      if (diffDays === 1) {
        currentStreak.count += 1;
      } else { // Streak broken or first time
        currentStreak.count = 1;
        currentBonus = 0; // Reset bonus if streak broken
      }
      currentStreak.date = today;

      // Update bonus damage every 3 days of streak
      if (currentStreak.count > 0 && currentStreak.count % 3 === 0) {
        currentBonus = Math.min(5, currentBonus + 1); // Max +5 bonus
      }
    }
    
    setMindfulStreak(currentStreak);
    localStorage.setItem(MINDFUL_MOMENT_STREAK_KEY, JSON.stringify(currentStreak));
    setStreakBonusDamage(currentBonus);
    localStorage.setItem(MINDFUL_STREAK_BONUS_KEY, String(currentBonus));
    return currentStreak.count;
  }, [mindfulStreak, streakBonusDamage]);


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
        description: `Heh. While you slept, I regained ${recoveryAmount} health. I'm now at ${newHealth.toFixed(1)}%. Not bad.`,
        variant: "default", duration: 7000,
      });
    }
  }, [toast]);

  useEffect(() => {
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);

    if (monsterGenerated === 'true' && storedImage && storedName) {
      setMonsterImageUrl(storedImage); setMonsterName(storedName);
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) setMonsterHealth(parseFloat(storedHealth));
      else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth); localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
      performNightlyRecovery();
    }

    const storedStreak = localStorage.getItem(MINDFUL_MOMENT_STREAK_KEY);
    if (storedStreak) setMindfulStreak(JSON.parse(storedStreak));
    const storedBonus = localStorage.getItem(MINDFUL_STREAK_BONUS_KEY);
    if (storedBonus) setStreakBonusDamage(parseInt(storedBonus, 10));

  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "the burden of tranquility"); 
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
          title: `${monsterName} Has Vanished!`,
          description: `Its form dissipates, succumbing to ${cause} at ${currentHealth.toFixed(1)}% health. The quiet is... unsettling. A new presence may emerge.`,
          variant: "destructive", duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const runBreathingCycle = () => {
    setBreathingPhase('inhale');
    phaseTimerRef.current = setTimeout(() => {
      setBreathingPhase('hold');
      phaseTimerRef.current = setTimeout(() => {
        setBreathingPhase('exhale');
        phaseTimerRef.current = setTimeout(() => {
          if (isSessionActive) runBreathingCycle(); // Loop if session still active
          else setBreathingPhase('idle');
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
  }, [isSessionActive, timeLeft]);


  useEffect(() => {
    if (isSessionActive) {
        runBreathingCycle();
    } else {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
        setBreathingPhase('idle');
    }
    return () => {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    }
  }, [isSessionActive]);


  const handleStartSession = () => {
    if (!monsterName || monsterHealth === null) {
      setError("Monster data not loaded. Please ensure your monster is created."); return;
    }
    setTimeLeft(selectedDuration * 60);
    setIsSessionActive(true);
    setError(null);
  };

  const handleSessionCompletion = () => {
    setIsSessionActive(false);
    setBreathingPhase('idle');
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    startProcessingCompletionTransition(async () => {
      if (monsterHealth === null || !monsterName) return;

      const durationOption = DURATION_OPTIONS.find(opt => opt.value === selectedDuration);
      if (!durationOption) return;

      const currentStreakCount = updateStreak();
      const totalDamage = durationOption.baseDamage + streakBonusDamage;
      
      const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterHealth - totalDamage);
      setMonsterHealth(newHealth);
      addPoints(durationOption.points);

      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);

      let toastMessage = `${monsterName} shudders! ${durationOption.label} of mindfulness dealt ${totalDamage.toFixed(1)} damage (Base: ${durationOption.baseDamage}, Streak Bonus: ${streakBonusDamage}). Its health is now ${newHealth.toFixed(1)}%. You earned ${durationOption.points} points.`;
      if (currentStreakCount > 1) {
        toastMessage += ` Mindful streak: ${currentStreakCount} days!`;
      }
      
      if (!checkMonsterDeath(newHealth, `a moment of calm (${durationOption.label})`)) {
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
    });
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY) === 'true';

  if (!monsterGenerated) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Your inner monster must be created to engage in mindful moments.</p>
          <Button asChild className="w-full"><Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create Your Monster</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
              <Badge variant="secondary" className="mt-1">Mindful Streak: {mindfulStreak.count} day{mindfulStreak.count === 1 ? '' : 's'}</Badge>
              {streakBonusDamage > 0 && <Badge variant="outline" className="mt-1 text-green-600 border-green-500">+{streakBonusDamage} Bonus HP Dmg</Badge>}
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-mindful" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-mindful" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/>Mindful Moment: Calm the Chaos</CardTitle>
            <CardDescription>Engage in a guided breathing exercise to reduce stress and weaken {monsterName || 'your monster'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isSessionActive ? (
              <>
                <div>
                  <Label htmlFor="duration-select">Select Duration</Label>
                  <Select value={String(selectedDuration)} onValueChange={(val) => setSelectedDuration(Number(val))}>
                    <SelectTrigger id="duration-select">
                      <SelectValue placeholder="Choose duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label} (Monster -{opt.baseDamage + streakBonusDamage}HP, You +{opt.points}pts)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleStartSession} className="w-full" disabled={isProcessingCompletion}>
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
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Completing mindful moments regularly strengthens your resolve and grants streak bonuses against your monster!</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
