'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, ShieldCheck, CheckCircle, Sparkles, AlertTriangle, Wand2, ListChecks, Eye, Loader2 as IconLoader, Trophy, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import LoadingPlaceholder from '@/components/ui/loading-placeholder';
import { cn } from '@/lib/utils';
import { generateMonsterImageAction } from '@/app/create-monster/actions';

const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const USER_POINTS_KEY = 'userPoints';
const DAILY_REWARD_CLAIMED_PREFIX = 'dailyBattlePlanRewardClaimed_';
const MONSTER_SLAYING_IMAGE_VAULT_KEY = 'monsterSlayingImageVault';

const FOOD_LOG_KEY = 'morgellonFoodLogEntries';
const EXERCISE_LOG_KEY = 'morgellonExerciseLogEntries';
const PRODUCT_TRACKER_WORKING_KEY = 'workingProducts';
const PRODUCT_TRACKER_NOT_WORKING_KEY = 'notWorkingProducts';
const PRESCRIPTION_TRACKER_BENEFICIAL_KEY = 'beneficialPrescriptionsLog';
const PRESCRIPTION_TRACKER_OTHER_KEY = 'otherPrescriptionsLog';
const SYMPTOM_JOURNAL_ENTRIES_KEY = 'fiberFriendsSymptomJournalEntries';
const SLEEP_LOG_ENTRIES_KEY = 'morgellonSleepLogEntries';
const KNOWLEDGE_NUGGET_LAST_ATTEMPT_DATE_KEY = 'knowledgeNuggetQuizLastAttemptDate';
const MINDFUL_MOMENT_DAILY_USAGE_KEY = 'mindfulMomentDailyUsage';
const KINDNESS_CHALLENGE_CURRENT_TASK_KEY = 'kindnessChallengeCurrentTask';
const TRUSTED_DOCTOR_NAME = "Dr. Anya Sharma, MD";

const DAILY_VICTORY_BONUS_POINTS = 75;

interface Story {
  id: string;
  author: string;
  avatar: string;
  avatarAiHint: string;
  time: string;
  content: string;
  imageUrl?: string;
  imageAiHint?: string;
  likes: number;
  comments: number;
  isTrustedDoctorPost?: boolean;
}

const initialStories: Story[] = [
   {
    id: "doc-story-1",
    author: TRUSTED_DOCTOR_NAME,
    avatar: "https://placehold.co/40x40.png",
    avatarAiHint: "professional doctor",
    time: "3 hours ago",
    content: "Hello everyone, Dr. Sharma here. I want to emphasize the importance of self-compassion on this journey. It's okay to have difficult days. Acknowledge your feelings without judgment. Small acts of self-care can make a difference. We're here to support each other.",
    imageUrl: "https://placehold.co/600x400.png?text=Compassion",
    imageAiHint: "calm peaceful scene",
    likes: 180,
    comments: 25,
    isTrustedDoctorPost: true,
  },
  {
    id: "1",
    author: "Elara Vance",
    avatar: "https://placehold.co/40x40.png?text=EV",
    avatarAiHint: "woman smiling",
    time: "2 hours ago",
    content: "Just needed a space to share... today was tough. The itching, the fatigue, and the feeling of being misunderstood by another doctor. It's exhausting. Grateful for this community where I know I'm not alone. Sending love to everyone fighting this.",
    imageUrl: "https://placehold.co/600x400.png?text=Support",
    imageAiHint: "abstract light",
    likes: 152,
    comments: 31,
  },
  {
    id: "2",
    author: "Marcus Thorne",
    avatar: "https://placehold.co/40x40.png?text=MT",
    avatarAiHint: "man portrait",
    time: "5 hours ago",
    content: "Found a new coping mechanism that seems to help with the crawling sensations: cold compresses and mindfulness. It doesn't make it go away, but it makes it more bearable. Has anyone else tried something similar? Your experience is real, and so is your strength.",
    likes: 221,
    comments: 83,
  },
  {
    id: "3",
    author: "Aisha Khan",
    avatar: "https://placehold.co/40x40.png?text=AK",
    avatarAiHint: "person thinking",
    time: "1 day ago",
    content: "Feeling hopeful today. Had a good conversation with a friend who actually listened without judgment. It's amazing how much that can lift your spirits. Small victories!",
    imageUrl: "https://placehold.co/600x400.png?text=Hope",
    imageAiHint: "sunrise landscape",
    likes: 98,
    comments: 12,
  },
];

