
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateMonsterRiddleAction } from '@/app/riddle-challenge/actions';
import type { MonsterRiddleOutput } from '@/ai/flows/monster-riddle-flow';

const RIDDLE_TIMER_SECONDS = 15;
const MONSTER_VOICE_CONFIG_KEY = 'monsterVoiceConfig';

interface MonsterVoiceConfig {
  voiceURI: string | null;
  pitch: number;
  rate: number;
}

interface MonsterRiddleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeComplete: (wasCorrect: boolean) => void;
}

const defaultDemonicPitch = () => parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2));
const defaultDemonicRate = () => parseFloat((Math.random() * (0.8 - 0.5) + 0.5).toFixed(2));

export default function MonsterRiddleModal({ isOpen, onClose, onChallengeComplete }: MonsterRiddleModalProps) {
  const [riddleData, setRiddleData] = useState<MonsterRiddleOutput | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(RIDDLE_TIMER_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<MonsterVoiceConfig | null>({
    voiceURI: null,
    pitch: defaultDemonicPitch(),
    rate: defaultDemonicRate(),
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const storedConfig = localStorage.getItem(MONSTER_VOICE_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        if (parsedConfig && typeof parsedConfig.pitch === 'number' && typeof parsedConfig.rate === 'number') {
          setVoiceConfig(parsedConfig);
        } else {
          throw new Error("Invalid voice config structure in localStorage");
        }
      } catch (e) {
        console.error("Failed to parse or validate monster voice config from localStorage:", e);
        // Fallback to demonic defaults if localStorage is corrupt
        setVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
      }
    }
    // If no storedConfig, the useState initial value is already demonic.
  }, [isOpen]); // Re-check localStorage if modal reopens, in case monster was re-created

  useEffect(() => {
    if (isOpen) {
      resetModal();
      fetchRiddle();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      speechSynthesis.cancel();
    };
  }, [isOpen]);

  useEffect(() => {
    // Speak riddle only when riddleData is available, voiceConfig is set, modal is open, and not currently loading.
    if (riddleData?.riddle && voiceConfig && isOpen && !isLoading) {
      speakRiddle(riddleData.riddle);
      // Timer will be started by speakRiddle's onend/onerror
    }
  }, [riddleData, voiceConfig, isOpen, isLoading]);

  useEffect(() => {
    if (timeLeft <= 0 && riddleData && !showResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleTimeOut();
    }
  }, [timeLeft, riddleData, showResult]);

  const speakRiddle = (text: string) => {
    speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceConfig) {
      if (voiceConfig.voiceURI) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceConfig.voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      utterance.pitch = voiceConfig.pitch;
      utterance.rate = voiceConfig.rate;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        if (!showResult) startTimer(); // Only start timer if no result shown yet (e.g. user hasn't answered quick)
    };
    utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        if (!showResult) startTimer(); // Start timer even on error
    };

    speechSynthesis.speak(utterance);
  };

  const resetModal = () => {
    setRiddleData(null);
    setUserAnswer('');
    setTimeLeft(RIDDLE_TIMER_SECONDS);
    setIsLoading(false);
    setError(null);
    setShowResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fetchRiddle = async () => {
    setIsLoading(true);
    setError(null);
    setRiddleData(null);
    try {
      const result = await generateMonsterRiddleAction();
      setRiddleData(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to fetch riddle.";
      setError(errorMessage);
      setRiddleData(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current); // Clear existing timer before starting new
    setTimeLeft(RIDDLE_TIMER_SECONDS); // Reset time
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
          if (typeof prev === 'number' && prev > 0) {
              return prev - 1;
          }
          // Time is up or prev is not a number
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
      });
    }, 1000);
  };

  const handleSubmitAnswer = () => {
    if (!riddleData || showResult) return;
    if (timerRef.current) clearInterval(timerRef.current);
    speechSynthesis.cancel(); // Stop monster from speaking if user submits early

    const isCorrect = userAnswer.trim().toLowerCase() === riddleData.answer.trim().toLowerCase();
    setShowResult(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      onChallengeComplete(isCorrect);
      onClose();
    }, 2500);
  };
  
  const handleTimeOut = () => {
    if (!riddleData || showResult) return; // Prevent re-triggering if already handled
    setShowResult('incorrect');
     setTimeout(() => {
      onChallengeComplete(false);
      onClose();
    }, 2500);
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Lightbulb className="h-6 w-6 text-primary" />
            Monster's Riddle Challenge!
          </DialogTitle>
          {riddleData && !isLoading && (
            <DialogDescription>
              Your monster has a riddle for you. Answer wisely!
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Monster is conjuring a riddle...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTitle>Riddle Error</AlertTitle>
            <AlertDescription>{error} The monster seems stumped. Try again later?</AlertDescription>
          </Alert>
        )}

        {riddleData && !isLoading && !error && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Button onClick={() => speakRiddle(riddleData.riddle)} variant="outline" size="sm" disabled={isSpeaking}>
                <Volume2 className="mr-2 h-4 w-4" /> {isSpeaking ? "Speaking..." : "Hear Riddle Again"}
              </Button>
            </div>
            <p className="text-lg text-center font-medium text-foreground p-4 bg-muted/50 rounded-md min-h-[100px] flex items-center justify-center">
              "{riddleData.riddle}"
            </p>
            
            <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Time Left:</span>
                    <span>{timeLeft}s</span>
                </div>
                <Progress value={(timeLeft / RIDDLE_TIMER_SECONDS) * 100} className="h-2" />
            </div>

            {!showResult ? (
              <div className="space-y-2">
                <Label htmlFor="riddle-answer">Your Answer</Label>
                <Input
                  id="riddle-answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={timeLeft <=0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userAnswer.trim() && timeLeft > 0 && !showResult) {
                      handleSubmitAnswer();
                    }
                  }}
                />
              </div>
            ) : (
              <div className={`text-center p-4 rounded-md ${showResult === 'correct' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {showResult === 'correct' ? (
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                )}
                <p className={`text-xl font-semibold ${showResult === 'correct' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {showResult === 'correct' ? 'Correct!' : timeLeft <= 0 ? 'Time\'s Up! Incorrect!' : 'Incorrect!'}
                </p>
                <p className="text-sm text-muted-foreground">The answer was: <strong>{riddleData.answer}</strong></p>
              </div>
            )}
          </div>
        )}

        {!showResult && riddleData && !isLoading && (
          <DialogFooter>
            <Button onClick={handleSubmitAnswer} disabled={isLoading || timeLeft <= 0 || !userAnswer.trim()}>
              Submit Answer
            </Button>
          </DialogFooter>
        )}
         {showResult && !isLoading && (
            <DialogFooter className="mt-4">
                 <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        )}
         {!riddleData && !isLoading && error && ( 
            <DialogFooter className="mt-4">
                 <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
