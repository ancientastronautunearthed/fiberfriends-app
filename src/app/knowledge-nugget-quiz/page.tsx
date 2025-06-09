'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, Sparkles, Skull, CheckCircle, XCircle, HelpCircle, Info, Trophy, Gem, AlertCircle as AlertCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateQuizQuestionAction } from './actions';
import type { QuizQuestionOutput } from '@/ai/flows/knowledge-nugget-quiz-flow';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { firestoreService, type MonsterData } from '@/lib/firestore-service';

const MAX_QUIZ_LEVEL = 10;
const MAX_BASIC_QUIZ_LEVEL = 5; 
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

const POINTS_FOR_CORRECT_QUIZ_ANSWER = 15;
const MONSTER_HP_REDUCTION_BASE = 4; 
const PERFECT_LEVEL_10_BONUS_POINTS = 100;

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Knowledge Quiz...</p>
    </div>
  );
}

export default function KnowledgeNuggetQuizPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);

  const [monsterData, setMonsterData] = useState<MonsterData | null>(null);
  
  const [currentQuizLevel, setCurrentQuizLevel] = useState<number>(1);
  const [hasAttemptedQuizToday, setHasAttemptedQuizToday] = useState<boolean>(false);
  const [showPremiumUpgradePrompt, setShowPremiumUpgradePrompt] = useState<boolean>(false);

  const [quizData, setQuizData] = useState<QuizQuestionOutput | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoadingQuiz, startLoadingQuizTransition] = useTransition();
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        description: `While you rested, I regained ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`, 
        duration: 7000 
      });
    }
  }, [user, monsterData, toast]);

  const fetchQuizQuestion = useCallback((levelToFetch: number) => {
    if (hasAttemptedQuizToday || showPremiumUpgradePrompt) return;

    setError(null);
    setQuizData(null);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShuffledOptions([]);
    startLoadingQuizTransition(async () => {
      try {
        const result = await generateQuizQuestionAction({ difficultyLevel: levelToFetch });
        setQuizData(result);
        setShuffledOptions([...result.options].sort(() => Math.random() - 0.5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch quiz question.");
        toast({ 
          title: "Quiz Error", 
          description: e instanceof Error ? e.message : "Unknown error fetching quiz.", 
          variant: "destructive" 
        });
      }
    });
  }, [toast, hasAttemptedQuizToday, showPremiumUpgradePrompt]);

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

        // Load quiz progress from completion data
        const today = getCurrentDateString();
        const completion = await firestoreService.getCompletion(user.uid, 'quiz', today);
        
        let loadedLevel = 1;
        if (completion && completion.data?.currentLevel) {
          loadedLevel = completion.data.currentLevel;
        }
        setCurrentQuizLevel(loadedLevel);

        let attemptToday = false;
        if (completion && completion.completed) {
          attemptToday = true;
          setHasAttemptedQuizToday(true);
        }

        let shouldShowPremium = false;
        if (loadedLevel > MAX_BASIC_QUIZ_LEVEL) {
          shouldShowPremium = true;
          setShowPremiumUpgradePrompt(true);
        }
        
        if (!attemptToday && !shouldShowPremium) {
          fetchQuizQuestion(loadedLevel);
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
  }, [user, fetchQuizQuestion, toast]);

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
        title: `${monsterData.name} Crumbles!`, 
        description: `Overwhelmed by ${cause}, its essence dissipates at ${currentHealth.toFixed(1)}% health.`, 
        variant: "destructive", 
        duration: Number.MAX_SAFE_INTEGER 
      });

      router.push('/create-monster');
      return true;
    }
    return false;
  }, [monsterData, user, router, toast]);

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || !quizData || !monsterData || !user || hasAttemptedQuizToday || showPremiumUpgradePrompt) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    const isCorrect = answer === quizData.correctAnswer;
    let toastDescription = "";
    let totalPointsAwarded = 0;

    try {
      if (isCorrect) {
        totalPointsAwarded += POINTS_FOR_CORRECT_QUIZ_ANSWER;
        const monsterDamage = MONSTER_HP_REDUCTION_BASE + currentQuizLevel;
        const newHealth = Math.min(MAX_MONSTER_HEALTH, monsterData.health - monsterDamage);
        
        // Update monster health
        await firestoreService.updateMonsterData(user.uid, { health: newHealth });
        setMonsterData(prev => prev ? { ...prev, health: newHealth } : null);

        setShowDamageEffect(true);
        setTimeout(() => setShowDamageEffect(false), 700);

        toastDescription = `${monsterData.name} winces! Your Lvl ${currentQuizLevel} knowledge dealt ${monsterDamage} damage. Health: ${newHealth.toFixed(1)}%. You earned ${POINTS_FOR_CORRECT_QUIZ_ANSWER} points.`;

        const nextLevel = currentQuizLevel + 1;
        if (currentQuizLevel === MAX_QUIZ_LEVEL) {
          totalPointsAwarded += PERFECT_LEVEL_10_BONUS_POINTS;
          toastDescription += ` Max Level ${MAX_QUIZ_LEVEL} Mastered! +${PERFECT_LEVEL_10_BONUS_POINTS} Bonus Points!`;
        } else if (nextLevel > MAX_BASIC_QUIZ_LEVEL && nextLevel <= MAX_QUIZ_LEVEL) {
          if (currentQuizLevel === MAX_BASIC_QUIZ_LEVEL) {
             setShowPremiumUpgradePrompt(true); 
             toastDescription += ` You've mastered Level ${currentQuizLevel}! Advanced levels require Premium.`;
             setCurrentQuizLevel(nextLevel); 
          } else {
              setCurrentQuizLevel(nextLevel);
              toastDescription += ` Leveled up to Quiz Level ${nextLevel}!`;
          }
        } else { 
          setCurrentQuizLevel(nextLevel);
          toastDescription += ` Leveled up to Quiz Level ${nextLevel}!`;
        }

        // Add points
        await firestoreService.addPoints(user.uid, totalPointsAwarded);
        await refreshUserProfile();

        if (!(await checkMonsterDeath(newHealth, `a correct Lvl ${currentQuizLevel} answer`))) {
          toast({ 
            title: "Correct!", 
            description: toastDescription, 
            duration: 7000 
          });
        }
      } else {
        toastDescription = `${monsterData.name} scoffs: "Your ignorance at Level ${currentQuizLevel} is amusing." The correct answer was: ${quizData.correctAnswer}.`;
        toast({ 
          title: "Incorrect!", 
          description: toastDescription, 
          variant: "destructive", 
          duration: 7000 
        });
      }

      // Save completion data
      const today = getCurrentDateString();
      await firestoreService.setCompletion(user.uid, 'quiz', {
        currentLevel: currentQuizLevel,
        answeredCorrectly: isCorrect,
        completedAt: new Date().toISOString()
      });

      setHasAttemptedQuizToday(true);
    } catch (error) {
      console.error('Error handling answer selection:', error);
      toast({
        title: "Error",
        description: "Failed to process quiz answer.",
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

  const handleGetNextQuestion = () => {
    if (showPremiumUpgradePrompt) return; // If prompt is shown, don't fetch new question.
    fetchQuizQuestion(currentQuizLevel);
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
          <p className="text-center text-muted-foreground mb-4">Please log in to challenge your knowledge!</p>
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
          <p className="text-center text-muted-foreground mb-4">Create your monster to challenge its knowledge!</p>
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
              <Badge variant="outline" className="mt-1">Quiz Level: {currentQuizLevel}</Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-quiz" className="text-sm font-medium block mb-1">
                Monster Health: {monsterData.health.toFixed(1)}%
              </Label>
              <Progress id="monster-health-quiz" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Base Damage: {MONSTER_HP_REDUCTION_BASE + currentQuizLevel} HP</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary"/>
              Knowledge Nugget Quiz
            </CardTitle>
            <CardDescription>
              Test your knowledge. Level {currentQuizLevel}/{MAX_QUIZ_LEVEL}. Correct answers empower you and weaken your monster! One attempt per day.
              Levels {MAX_BASIC_QUIZ_LEVEL + 1}-{MAX_QUIZ_LEVEL} are a Premium feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAttemptedQuizToday && !showPremiumUpgradePrompt && (
              <Alert variant="default" className="bg-accent/20 border-accent">
                <Trophy className="h-4 w-4 text-accent-foreground" />
                <AlertTitle>Daily Quiz Attempted</AlertTitle>
                <AlertDescription>
                  You've already challenged your knowledge for today. Come back tomorrow for a new Level {currentQuizLevel} question!
                </AlertDescription>
              </Alert>
            )}
             {showPremiumUpgradePrompt && (
                <Alert variant="default" className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
                    <Gem className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-700 dark:text-amber-300 font-semibold">Advanced Quiz Levels Locked!</AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-400 text-sm">
                        Congratulations on mastering Level {MAX_BASIC_QUIZ_LEVEL}!
                        Quiz Levels {MAX_BASIC_QUIZ_LEVEL + 1} through {MAX_QUIZ_LEVEL} offer deeper insights and are part of our Premium subscription.
                        <Link href="/landing#pricing" className="block text-xs text-amber-700 dark:text-amber-300 hover:underline mt-1 font-semibold">Upgrade to Premium to continue leveling up!</Link>
                    </AlertDescription>
                </Alert>
            )}
            {isLoadingQuiz && !hasAttemptedQuizToday && !showPremiumUpgradePrompt && (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">{monsterData?.name || "The AI"} is preparing a Level {currentQuizLevel} question...</p>
              </div>
            )}
            {error && !isLoadingQuiz && !hasAttemptedQuizToday && !showPremiumUpgradePrompt && (
              <Alert variant="destructive">
                <AlertTitle>Quiz Error</AlertTitle>
                <AlertDescription>{error} Please try fetching a new one later.</AlertDescription>
              </Alert>
            )}
            {quizData && !isLoadingQuiz && !hasAttemptedQuizToday && !showPremiumUpgradePrompt && (
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
            <Button onClick={handleGetNextQuestion} 
                disabled={isLoadingQuiz || hasAttemptedQuizToday || showPremiumUpgradePrompt || (isAnswered && selectedAnswer === quizData?.correctAnswer && currentQuizLevel >= MAX_QUIZ_LEVEL) } 
                className="w-full sm:w-auto"
            >
              {isLoadingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
              {hasAttemptedQuizToday ? "Quiz Done For Today" : 
                (isLoadingQuiz ? "Conjuring..." : 
                    (quizData && isAnswered && selectedAnswer !== quizData?.correctAnswer) ? "Try Next Question (Same Level)" :
                    (quizData && currentQuizLevel >= MAX_QUIZ_LEVEL && selectedAnswer === quizData?.correctAnswer) ? "Max Level Reached!" :
                    (quizData ? "Next Question" : "Get Question")
                )
              }
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}