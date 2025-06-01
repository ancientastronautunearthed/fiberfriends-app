
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, Share } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { expandMonsterPromptAction, generateMonsterImageAction } from './actions';
import { useToast } from '@/hooks/use-toast';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_VOICE_CONFIG_KEY = 'monsterVoiceConfig';
const MONSTER_HAS_SPOKEN_KEY = 'monsterHasSpokenFirstTime';


const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;

// Function to generate demonic pitch and rate
const generateDemonicPitch = () => parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2)); // Deep: 0.1 to 0.5
const generateDemonicRate = () => parseFloat((Math.random() * (0.8 - 0.5) + 0.5).toFixed(2));  // Slow: 0.5 to 0.8


export default function CreateMonsterPage() {
  const [words, setWords] = useState('');
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false);

  const [isExpanding, startExpandingTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const { toast } = useToast();

  const selectAndStoreVoice = () => {
    const voices = speechSynthesis.getVoices();
    
    let selectedVoiceURI: string | null = null;
    const pitch = generateDemonicPitch();
    const rate = generateDemonicRate();

    if (voices.length === 0) {
        localStorage.setItem(MONSTER_VOICE_CONFIG_KEY, JSON.stringify({ 
            voiceURI: null, 
            pitch: pitch, 
            rate: rate   
        }));
        localStorage.setItem(MONSTER_HAS_SPOKEN_KEY, 'false');
        return;
    }


    // Attempt to find a somewhat "monster-like" voice.
    const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
    // Prefer non-standard, male, or deeper sounding voices if possible
    const nonStandardEnglishVoices = englishVoices.filter(v => 
        !v.name.toLowerCase().includes('standard') && 
        !v.name.toLowerCase().includes('default') &&
        !v.name.toLowerCase().includes('natural') && 
        !v.name.toLowerCase().includes('google us english') && 
        !v.name.toLowerCase().includes('microsoft david') && 
        !v.name.toLowerCase().includes('microsoft zira') &&
        !v.name.toLowerCase().includes('female') && // try to avoid explicitly female voices
        !(v as any).gender?.toLowerCase().includes('female')
    );
    
    const maleEnglishVoices = englishVoices.filter(v => 
        v.name.toLowerCase().includes('male') || 
        (v as any).gender?.toLowerCase().includes('male')
    );
    
    let candidateVoices: SpeechSynthesisVoice[] = [];

    if (nonStandardEnglishVoices.length > 0) {
        candidateVoices = nonStandardEnglishVoices;
    } else if (maleEnglishVoices.length > 0) {
        candidateVoices = maleEnglishVoices;
    } else if (englishVoices.length > 0) {
        candidateVoices = englishVoices;
    } else {
        candidateVoices = voices; // Fallback to any available voice
    }

    if (candidateVoices.length > 0) {
        selectedVoiceURI = candidateVoices[Math.floor(Math.random() * candidateVoices.length)].voiceURI;
    }
    
    localStorage.setItem(MONSTER_VOICE_CONFIG_KEY, JSON.stringify({ 
        voiceURI: selectedVoiceURI, 
        pitch: pitch, 
        rate: rate 
    }));
    localStorage.setItem(MONSTER_HAS_SPOKEN_KEY, 'false');
  };


  const handleWordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDetailedPrompt(null);
    setImageUrl(null);
    setMonsterName(null);

    const wordArray = words.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (wordArray.length !== 5) {
      setError("Please provide exactly 5 words.");
      toast({
        title: "Input Error",
        description: "Please provide exactly 5 words.",
        variant: "destructive",
      });
      return;
    }

    startExpandingTransition(async () => {
      try {
        const expansionResult = await expandMonsterPromptAction({ words: wordArray });
        setDetailedPrompt(expansionResult.detailedPrompt);
        setMonsterName(expansionResult.monsterName);
        
        startGeneratingTransition(async () => {
          try {
            const imageResult = await generateMonsterImageAction({ detailedPrompt: expansionResult.detailedPrompt });
            setImageUrl(imageResult.imageUrl);
            setHasGeneratedInSession(true);
            
            localStorage.setItem(MONSTER_GENERATED_KEY, 'true');
            localStorage.setItem(MONSTER_IMAGE_KEY, imageResult.imageUrl);
            localStorage.setItem(MONSTER_NAME_KEY, expansionResult.monsterName);
            
            const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
            localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
            
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                // Ensure voices are loaded before selecting
                if (speechSynthesis.getVoices().length === 0) {
                    speechSynthesis.onvoiceschanged = () => {
                        selectAndStoreVoice();
                        speechSynthesis.onvoiceschanged = null; // Important to prevent multiple calls
                    };
                } else {
                    selectAndStoreVoice();
                }
            } else {
                // Fallback if speech synthesis is not supported
                localStorage.setItem(MONSTER_VOICE_CONFIG_KEY, JSON.stringify({ 
                    voiceURI: null, 
                    pitch: generateDemonicPitch(), 
                    rate: generateDemonicRate() 
                }));
                localStorage.setItem(MONSTER_HAS_SPOKEN_KEY, 'false');
            }

             toast({
                title: "Monster Revealed!",
                description: `Your unique Morgellon Monster, ${expansionResult.monsterName}, has been generated with ${initialHealth}% health. It is now your profile identity. It may even speak to you... with a unique, deep voice!`,
                variant: "default",
            });

          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Image generation failed.";
            setError(errorMessage);
            toast({
              title: "Image Generation Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Prompt expansion or name generation failed.";
        setError(errorMessage);
        toast({
          title: "Monster Conception Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  if (hasGeneratedInSession && imageUrl && monsterName) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>Your Morgellon Monster: {monsterName}</CardTitle>
          <CardDescription>This is your unique, inner monster. Its name, form, and deep voice are now bound to your profile.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image src={imageUrl} alt={`Your Morgellon Monster: ${monsterName}`} width={512} height={512} className="rounded-lg border object-cover mx-auto shadow-lg" data-ai-hint="generated monster" />
            <p className="text-sm text-muted-foreground mt-4">You can view it on your profile page and track its health in the Food Log. It might even have a riddle for you...</p>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row justify-center gap-2 pt-4">
             <Button asChild variant="outline">
                <Link href="/doctor-forum">
                    <Share className="mr-2 h-4 w-4" />
                    Share Your Monster on the Forum!
                </Link>
            </Button>
             <Button onClick={() => {
                setHasGeneratedInSession(false); 
                setImageUrl(null);
                setMonsterName(null);
                setWords('');
             }} variant="secondary">
                Create Another Monster
            </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary"/>Create Your Morgellon Monster</CardTitle>
        <CardDescription>
          This is a special one-time ritual for our valued members.
          Describe your inner Morgellon Monster in exactly 5 words. Our AI will then conjure its image, reveal its name, and give it a unique, randomized deep and demonic voice.
          This image, name, voice, and its initial health will become your unique profile identity. Choose your words wisely.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleWordSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="monster-words">Your 5 Words</Label>
            <Input
              id="monster-words"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="e.g., Shadow, Whispers, Crystal, Chains, Deep"
              disabled={isExpanding || isGenerating || hasGeneratedInSession}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate words with spaces. Exactly 5 words required.</p>
          </div>

          {(isExpanding || isGenerating) && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-sm text-foreground">
                {isExpanding && !isGenerating && "Expanding your vision, discovering its name..."}
                {isGenerating && "The AI is conjuring your monster... and finding its unique, deep voice..."}
              </p>
              {detailedPrompt && !isGenerating && monsterName && (
                <p className="text-xs text-muted-foreground mt-2 italic">Initial vision for {monsterName}: "{detailedPrompt.substring(0,100)}..."</p>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {!hasGeneratedInSession && (
            <Button type="submit" disabled={isExpanding || isGenerating} className="w-full">
              {(isExpanding || isGenerating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isExpanding ? 'Crafting Essence...' : isGenerating ? 'Conjuring Monster...' : 'Reveal My Monster'}
            </Button>
          )}
          { hasGeneratedInSession && <p className="text-xs text-muted-foreground text-center">You have generated your monster. Click "Create Another Monster" above if you wish to try again (this will replace your current monster and its voice).</p>}
        </CardFooter>
      </form>
    </Card>
  );
}
