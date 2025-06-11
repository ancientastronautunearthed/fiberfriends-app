'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Skull, HeartPulse, ShieldCheck, VenetianMask, Speaker, HelpCircle, Info } from "lucide-react"; 
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateAffirmationAction } from './actions';
import type { AffirmationOutput } from '@/ai/flows/affirmation-generation-flow';
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData } from '@/lib/firestore-service';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;
const POINTS_FOR_AFFIRMATION = 10;
const MONSTER_HP_REDUCTION_FOR_AFFIRMATION = 4;
const AMPLIFY_DURATION_MS = 1500; 

const defaultDemonicPitch = () => parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2));
const defaultDemonicRate = () => parseFloat((Math.random() * (0.8 - 0.5) + 0.5).toFixed(2));

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Affirmation Amplifier...</p>
    </div>
  );
}

export default function AffirmationAmplifierPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  
  const [affirmationData, setAffirmationData] = useState<AffirmationOutput | null>(null);
  const [isAmplifying, setIsAmplifying] = useState(false);
  const [amplificationProgress, setAmplificationProgress] = useState(0);
  const [hasAmplifiedToday, setHasAmplifiedToday] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingAffirmation, startLoadingAffirmationTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isSpeaking, setIsSpeaking] = useState(false);

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
        title: `${monsterData.name} Regenerates`,
        description: `It seems my power grew by ${recoveryAmount}HP overnight. Health: ${newHealth.toFixed(1)}%.`,
        duration: 7000
      });
    }
  }, [user, monsterData, toast]);

  const fetchAffirmation = useCallback(() => {
    setError(null);
    setAffirmationData(null);
    startLoadingAffirmationTransition(async () => {
      try {
        const result = await generateAffirmationAction();
        setAffirmationData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch affirmation.");
        toast({ 
          title: "Affirmation Error", 
          description: e instanceof Error ? e.message : "Unknown error fetching affirmation.", 
          variant: "destructive" 
        });
      }
    });
  }, [toast]);

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

          // Check if user has already amplified today
          const completion = await firestoreService.getCompletion(user.uid, 'affirmation');
          if (completion) {
            setHasAmplifiedToday(true);
          }

          // Perform nightly recovery
          await performNightlyRecovery();
          
          // Fetch affirmation if not completed today
          if (!completion) {
            fetchAffirmation();
          }
        } else {
          setIsMonsterActuallyGenerated(false);
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
  }, [user, performNightlyRecovery, fetchAffirmation, toast]);

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
        description: `Its negativity couldn't withstand ${cause}. Current health: ${currentHealth.toFixed(1)}%.`,
        variant: "destructive",
        duration: Number.MAX_SAFE_INTEGER
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const handleInternalizeAffirmation = () => {
    if (isAmplifying || !affirmationData || !monsterData || hasAmplifiedToday || !user) return;
    
    setIsAmplifying(true);
    setAmplificationProgress(0);
    
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(100, (elapsedTime / AMPLIFY_DURATION_MS) * 100);
      setAmplificationProgress(progress);
      if (progress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        completeAmplification();
      }
    }, 50);
  };

  const completeAmplification = async () => {
    setIsAmplifying(false);
    setAmplificationProgress(0);
    if (!monsterData || !user) return;

    try {
      // Add points
      await firestoreService.addPoints(user.uid, POINTS_FOR_AFFIRMATION);
      await refreshUserProfile();

      // Update monster health
      const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterData.health - MONSTER_HP_REDUCTION_FOR_AFFIRMATION);
      await firestoreService.updateMonsterData(user.uid, { health: newHealth });
      setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);

      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);

      // Mark as completed for today
      await firestoreService.setCompletion(user.uid, 'affirmation');
      setHasAmplifiedToday(true);

      if (!(await checkMonsterDeath(newHealth, "an internalized affirmation"))) {
        toast({
          title: "Affirmation Amplified!",
          description: `${monsterData.name} recoils! Your inner strength grows. Monster Health: ${newHealth.toFixed(1)}% (-${MONSTER_HP_REDUCTION_FOR_AFFIRMATION}). You earned ${POINTS_FOR_AFFIRMATION} points!`,
          duration: 7000
        });
      }

      fetchAffirmation();
    } catch (error) {
      console.error('Error completing amplification:', error);
      toast({
        title: "Error",
        description: "Failed to complete affirmation amplification.",
        variant: "destructive"
      });
    }
  };
  
  const getHealthBarValue = () => {
      if (!monsterData) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterData.health - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  const speakMonsterRetort = (text: string) => {
    if (!monsterData?.voiceConfig || isSpeaking || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (monsterData.voiceConfig.voiceURI) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === monsterData.voiceConfig?.voiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    utterance.pitch = monsterData.voiceConfig.pitch;
    utterance.rate = monsterData.voiceConfig.rate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  if (!isClientReady) {
    return <LoadingPlaceholder />;
  }

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Please log in to amplify affirmations!</p>
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
            <HelpCircle className="h-6 w-6 text-primary" />
            Monster Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Create your monster to amplify affirmations!</p>
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
              <Label htmlFor="monster-health-affirm" className="text-sm font-medium block mb-1">
                Monster Health: {monsterData.health.toFixed(1)}%
              </Label>
              <Progress id="monster-health-affirm" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Positive affirmations weaken its negativity.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <HeartPulse className="h-6 w-6 text-primary"/>
              Affirmation Amplifier
            </CardTitle>
            <CardDescription>
              Focus on a positive affirmation to strengthen your inner resolve and weaken your monster. One internalization per day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isLoadingAffirmation && (
              <div className="flex flex-col items-center justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-muted-foreground">{monsterData?.name || "The AI"} is crafting an affirmation...</p>
              </div>
            )}
            {error && !isLoadingAffirmation && (
              <Alert variant="destructive">
                <AlertTitle>Affirmation Error</AlertTitle>
                <AlertDescription>{error} Please try fetching a new one.</AlertDescription>
              </Alert>
            )}
            {affirmationData && !isLoadingAffirmation && (
              <div className="space-y-4">
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/30 shadow-lg">
                    <p className="text-2xl font-semibold text-primary-foreground text-center leading-tight">
                    "{affirmationData.affirmationText}"
                    </p>
                </Card>
                
                {affirmationData.monsterCounterAffirmation && (
                  <Card className="p-3 bg-muted/50 border-dashed border-foreground/30">
                    <div className="flex items-center justify-center gap-2">
                        <VenetianMask className="h-5 w-5 text-foreground/70 shrink-0"/>
                        <p className="italic text-sm text-foreground/70 text-center">
                           {monsterData?.name || "Monster"} grumbles: "{affirmationData.monsterCounterAffirmation}"
                        </p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => speakMonsterRetort(affirmationData.monsterCounterAffirmation!)} 
                          disabled={isSpeaking || !monsterData?.voiceConfig} 
                          aria-label="Speak monster retort" 
                          className="h-6 w-6"
                        >
                            <Speaker className="h-4 w-4"/>
                        </Button>
                    </div>
                  </Card>
                )}

                {isAmplifying && (
                  <div className="mt-4">
                    <Progress value={amplificationProgress} className="w-full h-3 transition-all duration-100 ease-linear" />
                    <p className="text-sm text-primary animate-pulse mt-1">Amplifying affirmation...</p>
                  </div>
                )}
                {hasAmplifiedToday && !isAmplifying && (
                    <Alert variant="default" className="bg-accent/20 border-accent text-accent-foreground">
                        <Info className="h-4 w-4"/>
                        <AlertTitle>Daily Limit Reached</AlertTitle>
                        <AlertDescription>
                        You've amplified your affirmation for today. Come back tomorrow for another boost!
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={handleInternalizeAffirmation} 
              disabled={isLoadingAffirmation || isAmplifying || !affirmationData || hasAmplifiedToday} 
              className="w-full sm:w-auto text-base py-3 px-6"
              size="lg"
            >
              {isAmplifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShieldCheck className="mr-2 h-5 w-5"/>}
              {isAmplifying ? "Amplifying..." : hasAmplifiedToday ? "Amplified Today" : "Internalize Affirmation"}
            </Button>
            <Button 
              onClick={fetchAffirmation} 
              variant="outline" 
              disabled={isLoadingAffirmation || isAmplifying} 
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4"/> Get New Affirmation
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}