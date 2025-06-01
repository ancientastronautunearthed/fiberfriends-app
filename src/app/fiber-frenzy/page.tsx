
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Play, Repeat, Trophy, Gamepad2, ShieldAlert, CalendarDays, BadgeCent, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const MONSTER_NAME_KEY = 'morgellonMonsterName';
const CURRENT_LEVEL_KEY = 'FIBER_FRENZY_CURRENT_LEVEL';
const LAST_PLAY_INFO_KEY = 'FIBER_FRENZY_LAST_PLAY_INFO';
const EARNED_BADGES_KEY = 'FIBER_FRENZY_EARNED_BADGES';

const MAX_LEVELS = 100;
const PRE_L10_DAILY_LEVEL_CAP = 10;
const BADGE_INTERVAL = 10;

interface Fiber {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface LevelConfig {
  targetScore: number;
  spawnInterval: number;
  maxFibers: number;
  fiberSize: { min: number; max: number };
  duration: number; // in seconds
}

interface LastPlayInfo {
  date: string; // YYYY-MM-DD
  levelsCompletedPreL10Today: number;
  hasCompletedLevelPostL10Today: boolean;
}

const getInitialLevelConfig = (level: number): LevelConfig => {
  // Base values
  let targetScore = 5 + Math.floor(level / 2);
  let spawnInterval = 1000 - level * 7; // Faster spawn with level
  let maxFibers = 5 + Math.floor(level / 5);
  let fiberMinSize = 20 - Math.floor(level / 10);
  let fiberMaxSize = 30 - Math.floor(level / 8);
  let duration = 30 - Math.floor(level / 10); // Shorter duration with level

  // Clamp values to be reasonable
  targetScore = Math.min(targetScore, 50); // Max 50 fibers to click
  spawnInterval = Math.max(spawnInterval, 200); // Min 200ms spawn interval
  maxFibers = Math.min(maxFibers, 15);
  fiberMinSize = Math.max(fiberMinSize, 8);
  fiberMaxSize = Math.max(fiberMaxSize, 15);
  duration = Math.max(duration, 10); // Min 10 seconds duration

  return {
    targetScore,
    spawnInterval,
    maxFibers,
    fiberSize: { min: fiberMinSize, max: fiberMaxSize },
    duration,
  };
};


export default function FiberFrenzyGamePage() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'levelComplete' | 'gameOver' | 'dailyLimitReached' | 'allLevelsComplete'>('idle');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(getInitialLevelConfig(1));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getInitialLevelConfig(1).duration);
  const [fibers, setFibers] = useState<Fiber[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
  const [lastPlayInfo, setLastPlayInfo] = useState<LastPlayInfo | null>(null);
  const [canPlayCurrentLevel, setCanPlayCurrentLevel] = useState(true);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fiberSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);

  const getCurrentDateString = () => new Date().toISOString().split('T')[0];

  // Load state from localStorage
  useEffect(() => {
    setIsLoadingState(true);
    const storedMonsterName = localStorage.getItem(MONSTER_NAME_KEY);
    if (storedMonsterName) setMonsterName(storedMonsterName);

    const storedLevel = localStorage.getItem(CURRENT_LEVEL_KEY);
    const initialLevel = storedLevel ? parseInt(storedLevel, 10) : 1;
    setCurrentLevel(initialLevel);
    setLevelConfig(getInitialLevelConfig(initialLevel));
    setTimeLeft(getInitialLevelConfig(initialLevel).duration);


    const storedBadges = localStorage.getItem(EARNED_BADGES_KEY);
    if (storedBadges) setEarnedBadges(JSON.parse(storedBadges));

    const storedLastPlayInfo = localStorage.getItem(LAST_PLAY_INFO_KEY);
    const today = getCurrentDateString();
    let currentPlayInfo: LastPlayInfo;

    if (storedLastPlayInfo) {
      const parsedInfo: LastPlayInfo = JSON.parse(storedLastPlayInfo);
      if (parsedInfo.date === today) {
        currentPlayInfo = parsedInfo;
      } else {
        // New day, reset daily counters
        currentPlayInfo = { date: today, levelsCompletedPreL10Today: 0, hasCompletedLevelPostL10Today: false };
      }
    } else {
      currentPlayInfo = { date: today, levelsCompletedPreL10Today: 0, hasCompletedLevelPostL10Today: false };
    }
    setLastPlayInfo(currentPlayInfo);
    checkIfCanPlay(initialLevel, currentPlayInfo);
    setIsLoadingState(false);
  }, []);

  const checkIfCanPlay = (level: number, playInfo: LastPlayInfo | null) => {
    if (!playInfo) { // Should not happen if initialized correctly
        setCanPlayCurrentLevel(false); // Default to cannot play if info is missing
        setGameState('dailyLimitReached');
        return;
    }

    if (level > MAX_LEVELS) {
        setCanPlayCurrentLevel(false);
        setGameState('allLevelsComplete');
        return;
    }

    const today = getCurrentDateString();
    // Ensure playInfo is for today, if not, it should have been reset
    if (playInfo.date !== today) {
        const freshPlayInfo = { date: today, levelsCompletedPreL10Today: 0, hasCompletedLevelPostL10Today: false };
        setLastPlayInfo(freshPlayInfo);
        localStorage.setItem(LAST_PLAY_INFO_KEY, JSON.stringify(freshPlayInfo));
        setCanPlayCurrentLevel(true);
        return;
    }
    
    if (level <= 10) {
      if (playInfo.levelsCompletedPreL10Today >= PRE_L10_DAILY_LEVEL_CAP) {
        setCanPlayCurrentLevel(false);
        setGameState('dailyLimitReached');
      } else {
        setCanPlayCurrentLevel(true);
      }
    } else { // Level > 10
      if (playInfo.hasCompletedLevelPostL10Today) {
        setCanPlayCurrentLevel(false);
        setGameState('dailyLimitReached');
      } else {
        setCanPlayCurrentLevel(true);
      }
    }
  };


  const getRandomPosition = useCallback(() => {
    if (!gameAreaRef.current) return { x: 0, y: 0, size: 20 };
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    const currentFiberSize = Math.random() * (levelConfig.fiberSize.max - levelConfig.fiberSize.min) + levelConfig.fiberSize.min;
    const x = Math.random() * (gameAreaRect.width - currentFiberSize);
    const y = Math.random() * (gameAreaRect.height - currentFiberSize);
    return { x, y, size: currentFiberSize };
  }, [levelConfig]);

  const spawnFiber = useCallback(() => {
    if (fibers.length >= levelConfig.maxFibers) return;
    const { x, y, size } = getRandomPosition();
    const newFiber: Fiber = { id: Date.now() + Math.random(), x, y, size };
    setFibers(prevFibers => [...prevFibers, newFiber]);
  }, [fibers.length, levelConfig, getRandomPosition]);

  const startGame = () => {
    if (!canPlayCurrentLevel || currentLevel > MAX_LEVELS) {
        checkIfCanPlay(currentLevel, lastPlayInfo); // Re-check to set correct game state if idle
        return;
    }
    setScore(0);
    const config = getInitialLevelConfig(currentLevel);
    setLevelConfig(config);
    setTimeLeft(config.duration);
    setFibers([]);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setGameState('gameOver');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      fiberSpawnTimerRef.current = setInterval(spawnFiber, levelConfig.spawnInterval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fiberSpawnTimerRef.current) clearInterval(fiberSpawnTimerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fiberSpawnTimerRef.current) clearInterval(fiberSpawnTimerRef.current);
    };
  }, [gameState, spawnFiber, levelConfig.spawnInterval]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      let description = `You zapped ${score} fibers but needed ${levelConfig.targetScore} for Level ${currentLevel}. Try again?`;
      if (monsterName) description = `${monsterName} chuckles: '${description}'`;
      toast({ title: "Game Over!", description, duration: 7000 });
    } else if (gameState === 'levelComplete') {
      let description = `Level ${currentLevel -1 } complete! You zapped all ${score} fibers.`;
      if (monsterName) description = `${monsterName} grunts: '${description} Next!'`;
      toast({ title: "Level Up!", description, duration: 7000 });

      // Check for badges
      if ((currentLevel -1) % BADGE_INTERVAL === 0 && (currentLevel -1) > 0 && !earnedBadges.includes(currentLevel - 1)) {
        const newBadges = [...earnedBadges, currentLevel - 1];
        setEarnedBadges(newBadges);
        localStorage.setItem(EARNED_BADGES_KEY, JSON.stringify(newBadges));
        toast({
          title: "Badge Unlocked!",
          description: `You earned the Level ${currentLevel -1} Fiber Vanquisher badge!`,
          duration: 7000,
        });
      }
    }
  }, [gameState, score, toast, monsterName, currentLevel, levelConfig.targetScore, earnedBadges]);

  const handleFiberClick = (id: number) => {
    if (gameState !== 'playing') return;
    setFibers(prevFibers => prevFibers.filter(fiber => fiber.id !== id));
    const newScore = score + 1;
    setScore(newScore);

    if (newScore >= levelConfig.targetScore) {
      clearInterval(timerRef.current!);
      clearInterval(fiberSpawnTimerRef.current!);
      
      const newLevel = currentLevel + 1;
      localStorage.setItem(CURRENT_LEVEL_KEY, String(newLevel));
      
      const today = getCurrentDateString();
      let updatedPlayInfo = { ...lastPlayInfo!, date: today }; // Ensure date is today

      if (currentLevel <= 10) {
        updatedPlayInfo.levelsCompletedPreL10Today = (updatedPlayInfo.levelsCompletedPreL10Today || 0) + 1;
      } else {
        updatedPlayInfo.hasCompletedLevelPostL10Today = true;
      }
      setLastPlayInfo(updatedPlayInfo);
      localStorage.setItem(LAST_PLAY_INFO_KEY, JSON.stringify(updatedPlayInfo));
      
      setCurrentLevel(newLevel); // This will trigger useEffect to update levelConfig and timeLeft for next level display
      setGameState('levelComplete');
      checkIfCanPlay(newLevel, updatedPlayInfo); // Check if next level can be played
    }
  };

  useEffect(() => {
      const newConfig = getInitialLevelConfig(currentLevel);
      setLevelConfig(newConfig);
      setTimeLeft(newConfig.duration);
      // Re-check playability when level changes, especially after level up
      if (lastPlayInfo) {
          checkIfCanPlay(currentLevel, lastPlayInfo);
      }
  }, [currentLevel, lastPlayInfo]);


  if (isLoadingState) {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4"/>
            <p className="text-muted-foreground">Loading Fiber Frenzy State...</p>
        </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Gamepad2 className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle className="font-headline text-3xl">Fiber Frenzy!</CardTitle>
        <CardDescription>Zap the fibers! Level {currentLevel}/{MAX_LEVELS}.</CardDescription>
         {earnedBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
                {earnedBadges.map(badgeLevel => (
                    <Badge key={badgeLevel} variant="secondary" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1 text-amber-500"/> Lvl {badgeLevel}
                    </Badge>
                ))}
            </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 items-center p-3 bg-muted rounded-lg text-center">
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-bold text-primary">{score} / {levelConfig.targetScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-2xl font-bold text-primary">{currentLevel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="text-2xl font-bold text-primary">{timeLeft}s</p>
          </div>
        </div>
        <Progress value={(timeLeft / levelConfig.duration) * 100} className="h-2"/>


        <div
          ref={gameAreaRef}
          className={cn(
            "relative w-full h-80 rounded-lg overflow-hidden cursor-crosshair",
            "bg-gradient-to-br from-slate-200 via-gray-100 to-stone-200 dark:from-slate-800 dark:via-gray-900 dark:to-stone-900", // Simplified body-like BG
            "border-2 border-dashed border-primary/50"
          )}
          role="application"
          aria-label="Fiber Frenzy game area"
        >
          {fibers.map(fiber => (
            <div
              key={fiber.id}
              className="absolute rounded-sm animate-pulse" // elongated effect via aspect ratio if needed
              style={{
                left: `${fiber.x}px`,
                top: `${fiber.y}px`,
                width: `${fiber.size * 1.5}px`, // Make it more rectangular
                height: `${fiber.size}px`,
                backgroundColor: `hsl(${Math.random() * 60 + 20}, 70%, 60%)`, // yellows, oranges, reds
                boxShadow: `0 0 ${fiber.size / 3}px hsl(${Math.random() * 60 + 20}, 70%, 60%)`,
                transition: 'opacity 0.2s ease-out, transform 0.1s ease-out',
                opacity: gameState === 'playing' ? 1 : 0.5,
                transform: `rotate(${Math.random() * 15 - 7.5}deg)`, // Slight random rotation
              }}
              onClick={() => handleFiberClick(fiber.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFiberClick(fiber.id);}}
              role="button"
              tabIndex={gameState === 'playing' ? 0 : -1}
              aria-label="Zap fiber"
            />
          ))}
        </div>

        {gameState === 'idle' && canPlayCurrentLevel && currentLevel <= MAX_LEVELS && (
          <Button onClick={startGame} className="w-full text-lg py-3" size="lg">
            <Play className="mr-2" /> Start Level {currentLevel}
          </Button>
        )}

        {gameState === 'playing' && (
          <p className="text-center text-primary animate-pulse">Zapping in progress... Click 'em all!</p>
        )}
        
        {gameState === 'levelComplete' && currentLevel <= MAX_LEVELS && canPlayCurrentLevel && (
          <div className="text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-amber-500" />
            <p className="text-2xl font-semibold">Level {currentLevel -1} Complete!</p>
            <Button onClick={startGame} className="w-full sm:w-auto text-lg py-3" size="lg">
              <Play className="mr-2" /> Start Level {currentLevel}
            </Button>
          </div>
        )}
        
        {gameState === 'levelComplete' && currentLevel > MAX_LEVELS && (
             <div className="text-center space-y-3 p-4 bg-green-100 dark:bg-green-900 rounded-md">
                <Trophy className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">ALL LEVELS CONQUERED!</p>
                <p className="text-muted-foreground">You are a true Fiber Frenzy Master! You've beaten all {MAX_LEVELS} levels.</p>
            </div>
        )}
        
        {gameState === 'levelComplete' && !canPlayCurrentLevel && (
             <div className="text-center space-y-3 p-4 bg-blue-100 dark:bg-blue-900 rounded-md">
                <CalendarDays className="h-10 w-10 mx-auto text-blue-500" />
                <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">Nice Job! Daily Limit Reached.</p>
                <p className="text-muted-foreground">You've completed your fiber zapping for today. Come back tomorrow for Level {currentLevel}!</p>
            </div>
        )}


        {gameState === 'gameOver' && (
          <div className="text-center space-y-3">
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-2xl font-semibold">Failed Level {currentLevel}</p>
            <p className="text-muted-foreground">You zapped {score} out of {levelConfig.targetScore} fibers.</p>
            <Button onClick={startGame} className="w-full sm:w-auto text-lg py-3" size="lg" disabled={!canPlayCurrentLevel}>
              <Repeat className="mr-2" /> Try Level {currentLevel} Again
            </Button>
             {!canPlayCurrentLevel && <p className="text-xs text-destructive mt-1">Daily limit reached for this level. Try again tomorrow.</p>}
          </div>
        )}

        {gameState === 'dailyLimitReached' && (
            <div className="text-center space-y-3 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                <CalendarDays className="h-10 w-10 mx-auto text-yellow-600 dark:text-yellow-400" />
                <p className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">Daily Play Limit Reached</p>
                <p className="text-sm text-muted-foreground">
                    {currentLevel <=10 ? `You've completed ${PRE_L10_DAILY_LEVEL_CAP} levels today (max for levels 1-10).` : `You've completed your level for today.`}
                    <br/>Come back tomorrow to continue your Fiber Frenzy adventure!
                </p>
            </div>
        )}

         {gameState === 'allLevelsComplete' && (
            <div className="text-center space-y-3 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                <BadgeCent className="h-12 w-12 mx-auto text-purple-500" />
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">Congratulations, Fiber Master!</p>
                <p className="text-muted-foreground">You've conquered all {MAX_LEVELS} levels of Fiber Frenzy! An incredible feat!</p>
            </div>
        )}


      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
            Earn badges every {BADGE_INTERVAL} levels. Difficulty increases with each level.
        </p>
      </CardFooter>
    </Card>
  );
}


