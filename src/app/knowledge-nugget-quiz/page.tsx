
'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, Sparkles, Skull, CheckCircle, XCircle, HelpCircle, Info, Trophy } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateQuizQuestionAction } from './actions';
import type { QuizQuestionOutput } from '@/ai/flows/knowledge-nugget-quiz-flow';
import { Badge } from '@/components/ui/badge';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';

const KNOWLEDGE_NUGGET_QUIZ_LEVEL_KEY = 'knowledgeNuggetQuizLevel';
const KNOWLEDGE_NUGGET_LAST_ATTEMPT_DATE_KEY = 'knowledgeNuggetQuizLastAttemptDate';

const MAX_QUIZ_LEVEL = 10;
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

const POINTS_FOR_CORRECT_QUIZ_ANSWER = 15;
const MONSTER_HP_REDUCTION_BASE = 4; // Base damage
const PERFECT_LEVEL_10_BONUS_POINTS = 100;


interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

export default function KnowledgeNuggetQuizPage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  
  const [currentQuizLevel, setCurrentQuizLevel] = useState<number>(1);
  const [lastQuizAttemptDate, setLastQuizAttemptDate] = useState<string | null>(null);
  const [hasAttemptedQuizToday, setHasAttemptedQuizToday] = useState<boolean>(false);

  const [quizData, setQuizData] = useState<QuizQuestionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingQuiz, startLoadingQuizTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const getCurrentDateString = () => new Date().toISOString().split('T')[0];

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
      toast({ title: `${storedName} Regenerates`, description: `While you rested, I regained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`, duration: 7000 });
    }
  }, [toast]);

  const fetchQuizQuestion = useCallback(() => {
    if (hasAttemptedQuizToday) return;

    setError(null);
    setQuizData(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShuffledOptions([]);
    startLoadingQuizTransition(async () => {
      try {
        const result = await generateQuizQuestionAction({ difficultyLevel: currentQuizLevel });
        setQuizData(result);
        setShuffledOptions([...result.options].sort(() => Math.random() - 0.5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch quiz question.");
        toast({ title: "Quiz Error", description: e instanceof Error ? e.message : "Unknown error fetching quiz.", variant: "destructive" });
      }
    });
  }, [toast, currentQuizLevel, hasAttemptedQuizToday]);

  useEffect(() => {
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);

    const storedLevel = localStorage.getItem(KNOWLEDGE_NUGGET_QUIZ_LEVEL_KEY);
    if (storedLevel) setCurrentQuizLevel(parseInt(storedLevel, 10));

    const storedLastAttemptDate = localStorage.getItem(KNOWLEDGE_NUGGET_LAST_ATTEMPT_DATE_KEY);
    setLastQuizAttemptDate(storedLastAttemptDate);
    if (storedLastAttemptDate === getCurrentDateString()) {
      setHasAttemptedQuizToday(true);
    }

    if (monsterGenerated === 'true' && storedImage && storedName) {
      setMonsterImageUrl(storedImage); setMonsterName(storedName);
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) setMonsterHealth(parseFloat(storedHealth));
      else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth); localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
      performNightlyRecovery();
      if (storedLastAttemptDate !== getCurrentDateString()) {
         fetchQuizQuestion();
      }
    }
  }, [performNightlyRecovery, fetchQuizQuestion]);

  useEffect(() => {
    localStorage.setItem(KNOWLEDGE_NUGGET_QUIZ_LEVEL_KEY, String(currentQuizLevel));
  }, [currentQuizLevel]);

  useEffect(() => {
    if (lastQuizAttemptDate) {
      localStorage.setItem(KNOWLEDGE_NUGGET_LAST_ATTEMPT_DATE_KEY, lastQuizAttemptDate);
    }
  }, [lastQuizAttemptDate]);


  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "the weight of knowledge"); 
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
        toast({ title: `${monsterName} Crumbles!`, description: `Overwhelmed by ${cause}, its essence dissipates at ${currentHealth.toFixed(1)}% health.`, variant: "destructive", duration: Number.MAX_SAFE_INTEGER });
        router.push('/create-monster'); return true;
      } return false;
  };

  const addPoints = (points: number) => {
    const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
    localStorage.setItem(USER_POINTS_KEY, String(currentPoints + points));
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered || !quizData || !monsterName || monsterHealth === null || hasAttemptedQuizToday) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    const isCorrect = answer === quizData.correctAnswer;
    let toastDescription = "";
    let totalPointsAwarded = 0;

    if (isCorrect) {
      totalPointsAwarded += POINTS_FOR_CORRECT_QUIZ_ANSWER;
      const monsterDamage = MONSTER_HP_REDUCTION_BASE + currentQuizLevel;
      const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterHealth - monsterDamage);
      setMonsterHealth(newHealth);
      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 700);

      toastDescription = `${monsterName} winces! Your Lvl ${currentQuizLevel} knowledge dealt ${monsterDamage} damage. Health: ${newHealth.toFixed(1)}%. You earned ${POINTS_FOR_CORRECT_QUIZ_ANSWER} points.`;

      if (currentQuizLevel === MAX_QUIZ_LEVEL) {
        totalPointsAwarded += PERFECT_LEVEL_10_BONUS_POINTS;
        toastDescription += ` Max Level ${MAX_QUIZ_LEVEL} Mastered! +${PERFECT_LEVEL_10_BONUS_POINTS} Bonus Points!`;
      } else {
        setCurrentQuizLevel(prev => Math.min(prev + 1, MAX_QUIZ_LEVEL));
        toastDescription += ` Leveled up to Quiz Level ${currentQuizLevel + 1}!`;
      }
      addPoints(totalPointsAwarded);
      if (!checkMonsterDeath(newHealth, `a correct Lvl ${currentQuizLevel} answer`)) {
        toast({ title: "Correct!", description: toastDescription, duration: 7000 });
      }
    } else {
      toastDescription = `${monsterName} scoffs: "Your ignorance at Level ${currentQuizLevel} is amusing." The correct answer was: ${quizData.correctAnswer}.`;
      toast({ title: "Incorrect!", description: toastDescription, variant: "destructive", duration: 7000 });
    }

    setLastQuizAttemptDate(getCurrentDateString());
    setHasAttemptedQuizToday(true);
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
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><HelpCircle />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Create your monster to challenge its knowledge!</p>
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
              <Badge variant="outline" className="mt-1">Quiz Level: {currentQuizLevel}</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-quiz" className="text-sm font-medium block mb-1">Monster Health: {monsterHealth.toFixed(1)}%</Label>
              <Progress id="monster-health-quiz" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Damage: {MONSTER_HP_REDUCTION_BASE + currentQuizLevel} HP</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary"/>Knowledge Nugget Quiz</CardTitle>
            <CardDescription>
              Test your knowledge. Level {currentQuizLevel}/{MAX_QUIZ_LEVEL}. Correct answers empower you and weaken your monster! One attempt per day.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAttemptedQuizToday && !isLoadingQuiz && (
              <Alert variant="default" className="bg-accent/20 border-accent">
                <Trophy className="h-4 w-4 text-accent-foreground" />
                <AlertTitle>Daily Quiz Attempted</AlertTitle>
                <AlertDescription>
                  You've already challenged your knowledge for today. Come back tomorrow for a new Level {currentQuizLevel} question!
                </AlertDescription>
              </Alert>
            )}
            {isLoadingQuiz && !hasAttemptedQuizToday && (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">{monsterName || "The AI"} is preparing a Level {currentQuizLevel} question...</p>
              </div>
            )}
            {error && !isLoadingQuiz && !hasAttemptedQuizToday && (
              <Alert variant="destructive">
                <AlertTitle>Quiz Error</AlertTitle>
                <AlertDescription>{error} Please try fetching a new one later.</AlertDescription>
              </Alert>
            )}
            {quizData && !isLoadingQuiz && !hasAttemptedQuizToday && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-foreground p-4 bg-muted/30 rounded-md">{quizData.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shuffledOptions.map((option, index) => {
                    const isCorrectOption = option === quizData.correctAnswer;
                    const isSelectedOption = option === selectedAnswer;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleAnswerSelect(option)}
                        disabled={isAnswered || hasAttemptedQuizToday}
                        className={cn(
                          "h-auto py-3 whitespace-normal justify-start text-left text-sm",
                          isAnswered && isSelectedOption && isCorrectOption && "bg-green-100 border-green-500 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:border-green-700 dark:text-green-300",
                          isAnswered && isSelectedOption && !isCorrectOption && "bg-red-100 border-red-500 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:border-red-700 dark:text-red-300",
                          isAnswered && !isSelectedOption && isCorrectOption && "bg-green-50 border-green-400 text-green-600 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                        )}
                      >
                        {isAnswered && isSelectedOption && isCorrectOption && <CheckCircle className="mr-2 h-4 w-4 shrink-0" />}
                        {isAnswered && isSelectedOption && !isCorrectOption && <XCircle className="mr-2 h-4 w-4 shrink-0" />}
                        {isAnswered && !isSelectedOption && isCorrectOption && <CheckCircle className="mr-2 h-4 w-4 shrink-0" />}
                        {option}
                      </Button>
                    );
                  })}
                </div>
                {isAnswered && quizData.explanation && (
                  <Alert variant={selectedAnswer === quizData.correctAnswer ? "default" : "destructive"} className={cn(selectedAnswer === quizData.correctAnswer && "bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700")}>
                    <AlertTitle>{selectedAnswer === quizData.correctAnswer ? "Explanation" : "The Correct Answer Was..."}</AlertTitle>
                    <AlertDescription>
                      {selectedAnswer !== quizData.correctAnswer && <p className="font-semibold mb-1">Correct Answer: {quizData.correctAnswer}</p>}
                      {quizData.explanation}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fetchQuizQuestion} disabled={isLoadingQuiz || hasAttemptedQuizToday || isAnswered} className="w-full sm:w-auto">
              {isLoadingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
              {hasAttemptedQuizToday ? "Quiz Done For Today" : (isLoadingQuiz ? "Conjuring..." : (quizData ? "Next Question (If Incorrect)" : "Get Question"))}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

