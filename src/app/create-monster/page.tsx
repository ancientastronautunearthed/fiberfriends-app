
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, CheckCircle } from "lucide-react";
import Image from "next/image";
import { expandMonsterPromptAction, generateMonsterImageAction } from './actions';
import { useToast } from '@/hooks/use-toast';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';

export default function CreateMonsterPage() {
  const [words, setWords] = useState('');
  const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [isExpanding, startExpandingTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const { toast } = useToast();

  useEffect(() => {
    const previouslyGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    if (previouslyGenerated === 'true') {
      setHasGenerated(true);
      if (storedImage) {
        setImageUrl(storedImage);
      }
    }
  }, []);

  const handleWordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDetailedPrompt(null);
    setImageUrl(null);

    const wordArray = words.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (wordArray.length !== 5) {
      setError("Please provide exactly 5 words.");
      return;
    }

    startExpandingTransition(async () => {
      try {
        const expansionResult = await expandMonsterPromptAction({ words: wordArray });
        setDetailedPrompt(expansionResult.detailedPrompt);
        
        startGeneratingTransition(async () => {
          try {
            const imageResult = await generateMonsterImageAction({ detailedPrompt: expansionResult.detailedPrompt });
            setImageUrl(imageResult.imageUrl);
            setHasGenerated(true);
            localStorage.setItem(MONSTER_GENERATED_KEY, 'true');
            // Accept monster automatically for this prototype after generation
            localStorage.setItem(MONSTER_IMAGE_KEY, imageResult.imageUrl);
             toast({
                title: "Monster Revealed!",
                description: "Your unique Morgellon Monster has been generated and set as your profile image.",
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
        setError(e instanceof Error ? e.message : "Prompt expansion failed.");
        toast({
          title: "Prompt Expansion Error",
          description: e instanceof Error ? e.message : "Could not craft the monster's description.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAcceptMonster = () => {
    if (imageUrl) {
      localStorage.setItem(MONSTER_IMAGE_KEY, imageUrl);
      toast({
        title: "Monster Accepted!",
        description: "Your Morgellon Monster is now your profile image.",
      });
    }
  };


  if (hasGenerated && imageUrl) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>Your Morgellon Monster</CardTitle>
          <CardDescription>This is your unique, inner monster. It has been set as your profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image src={imageUrl} alt="Your Morgellon Monster" width={512} height={512} className="rounded-lg border object-cover mx-auto shadow-lg" data-ai-hint="generated monster" />
            <p className="text-sm text-muted-foreground mt-4">You can view it on your profile page.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (hasGenerated && !imageUrl && !isExpanding && !isGenerating) {
     return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>Monster Already Conjured</CardTitle>
          <CardDescription>You've already brought your Morgellon Monster into existence. Check your profile!</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">If you don't see your monster on your profile, there might have been an issue saving it. Unfortunately, the ritual allows only one conjuring.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary"/>Create Your Morgellon Monster</CardTitle>
        <CardDescription>
          This is a special one-time ritual for our valued members.
          Describe your inner Morgellon Monster in exactly 5 words. Our AI will then conjure its image.
          This image will become your unique profile picture. Choose your words wisely, for the monster, once revealed, cannot be changed.
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
              disabled={isExpanding || isGenerating || hasGenerated}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate words with spaces. Exactly 5 words required.</p>
          </div>

          {(isExpanding || isGenerating) && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-sm text-foreground">
                {isExpanding && !isGenerating && "Expanding your vision into a grand design..."}
                {isGenerating && "The AI is conjuring your monster from the æther... be patient!"}
              </p>
              {detailedPrompt && !isGenerating && (
                <p className="text-xs text-muted-foreground mt-2 italic">Initial vision: "{detailedPrompt.substring(0,100)}..."</p>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {imageUrl && !isGenerating && (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-headline mb-2 text-primary">Behold! Your Morgellon Monster!</h3>
              <Image src={imageUrl} alt="Generated Morgellon Monster" width={400} height={400} className="rounded-lg border object-cover mx-auto shadow-lg" data-ai-hint="generated monster" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {!imageUrl && (
            <Button type="submit" disabled={isExpanding || isGenerating || hasGenerated} className="w-full">
              {(isExpanding || isGenerating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {isExpanding ? 'Crafting Prompt...' : isGenerating ? 'Generating Image...' : 'Reveal My Monster'}
            </Button>
          )}
          {/* The monster is now automatically accepted and set upon generation, so this button might not be needed */}
          {/* {imageUrl && !isGenerating && (
             <Button onClick={handleAcceptMonster} className="w-full bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" /> Monster Accepted & Profile Updated
            </Button>
          )} */}
          { hasGenerated && <p className="text-xs text-muted-foreground text-center">You have already generated your monster. This was your one opportunity.</p>}
        </CardFooter>
      </form>
    </Card>
  );
}

