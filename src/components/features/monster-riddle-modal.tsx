
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, CheckCircle, XCircle, Volume2, Eraser, MessageSquareQuote, VenetianMask } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateMonsterRiddleAction } from '@/app/riddle-challenge/actions';
import type { MonsterRiddleOutput } from '@/ai/flows/monster-riddle-flow';
import { cn } from '@/lib/utils';

const RIDDLE_TIMER_SECONDS = 20; // Increased timer for multiple choice
const MONSTER_VOICE_CONFIG_KEY = 'monsterVoiceConfig';
const USER_POINTS_KEY = 'userPoints';

const REMOVE_ONE_COST = 25;
const PHONE_FRIEND_COST = 50;

// For "Tales from the Crypt" like voice
const CRYPT_KEEPER_PITCH = 1.6; // Higher pitch
const CRYPT_KEEPER_RATE = 1.2;  // Slightly faster, more animated

const MONSTER_FRIEND_NAMES = ["Gravelguts", "Moldrot", "Shadoweaver", "Crypticlaw", "Gloomfang", "Whisperwind"];


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
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(RIDDLE_TIMER_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [userMonsterVoiceConfig, setUserMonsterVoiceConfig] = useState<MonsterVoiceConfig | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [monsterFriendMessage, setMonsterFriendMessage] = useState<string | null>(null);

  const [userPoints, setUserPoints] = useState(0);
  const [removeOneUsed, setRemoveOneUsed] = useState(false);
  const [phoneFriendUsed, setPhoneFriendUsed] = useState(false);

  const fetchUserPoints = useCallback(() => {
    const pointsStr = localStorage.getItem(USER_POINTS_KEY);
    setUserPoints(pointsStr ? parseInt(pointsStr, 10) : 0);
  }, []);

  useEffect(() => {
    const storedConfig = localStorage.getItem(MONSTER_VOICE_CONFIG_KEY);
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        if (parsedConfig && typeof parsedConfig.pitch === 'number' && typeof parsedConfig.rate === 'number') {
          setUserMonsterVoiceConfig(parsedConfig);
        } else {
          setUserMonsterVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
        }
      } catch (e) {
        setUserMonsterVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
      }
    } else {
        setUserMonsterVoiceConfig({ voiceURI: null, pitch: defaultDemonicPitch(), rate: defaultDemonicRate() });
    }
    fetchUserPoints();
  }, [isOpen, fetchUserPoints]);

  const shuffleArray = (array: string[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

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
    if (riddleData?.riddle && userMonsterVoiceConfig && isOpen && !isLoading && !monsterFriendMessage) {
      speakText(riddleData.riddle, userMonsterVoiceConfig, () => {
        if (!showResult && !monsterFriendMessage) startTimer();
      });
    }
  }, [riddleData, userMonsterVoiceConfig, isOpen, isLoading, monsterFriendMessage, showResult]);


  useEffect(() => {
    if (timeLeft <= 0 && riddleData && !showResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleTimeOut();
    }
  }, [timeLeft, riddleData, showResult]);

  const speakText = (text: string, voiceConfig: MonsterVoiceConfig | {pitch: number, rate: number, voiceURI?: string | null}, onEndCallback?: () => void) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceConfig.voiceURI) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.voiceURI === voiceConfig.voiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
    }
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        onEndCallback?.();
    };
    utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        onEndCallback?.(); // Call callback even on error
    };
    speechSynthesis.speak(utterance);
  };

  const resetModal = () => {
    setRiddleData(null);
    setShuffledOptions([]);
    setDisabledOptions([]);
    setTimeLeft(RIDDLE_TIMER_SECONDS);
    setIsLoading(false);
    setError(null);
    setShowResult(null);
    setRemoveOneUsed(false);
    setPhoneFriendUsed(false);
    setMonsterFriendMessage(null);
    fetchUserPoints();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fetchRiddle = async () => {
    setIsLoading(true); setError(null); setRiddleData(null);
    try {
      const result = await generateMonsterRiddleAction();
      setRiddleData(result);
      setShuffledOptions(shuffleArray(result.options));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch riddle.");
      setRiddleData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(RIDDLE_TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
  };

  const handleAnswerSubmit = (selectedAnswer: string) => {
    if (!riddleData || showResult) return;
    if (timerRef.current) clearInterval(timerRef.current);
    speechSynthesis.cancel();

    const isCorrect = selectedAnswer.trim().toLowerCase() === riddleData.correctAnswer.trim().toLowerCase();
    setShowResult(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      onChallengeComplete(isCorrect);
      onClose();
    }, 2500);
  };
  
  const handleTimeOut = () => {
    if (!riddleData || showResult) return;
    setShowResult('incorrect');
    setTimeout(() => {
      onChallengeComplete(false);
      onClose();
    }, 2500);
  };

  const handleRemoveOneLifeline = () => {
    if (!riddleData || removeOneUsed || userPoints < REMOVE_ONE_COST || disabledOptions.length > 0) return;
    
    const incorrectOptions = riddleData.options.filter(opt => opt !== riddleData.correctAnswer);
    if (incorrectOptions.length > 0) {
      const optionToRemove = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      setDisabledOptions([optionToRemove]);
      setUserPoints(prev => prev - REMOVE_ONE_COST);
      localStorage.setItem(USER_POINTS_KEY, String(userPoints - REMOVE_ONE_COST));
      setRemoveOneUsed(true);
    }
  };

  const handlePhoneFriendLifeline = () => {
    if (!riddleData || phoneFriendUsed || userPoints < PHONE_FRIEND_COST) return;
    
    speechSynthesis.cancel(); // Cancel current monster speech
    if (timerRef.current) clearInterval(timerRef.current); // Stop timer

    const friendName = MONSTER_FRIEND_NAMES[Math.floor(Math.random() * MONSTER_FRIEND_NAMES.length)];
    const friendAnswerText = `${friendName} cackles... 'Hee hee heee! The answer, my dear, is obviously... ${riddleData.correctAnswer}!'`;
    setMonsterFriendMessage(friendAnswerText);

    speakText(friendAnswerText, { pitch: CRYPT_KEEPER_PITCH, rate: CRYPT_KEEPER_RATE }, () => {
       // Optional: Auto-select or highlight correct answer, or just let user click
       // For now, just resume timer if user hasn't answered
       if (!showResult) startTimer();
    });
    
    setUserPoints(prev => prev - PHONE_FRIEND_COST);
    localStorage.setItem(USER_POINTS_KEY, String(userPoints - PHONE_FRIEND_COST));
    setPhoneFriendUsed(true);
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Lightbulb className="h-6 w-6 text-primary" />
            Monster's Riddle Challenge!
          </DialogTitle>
          {riddleData && !isLoading && (
            <DialogDescription>
              Your monster has a multiple choice riddle. You have {RIDDLE_TIMER_SECONDS} seconds once it starts!
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
              <Button onClick={() => speakText(riddleData.riddle, userMonsterVoiceConfig || { pitch: defaultDemonicPitch(), rate: defaultDemonicRate() })} variant="outline" size="sm" disabled={isSpeaking || !!monsterFriendMessage}>
                <Volume2 className="mr-2 h-4 w-4" /> {isSpeaking && !monsterFriendMessage ? "My Monster Speaking..." : "Hear My Monster Again"}
              </Button>
            </div>
            <p className="text-lg text-center font-medium text-foreground p-4 bg-muted/50 rounded-md min-h-[100px] flex items-center justify-center">
              "{riddleData.riddle}"
            </p>
            
            {monsterFriendMessage && (
                <div className="p-3 my-2 bg-purple-100 dark:bg-purple-900/30 rounded-md border border-purple-300 dark:border-purple-700 text-center">
                    <p className="text-sm italic text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2">
                        <VenetianMask className="h-5 w-5"/> {monsterFriendMessage}
                    </p>
                </div>
            )}

            <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Time Left:</span>
                    <span>{timeLeft}s</span>
                </div>
                <Progress value={(timeLeft / RIDDLE_TIMER_SECONDS) * 100} className="h-2" />
            </div>

            {!showResult ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {shuffledOptions.map((option, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className={cn("h-auto py-3 whitespace-normal justify-start text-left", disabledOptions.includes(option) && "opacity-50 cursor-not-allowed")}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={timeLeft <= 0 || disabledOptions.includes(option) || phoneFriendUsed} // Disable options if friend answered
                  >
                    {option}
                  </Button>
                ))}
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
                <p className="text-sm text-muted-foreground">The answer was: <strong>{riddleData.correctAnswer}</strong></p>
              </div>
            )}

            {!showResult && timeLeft > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="secondary" 
                  onClick={handleRemoveOneLifeline} 
                  disabled={removeOneUsed || userPoints < REMOVE_ONE_COST || phoneFriendUsed || disabledOptions.length > 0}
                  className="flex-1"
                >
                  <Eraser className="mr-2 h-4 w-4"/> Remove One ({REMOVE_ONE_COST} pts)
                  {!removeOneUsed && userPoints < REMOVE_ONE_COST && <span className="text-xs ml-1 text-destructive/80">(Need {REMOVE_ONE_COST})</span>}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handlePhoneFriendLifeline} 
                  disabled={phoneFriendUsed || userPoints < PHONE_FRIEND_COST}
                  className="flex-1"
                >
                  <MessageSquareQuote className="mr-2 h-4 w-4"/> Ask Friend ({PHONE_FRIEND_COST} pts)
                  {!phoneFriendUsed && userPoints < PHONE_FRIEND_COST && <span className="text-xs ml-1 text-destructive/80">(Need {PHONE_FRIEND_COST})</span>}
                </Button>
              </div>
            )}
             <p className="text-xs text-center text-muted-foreground mt-2">Your Points: {userPoints}</p>
          </div>
        )}

        {(showResult || (!riddleData && !isLoading)) && ( // Show close if result is shown, or if no riddle and not loading (e.g. error state)
            <DialogFooter className="mt-4">
                 <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

