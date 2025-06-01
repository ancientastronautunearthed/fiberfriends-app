
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Play, Repeat, Trophy, Gamepad2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GAME_DURATION_SECONDS = 30;
const FIBER_SPAWN_INTERVAL_MS = 800;
const MAX_FIBERS_ON_SCREEN = 10;
const MONSTER_NAME_KEY = 'morgellonMonsterName';

interface Fiber {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export default function FiberFrenzyGamePage() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [fibers, setFibers] = useState<Fiber[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fiberSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [monsterName, setMonsterName] = useState<string | null>(null);

  useEffect(() => {
    const storedMonsterName = localStorage.getItem(MONSTER_NAME_KEY);
    if (storedMonsterName) {
      setMonsterName(storedMonsterName);
    }
  }, []);

  const getRandomPosition = useCallback(() => {
    if (!gameAreaRef.current) return { x: 0, y: 0 };
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    // Ensure fibers spawn within bounds and are fully visible
    const size = Math.random() * 15 + 10; // min 10px, max 25px
    const x = Math.random() * (gameAreaRect.width - size);
    const y = Math.random() * (gameAreaRect.height - size);
    return { x, y, size };
  }, []);

  const spawnFiber = useCallback(() => {
    if (fibers.length >= MAX_FIBERS_ON_SCREEN) return;
    const { x, y, size } = getRandomPosition();
    const newFiber: Fiber = {
      id: Date.now() + Math.random(), // More unique ID
      x,
      y,
      color: `hsl(${Math.random() * 360}, 70%, 70%)`,
      size,
    };
    setFibers(prevFibers => [...prevFibers, newFiber]);
  }, [fibers.length, getRandomPosition]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
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

      fiberSpawnTimerRef.current = setInterval(spawnFiber, FIBER_SPAWN_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fiberSpawnTimerRef.current) clearInterval(fiberSpawnTimerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fiberSpawnTimerRef.current) clearInterval(fiberSpawnTimerRef.current);
    };
  }, [gameState, spawnFiber]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      let description = `You zapped ${score} fibers! Not bad, human.`;
      if (monsterName) {
        if (score > 20) description = `${monsterName} grunts: 'Impressive, ${score} fibers. You're becoming a nuisance.'`;
        else if (score > 10) description = `${monsterName} sniffs: 'Only ${score} fibers? Barely worth my attention.'`;
        else description = `${monsterName} yawns: 'Just ${score} fibers? My grandmother could zap more in her sleep.'`;
      }
      toast({
        title: "Game Over!",
        description: description,
        duration: 5000,
      });
    }
  }, [gameState, score, toast, monsterName]);

  const handleFiberClick = (id: number) => {
    if (gameState !== 'playing') return;
    setFibers(prevFibers => prevFibers.filter(fiber => fiber.id !== id));
    setScore(prevScore => prevScore + 1);
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Gamepad2 className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle className="font-headline text-3xl">Fiber Frenzy!</CardTitle>
        <CardDescription>Zap the mischievous fibers before time runs out! How many can you get?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-around items-center p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-3xl font-bold text-primary">{score}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time Left</p>
            <p className="text-3xl font-bold text-primary">{timeLeft}s</p>
          </div>
        </div>

        <div
          ref={gameAreaRef}
          className="relative w-full h-80 bg-background border-2 border-dashed border-primary rounded-lg overflow-hidden cursor-crosshair"
          role="application"
          aria-label="Fiber Frenzy game area"
        >
          {fibers.map(fiber => (
            <div
              key={fiber.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${fiber.x}px`,
                top: `${fiber.y}px`,
                width: `${fiber.size}px`,
                height: `${fiber.size}px`,
                backgroundColor: fiber.color,
                boxShadow: `0 0 ${fiber.size / 2}px ${fiber.color}`,
                transition: 'opacity 0.2s ease-out',
                opacity: gameState === 'playing' ? 1 : 0.5,
              }}
              onClick={() => handleFiberClick(fiber.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFiberClick(fiber.id);}}
              role="button"
              tabIndex={0}
              aria-label="Zap fiber"
            />
          ))}
        </div>

        {gameState === 'idle' && (
          <Button onClick={startGame} className="w-full text-lg py-3" size="lg">
            <Play className="mr-2" /> Start Game
          </Button>
        )}

        {gameState === 'playing' && (
          <p className="text-center text-primary animate-pulse">Zapping in progress... Good luck!</p>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-amber-500" />
            <p className="text-2xl font-semibold">Round Over! Final Score: {score}</p>
            <Button onClick={startGame} className="w-full sm:w-auto text-lg py-3" size="lg">
              <Repeat className="mr-2" /> Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
