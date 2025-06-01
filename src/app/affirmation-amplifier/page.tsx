
'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Skull, HeartPulse, ShieldCheck, VenetianMask, Speaker } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateAffirmationAction } from './actions';
import type { AffirmationOutput } from '@/ai/flows/affirmation-generation-flow';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';
const MONSTER_VOICE_CONFIG_KEY = 'monsterVoiceConfig';


const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;
const POINTS_FOR_AFFIRMATION = 10;
const MONSTER_HP_REDUCTION_FOR_AFFIRMATION = 4;
const AMPLIFY_DURATION_MS = 1500; // Duration for the "amplifying" animation

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

interface MonsterVoiceConfig {
  voiceURI: string | null;
  pitch: number;
  rate: number;
}
const defaultDemonicPitch = () => parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2));
const defaultDemonicRate = () => parseFloat((Math.random() * (0.8 - 0.5) + 0.5).toFixed(2));


export default function AffirmationAmplifierPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  
  const [affirmationData, setAffirmationData] = useState<AffirmationOutput | null>(null);
  const [isAmplifying, setIsAmplifying] = useState(false);
  const [amplificationProgress, setAmplificationProgress] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingAffirmation, startLoadingAffirmationTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [userMonsterVoiceConfig, setUserMonsterVoiceConfig] = useState<MonsterVoiceConfig | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);


  useEffect(() => {
    const storedConfig = localStorage.getItem(MONSTER_VOICE_CONFIG_KEY);
    if (storedConfig) {
      try {
        setUserMonsterVoiceConfig(JSON.parse(storedConfig));
      } catch (e) { /* Use default if parse error */ 
        setUserMonsterVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
      }
    } else {
       setUserMonsterVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
    }
  }, []);


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
      toast({ title: `${storedName} Regenerates`, description: `It seems my power grew by ${recoveryAmount}HP overnight. Health: ${newHealth.toFixed(1)}%.`, duration: 7000 });
    }
  }, [toast]);

  const fetchAffirmation = useCallback(() => {
    setError(null);
    setAffirmationData(null);
    startLoadingAffirmationTransition(async () => {
      try {
        const result = await generateAffirmationAction();
        setAffirmationData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch affirmation.");
        toast({ title: "Affirmation Error", description: e instanceof Error ? e.message : "Unknown error fetching affirmation.", variant: "destructive" });
      }
    });
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
      fetchAffirmation();
    }
  }, [performNightlyRecovery, fetchAffirmation]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "the force of positivity"); 
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
        toast({ title: `${monsterName} Dissolves!`, description: `Its negativity couldn't withstand ${cause}. Current health: ${currentHealth.toFixed(1)}%.`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const handleInternalizeAffirmation = () => {
    if (isAmplifying || !affirmationData || !monsterName || monsterHealth === null) return;
    
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

  const completeAmplification = () => {
    setIsAmplifying(false);
    setAmplificationProgress(0);
    if (monsterHealth === null || !monsterName) return;

    addPoints(POINTS_FOR_AFFIRMATION);
    const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterHealth - MONSTER_HP_REDUCTION_FOR_AFFIRMATION);
    setMonsterHealth(newHealth);
    setShowDamageEffect(true);
    setTimeout(() => setShowDamageEffect(false), 700);

    if (!checkMonsterDeath(newHealth, "an internalized affirmation")) {
      toast({ title: "Affirmation Amplified!", description: `${monsterName} recoils! Your inner strength grows. Monster Health: ${newHealth.toFixed(1)}% (-${MONSTER_HP_REDUCTION_FOR_AFFIRMATION}). You earned ${POINTS_FOR_AFFIRMATION} points!`, duration: 7000 });
    }
    // Fetch a new affirmation after completion
    fetchAffirmation();
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  const speakMonsterRetort = (text: string) => {
    if (!userMonsterVoiceConfig || isSpeaking) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (userMonsterVoiceConfig.voiceURI) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === userMonsterVoiceConfig.voiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
    }
    utterance.pitch = userMonsterVoiceConfig.pitch;
    utterance.rate = userMonsterVoiceConfig.rate;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  if (localStorage.getItem(MONSTER_GENERATED_KEY) !== 'true') {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><HelpCircle />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Create your monster to amplify affirmations!</p>
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
              <Label htmlFor="monster-health-affirm" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-affirm" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Positive affirmations weaken its negativity.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><HeartPulse className="h-6 w-6 text-primary"/>Affirmation Amplifier</CardTitle>
            <CardDescription>Focus on a positive affirmation to strengthen your inner resolve and weaken your monster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isLoadingAffirmation && (
              <div className="flex flex-col items-center justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-muted-foreground">{monsterName || "The AI"} is crafting an affirmation...</p>
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
                           {monsterName || "Monster"} grumbles: "{affirmationData.monsterCounterAffirmation}"
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => speakMonsterRetort(affirmationData.monsterCounterAffirmation!)} disabled={isSpeaking || !userMonsterVoiceConfig} aria-label="Speak monster retort" className="h-6 w-6">
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
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={handleInternalizeAffirmation} 
              disabled={isLoadingAffirmation || isAmplifying || !affirmationData} 
              className="w-full sm:w-auto text-base py-3 px-6"
              size="lg"
            >
              {isAmplifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShieldCheck className="mr-2 h-5 w-5"/>}
              {isAmplifying ? "Amplifying..." : "Internalize Affirmation"}
            </Button>
            <Button onClick={fetchAffirmation} variant="outline" disabled={isLoadingAffirmation || isAmplifying} className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4"/> Get New Affirmation
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