interface DailyTask {
  id: string;
  label: string;
  href: string;
  isCompleted: boolean;
  goalCount?: number;
  currentCount?: number;
}

function DailyBattlePlanCard({ monsterName, monsterImageUrl, monsterHealth }: { monsterName: string; monsterImageUrl: string; monsterHealth: number | null }) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [rewardClaimedToday, setRewardClaimedToday] = useState(false);
  const [generatedSlayingImage, setGeneratedSlayingImage] = useState<string | null>(null);
  const [isClaimingReward, startClaimRewardTransition] = useTransition();
  const [isGeneratingSlayingImage, setIsGeneratingSlayingImage] = useState(false);
  const { toast } = useToast();

  const getCurrentDateString = useCallback(() => new Date().toISOString().split('T')[0], []);

  const countEntriesForToday = useCallback((storageKeys: string | string[], dateField: 'loggedAt' | 'date' = 'loggedAt'): number => {
    if (typeof window === 'undefined') return 0;
    const keys = Array.isArray(storageKeys) ? storageKeys : [storageKeys];
    const todayStr = getCurrentDateString();
    let totalCount = 0;

    keys.forEach(key => {
      const logRaw = localStorage.getItem(key);
      if (!logRaw) return;
      try {
        const logEntries = JSON.parse(logRaw);
        if (!Array.isArray(logEntries)) return;
        // Correctly filter and count entries for the current key
        totalCount += logEntries.filter((entry: any) => {
          if (dateField === 'loggedAt' && entry.loggedAt && typeof entry.loggedAt === 'string') {
            return entry.loggedAt.startsWith(todayStr);
          } else if (dateField === 'date' && entry.date && typeof entry.date === 'string') {
            return entry.date === todayStr;
          }
          return false;
        }).length;
      } catch { /* ignore parse errors for a single key */ } // TODO: Consider more robust error handling/logging
    });
 return totalCount;
  }, [getCurrentDateString]); // Move closing parenthesis here
  const checkTaskCompletion = useCallback(() => {
    if (typeof window === 'undefined') return;
    setTasksLoading(true);
    const todayStr = getCurrentDateString();

    const foodEntriesToday = countEntriesForToday(FOOD_LOG_KEY, 'loggedAt');
    const supplementEntriesToday = countEntriesForToday([PRODUCT_TRACKER_WORKING_KEY, PRODUCT_TRACKER_NOT_WORKING_KEY], 'loggedAt');
    const prescriptionEntriesToday = countEntriesForToday([PRESCRIPTION_TRACKER_BENEFICIAL_KEY, PRESCRIPTION_TRACKER_OTHER_KEY], 'loggedAt');
    const exerciseEntriesToday = countEntriesForToday(EXERCISE_LOG_KEY, 'loggedAt');
    const symptomEntriesToday = countEntriesForToday(SYMPTOM_JOURNAL_ENTRIES_KEY, 'date');
    const sleepEntriesToday = countEntriesForToday(SLEEP_LOG_ENTRIES_KEY, 'date');

    const quizCompletedToday = localStorage.getItem(KNOWLEDGE_NUGGET_LAST_ATTEMPT_DATE_KEY) === todayStr;
    
    let mindfulCompletedToday = false;
    const mindfulUsageRaw = localStorage.getItem(MINDFUL_MOMENT_DAILY_USAGE_KEY);
    if (mindfulUsageRaw) {
        try {
            const mindfulUsage = JSON.parse(mindfulUsageRaw);
            if (mindfulUsage.date === todayStr && mindfulUsage.minutesCompletedToday > 0) {
                mindfulCompletedToday = true;
            }
        } catch {}
    }

    let kindnessCompletedToday = false;
    const kindnessTaskRaw = localStorage.getItem(KINDNESS_CHALLENGE_CURRENT_TASK_KEY);
    if (kindnessTaskRaw) {
        try {
            const kindnessTask = JSON.parse(kindnessTaskRaw);
            if (kindnessTask.date === todayStr && kindnessTask.isCompleted) {
                kindnessCompletedToday = true;
            }
        } catch {}
    }
    
    const updatedTasks: DailyTask[] = [
      { id: 'food', label: "Log Meals & Snacks", href: "/food-log", currentCount: foodEntriesToday, goalCount: 5, isCompleted: foodEntriesToday >= 5 },
      { id: 'supplements', label: "Log Supplements", href: "/product-tracker", currentCount: supplementEntriesToday, goalCount: 3, isCompleted: supplementEntriesToday >= 3 },
      { id: 'prescriptions', label: "Log Prescriptions", href: "/prescription-tracker", isCompleted: prescriptionEntriesToday > 0 },
      { id: 'exercise', label: "Log Exercise", href: "/exercise-log", isCompleted: exerciseEntriesToday > 0 },
      { id: 'symptoms', label: "Log Symptoms", href: "/symptom-journal", isCompleted: symptomEntriesToday > 0 },
      { id: 'sleep', label: "Log Sleep", href: "/sleep-log", isCompleted: sleepEntriesToday > 0 },
      { id: 'quiz', label: "Knowledge Quiz", href: "/knowledge-nugget-quiz", isCompleted: quizCompletedToday },
      { id: 'mindful', label: "Mindful Moment", href: "/mindful-moment", isCompleted: mindfulCompletedToday },
      { id: 'kindness', label: "Kindness Challenge", href: "/kindness-challenge", isCompleted: kindnessCompletedToday },
    ];
    
    setTasks(updatedTasks);
    setAllTasksCompleted(updatedTasks.every(task => task.isCompleted));
    setTasksLoading(false);
  }, [getCurrentDateString, countEntriesForToday]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    checkTaskCompletion();
    const claimed = localStorage.getItem(DAILY_REWARD_CLAIMED_PREFIX + getCurrentDateString()) === 'true';
    setRewardClaimedToday(claimed);

    let intervalId: NodeJS.Timeout | null = null;
    if (!allTasksCompleted && !claimed) {
      intervalId = setInterval(checkTaskCompletion, 30000); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkTaskCompletion, allTasksCompleted, rewardClaimedToday, getCurrentDateString]);

  const handleClaimReward = () => {
    if (!allTasksCompleted || rewardClaimedToday || isClaimingReward || isGeneratingSlayingImage || !monsterName || !monsterImageUrl) return;

    startClaimRewardTransition(async () => {
      setIsGeneratingSlayingImage(true);
      toast({
        title: "Claiming Daily Victory...",
        description: `Generating a slaying image for ${monsterName}... This may take a moment.`,
        duration: 5000,
      });
      console.log("[DEBUG] DailyBattlePlan: Calling generateMonsterImageAction");
      try {
        if (typeof window !== 'undefined') {
            const currentPoints = parseInt(localStorage.getItem(USER_POINTS_KEY) || '0', 10);
            localStorage.setItem(USER_POINTS_KEY, String(currentPoints + DAILY_VICTORY_BONUS_POINTS));
        }

        const imageResult = await generateMonsterImageAction({
          detailedPrompt: `${monsterName} in a victorious pose after completing the Daily Battle Plan. The monster should look defeated but in an epic, dramatic way. Achievement: Victory! ${monsterName} completed all daily wellness tasks!`,
        });
        console.log("[DEBUG] DailyBattlePlan: Image generation result:", imageResult);

        if (imageResult && imageResult.imageUrl) {
            setGeneratedSlayingImage(imageResult.imageUrl);
            if (typeof window !== 'undefined') {
                const vaultRaw = localStorage.getItem(MONSTER_SLAYING_IMAGE_VAULT_KEY);
                const vault = vaultRaw ? JSON.parse(vaultRaw) : [];
                vault.unshift({ date: getCurrentDateString(), imageUrl: imageResult.imageUrl, monsterName: monsterName });
                localStorage.setItem(MONSTER_SLAYING_IMAGE_VAULT_KEY, JSON.stringify(vault.slice(0, 10)));
            }
            toast({
              title: "Daily Victory Achieved!",
              description: `You earned ${DAILY_VICTORY_BONUS_POINTS} points and a new Slaying Image for ${monsterName}!`,
              duration: 7000,
            });
        } else {
            console.error("[DEBUG] DailyBattlePlan: Image generation failed, no imageUrl in result:", imageResult);
            toast({
              title: "Victory Points Claimed!",
              description: `You earned ${DAILY_VICTORY_BONUS_POINTS} points! The victory image for ${monsterName} couldn't be generated this time.`,
              variant: "default",
              duration: 7000,
            });
        }
        
        if (typeof window !== 'undefined') {
            localStorage.setItem(DAILY_REWARD_CLAIMED_PREFIX + getCurrentDateString(), 'true');
        }
        setRewardClaimedToday(true);

      } catch (error) {
        console.error("[DEBUG] DailyBattlePlan: Error claiming reward / generating image:", error);
        toast({
          title: "Reward Error",
          description: `Could not claim reward: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      } finally {
        setIsGeneratingSlayingImage(false);
      }
    });
  };

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <Card className="shadow-lg border-primary/30">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Target className="h-7 w-7 text-primary"/> Daily Battle Plan for {monsterName}
        </CardTitle>
        <CardDescription>Complete all daily tasks to earn bonus points and a unique "Monster Slaying" image!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 mb-3">
            <div className="flex justify-between text-sm font-medium">
                <span>Progress:</span>
                <span>{completedCount} / {totalTasks} Tasks</span>
            </div>
            <Progress value={tasksLoading ? 0 : (completedCount / totalTasks) * 100} className="h-2.5" />
        </div>

        {tasksLoading ? (
          <div className="flex items-center justify-center p-6">
            <IconLoader className="h-6 w-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading daily tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map(task => (
              <Link href={task.href} key={task.id} legacyBehavior>
                <a className={cn(
                  "flex items-center justify-between p-3 rounded-md border transition-all hover:shadow-md",
                  task.isCompleted ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-700" : "bg-card hover:bg-muted/50"
                )}>
                  <span className={cn("text-sm", task.isCompleted ? "text-green-700 dark:text-green-300 font-medium" : "text-foreground")}>
                    {task.label}
                    {task.goalCount && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({task.currentCount ?? 0}/{task.goalCount})
                      </span>
                    )}
                  </span>
                  {task.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </a>
              </Link>
            ))}
          </div>
        )}
        
        {!tasksLoading && isGeneratingSlayingImage && (
           <div className="mt-4 p-3 rounded-md bg-blue-100 dark:bg-blue-800/30 border border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
              <IconLoader className="h-5 w-5 animate-spin" />
              <p className="font-medium">Generating your monster's victory pose...</p>
            </div>
        )}

        {!tasksLoading && allTasksCompleted && !rewardClaimedToday && !isGeneratingSlayingImage && (
          <Button onClick={handleClaimReward} disabled={isClaimingReward || isGeneratingSlayingImage} className="w-full mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground">
            {(isClaimingReward || isGeneratingSlayingImage) ? <IconLoader className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
            {(isClaimingReward || isGeneratingSlayingImage) ? "Claiming Victory & Image..." : "Claim Daily Victory Reward!"}
          </Button>
        )}
        {!tasksLoading && rewardClaimedToday && !isGeneratingSlayingImage && (
          <div className="mt-4 p-3 rounded-md bg-green-100 dark:bg-green-800/30 border border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <div>
                <p className="font-semibold">Daily Victory Claimed!</p>
                <p className="text-xs">Excellent work, warrior!</p>
            </div>
          </div>
        )}
        {generatedSlayingImage && !isGeneratingSlayingImage && (
          <div className="mt-4 p-4 border rounded-md bg-muted/30">
            <h3 className="font-semibold text-lg text-center mb-2">Your {monsterName}'s Victory Pose!</h3>
            {generatedSlayingImage && ( // Conditional rendering for Image
              <Image src={generatedSlayingImage} alt={`${monsterName} Slaying Image`} width={512} height={512} className="rounded-md object-cover mx-auto border-2 border-primary shadow-lg" data-ai-hint="generated monster victory pose" />
            )}
            <p className="text-xs text-muted-foreground text-center mt-2">This image has been saved to your Monster Slaying Image Vault (accessible via My Profile in future).</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function BeliefCirclePage() {
  const [isClient, setIsClient] = useState(false);
  const [monsterGenerated, setMonsterGenerated] = useState(false);
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [userMonsterName, setUserMonsterName] = useState<string | null>(null);
  const [userMonsterImageUrl, setUserMonsterImageUrl] = useState<string | null>(null);
  const [userMonsterHealth, setUserMonsterHealth] = useState<number | null>(null);
  const [monsterDetailsLoading, setMonsterDetailsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("[DEBUG] BeliefCirclePage: Main useEffect triggered.");
    setIsClient(true);
    const generated = localStorage.getItem(MONSTER_GENERATED_KEY) === 'true';
    console.log("[DEBUG] BeliefCirclePage: MONSTER_GENERATED_KEY from localStorage:", generated);
    setMonsterGenerated(generated);
    setMonsterDetailsLoading(true);

    if (generated) {
      const name = localStorage.getItem(MONSTER_NAME_KEY);
      const imageUrl = localStorage.getItem(MONSTER_IMAGE_KEY);
      const healthStr = localStorage.getItem(MONSTER_HEALTH_KEY);
      console.log("[DEBUG] BeliefCirclePage: Loaded from localStorage:", { name, imageUrl, healthStr });

      setUserMonsterName(name);
      setUserMonsterImageUrl(imageUrl);
      if (healthStr) {
        setUserMonsterHealth(parseFloat(healthStr));
      }
    } else {
      setUserMonsterName(null);
      setUserMonsterImageUrl(null);
      setUserMonsterHealth(null);
    }
    setMonsterDetailsLoading(false);
    
  }, []);

  const handlePostStory = (e: React.FormEvent) => {    e.preventDefault();
    e.preventDefault();
    if (!newStoryContent.trim()) {
      toast({
        title: "Empty Post",
        description: "Please write something to share.",
        variant: "destructive",
      });
      return;
    }

    const authorNameToUse = userMonsterName || "Community Member";
    const authorImageToUse = userMonsterImageUrl || "https://placehold.co/40x40.png?text=CM";
    const authorImageHint = userMonsterImageUrl ? "user monster" : "community member";


    const newStory: Story = {
      id: String(Date.now()),
      author: authorNameToUse,
      avatar: authorImageToUse,
      avatarAiHint: authorImageHint,
      time: "Just now",
      content: newStoryContent.trim(),
      likes: 0,
      comments: 0,
    };

    setStories(prevStories => [newStory, ...prevStories]);
    setNewStoryContent('');
    toast({
      title: "Story Shared!",
      description: "Your thoughts have been added to the Comrades' Campfire (locally for this session).",
    });
  };

  if (!isClient) {
    console.log("[DEBUG] BeliefCirclePage: Rendering LoadingPlaceholder (isClient false).");
    return <LoadingPlaceholder message="Preparing Battle HQ..." />;
  }
  
  console.log("[DEBUG] BeliefCirclePage: Before main render - isClient:", isClient, "monsterGenerated:", monsterGenerated, "monsterDetailsLoading:", monsterDetailsLoading, "userMonsterName:", userMonsterName, "userMonsterImageUrl:", userMonsterImageUrl);


  if (!monsterGenerated) {
    console.log("[DEBUG] BeliefCirclePage: Rendering 'Create Monster' prompt.");
    return (
      <Card className="max-w-lg mx-auto my-10">
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="font-headline text-2xl">Welcome to Fiber Friends!</CardTitle>
          <CardDescription>
            To begin your journey and access all features, you first need to summon your personal Nemesis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-center">
            This unique AI-generated monster will represent your health challenges and react to your daily progress.
          </p>
          <Button asChild className="w-full">
            <Link href="/create-monster"><Wand2 className="mr-2 h-4 w-4" />Summon Your Nemesis</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (monsterDetailsLoading) {
      console.log("[DEBUG] BeliefCirclePage: Rendering LoadingPlaceholder (monsterDetailsLoading true).");
      return <LoadingPlaceholder message="Loading your Battle HQ details..." />;
  }

  if (!userMonsterName || !userMonsterImageUrl) {
      console.log("[DEBUG] BeliefCirclePage: Rendering 'Nemesis Data Incomplete' card.");
      return (
        <Card className="max-w-lg mx-auto my-10">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-2" />
            <CardTitle className="font-headline text-xl">DEBUG: YOU ARE SEEING THE 'NEMESIS DATA INCOMPLETE' CARD.</CardTitle>
            <CardTitle className="font-headline text-xl mt-2">Nemesis Data Incomplete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-center">
              It seems your Nemesis was summoned, but some crucial details (name or image) are missing from local storage. This can sometimes happen if the summoning ritual was interrupted or data was cleared.
            </p>
            <p className="text-muted-foreground mb-4 text-center">
              Please try re-conjuring your Nemesis to ensure all its aspects are correctly recorded. This will allow you to access features like the Daily Battle Plan.
            </p>
            <Button asChild className="w-full">
              <Link href="/create-monster"><Wand2 className="mr-2 h-4 w-4" />Re-Conjure Your Nemesis</Link>
            </Button>
          </CardContent>
        </Card>
      );
  }

  console.log("[DEBUG] BeliefCirclePage: Rendering DailyBattlePlanCard and community stories.");
  return (
    <div className="space-y-8">
      <DailyBattlePlanCard
        monsterName={userMonsterName} 
        monsterImageUrl={userMonsterImageUrl} 
        monsterHealth={userMonsterHealth}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Share Your Story</CardTitle>
          <CardDescription>This is a safe space. Your experience is real and valid.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePostStory}>
          <CardContent>
            <Textarea 
              placeholder="What's on your mind today?" 
              className="min-h-[100px]"
              value={newStoryContent}
              onChange={(e) => setNewStoryContent(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Post to Comrades' Campfire</Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-semibold text-foreground">Community Stories</h2>
        {stories.map((story) => (
          <Card key={story.id} className={story.isTrustedDoctorPost ? 'border-2 border-primary bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={story.avatar} alt={story.author} data-ai-hint={story.avatarAiHint} />
                  <AvatarFallback>{story.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center">
                    {story.author}
                    {story.isTrustedDoctorPost && (
                      <Badge variant="default" className="ml-2 text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Trusted Advisor
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{story.time}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{story.content}</p>
              {story.imageUrl && (
                <Image
                  src={story.imageUrl}
                  alt="User uploaded content"
                  width={600}
                  height={400}
                  className="rounded-lg border object-cover"
                  data-ai-hint={story.imageAiHint}
                />
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between text-muted-foreground border-t pt-4 mt-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" /> {story.likes} Likes
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> {story.comments} Comments
              </Button>
              <Button variant="link" size="sm">Read More</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}