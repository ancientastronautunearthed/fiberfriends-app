'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Pill, ThumbsUp, ThumbsDown, CircleOff, Info, Sparkles, Skull, ListChecks, MessageSquare, HeartPulse, PlusCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from '@/components/ui/textarea';
import { gradePrescriptionAction } from './actions';
import type { PrescriptionGradingOutput } from '@/ai/flows/prescription-grading-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showSocialProofToast } from '@/lib/social-proof-toast';
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData, type PrescriptionEntry, type StreakData } from '@/lib/firestore-service';
import { Timestamp } from 'firebase/firestore';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;
const POINTS_PER_PRESCRIPTION_LOG = 15;
const PRESCRIPTION_LOG_MILESTONE_INTERVAL = 3;

const PRESCRIPTION_GRADE_CACHE_PREFIX = 'prescription_grade_cache_';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedAIResponse<T> {
  timestamp: number;
  data: T;
}

interface PrescriptionLogEntryClient extends PrescriptionGradingOutput {
  id: string;
  userComments: string;
  loggedAt: string;
  isGraded: boolean; 
  experienceType: 'beneficial' | 'not-beneficial' | 'neutral';
}

interface OtherPrescriptionLogEntry {
  id: string;
  prescriptionName: string;
  userComments: string;
  loggedAt: string;
  experienceType: 'not-beneficial' | 'neutral';
}

function LoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Loading Your Battle Potions...</p>
    </div>
  );
}

