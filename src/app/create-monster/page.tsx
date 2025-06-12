'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, Share, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { expandMonsterPromptAction, generateMonsterImageAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { firestoreService } from '@/lib/firestore-service';
import { useRouter } from 'next/navigation';

const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
export default function CreateMonsterPage() {
  const [words, setWords] = useState('');
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false);
  const [existingMonster, setExistingMonster] = useState<any>(null);

  const [isExpanding, startExpandingTransition] = useTransition();
  const [isGenerating, startGeneratingTransition] = useTransition();

  const { toast } = useToast();
  const { user, refreshUserProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkExistingMonster = async () => {
      if (!user) return;
      
      try {
        const monsterData = await firestoreService.getMonsterData(user.uid);
        if (monsterData && monsterData.generated) {
          setExistingMonster(monsterData);
        }
      } catch (error) {
        console.error('Error checking existing monster:', error);
      }
    };

    checkExistingMonster();
  }, [user]);

  const handleWordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
      setError("You must be logged in to create a monster.");
      toast({
        title: "Authentication Required",
        description: "Please log in to create your monster.",
        variant: "destructive",
      });
      return;
    }

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
            const imageResult = await generateMonsterImageAction({ 
 detailedPrompt: expansionResult.detailedPrompt,
              name: expansionResult.monsterName, // Include monsterName
 description: expansionResult.detailedPrompt, // Use detailedPrompt as description
 userId: user.uid, // Include userId
            });
            setImageUrl(imageResult.imageUrl ?? null);
            console.log("Image result URL:", imageResult.imageUrl); // Add this
            console.log("Updated imageUrl state:", imageUrl); // Add this
            setHasGeneratedInSession(true);
            
            const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;

            // The imageUrl state is set above, and the render logic handles the null state
            
            // Save monster data to Firestore
            await firestoreService.createMonster(user.uid, {
              name: expansionResult.monsterName,
              imageUrl: imageResult.imageUrl || '', // Provide default empty string
              health: initialHealth,
              generated: true,
              lastRecoveryDate: new Date().toDateString()
            });

            // If there was an existing monster, add it to the tomb
            if (existingMonster) {
              await firestoreService.addToTomb(user.uid, {
                name: existingMonster.name,
                imageUrl: existingMonster.imageUrl,
                cause: "Replaced by a new monster"
              });
            }

            // Refresh user profile to update any related data
            await refreshUserProfile();

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

  // If user is not logged in
  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary"/>Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            You must be logged in to create your Morgellon Monster.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show existing monster if one exists and we haven't generated a new one in this session
  if (existingMonster && !hasGeneratedInSession) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary"/>Your Existing Monster: {existingMonster.name}
          </CardTitle>
          <CardDescription>
            You already have a monster. Creating a new one will retire your current monster to the tomb.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <Image 
              src={existingMonster.imageUrl} 
              alt={`Your Morgellon Monster: ${existingMonster.name}`} 
              width={200} 
              height={200} 
              className="rounded-lg border object-cover mx-auto shadow-lg mb-4" 
              data-ai-hint="existing monster" 
            />
            <p className="text-sm text-muted-foreground">Current Health: {existingMonster.health.toFixed(1)}%</p>
        </CardContent>
        <CardFooter className="flex-col gap-3">
            <Button onClick={() => setExistingMonster(null)} size="lg" variant="outline">
                <Wand2 className="mr-2 h-4 w-4" /> Create New Monster
            </Button>
            <Button asChild size="lg">
                <Link href="/">
                    <Sparkles className="mr-2 h-4 w-4" /> Keep Current Monster
                </Link>
            </Button>
        </CardFooter>
      </Card>
    );
  }

  if (hasGeneratedInSession && imageUrl && monsterName) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary"/>Your Morgellon Monster: {monsterName}</CardTitle>
          <CardDescription>
            This is your unique, inner monster. Its name, form, and deep voice are now bound to your profile. 
            What's next? Explore the app or check out our Getting Started Guide!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {imageUrl ? (
 <Image
 src={imageUrl}
 alt={`Your Morgellon Monster: ${monsterName}`}
 width={512}
 height={512}
 className="rounded-lg border object-cover mx-auto shadow-lg"
 data-ai-hint="generated monster"
 />
 ) : (
 <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md">
 <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
 <p className="text-sm text-foreground">Loading monster image...</p>
 </div>
 )}
            <p className="text-sm text-muted-foreground mt-4">You can view it on your profile page and track its health in the Meal Log. It might even have a riddle for you...</p>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-4 items-center">
            <Button asChild size="lg">
                <Link href="/">
                    <Sparkles className="mr-2 h-4 w-4" /> Explore Fiber Friends (Home)
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/getting-started">
                   <ArrowRight className="mr-2 h-4 w-4" /> View Getting Started Guide
                </Link>
            </Button>
        </CardFooter>
        <CardFooter className="flex-col sm:flex-row justify-center gap-x-4 gap-y-2 pt-3 items-center border-t mt-4">
            <Button asChild variant="link" className="text-xs">
                <Link href="/doctor-forum">
                    <Share className="mr-1 h-3 w-3" /> Share on Forum
                </Link>
            </Button>
            <Button onClick={() => {
                setHasGeneratedInSession(false); 
                setImageUrl(null);
                setMonsterName(null);
                setWords('');
             }} variant="link" className="text-xs text-muted-foreground">
                Create a Different Monster
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
          {existingMonster && (
            <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
              Note: Creating a new monster will retire your current monster ({existingMonster.name}) to the tomb.
            </span>
          )}
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