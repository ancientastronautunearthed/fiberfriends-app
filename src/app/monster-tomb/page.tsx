'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Image from "next/image";
import { Skull, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';

interface TombEntry {
  id: string;
  name: string;
  imageUrl: string;
  cause: string;
  diedAt: Timestamp;
}

export default function MonsterTombPage() {
  const [tombEntries, setTombEntries] = useState<TombEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTombEntries();
  }, [user]);

  const fetchTombEntries = async () => {
    if (!user?.uid || !db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tombQuery = query(
        collection(db, 'tomb'),
        where('userId', '==', user.uid),
        orderBy('diedAt', 'desc'),
        limit(50) // Limit to last 50 fallen monsters
      );

      const tombSnapshot = await getDocs(tombQuery);
      const entries: TombEntry[] = [];

      tombSnapshot.docs.forEach(doc => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          name: data.name,
          imageUrl: data.imageUrl,
          cause: data.cause || 'unknown causes',
          diedAt: data.diedAt
        });
      });

      setTombEntries(entries);
    } catch (error) {
      console.error('Error fetching tomb entries:', error);
      setError('Failed to load the tomb. The spirits are restless...');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Skull className="h-16 w-16 mx-auto text-primary mb-2" />
            <CardTitle className="font-headline text-3xl">Tomb of Fallen Monsters</CardTitle>
            <CardDescription>
              Please log in to view your fallen companions.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/login">
                Log In to View Tomb
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Skull className="h-12 w-12 animate-pulse text-muted-foreground" />
        <p className="ml-4 text-muted-foreground">Loading the crypt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <Skull className="h-16 w-16 mx-auto text-destructive mb-2" />
            <CardTitle className="font-headline text-3xl">Tomb Access Denied</CardTitle>
            <CardDescription className="text-destructive">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={fetchTombEntries} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Skull className="h-16 w-16 mx-auto text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Tomb of Fallen Monsters</CardTitle>
          <CardDescription>
            Here lie the brave companions who have succumbed to the trials of your journey. May their essence live on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tombEntries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-muted-foreground mb-4">The tomb is currently empty. No monsters have fallen yet.</p>
              <p className="text-sm text-muted-foreground mb-6">Your current monster must be quite resilient... or perhaps you haven't created one yet?</p>
              <Button asChild>
                <Link href="/create-monster">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Begin Your Journey with a New Monster
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  {tombEntries.length} fallen companion{tombEntries.length !== 1 ? 's' : ''} rest{tombEntries.length === 1 ? 's' : ''} here
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tombEntries.map((monster) => (
                  <Card 
                    key={monster.id} 
                    className="flex flex-col items-center p-4 transition-all hover:shadow-2xl hover:scale-105 bg-card/50 border-2 border-muted/50 hover:border-primary/30"
                  >
                    <div className="relative">
                      <Image
                        src={monster.imageUrl}
                        alt={`Fallen Monster: ${monster.name}`}
                        width={128}
                        height={128}
                        className="rounded-lg border-2 border-muted object-cover shadow-md grayscale"
                        data-ai-hint="fallen monster"
                      />
                      <div className="absolute -top-2 -right-2 bg-destructive rounded-full p-1">
                        <Skull className="h-4 w-4 text-destructive-foreground" />
                      </div>
                    </div>
                    <h3 className="mt-3 font-semibold text-lg text-center text-foreground line-clamp-2">
                      {monster.name}
                    </h3>
                    <div className="text-center mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Fell to: <span className="italic">{monster.cause}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(monster.diedAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/food-log">
              Return to Food Log
            </Link>
          </Button>
          <Button asChild>
            <Link href="/create-monster">
              <Sparkles className="mr-2 h-4 w-4" />
              Summon a New Monster
            </Link>
          </Button>
        </div>
        
        {tombEntries.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 max-w-2xl mx-auto">
            Each fallen monster represents a chapter in your wellness journey. Their sacrifice was not in vain - 
            they taught you valuable lessons about balance, health, and resilience.
          </p>
        )}
      </div>
    </div>
  );
}