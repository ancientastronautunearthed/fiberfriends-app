'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, Heart, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { createRomanticMonsterAction, getRomanticMonsterAction, deleteRomanticMonsterAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

interface ExistingRomanticMonster {
  id: string;
  name: string;
  imageUrl: string;
  words: string[];
}

export default function CreateRomanticMonsterPage() {
  const [words, setWords] = useState('');
  const [existingMonster, setExistingMonster] = useState<ExistingRomanticMonster | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreating, startCreatingTransition] = useTransition();
  const [isDeleting, startDeletingTransition] = useTransition();

  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  // Fetch existing romantic monster on component mount
  useEffect(() => {
    const fetchExistingMonster = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getRomanticMonsterAction();
        if (result.success && result.monster) {
          setExistingMonster(result.monster);
        }
      } catch (error) {
        console.error('Error fetching existing monster:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingMonster();
  }, [user]);

  const handleWordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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

    if (!user) {
      setError("Please log in to create a romantic monster.");
      toast({
        title: "Authentication Error",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    startCreatingTransition(async () => {
      try {
        const result = await createRomanticMonsterAction({ words: wordArray });
        
        if (result.success) {
          toast({
            title: "Romantic Monster Conjured!",
            description: "Your unique Romantic Monster is ready to charm! Redirecting to Fiber Singles...",
            variant: "default",
            duration: 5000,
          });
          
          // Redirect to Fiber Singles page after creation
          router.push('/fiber-singles');
        } else {
          setError(result.error || "Failed to create romantic monster");
          toast({
            title: "Creation Failed",
            description: result.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Romantic monster creation failed.";
        setError(errorMessage);
        toast({
          title: "Romantic Monster Conception Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteMonster = async () => {
    if (!existingMonster) return;

    startDeletingTransition(async () => {
      try {
        const result = await deleteRomanticMonsterAction();
        
        if (result.success) {
          setExistingMonster(null);
          toast({
            title: "Romantic Monster Dismissed",
            description: "Your romantic monster has been removed. You can create a new one now.",
            variant: "default",
          });
        } else {
          toast({
            title: "Deletion Failed",
            description: result.error || "Failed to delete romantic monster.",
            variant: "destructive",
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete romantic monster.";
        toast({
          title: "Deletion Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your romantic persona...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500"/>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Please log in to create your romantic monster persona.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If user already has a romantic monster, show it
  if (existingMonster) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/fiber-singles">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="font-headline flex items-center gap-2">
                <Heart className="h-6 w-6 text-pink-500"/>
                Your Romantic Monster
              </CardTitle>
            </div>
            <CardDescription>
              Your charming persona for the Fiber Singles community.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Image 
              src={existingMonster.imageUrl} 
              alt={existingMonster.name} 
              width={200} 
              height={200} 
              className="rounded-full mx-auto border-4 border-pink-500 shadow-lg"
              data-ai-hint="romantic monster"
            />
            <div>
              <h2 className="text-2xl font-bold text-primary">{existingMonster.name}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Created from: {existingMonster.words.join(', ')}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/fiber-singles">
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Fiber Singles
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMonster}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isDeleting ? 'Dismissing...' : 'Delete & Create New'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show creation form if no existing monster
  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/fiber-singles">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle className="font-headline flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500"/>
              Create Your Romantic Monster Persona
            </CardTitle>
          </div>
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
                disabled={isCreating}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate words with spaces. Exactly 5 words required.
              </p>
            </div>

            {isCreating && (
              <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-md">
                <Loader2 className="h-12 w-12 animate-spin text-pink-500 mb-3" />
                <p className="text-sm text-foreground text-center">
                  Crafting your romantic monster's essence and conjuring its charming image...
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This may take a moment while our AI works its magic.
                </p>
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
            <Button 
              type="submit" 
              disabled={isCreating || !words.trim()} 
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isCreating ? 'Conjuring Romance...' : 'Reveal My Romantic Monster'}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/fiber-singles">Cancel & Return to Fiber Singles</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}