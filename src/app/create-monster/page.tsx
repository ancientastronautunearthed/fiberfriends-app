
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

export default function CreateMonsterPage() {
  const [words, setWords] = useState('');
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false); // Tracks generation within the current page session

  const [isExpanding, startExpandingTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const { toast } = useToast();

  // Removed useEffect that checked localStorage for MONSTER_GENERATED_KEY on mount.
  // This allows the form to be presented fresh on each page load/visit.

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
            setHasGeneratedInSession(true); // Mark as generated for the current session
            localStorage.setItem(MONSTER_GENERATED_KEY, 'true'); // Still set this for other parts of app that might use it
            localStorage.setItem(MONSTER_IMAGE_KEY, imageResult.imageUrl);
            localStorage.setItem(MONSTER_NAME_KEY, expansionResult.monsterName);
             toast({
                title: "Monster Revealed!",
                description: `Your unique Morgellon Monster, ${expansionResult.monsterName}, has been generated and set as your profile image.`,
                variant: "default",
            });

          } catch (e) {
            setError(e instanceof Error ? e.message : "Image generation failed.");
            toast({
              title: "Image Generation Error",
              description: e instanceof Error ? e.message : "Could not conjure the monster image.",
              variant: "destructive",
            });
          }
        });

      } catch (e) {
        setError(e instanceof Error ? e.message : "Prompt expansion or name generation failed.");
        toast({
          title: "Monster Conception Error",
          description: e instanceof Error ? e.message : "Could not craft the monster's essence (name or description).",
          variant: "destructive",
        });
      }
    });
  };

  // This view shows after a monster is generated IN THE CURRENT SESSION
  if (hasGeneratedInSession && imageUrl && monsterName) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>Your Morgellon Monster: {monsterName}</CardTitle>
          <CardDescription>This is your unique, inner monster. Its name and form are now bound to your profile.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image src={imageUrl} alt={`Your Morgellon Monster: ${monsterName}`} width={512} height={512} className="rounded-lg border object-cover mx-auto shadow-lg" data-ai-hint="generated monster" />
            <p className="text-sm text-muted-foreground mt-4">You can view it on your profile page.</p>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row justify-center gap-2 pt-4">
             <Button asChild variant="outline">
                <Link href="/doctor-forum">
                    <Share className="mr-2 h-4 w-4" />
                    Share Your Monster on the Forum!
                </Link>
            </Button>
             <Button onClick={() => {
                setHasGeneratedInSession(false); // Allow re-generation
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
  
  // This logic path for pre-generated monsters being loaded from localStorage is no longer hit on initial load
  // because the useEffect that set hasGenerated based on localStorage was removed.

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary"/>Create Your Morgellon Monster</CardTitle>
        <CardDescription>
          This is a special one-time ritual for our valued members.
          Describe your inner Morgellon Monster in exactly 5 words. Our AI will then conjure its image and reveal its name.
          This image and name will become your unique profile identity. Choose your words wisely, for the monster, once revealed, cannot be changed.
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
                {isGenerating && "The AI is conjuring your monster from the æther... be patient!"}
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

          {/* This section is now covered by the `if (hasGeneratedInSession && imageUrl && monsterName)` block above */}
          {/* {imageUrl && monsterName && !isGenerating && (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-headline mb-2 text-primary">Behold! Your Morgellon Monster, {monsterName}!</h3>
              <Image src={imageUrl} alt={`Generated Morgellon Monster: ${monsterName}`} width={400} height={400} className="rounded-lg border object-cover mx-auto shadow-lg" data-ai-hint="generated monster" />
            </div>
          )} */}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {!hasGeneratedInSession && ( // Button shown if no monster generated in current session
            <Button type="submit" disabled={isExpanding || isGenerating} className="w-full">
              {(isExpanding || isGenerating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isExpanding ? 'Crafting Essence...' : isGenerating ? 'Conjuring Monster...' : 'Reveal My Monster'}
            </Button>
          )}
          { hasGeneratedInSession && <p className="text-xs text-muted-foreground text-center">You have generated your monster for this session. Click "Create Another Monster" above if you wish to try again.</p>}
        </CardFooter>
      </form>
    </Card>
  );
}
