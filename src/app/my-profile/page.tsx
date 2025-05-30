
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { UserCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';

export default function MyProfilePage() {
  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    setMonsterImageUrl(storedImage);
    setMonsterName(storedName);
    setIsLoading(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-4">
            {isLoading ? (
              <div className="w-48 h-48 bg-muted rounded-full flex items-center justify-center animate-pulse">
                <UserCircle className="h-24 w-24 text-muted-foreground" />
              </div>
            ) : monsterImageUrl ? (
              <Image 
                src={monsterImageUrl} 
                alt={monsterName ? `My Morgellon Monster: ${monsterName}` : "My Morgellon Monster"} 
                width={192} 
                height={192} 
                className="rounded-full border-4 border-primary shadow-lg object-cover mx-auto"
                data-ai-hint="profile monster"
              />
            ) : (
              <Avatar className="w-48 h-48 text-6xl mx-auto border-4 border-muted">
                <AvatarFallback>
                  <UserCircle className="h-32 w-32 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <CardTitle className="font-headline text-3xl">
            {isLoading ? "My Profile" : monsterName ? monsterName : "My Profile"}
          </CardTitle>
          <CardDescription>
            {isLoading ? "Loading your identity..." : monsterName ? `Your unique, unchangeable Morgellon Monster.` : "This is your personal space within Fiber Friends."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {isLoading ? (
             <p className="text-muted-foreground">Loading your profile...</p>
          ): monsterImageUrl ? (
            <p className="text-lg text-foreground">
              {monsterName ? `Behold ${monsterName}, your chosen emblem in this community.` : "Behold your unique Morgellon Monster, your chosen emblem in this community."}
            </p>
          ) : (
            <div className="p-4 bg-accent/20 border border-accent rounded-md text-accent-foreground">
              <div className="flex items-center justify-center gap-2 mb-2">
                 <AlertTriangle className="h-6 w-6 text-amber-500"/> 
                 <h3 className="text-lg font-semibold">Your Monster Awaits!</h3>
              </div>
              <p className="text-sm mb-3">
                You haven't created your Morgellon Monster profile picture and name yet. 
                This is a special, one-time opportunity for members.
              </p>
              <Button asChild>
                <Link href="/create-monster">Create My Monster Now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">My Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            (Future section: Display user's journal entries, product logs, forum posts, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
