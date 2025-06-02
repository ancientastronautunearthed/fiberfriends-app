
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

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const BENEFICIAL_PRESCRIPTIONS_KEY = 'beneficialPrescriptionsLog';
const OTHER_PRESCRIPTIONS_KEY = 'otherPrescriptionsLog';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';
const PRESCRIPTION_LOG_MILESTONE_INTERVAL = 3;
const PRESCRIPTION_USAGE_STREAK_KEY = 'prescriptionUsageStreak';

const PRESCRIPTION_GRADE_CACHE_PREFIX = 'prescription_grade_cache_';
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
const POINTS_PER_PRESCRIPTION_LOG = 15;

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

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

interface StreakData {
  date: string;
  count: number;
}

export default function PrescriptionTrackerPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  
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
  const [prescriptionUsageStreak, setPrescriptionUsageStreak] = useState<StreakData>({ date: '', count: 0});

  const updateStreak = (streakKey: string, setStreakState: React.Dispatch<React.SetStateAction<StreakData>>): number => {
    const today = new Date().toISOString().split('T')[0];
    const storedStreak = localStorage.getItem(streakKey);
    let currentStreakData: StreakData = { date: today, count: 0 };

    if (storedStreak) {
      currentStreakData = JSON.parse(storedStreak);
      const lastDate = new Date(currentStreakData.date);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (today === currentStreakData.date) {
        // Already counted for today
      } else if (diffDays === 1) {
        currentStreakData.count += 1; 
      } else {
        currentStreakData.count = 1; 
      }
    } else {
      currentStreakData.count = 1; 
    }
    currentStreakData.date = today;
    localStorage.setItem(streakKey, JSON.stringify(currentStreakData));
    setStreakState(currentStreakData);
    return currentStreakData.count;
  };


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
      if (storedHealth) setMonsterHealth(parseFloat(storedHealth));
      else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth);
        localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
      performNightlyRecovery();
    }

    const storedBeneficial = localStorage.getItem(BENEFICIAL_PRESCRIPTIONS_KEY);
    if (storedBeneficial) setBeneficialPrescriptions(JSON.parse(storedBeneficial));
    const storedOther = localStorage.getItem(OTHER_PRESCRIPTIONS_KEY);
    if (storedOther) setOtherPrescriptions(JSON.parse(storedOther));
    
    const savedUsageStreak = localStorage.getItem(PRESCRIPTION_USAGE_STREAK_KEY);
    if (savedUsageStreak) setPrescriptionUsageStreak(JSON.parse(savedUsageStreak));

  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "its own complicated chemistry"); 
    }
  }, [monsterHealth, monsterName]);

  useEffect(() => { localStorage.setItem(BENEFICIAL_PRESCRIPTIONS_KEY, JSON.stringify(beneficialPrescriptions)); }, [beneficialPrescriptions]);
  useEffect(() => { localStorage.setItem(OTHER_PRESCRIPTIONS_KEY, JSON.stringify(otherPrescriptions)); }, [otherPrescriptions]);
  useEffect(() => { localStorage.setItem(PRESCRIPTION_USAGE_STREAK_KEY, JSON.stringify(prescriptionUsageStreak)); }, [prescriptionUsageStreak]);

  const checkMonsterDeath = (currentHealth: number, cause: string) => {
     if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
        const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
        tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
        localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));
        localStorage.removeItem(MONSTER_IMAGE_KEY); localStorage.removeItem(MONSTER_NAME_KEY);
        localStorage.removeItem(MONSTER_HEALTH_KEY); localStorage.removeItem(MONSTER_GENERATED_KEY);
        setMonsterImageUrl(null); setMonsterName(null); setMonsterHealth(null);
        toast({
          title: `${monsterName} Has Perished!`,
          description: `Its dark reign ends due to ${cause}, at ${currentHealth.toFixed(1)}% health. A new shadow awaits... Create it now!`,
          variant: "destructive", duration: Number.MAX_SAFE_INTEGER,
        });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const processPrescriptionGradingResult = (
    prescriptionId: string,
    aiResult: PrescriptionGradingOutput,
    isCached: boolean
  ) => {
    setBeneficialPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, ...aiResult, isGraded: true } : p));
    toast({
        title: `${isCached ? "[Cache] " : ""}${aiResult.prescriptionName} graded!`,
        description: `AI assessed a benefit score of ${aiResult.benefitScore}/15. ${monsterName || 'The AI'} quips: '${aiResult.reasoning.substring(0,70)}...'`,
        duration: Number.MAX_SAFE_INTEGER,
    });
  };

  const handleLogPrescription = async (event: React.FormEvent) => {
    event.preventDefault();
    const currentPrescriptionName = prescriptionNameInput.trim();
    const currentComments = commentsInput.trim();

    if (!currentPrescriptionName) { setError("Please enter a prescription name."); return; }
    if (!monsterName) { setError("Monster not found. Please create your monster first."); return; }
    setError(null);
    
    const tempId = Date.now().toString();
    const loggedAt = new Date().toISOString();
    addPoints(POINTS_PER_PRESCRIPTION_LOG);

    if (experienceTypeInput === 'beneficial') {
      const cacheKey = `${PRESCRIPTION_GRADE_CACHE_PREFIX}${currentPrescriptionName.toLowerCase()}_${(currentComments || "").toLowerCase()}`;
      if (typeof window !== 'undefined') {
        const cachedItemRaw = localStorage.getItem(cacheKey);
        if (cachedItemRaw) {
            try {
                const cachedItem: CachedAIResponse<PrescriptionGradingOutput> = JSON.parse(cachedItemRaw);
                if (Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
                    const pendingEntry: PrescriptionLogEntryClient = {
                        id: tempId, prescriptionName: currentPrescriptionName, userComments: currentComments,
                        loggedAt, benefitScore: cachedItem.data.benefitScore, reasoning: cachedItem.data.reasoning, isGraded: true, experienceType: 'beneficial',
                    };
                    setBeneficialPrescriptions(prev => [pendingEntry, ...prev].slice(0, 20));
                    processPrescriptionGradingResult(tempId, cachedItem.data, true);
                    setPrescriptionNameInput(''); setCommentsInput('');
                    return;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                console.error("Error parsing prescription cache:", e);
                localStorage.removeItem(cacheKey);
            }
        }
      }

      const pendingEntry: PrescriptionLogEntryClient = {
        id: tempId, prescriptionName: currentPrescriptionName, userComments: currentComments,
        loggedAt, benefitScore: 0, reasoning: 'Awaiting AI grading...', isGraded: false, experienceType: 'beneficial',
      };
      setBeneficialPrescriptions(prev => [pendingEntry, ...prev].slice(0, 20));
      
      startProcessingTransition(async () => {
        try {
          const aiResult = await gradePrescriptionAction({ prescriptionName: currentPrescriptionName, userNotes: currentComments });
          if (typeof window !== 'undefined') {
            const newCachedItem: CachedAIResponse<PrescriptionGradingOutput> = { timestamp: Date.now(), data: aiResult };
            localStorage.setItem(cacheKey, JSON.stringify(newCachedItem));
          }
          processPrescriptionGradingResult(tempId, aiResult, false);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : "AI grading failed.";
          setBeneficialPrescriptions(prev => prev.filter(p => p.id !== tempId)); 
          setError(`Failed to grade prescription: ${errorMsg}`);
          toast({ title: "Grading Error", description: `${monsterName} gloats: 'My AI minions failed to assess ${currentPrescriptionName}! How typical. Error: ${errorMsg}'`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER });
        }
      });
    } else { 
      const otherEntry: OtherPrescriptionLogEntry = {
        id: tempId, prescriptionName: currentPrescriptionName, userComments: currentComments, loggedAt, experienceType: experienceTypeInput
      };
      setOtherPrescriptions(prev => [otherEntry, ...prev].slice(0, 20));
      toast({ title: "Prescription Logged", description: `${currentPrescriptionName} logged under '${experienceTypeInput}'.`, duration: 5000 });
    }

    const totalPrescriptionsLogged = beneficialPrescriptions.length + otherPrescriptions.length +1;
    if (totalPrescriptionsLogged > 0 && totalPrescriptionsLogged % PRESCRIPTION_LOG_MILESTONE_INTERVAL === 0) {
        showSocialProofToast(`${totalPrescriptionsLogged} prescriptions logged by community`, POINTS_PER_PRESCRIPTION_LOG, true);
    }

    setPrescriptionNameInput(''); setCommentsInput(''); 
  };

  const handleTakeDose = (prescription: PrescriptionLogEntryClient) => {
    if (!monsterGenerated || monsterHealth === null || !prescription.isGraded || !monsterName) return;
    if (prescription.benefitScore <= 0) {
      toast({ title: "No Monster Impact", description: `${prescription.prescriptionName} has no graded benefit to affect ${monsterName}.`, variant: "default" });
      return;
    }

    const STREAK_BONUS_PER_DAY = 0.025; 
    const MAX_STREAK_MODIFIER = 0.60; 
    const currentStreakCount = updateStreak(PRESCRIPTION_USAGE_STREAK_KEY, setPrescriptionUsageStreak);
    const streakModifier = Math.min(currentStreakCount * STREAK_BONUS_PER_DAY, MAX_STREAK_MODIFIER);
    const finalBenefitScore = prescription.benefitScore * (1 + streakModifier);

    const healthBefore = monsterHealth;
    let newHealth = healthBefore - finalBenefitScore;
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);
    setMonsterHealth(newHealth);
    setShowDamageEffect(true);
    setTimeout(() => setShowDamageEffect(false), 700);

    let monsterReact = `${monsterName} recoils! Taking ${prescription.prescriptionName}? My health drops to ${newHealth.toFixed(1)}% (-${finalBenefitScore.toFixed(1)}%).`;
    if (streakModifier > 0) {
        monsterReact += ` Your ${currentStreakCount}-day consistency (+${(streakModifier * 100).toFixed(0)}% effect) makes it even more potent!`;
    }
    if (newHealth <= 0 && newHealth > MONSTER_DEATH_THRESHOLD) monsterReact += " This is... unpleasant...";
    
    if (!checkMonsterDeath(newHealth, prescription.prescriptionName)) {
      toast({ title: `${monsterName} Reacts to ${prescription.prescriptionName}`, description: monsterReact, variant: "default", duration: Number.MAX_SAFE_INTEGER });
       if (currentStreakCount >= 3 && currentStreakCount % 3 === 0) {
          showSocialProofToast(`${currentStreakCount}-day beneficial prescription streak`, undefined, true);
      }
    }
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
        <CardContent><p className="text-center text-muted-foreground mb-4">Create your Morgellon Monster to track prescriptions and their effects.</p>
          <Button asChild className="w-full"><Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create Monster</Link></Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {monsterName && monsterImageUrl && monsterHealth !== null && (
          <Card className={cn(showDamageEffect && 'animate-damage-flash')}>
            <CardHeader className="items-center text-center">
              <Link href="/my-profile">
                <Image src={monsterImageUrl} alt={monsterName} width={100} height={100} className="rounded-full border-2 border-primary shadow-md mx-auto cursor-pointer hover:opacity-80 transition-opacity" data-ai-hint="generated monster"/>
              </Link>
              <CardTitle className="font-headline text-xl pt-2">{monsterName}</CardTitle>
               {prescriptionUsageStreak.count > 0 && (
                <Badge variant="secondary" className="mt-1">
                    Beneficial Rx Streak: {prescriptionUsageStreak.count} day{prescriptionUsageStreak.count > 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-rx" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-rx" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Pill className="h-6 w-6 text-primary"/>Log Prescription</CardTitle>
            <CardDescription>Log prescriptions you're taking or have tried. Beneficial ones (AI-graded, cached for 24hrs) can impact {monsterName}'s health when "taken".</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogPrescription}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prescription-name">Prescription Name</Label>
                <Input id="prescription-name" value={prescriptionNameInput} onChange={(e) => setPrescriptionNameInput(e.target.value)} placeholder="e.g., Amoxicillin, Sertraline" disabled={isProcessing}/>
              </div>
              <div>
                <Label htmlFor="prescription-comments">Your Comments/Experience</Label>
                <Textarea id="prescription-comments" value={commentsInput} onChange={(e) => setCommentsInput(e.target.value)} placeholder="e.g., Helped with X symptom, caused Y side effect..." className="min-h-[80px]" disabled={isProcessing}/>
              </div>
              <div>
                <Label>My Experience with this Prescription</Label>
                <RadioGroup value={experienceTypeInput} onValueChange={(v) => setExperienceTypeInput(v as any)} className="flex gap-4 pt-1">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="beneficial" id="exp-beneficial" /><Label htmlFor="exp-beneficial" className="font-normal flex items-center gap-1"><ThumbsUp className="h-4 w-4 text-green-500"/>Helped Me</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="not-beneficial" id="exp-not-beneficial" /><Label htmlFor="exp-not-beneficial" className="font-normal flex items-center gap-1"><ThumbsDown className="h-4 w-4 text-red-500"/>Didn't Help / Adverse</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="neutral" id="exp-neutral" /><Label htmlFor="exp-neutral" className="font-normal flex items-center gap-1"><CircleOff className="h-4 w-4 text-muted-foreground"/>Neutral / Unsure</Label></div>
                </RadioGroup>
              </div>
              {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProcessing || !prescriptionNameInput.trim()} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListChecks className="mr-2 h-4 w-4"/>}
                {isProcessing ? 'Processing...' : 'Log Prescription'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-1.5"><ThumbsUp className="text-green-500"/>Beneficial Prescriptions</CardTitle>
              <CardDescription className="text-xs">AI-graded. "Take Dose" to apply effect to {monsterName}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {beneficialPrescriptions.length === 0 && <p className="text-sm text-muted-foreground">No beneficial prescriptions logged yet.</p>}
              {beneficialPrescriptions.map(rx => (
                <Card key={rx.id} className="p-3 bg-card/70">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{rx.prescriptionName}</h4>
                      <p className="text-xs text-muted-foreground italic">"{rx.userComments.substring(0, 100)}{rx.userComments.length > 100 ? '...' : ''}"</p>
                      <div className="text-xs mt-1">
                        {rx.isGraded ? (
                           <div className="flex items-center gap-1">
                            <Badge variant="default">Monster Dmg: {rx.benefitScore}/15</Badge>
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5"><Info className="h-3.5 w-3.5"/></Button></TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs"><p className="text-xs font-medium">AI Reasoning:</p><p className="text-xs">{rx.reasoning}</p></TooltipContent>
                            </Tooltip>
                           </div>
                        ) : <Badge variant="outline" className="animate-pulse">AI Grading...</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setBeneficialPrescriptions(prev => prev.filter(p => p.id !== rx.id))} aria-label="Remove" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      {rx.isGraded && rx.benefitScore > 0 && <Button size="sm" variant="outline" onClick={() => handleTakeDose(rx)} className="text-xs h-7 px-2" disabled={monsterHealth === null || monsterHealth <= MONSTER_DEATH_THRESHOLD}><HeartPulse className="mr-1 h-3 w-3"/>Take Dose</Button>}
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-1.5"><MessageSquare/>Other Logged Prescriptions</CardTitle>
              <CardDescription className="text-xs">For your records (not AI-graded for monster impact).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {otherPrescriptions.length === 0 && <p className="text-sm text-muted-foreground">No other prescriptions logged yet.</p>}
              {otherPrescriptions.map(rx => (
                <Card key={rx.id} className="p-3 bg-card/70">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{rx.prescriptionName}</h4>
                      <p className="text-xs text-muted-foreground italic">"{rx.userComments.substring(0,100)}{rx.userComments.length > 100 ? '...' : ''}"</p>
                      <Badge variant="secondary" className="mt-1">{rx.experienceType === 'not-beneficial' ? "Didn't Help / Adverse" : "Neutral / Unsure"}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOtherPrescriptions(prev => prev.filter(p => p.id !== rx.id))} aria-label="Remove" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button>
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

    