export default function PrescriptionTrackerPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  
  const [beneficialPrescriptions, setBeneficialPrescriptions] = useState<PrescriptionLogEntryClient[]>([]);
  const [otherPrescriptions, setOtherPrescriptions] = useState<OtherPrescriptionLogEntry[]>([]);

  const [prescriptionNameInput, setPrescriptionNameInput] = useState('');
  const [commentsInput, setCommentsInput] = useState('');
  const [experienceTypeInput, setExperienceTypeInput] = useState<'beneficial' | 'not-beneficial' | 'neutral'>('beneficial');
  
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const { toast } = useToast();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const router = useRouter();
  const [prescriptionUsageStreak, setPrescriptionUsageStreak] = useState<StreakData | null>(null);

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

        // Load prescriptions
        const [beneficialPrescriptionsData, otherPrescriptionsData] = await Promise.all([
          firestoreService.getUserPrescriptions(user.uid, 'beneficial'),
          Promise.all([
            firestoreService.getUserPrescriptions(user.uid, 'not-beneficial'),
            firestoreService.getUserPrescriptions(user.uid, 'neutral')
          ]).then(([notBeneficial, neutral]) => [...notBeneficial, ...neutral])
        ]);

        // Convert to client format
        const beneficialConverted = beneficialPrescriptionsData.map(p => ({
          id: p.id,
          prescriptionName: p.prescriptionName,
          userComments: p.userComments,
          loggedAt: p.createdAt.toDate().toISOString(),
          benefitScore: p.benefitScore,
          reasoning: p.reasoning,
          isGraded: p.isGraded,
          experienceType: p.experienceType as 'beneficial'
        }));

        const otherConverted = otherPrescriptionsData.map(p => ({
          id: p.id,
          prescriptionName: p.prescriptionName,
          userComments: p.userComments,
          loggedAt: p.createdAt.toDate().toISOString(),
          experienceType: p.experienceType as 'not-beneficial' | 'neutral'
        }));

        setBeneficialPrescriptions(beneficialConverted);
        setOtherPrescriptions(otherConverted);

        // Load streak data
        const streak = await firestoreService.getStreak(user.uid, 'prescription');
        setPrescriptionUsageStreak(streak);

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
        description: `Its dark reign ends due to ${cause}, at ${currentHealth.toFixed(1)}% health. A new shadow awaits... Create it now!`,
        variant: "destructive",
        duration: Number.MAX_SAFE_INTEGER,
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const processPrescriptionGradingResult = async (
    prescriptionId: string,
    aiResult: PrescriptionGradingOutput,
    isCached: boolean
  ) => {
    if (!user) return;

    try {
      // Update the prescription in Firestore
      await firestoreService.updatePrescription(prescriptionId, {
        benefitScore: aiResult.benefitScore,
        reasoning: aiResult.reasoning,
        prescriptionName: aiResult.prescriptionName,
        isGraded: true,
      });

      // Update local state
      setBeneficialPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { 
        ...p, 
        ...aiResult, 
        isGraded: true 
      } : p));

      toast({
        title: `${isCached ? "[Cache] " : ""}${aiResult.prescriptionName} graded!`,
        description: `AI assessed a benefit score of ${aiResult.benefitScore}/15. ${monsterData?.name || 'The AI'} quips: '${aiResult.reasoning.substring(0,70)}...'`,
        duration: Number.MAX_SAFE_INTEGER,
      });
    } catch (error) {
      console.error('Error processing prescription grading result:', error);
      toast({
        title: "Error",
        description: "Failed to save prescription data.",
        variant: "destructive"
      });
    }
  };

  const handleLogPrescription = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentPrescriptionName = prescriptionNameInput.trim();
    const currentComments = commentsInput.trim();

    if (!currentPrescriptionName) { 
      setError("Please enter a prescription name."); 
      return; 
    }
    if (!user) { 
      setError("Please log in to track prescriptions."); 
      return; 
    }
    setError(null);
    
    try {
      // Add points
      await firestoreService.addPoints(user.uid, POINTS_PER_PRESCRIPTION_LOG);
      await refreshUserProfile();

      if (experienceTypeInput === 'beneficial') {
        const cacheKey = `${PRESCRIPTION_GRADE_CACHE_PREFIX}${currentPrescriptionName.toLowerCase()}_${(currentComments || "").toLowerCase()}`;
        
        // Check cache first
        if (typeof window !== 'undefined') {
          const cachedItemRaw = localStorage.getItem(cacheKey);
          if (cachedItemRaw) {
            try {
              const cachedItem: CachedAIResponse<PrescriptionGradingOutput> = JSON.parse(cachedItemRaw);
              if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
                // Add to Firestore with cached data
                const prescriptionId = await firestoreService.addPrescription(user.uid, {
                  prescriptionName: currentPrescriptionName,
                  userComments: currentComments,
                  benefitScore: cachedItem.data.benefitScore,
                  reasoning: cachedItem.data.reasoning,
                  isGraded: true,
                  experienceType: 'beneficial'
                });

                const pendingEntry: PrescriptionLogEntryClient = {
                  id: prescriptionId,
                  prescriptionName: cachedItem.data.prescriptionName,
                  userComments: currentComments,
                  loggedAt: new Date().toISOString(),
                  benefitScore: cachedItem.data.benefitScore,
                  reasoning: cachedItem.data.reasoning,
                  isGraded: true,
                  experienceType: 'beneficial',
                };
                setBeneficialPrescriptions(prev => [pendingEntry, ...prev].slice(0, 20));
                
                await processPrescriptionGradingResult(prescriptionId, cachedItem.data, true);
                setPrescriptionNameInput(''); 
                setCommentsInput('');
                return;
              } else {
                localStorage.removeItem(cacheKey); // Stale cache
              }
            } catch(e) {
              console.error("Error parsing prescription cache:", e);
              localStorage.removeItem(cacheKey);
            }
          }
        }

        // Add to Firestore (initially ungraded)
        const prescriptionId = await firestoreService.addPrescription(user.uid, {
          prescriptionName: currentPrescriptionName,
          userComments: currentComments,
          benefitScore: 0,
          reasoning: 'Awaiting AI grading...',
          isGraded: false,
          experienceType: 'beneficial'
        });

        const pendingEntry: PrescriptionLogEntryClient = {
          id: prescriptionId,
          prescriptionName: currentPrescriptionName,
          userComments: currentComments,
          loggedAt: new Date().toISOString(),
          benefitScore: 0,
          reasoning: 'Awaiting AI grading...',
          isGraded: false,
          experienceType: 'beneficial',
        };
        setBeneficialPrescriptions(prev => [pendingEntry, ...prev].slice(0, 20));
        
        startProcessingTransition(async () => {
          try {
            const aiResult = await gradePrescriptionAction({ 
              prescriptionName: currentPrescriptionName, 
              userNotes: currentComments 
            });
            
            if (typeof window !== 'undefined') {
              const newCachedItem: CachedAIResponse<PrescriptionGradingOutput> = { timestamp: Date.now(), data: aiResult };
              localStorage.setItem(cacheKey, JSON.stringify(newCachedItem));
            }
            
            await processPrescriptionGradingResult(prescriptionId, aiResult, false);
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : "AI grading failed.";
            
            // Remove from Firestore and local state on error
            await firestoreService.deletePrescription(prescriptionId);
            setBeneficialPrescriptions(prev => prev.filter(p => p.id !== prescriptionId)); 
            
            setError(`Failed to grade prescription: ${errorMsg}`);
            toast({ 
              title: "Grading Error", 
              description: `${monsterData?.name || 'The AI'} gloats: 'My AI minions failed to assess ${currentPrescriptionName}! How typical. Error: ${errorMsg}'`, 
              variant: "destructive", 
              duration: Number.MAX_SAFE_INTEGER 
            });
          }
        });
      } else { 
        // Add non-beneficial prescription
        const prescriptionId = await firestoreService.addPrescription(user.uid, {
          prescriptionName: currentPrescriptionName,
          userComments: currentComments,
          benefitScore: 0,
          reasoning: `User marked as "${experienceTypeInput}".`,
          isGraded: true,
          experienceType: experienceTypeInput
        });

        const otherEntry: OtherPrescriptionLogEntry = {
          id: prescriptionId,
          prescriptionName: currentPrescriptionName,
          userComments: currentComments,
          loggedAt: new Date().toISOString(),
          experienceType: experienceTypeInput
        };
        setOtherPrescriptions(prev => [otherEntry, ...prev].slice(0, 20));
        
        toast({ 
          title: "Prescription Logged", 
          description: `${currentPrescriptionName} logged under '${experienceTypeInput}'.`, 
          duration: 5000 
        });
      }

      const totalPrescriptionsLogged = beneficialPrescriptions.length + otherPrescriptions.length + 1;
      if (totalPrescriptionsLogged > 0 && totalPrescriptionsLogged % PRESCRIPTION_LOG_MILESTONE_INTERVAL === 0) {
        showSocialProofToast(`${totalPrescriptionsLogged} prescriptions logged by community`, POINTS_PER_PRESCRIPTION_LOG, true);
      }

      setPrescriptionNameInput(''); 
      setCommentsInput(''); 
    } catch (error) {
      console.error('Error logging prescription:', error);
      toast({
        title: "Error",
        description: "Failed to log prescription.",
        variant: "destructive"
      });
    }
  };

  const handleTakeDose = async (prescription: PrescriptionLogEntryClient) => {
    if (!isMonsterActuallyGenerated || !monsterData || !prescription.isGraded || !user) return;
    if (prescription.benefitScore <= 0) {
      toast({ 
        title: "No Monster Impact", 
        description: `${prescription.prescriptionName} has no graded benefit to affect ${monsterData.name}.`, 
        variant: "default" 
      });
      return;
    }

    try {
      const STREAK_BONUS_PER_DAY = 0.025; 
      const MAX_STREAK_MODIFIER = 0.60; 
      const currentStreakCount = await firestoreService.updateStreak(user.uid, 'prescription');
      const updatedStreak: StreakData = { 
        uid: user.uid, 
        type: 'prescription', 
        date: new Date().toISOString().split('T')[0], 
        count: currentStreakCount, 
        updatedAt: Timestamp.now()
      };
      setPrescriptionUsageStreak(updatedStreak);

      const streakModifier = Math.min(currentStreakCount * STREAK_BONUS_PER_DAY, MAX_STREAK_MODIFIER);
      const finalBenefitScore = prescription.benefitScore * (1 + streakModifier);

      const healthBefore = monsterData.health;
      let newHealth = healthBefore - finalBenefitScore;
      newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

      // Update monster health
      await firestoreService.updateMonsterData(user.uid, { health: newHealth });
      setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);

      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);

      let monsterReact = `${monsterData.name} recoils! Taking ${prescription.prescriptionName}? My health drops to ${newHealth.toFixed(1)}% (-${finalBenefitScore.toFixed(1)}%).`;
      if (streakModifier > 0) {
        monsterReact += ` Your ${currentStreakCount}-day consistency (+${(streakModifier * 100).toFixed(0)}% effect) makes it even more potent!`;
      }
      if (newHealth <= 0 && newHealth > MONSTER_DEATH_THRESHOLD) monsterReact += " This is... unpleasant...";
      
      if (!(await checkMonsterDeath(newHealth, prescription.prescriptionName))) {
        toast({ 
          title: `${monsterData.name} Reacts to ${prescription.prescriptionName}`, 
          description: monsterReact, 
          variant: "default", 
          duration: Number.MAX_SAFE_INTEGER 
        });
        
        if (currentStreakCount >= 3 && currentStreakCount % 3 === 0) {
          showSocialProofToast(`${currentStreakCount}-day beneficial prescription streak`, undefined, true);
        }
      }
    } catch (error) {
      console.error('Error taking dose:', error);
      toast({
        title: "Error",
        description: "Failed to apply prescription effect.",
        variant: "destructive"
      });
    }
  };

  const handleRemovePrescription = async (id: string, isBeneficial: boolean) => {
    if (!user) return;
    
    try {
      await firestoreService.deletePrescription(id);
      if (isBeneficial) {
        setBeneficialPrescriptions(prev => prev.filter(p => p.id !== id));
      } else {
        setOtherPrescriptions(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error removing prescription:', error);
      toast({
        title: "Error",
        description: "Failed to remove prescription.",
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
          <p className="text-center text-muted-foreground mb-4">Please log in to track your prescriptions.</p>
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
            Nemesis Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">Create your Nemesis to track prescriptions and their effects on its power.</p>
          <Button asChild className="w-full">
            <Link href="/create-monster">
              <Sparkles className="mr-2 h-4 w-4"/>
              Summon Nemesis
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
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
               {prescriptionUsageStreak && prescriptionUsageStreak.count > 0 && (
                <Badge variant="secondary" className="mt-1">
                    Beneficial Rx Streak: {prescriptionUsageStreak.count} day{prescriptionUsageStreak.count > 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-rx" className="text-sm font-medium block mb-1">
                Nemesis Health: {monsterData.health.toFixed(1)}%
              </Label>
              <Progress id="monster-health-rx" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Pill className="h-6 w-6 text-primary"/>
              Log Battle Potion or Elixir
            </CardTitle>
            <CardDescription>
              Log prescriptions you're taking or have tried. Beneficial ones (AI-graded, cached for 24hrs) can impact {monsterData?.name || 'your nemesis'}'s health when "taken".
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogPrescription}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prescription-name">Potion/Elixir Name</Label>
                <Input 
                  id="prescription-name" 
                  value={prescriptionNameInput} 
                  onChange={(e) => setPrescriptionNameInput(e.target.value)} 
                  placeholder="e.g., Amoxicillin, Sertraline" 
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="prescription-comments">Your Notes/Experience</Label>
                <Textarea 
                  id="prescription-comments" 
                  value={commentsInput} 
                  onChange={(e) => setCommentsInput(e.target.value)} 
                  placeholder="e.g., Helped with X symptom, caused Y side effect..." 
                  className="min-h-[80px]" 
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label>My Experience with this Potion/Elixir</Label>
                <RadioGroup value={experienceTypeInput} onValueChange={(v) => setExperienceTypeInput(v as any)} className="flex gap-4 pt-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beneficial" id="exp-beneficial" />
                    <Label htmlFor="exp-beneficial" className="font-normal flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-green-500"/>
                      Effective Potion
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-beneficial" id="exp-not-beneficial" />
                    <Label htmlFor="exp-not-beneficial" className="font-normal flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4 text-red-500"/>
                      Ineffective/Harmful
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neutral" id="exp-neutral" />
                    <Label htmlFor="exp-neutral" className="font-normal flex items-center gap-1">
                      <CircleOff className="h-4 w-4 text-muted-foreground"/>
                      Neutral / Unsure
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProcessing || !prescriptionNameInput.trim()} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListChecks className="mr-2 h-4 w-4"/>}
                {isProcessing ? 'Processing...' : 'Log Potion/Elixir'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-1.5">
                <ThumbsUp className="text-green-500"/>
                Effective Potions
              </CardTitle>
              <CardDescription className="text-xs">
                AI-graded. "Consume Potion" to apply effect to {monsterData?.name || 'your nemesis'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {beneficialPrescriptions.length === 0 && <p className="text-sm text-muted-foreground">No effective potions logged yet.</p>}
              {beneficialPrescriptions.map(rx => (
                <Card key={rx.id} className="p-3 bg-card/70">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{rx.prescriptionName}</h4>
                      <p className="text-xs text-muted-foreground italic">"{rx.userComments.substring(0, 100)}{rx.userComments.length > 100 ? '...' : ''}"</p>
                      <div className="text-xs mt-1">
                        {rx.isGraded ? (
                           <div className="flex items-center gap-1">
                            <Badge variant="default">Nemesis Dmg: {rx.benefitScore}/15</Badge>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5">
                                    <Info className="h-3.5 w-3.5"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs font-medium">AI Reasoning:</p>
                                  <p className="text-xs">{rx.reasoning}</p>
                                </TooltipContent>
                            </Tooltip>
                           </div>
                        ) : <Badge variant="outline" className="animate-pulse">AI Grading...</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemovePrescription(rx.id, true)} 
                        aria-label="Remove" 
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                      {rx.isGraded && rx.benefitScore > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleTakeDose(rx)} 
                          className="text-xs h-7 px-2" 
                          disabled={!monsterData || monsterData.health <= MONSTER_DEATH_THRESHOLD}
                        >
                          <HeartPulse className="mr-1 h-3 w-3"/>
                          Consume
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-1.5">
                <MessageSquare/>
                Other Logged Potions
              </CardTitle>
              <CardDescription className="text-xs">For your records (not AI-graded for Nemesis impact).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {otherPrescriptions.length === 0 && <p className="text-sm text-muted-foreground">No other potions logged yet.</p>}
              {otherPrescriptions.map(rx => (
                <Card key={rx.id} className="p-3 bg-card/70">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{rx.prescriptionName}</h4>
                      <p className="text-xs text-muted-foreground italic">"{rx.userComments.substring(0,100)}{rx.userComments.length > 100 ? '...' : ''}"</p>
                      <Badge variant="secondary" className="mt-1">
                        {rx.experienceType === 'not-beneficial' ? "Ineffective/Harmful" : "Neutral / Unsure"}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemovePrescription(rx.id, false)} 
                      aria-label="Remove" 
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}