
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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

const commonNegativeThoughts = [
  "This will never get better.",
  "No one understands what I'm going through.",
  "I'm a burden to my loved ones.",
  "I can't enjoy life anymore because of this.",
  "Doctors will never believe me or help me.",
  "I'm losing my mind.",
  "There's something fundamentally wrong with me.",
  "I'll never feel normal again.",
  "This pain/sensation is unbearable and will last forever.",
  "I'm damaged/broken.",
  "It's all my fault.",
  "I'm alone in this struggle."
];

const commonEvidenceFor = [
  "I feel this way physically right now.",
  "It has happened before many times.",
  "A doctor once said something similar.",
  "My symptoms are very strong today.",
  "I read an article that supports this fear.",
  "My energy levels are extremely low.",
  "I can't do things I used to.",
  "People don't seem to understand.",
  "The test results weren't good.",
  "I've been struggling for a long time.",
];

const commonEvidenceAgainst = [
  "There have been good days/moments.",
  "I've overcome challenges before.",
  "Some people do try to understand.",
  "My body has shown resilience in the past.",
  "This feeling/symptom isn't always this intense.",
  "I've found small ways to cope.",
  "Not all information I read is accurate or applies to me.",
  "I have support from someone/a group.",
  "One bad day doesn't mean all days are bad.",
  "I am still here, fighting.",
];

const commonAlternativePerspectives = [
  "This is temporary, even if it feels permanent now.",
  "I can focus on what I *can* control.",
  "This is a challenge, not a definition of who I am.",
  "It's okay to not be okay sometimes.",
  "I'm learning more about my body and needs.",
  "Even small steps are progress.",
  "This feeling is valid, but it doesn't have to consume me.",
  "Perhaps there are other factors at play I haven't considered.",
  "I can seek out different perspectives or support.",
  "My worth isn't tied to my physical condition.",
];

const commonAdviceToFriend = [
  "I understand why you feel that way, but it's not entirely true.",
  "You are stronger than you think.",
  "Be kind to yourself; you're doing your best.",
  "Let's look at the facts together, not just the fear.",
  "Remember that time you overcame something similar?",
  "This feeling is valid, but it doesn't define your future.",
  "You're not alone in this; I'm here for you.",
  "Focus on small, manageable steps.",
  "It's okay to ask for help or support.",
  "This doesn't make you any less of a person.",
];

