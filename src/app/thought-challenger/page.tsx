'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Brain, Lightbulb, MessageSquareHeart, Sparkles, Skull, CheckCircle, Palette, Info } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { analyzeThoughtAction } from './actions';
import type { ThoughtChallengerInput, ThoughtChallengerOutput } from '@/ai/flows/thought-challenger-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';


const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';
const THOUGHT_CHALLENGER_LOG_KEY = 'thoughtChallengerLog';

const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;
const POINTS_PER_REFRAME = 40;
const MONSTER_HP_REDUCTION_PER_REFRAME = 8;

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

interface ThoughtChallengerLogEntry {
  id: string;
  distressingThought: string;
  evidenceFor?: string;
  evidenceAgainst?: string;
  alternativePerspective?: string;
  adviceToFriend?: string;
  cognitiveDistortionsIdentified?: string[];
  analysisFeedback?: string;
  balancedReframe: string;
  loggedAt: string;
  monsterHpReduction: number;
  pointsAwarded: number;
}

export default function ThoughtChallengerPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  
  const [distressingThought, setDistressingThought] = useState('');
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [alternativePerspective, setAlternativePerspective] = useState('');
  const [adviceToFriend, setAdviceToFriend] = useState('');
  const [balancedReframe, setBalancedReframe] = useState('');

  const [aiAnalysisResult, setAiAnalysisResult] = useState<ThoughtChallengerOutput | null>(null);
  const [thoughtLog, setThoughtLog] = useState<ThoughtChallengerLogEntry[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
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
      toast({ title: `${storedName} Stirs...`, description: `It regained ${recoveryAmount} health overnight. Current health: ${newHealth.toFixed(1)}%.`, duration: 7000 });
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
    const storedLog = localStorage.getItem(THOUGHT_CHALLENGER_LOG_KEY);
    if (storedLog) setThoughtLog(JSON.parse(storedLog));
  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "the weight of its own negativity"); 
    }
  }, [monsterHealth, monsterName]);

  useEffect(() => {
    if (thoughtLog.length > 0) {
      localStorage.setItem(THOUGHT_CHALLENGER_LOG_KEY, JSON.stringify(thoughtLog));
    }
  }, [thoughtLog]);

  const checkMonsterDeath = (currentHealth: number, cause: string) => {
     if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
        const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
        tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
        localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));
        localStorage.removeItem(MONSTER_IMAGE_KEY); localStorage.removeItem(MONSTER_NAME_KEY);
        localStorage.removeItem(MONSTER_HEALTH_KEY); localStorage.removeItem(MONSTER_GENERATED_KEY);
        setMonsterImageUrl(null); setMonsterName(null); setMonsterHealth(null);
        toast({ title: `${monsterName} Has Faded!`, description: `Dispelled by clarity and insight. It succumbed to ${cause} at ${currentHealth.toFixed(1)}% health.`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const handleAnalyzeThought = () => {
    if (!distressingThought.trim()) {
      setError("Please enter a distressing thought to analyze."); return;
    }
    setError(null); setAiAnalysisResult(null);
    startAnalyzingTransition(async () => {
      try {
        const input: ThoughtChallengerInput = {
          distressingThought, evidenceFor, evidenceAgainst, alternativePerspective, adviceToFriend
        };
        const result = await analyzeThoughtAction(input);
        setAiAnalysisResult(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to get AI insights.");
        toast({ title: "AI Analysis Error", description: e instanceof Error ? e.message : "Unknown error.", variant: "destructive" });
      }
    });
  };

  const handleSaveReframe = () => {
    if (!balancedReframe.trim()) {
      setError("Please write your balanced reframe before saving."); return;
    }
    if (!monsterName || monsterHealth === null) {
      setError("Monster not available for this challenge."); return;
    }
    setError(null);

    const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterHealth - MONSTER_HP_REDUCTION_PER_REFRAME);
    setMonsterHealth(newHealth);
    addPoints(POINTS_PER_REFRAME);
    setShowDamageEffect(true);
    setTimeout(() => setShowDamageEffect(false), 700);

    const newLogEntry: ThoughtChallengerLogEntry = {
      id: Date.now().toString(),
      distressingThought, evidenceFor, evidenceAgainst, alternativePerspective, adviceToFriend,
      cognitiveDistortionsIdentified: aiAnalysisResult?.cognitiveDistortionsIdentified,
      analysisFeedback: aiAnalysisResult?.analysisFeedback,
      balancedReframe,
      loggedAt: new Date().toISOString(),
      monsterHpReduction: MONSTER_HP_REDUCTION_PER_REFRAME,
      pointsAwarded: POINTS_PER_REFRAME,
    };
    setThoughtLog(prev => [newLogEntry, ...prev].slice(0, 20));
    
    if (!checkMonsterDeath(newHealth, "a successfully challenged thought")) {
      toast({ title: "Thought Reframed!", description: `${monsterName} flinches! Its mental grip weakens. Health: ${newHealth.toFixed(1)}% (-${MONSTER_HP_REDUCTION_PER_REFRAME}). You earned ${POINTS_PER_REFRAME} points!`, duration: Number.MAX_SAFE_INTEGER });
    }

    // Reset fields
    setDistressingThought(''); setEvidenceFor(''); setEvidenceAgainst('');
    setAlternativePerspective(''); setAdviceToFriend(''); setAiAnalysisResult(null); setBalancedReframe('');
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  if (localStorage.getItem(MONSTER_GENERATED_KEY) !== 'true') {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Your inner monster must be created to engage in thought challenges.</p>
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
              <Label htmlFor="monster-health-tc" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-tc" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Successfully reframing thoughts weakens its mental grip.</p>
            </CardContent>
          </Card>
        )}
         <Card>
            <CardHeader><CardTitle className="font-headline text-lg">Past Challenges</CardTitle></CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-3">
                {thoughtLog.length === 0 && <p className="text-sm text-muted-foreground">No thoughts challenged yet.</p>}
                {thoughtLog.map(log => (
                    <Accordion key={log.id} type="single" collapsible className="w-full">
                        <AccordionItem value={log.id} className="border-b-0">
                            <AccordionTrigger className="text-sm font-medium p-3 bg-muted/30 hover:bg-muted/50 rounded-md text-left justify-between">
                                <div className="truncate pr-2">"{log.distressingThought.substring(0,50)}{log.distressingThought.length > 50 ? '...' : ''}"</div>
                            </AccordionTrigger>
                            <AccordionContent className="p-3 text-xs space-y-1 bg-card border rounded-b-md">
                                <p><strong>Distressing Thought:</strong> {log.distressingThought}</p>
                                <p><strong>Reframe:</strong> {log.balancedReframe}</p>
                                {log.cognitiveDistortionsIdentified && log.cognitiveDistortionsIdentified.length > 0 && (
                                    <p><strong>Distortions:</strong> {log.cognitiveDistortionsIdentified.join(', ')}</p>
                                )}
                                <p className="text-muted-foreground">Challenged on: {new Date(log.loggedAt).toLocaleDateString()}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ))}
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Palette className="h-6 w-6 text-primary"/>Thought Challenger</CardTitle>
            <CardDescription>Identify, analyze, and reframe distressing thoughts with AI assistance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="distressing-thought">1. What's a distressing thought you're having?</Label>
              <Textarea id="distressing-thought" value={distressingThought} onChange={(e) => setDistressingThought(e.target.value)} placeholder="e.g., This itching will never stop." className="min-h-[60px]" />
            </div>
            <Separator />
            <h3 className="text-md font-semibold pt-2">2. Challenge the Thought:</h3>
            <div>
              <Label htmlFor="evidence-for">Evidence FOR this thought (as 100% true):</Label>
              <Textarea id="evidence-for" value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)} placeholder="What makes you believe it's absolutely true?" className="min-h-[50px]" />
            </div>
            <div>
              <Label htmlFor="evidence-against">Evidence AGAINST this thought (or times it wasn't true):</Label>
              <Textarea id="evidence-against" value={evidenceAgainst} onChange={(e) => setEvidenceAgainst(e.target.value)} placeholder="Are there exceptions or counter-examples?" className="min-h-[50px]" />
            </div>
            <div>
              <Label htmlFor="alternative-perspective">An alternative, less distressing way to see this:</Label>
              <Textarea id="alternative-perspective" value={alternativePerspective} onChange={(e) => setAlternativePerspective(e.target.value)} placeholder="Is there another viewpoint?" className="min-h-[50px]" />
            </div>
            <div>
              <Label htmlFor="advice-to-friend">If a friend had this thought, what would you tell them?</Label>
              <Textarea id="advice-to-friend" value={adviceToFriend} onChange={(e) => setAdviceToFriend(e.target.value)} placeholder="What compassionate advice would you offer?" className="min-h-[50px]" />
            </div>
            <Button onClick={handleAnalyzeThought} disabled={isAnalyzing || !distressingThought.trim()} className="w-full sm:w-auto">
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Lightbulb className="mr-2 h-4 w-4"/>}
              Get AI Insights
            </Button>
          </CardContent>
        </Card>

        {isAnalyzing && (
            <Card className="p-6 flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3"/>
                <p className="text-muted-foreground">{monsterName || "The AI"} is pondering your thought...</p>
            </Card>
        )}

        {aiAnalysisResult && !isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><MessageSquareHeart className="h-6 w-6 text-accent"/>3. AI Insights & Reframe Guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiAnalysisResult.cognitiveDistortionsIdentified && aiAnalysisResult.cognitiveDistortionsIdentified.length > 0 && (
                <div>
                  <Label className="font-semibold">Potential Cognitive Distortions:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {aiAnalysisResult.cognitiveDistortionsIdentified.map(dist => <Badge key={dist} variant="secondary">{dist}</Badge>)}
                  </div>
                </div>
              )}
              <div>
                <Label className="font-semibold">AI Feedback on Your Analysis:</Label>
                <p className="text-sm text-muted-foreground p-2 bg-background rounded border italic">{aiAnalysisResult.analysisFeedback}</p>
              </div>
               <div>
                <Label className="font-semibold">Try Starting Your Reframe With:</Label>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                    {aiAnalysisResult.suggestedReframeStarters.map((starter,i) => <li key={i}>"{starter}"</li>)}
                </ul>
              </div>
              <Separator />
              <div>
                <Label htmlFor="balanced-reframe">4. Write Your Balanced Reframe:</Label>
                <p className="text-xs text-muted-foreground mb-1">{aiAnalysisResult.reframeSupportMessage}</p>
                <Textarea id="balanced-reframe" value={balancedReframe} onChange={(e) => setBalancedReframe(e.target.value)} placeholder="e.g., While the itching is very unpleasant now, it has eased before, and I can try X to cope." className="min-h-[70px]" />
              </div>
              <Button onClick={handleSaveReframe} disabled={!balancedReframe.trim()} className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-4 w-4"/> Save Reframe & Weaken {monsterName || "Monster"}
              </Button>
            </CardContent>
          </Card>
        )}
        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      </div>
    </div>
  );
}