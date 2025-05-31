
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, Heart } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { expandRomanticMonsterPromptAction, generateRomanticMonsterImageAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const ROMANTIC_MONSTER_IMAGE_KEY = 'romanticMonsterImageUrl';
const ROMANTIC_MONSTER_NAME_KEY = 'romanticMonsterName';
const ROMANTIC_MONSTER_GENERATED_KEY = 'romanticMonsterGenerated';


export default function CreateRomanticMonsterPage() {
  const [words, setWords] = useState('');
  const [romanticMonsterName, setRomanticMonsterName] = useState<string | null>(null);
  const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isExpanding, startExpandingTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const handleWordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDetailedPrompt(null);
    setImageUrl(null);
    setRomanticMonsterName(null);

    const wordArray = words.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (wordArray.length !== 5) {
      setError("Please provide exactly 5 words for your romantic monster.");
      toast({
        title: "Input Error",
        description: "Please provide exactly 5 words.",
        variant: "destructive",
      });
      return;
    }

    startExpandingTransition(async () => {
      try {
        const expansionResult = await expandRomanticMonsterPromptAction({ words: wordArray });
        setDetailedPrompt(expansionResult.detailedPrompt);
        setRomanticMonsterName(expansionResult.monsterName);
        
        startGeneratingTransition(async () => {
          try {
            const imageResult = await generateRomanticMonsterImageAction({ detailedPrompt: expansionResult.detailedPrompt });
            setImageUrl(imageResult.imageUrl);
            
            localStorage.setItem(ROMANTIC_MONSTER_GENERATED_KEY, 'true');
            localStorage.setItem(ROMANTIC_MONSTER_IMAGE_KEY, imageResult.imageUrl);
            localStorage.setItem(ROMANTIC_MONSTER_NAME_KEY, expansionResult.monsterName);
            
            toast({
                title: "Romantic Monster Conjured!",
                description: `Your unique Romantic Monster, ${expansionResult.monsterName}, is ready to charm! You can now see it on the Fiber Singles page.`,
                variant: "default",
                duration: 7000,
            });
            // Redirect to Fiber Singles page after creation
            router.push('/fiber-singles');

          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Image generation failed for romantic monster.";
            setError(errorMessage);
            toast({
              title: "Romantic Image Generation Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Romantic prompt expansion or name generation failed.";
        setError(errorMessage);
        toast({
          title: "Romantic Monster Conception Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };
  
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Heart className="h-6 w-6 text-pink-500"/>Create Your Romantic Monster Persona</CardTitle>
        <CardDescription>
          Define your unique & charming monster for the Fiber Singles community. 
          Enter 5 words that capture its romantic essence. Our AI will generate its name and a whimsical image.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleWordSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="monster-words">Your 5 Romantic Words</Label>
            <Input
              id="monster-words"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="e.g., Velvet, Starlight, Whisper, Dream, Gentle"
              disabled={isExpanding || isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate words with spaces. Exactly 5 words required.</p>
          </div>

          {(isExpanding || isGenerating) && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-pink-500 mb-3" />
              <p className="text-sm text-foreground">
                {isExpanding && !isGenerating && "Crafting your romantic monster's essence..."}
                {isGenerating && "Conjuring your romantic monster's image..."}
              </p>
              {detailedPrompt && !isGenerating && romanticMonsterName && (
                <p className="text-xs text-muted-foreground mt-2 italic">Vision for {romanticMonsterName}: "{detailedPrompt.substring(0,100)}..."</p>
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
          <Button type="submit" disabled={isExpanding || isGenerating} className="w-full bg-pink-500 hover:bg-pink-600 text-white">
            {(isExpanding || isGenerating) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isExpanding ? 'Crafting Romance...' : isGenerating ? 'Conjuring Charm...' : 'Reveal My Romantic Monster'}
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/fiber-singles">Cancel & Return to Fiber Singles</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
