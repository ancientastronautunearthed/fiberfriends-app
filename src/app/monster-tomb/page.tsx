
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Image from "next/image";
import { Skull, Sparkles } from 'lucide-react';
import Link from 'next/link';

const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}

export default function MonsterTombPage() {
  const [tombEntries, setTombEntries] = useState<TombEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTomb = localStorage.getItem(MONSTER_TOMB_KEY);
    if (storedTomb) {
      setTombEntries(JSON.parse(storedTomb));
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Skull className="h-12 w-12 animate-pulse text-muted-foreground" />
        <p className="ml-4 text-muted-foreground">Loading the crypt...</p>
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
              <Button asChild>
                <Link href="/create-monster">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Begin Your Journey with a New Monster
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tombEntries.map((monster, index) => (
                <Card key={index} className="flex flex-col items-center p-4 transition-all hover:shadow-2xl hover:scale-105 bg-card/50">
                  <Image
                    src={monster.imageUrl}
                    alt={`Fallen Monster: ${monster.name}`}
                    width={128}
                    height={128}
                    className="rounded-lg border-2 border-muted object-cover shadow-md"
                    data-ai-hint="fallen monster"
                  />
                  <h3 className="mt-3 font-semibold text-lg text-center text-foreground">{monster.name}</h3>
                  <p className="text-xs text-muted-foreground">Fell on: {new Date(monster.diedAt).toLocaleDateString()}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
       <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/food-log">
              Return to Food Log
            </Link>
          </Button>
        </div>
    </div>
  );
}