const commonBalancedReframeStarters = [
  "While it's true that..., it's also possible that...",
  "Even though I feel..., I can still try to...",
  "It might seem like..., but looking at it another way,...",
  "I acknowledge that..., however,...",
  "Instead of focusing on..., I will try to focus on...",
  "This is a difficult situation because..., but I am capable of...",
  "My thought says..., but the facts suggest...",
  "It's understandable to feel..., but it's important to remember...",
  "I will challenge this thought by reminding myself that...",
  "A more helpful way to think about this is: ...",
];


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
  
  const [selectedCommonThought, setSelectedCommonThought] = useState<string>('');
  const [selectedEvidenceFor, setSelectedEvidenceFor] = useState<string>('');
  const [selectedEvidenceAgainst, setSelectedEvidenceAgainst] = useState<string>('');
  const [selectedAlternativePerspective, setSelectedAlternativePerspective] = useState<string>('');
  const [selectedAdviceToFriend, setSelectedAdviceToFriend] = useState<string>('');
  const [selectedBalancedReframe, setSelectedBalancedReframe] = useState<string>('');

  const [aiAnalysisResult, setAiAnalysisResult] = useState<ThoughtChallengerOutput | null>(null);
  const [thoughtLog, setThoughtLog] = useState<ThoughtChallengerLogEntry[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSelectChange = (
    value: string, 
    setTextareaState: React.Dispatch<React.SetStateAction<string>>,
    setSelectedState: React.Dispatch<React.SetStateAction<string>>,
    optionsList: string[]
  ) => {
    setSelectedState(value);
    if (value === "other" || value === "") {
      // If "Other" or placeholder selected, don't clear, let user type or clear manually.
      // If text area already has custom text, keep it. If not, maybe clear.
      // For now, if "Other" selected, we only change the select. Textarea is free.
    } else {
      setTextareaState(value);
    }
  };

  const handleTextareaChange = (
    value: string,
    setTextareaState: React.Dispatch<React.SetStateAction<string>>,
    setSelectedState: React.Dispatch<React.SetStateAction<string>>,
    optionsList: string[]
  ) => {
    setTextareaState(value);
    if (optionsList.includes(value)) {
      setSelectedState(value);
    } else {
      setSelectedState("other");
    }
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

    setDistressingThought(''); setSelectedCommonThought('');
    setEvidenceFor(''); setSelectedEvidenceFor('');
    setEvidenceAgainst(''); setSelectedEvidenceAgainst('');
    setAlternativePerspective(''); setSelectedAlternativePerspective('');
    setAdviceToFriend(''); setSelectedAdviceToFriend('');
    setAiAnalysisResult(null);
    setBalancedReframe(''); setSelectedBalancedReframe('');
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

  const renderSelectAndTextarea = (
    label: string,
    selectValue: string,
    selectOptions: string[],
    textareaValue: string,
    textareaPlaceholder: string,
    setTextareaState: React.Dispatch<React.SetStateAction<string>>,
    setSelectedState: React.Dispatch<React.SetStateAction<string>>
  ) => (
    <div>
      <Label htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}-select`}>{label}:</Label>
      <Select
        value={selectValue}
        onValueChange={(value) => handleSelectChange(value, setTextareaState, setSelectedState, selectOptions)}
      >
        <SelectTrigger id={`${label.toLowerCase().replace(/\s+/g, '-')}-select`} className="mt-1 mb-1">
          <SelectValue placeholder={`Choose or type your own...`} />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((option, index) => (
            <SelectItem key={index} value={option}>{option}</SelectItem>
          ))}
          <SelectItem value="other">Other (type below)...</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        id={`${label.toLowerCase().replace(/\s+/g, '-')}-textarea`}
        value={textareaValue}
        onChange={(e) => handleTextareaChange(e.target.value, setTextareaState, setSelectedState, selectOptions)}
        placeholder={textareaPlaceholder}
        className="min-h-[60px]"
      />
    </div>
  );


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
            {renderSelectAndTextarea(
                "1. Your Distressing Thought",
                selectedCommonThought,
                commonNegativeThoughts,
                distressingThought,
                "e.g., This itching will never stop.",
                setDistressingThought,
                setSelectedCommonThought
              )}
            <Separator />
            <h3 className="text-md font-semibold pt-2">2. Challenge the Thought:</h3>
             {renderSelectAndTextarea(
                "Evidence FOR this thought (as 100% true)",
                selectedEvidenceFor,
                commonEvidenceFor,
                evidenceFor,
                "What makes you believe it's absolutely true?",
                setEvidenceFor,
                setSelectedEvidenceFor
              )}
              {renderSelectAndTextarea(
                "Evidence AGAINST this thought (or times it wasn't true)",
                selectedEvidenceAgainst,
                commonEvidenceAgainst,
                evidenceAgainst,
                "Are there exceptions or counter-examples?",
                setEvidenceAgainst,
                setSelectedEvidenceAgainst
              )}
              {renderSelectAndTextarea(
                "An alternative, less distressing way to see this",
                selectedAlternativePerspective,
                commonAlternativePerspectives,
                alternativePerspective,
                "Is there another viewpoint?",
                setAlternativePerspective,
                setSelectedAlternativePerspective
              )}
              {renderSelectAndTextarea(
                "If a friend had this thought, what would you tell them?",
                selectedAdviceToFriend,
                commonAdviceToFriend,
                adviceToFriend,
                "What compassionate advice would you offer?",
                setAdviceToFriend,
                setSelectedAdviceToFriend
              )}
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
               {renderSelectAndTextarea(
                "4. Write Your Balanced Reframe",
                selectedBalancedReframe,
                commonBalancedReframeStarters,
                balancedReframe,
                "e.g., While the itching is unpleasant, it has eased before...",
                setBalancedReframe,
                setSelectedBalancedReframe
              )}
              <p className="text-xs text-muted-foreground mb-1">{aiAnalysisResult.reframeSupportMessage}</p>
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

