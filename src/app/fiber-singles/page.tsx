
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserSearch, ShieldQuestion, Heart, Wand2, Sparkles, Loader2 as IconLoader } from "lucide-react"; // Renamed Loader2 to avoid conflict
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const ROMANTIC_MONSTER_IMAGE_KEY = 'romanticMonsterImageUrl';
const ROMANTIC_MONSTER_NAME_KEY = 'romanticMonsterName';
const ROMANTIC_MONSTER_GENERATED_KEY = 'romanticMonsterGenerated';

interface MockSingle {
  id: string;
  name: string;
  romanticMonsterName: string;
  romanticMonsterImageUrl: string; 
  romanticMonsterAiHint: string;
  avatarUrl: string; 
  aiHint: string;
  bio: string;
  interests: string[];
  onlineStatus: string;
}

const mockSingles: MockSingle[] = [
  {
    id: "s1",
    name: "Casey L.",
    romanticMonsterName: "Velvet Whisperwind",
    romanticMonsterImageUrl: "https://placehold.co/100x100.png", 
    romanticMonsterAiHint: "fantasy creature gentle",
    avatarUrl: "https://placehold.co/100x100.png", 
    aiHint: "person smiling",
    bio: "Loves hiking, reading, and quiet evenings. My monster, Velvet Whisperwind, seeks a kind soul.",
    interests: ["Nature", "Books", "Mindfulness", "Art"],
    onlineStatus: "Online",
  },
  {
    id: "s2",
    name: "Jordan M.",
    romanticMonsterName: "Starlight Dreamer",
    romanticMonsterImageUrl: "https://placehold.co/100x100.png",
    romanticMonsterAiHint: "ethereal being dreamlike",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "artist painting",
    bio: "Creative soul, passionate about music. Starlight Dreamer and I value deep conversations.",
    interests: ["Music", "Sustainability", "Cooking", "Yoga"],
    onlineStatus: "Active 3 hours ago",
  },
];

const chatFlairExamples = [
    { name: "Sparkle Heart", imageUrl: "https://placehold.co/50x50.png", aiHint: "glitter heart", cost: 10 },
    { name: "Witty Remark Bubble", imageUrl: "https://placehold.co/50x50.png", aiHint: "comic bubble", cost: 15 },
    { name: "Mystic Flower", imageUrl: "https://placehold.co/50x50.png", aiHint: "glowing flower", cost: 20 },
];

interface ShowcasedSyncedPair {
  userMonsterName: string;
  userMonsterImageUrl: string;
  opponentMonsterName: string;
  opponentMonsterImageUrl: string;
  opponentMonsterAiHint: string;
  opponentName: string;
}


export default function FiberSinglesPage() {
  const { toast } = useToast();
  const [userRomanticMonsterName, setUserRomanticMonsterName] = useState<string | null>(null);
  const [userRomanticMonsterImageUrl, setUserRomanticMonsterImageUrl] = useState<string | null>(null);
  const [isLoadingPersona, setIsLoadingPersona] = useState(true);
  const [showcasedSyncedPairs, setShowcasedSyncedPairs] = useState<ShowcasedSyncedPair[]>([]);

  useEffect(() => {
    const generated = localStorage.getItem(ROMANTIC_MONSTER_GENERATED_KEY);
    const name = localStorage.getItem(ROMANTIC_MONSTER_NAME_KEY);
    const imageUrl = localStorage.getItem(ROMANTIC_MONSTER_IMAGE_KEY);

    if (generated === 'true' && name && imageUrl) {
      setUserRomanticMonsterName(name);
      setUserRomanticMonsterImageUrl(imageUrl);

      // Check for synced pairs
      const newSyncedPairs: ShowcasedSyncedPair[] = [];
      mockSingles.forEach(opponent => {
        const syncedKey = `monstersSynced_${opponent.id}`;
        if (localStorage.getItem(syncedKey) === 'true') {
          newSyncedPairs.push({
            userMonsterName: name,
            userMonsterImageUrl: imageUrl,
            opponentMonsterName: opponent.romanticMonsterName,
            opponentMonsterImageUrl: opponent.romanticMonsterImageUrl,
            opponentMonsterAiHint: opponent.romanticMonsterAiHint,
            opponentName: opponent.name,
          });
        }
      });
      setShowcasedSyncedPairs(newSyncedPairs);
    }
    setIsLoadingPersona(false);
  }, []);

  const handleSendMessage = (userName: string) => {
    toast({
      title: "Simulated Message",
      description: `Sending a message to ${userName} would cost 50 points or be free with Premium. (This is a simulated feature for the prototype.)`,
      variant: "default",
      duration: 7000,
    });
  };

  if (isLoadingPersona) {
    return (
        <div className="flex justify-center items-center h-64">
            <IconLoader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Fiber Singles...</p>
        </div>
    );
  }

  if (!userRomanticMonsterName || !userRomanticMonsterImageUrl) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardHeader>
          <Heart className="h-12 w-12 mx-auto text-pink-500 mb-2" />
          <CardTitle className="font-headline text-2xl">Create Your Romantic Monster Persona!</CardTitle>
          <CardDescription>
            To join the Fiber Singles community and connect with others, you need to create your unique Romantic Monster persona.
            This persona will represent you in the singles section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">It's a fun way to express your charming side! Click below to begin.</p>
          <Button asChild className="bg-pink-500 hover:bg-pink-600 text-white">
            <Link href="/fiber-singles/create-romantic-monster">
              <Wand2 className="mr-2 h-4 w-4" /> Create My Romantic Monster
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {showcasedSyncedPairs.length > 0 && (
        <Card className="shadow-xl bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 text-white">
          <CardHeader className="text-center">
            <Heart className="h-12 w-12 mx-auto text-white animate-pulse mb-2" />
            <CardTitle className="font-headline text-3xl">Soul Connected Pairs</CardTitle>
            <CardDescription className="text-pink-100">
              These monsters have achieved perfect harmony, their essences intertwined!
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
            {showcasedSyncedPairs.map((pair, index) => (
              <div key={index} className="p-4 bg-white/20 rounded-lg shadow-lg text-center">
                <div className="flex flex-col sm:flex-row items-center justify-around gap-2 mb-2">
                  <div className="flex flex-col items-center">
                    <Image 
                        src={pair.userMonsterImageUrl} 
                        alt={pair.userMonsterName} 
                        width={80} 
                        height={80} 
                        className="rounded-lg border-2 border-pink-300 object-cover shadow-md"
                        data-ai-hint="user romantic monster"
                    />
                    <p className="mt-1 text-xs font-semibold">{pair.userMonsterName}</p>
                    <p className="text-xxs text-pink-200">(Your Persona)</p>
                  </div>
                  <Heart className="h-6 w-6 text-pink-200 my-2 sm:my-0" />
                  <div className="flex flex-col items-center">
                    <Image 
                        src={pair.opponentMonsterImageUrl} 
                        alt={pair.opponentMonsterName} 
                        width={80} 
                        height={80} 
                        className="rounded-lg border-2 border-purple-300 object-cover shadow-md"
                        data-ai-hint={pair.opponentMonsterAiHint}
                    />
                    <p className="mt-1 text-xs font-semibold">{pair.opponentMonsterName}</p>
                    <p className="text-xxs text-purple-200">(with {pair.opponentName})</p>
                  </div>
                </div>
                <p className="text-sm italic mt-2 text-pink-50">
                  "{pair.userMonsterName} & {pair.opponentMonsterName} - A bond forged in fibers!"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader className="text-center pb-4">
          <UserSearch className="h-10 w-10 mx-auto text-primary mb-1" />
          <CardTitle className="font-headline text-3xl">Fiber Singles Connect</CardTitle>
          <CardDescription className="max-w-xl mx-auto">
            Connect with others in the Fiber Friends community. Your romantic monster persona is how you'll appear here.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
            <Card className="mb-6 p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 border-pink-300 dark:border-pink-700">
                <CardHeader className="p-0 pb-2 flex flex-row items-center gap-3">
                     {userRomanticMonsterImageUrl && userRomanticMonsterName && (
                        <Image src={userRomanticMonsterImageUrl} alt={userRomanticMonsterName} width={128} height={128} className="rounded-lg border-2 border-pink-400 shadow-md object-cover" data-ai-hint="romantic monster user"/>
                     )}
                    <div>
                        <CardTitle className="text-xl text-pink-700 dark:text-pink-300">{userRomanticMonsterName}</CardTitle>
                        <CardDescription className="text-pink-600 dark:text-pink-400">This is your charming persona for Fiber Singles!</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/fiber-singles/create-romantic-monster">
                            <Wand2 className="mr-2 h-3 w-3"/>Re-conjure Your Romantic Monster
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="p-4 bg-accent/20 border border-accent rounded-md text-accent-foreground mb-6">
              <div className="flex items-start gap-3">
                 <ShieldQuestion className="h-6 w-6 text-amber-500 mt-1 shrink-0"/> 
                 <div>
                    <h3 className="text-md font-semibold">Interactions & Points (Simulated)</h3>
                    <p className="text-sm text-accent-foreground/80 mb-1">
                        Sending a Direct Message (DM) might cost 50 profile points, or be unlimited with Premium.
                    </p>
                    <p className="text-sm text-accent-foreground/80">
                        As you chat, your monsters get to know each other! Your message quality (analyzed by AI) will affect your monsters' "desire" for each other. Reach 100% desire on both sides to see them sync!
                    </p>
                 </div>
              </div>
            </div>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-center text-primary">Chat Flair Showcase (Conceptual)</h3>
                <div className="flex justify-center gap-4 flex-wrap">
                    {chatFlairExamples.map(flair => (
                        <div key={flair.name} className="text-center p-2 border rounded-md bg-card/50 w-32">
                            <Image src={flair.imageUrl} alt={flair.name} width={40} height={40} className="mx-auto rounded" data-ai-hint={flair.aiHint}/>
                            <p className="text-xs mt-1">{flair.name}</p>
                            <Badge variant="outline" className="text-xxs mt-0.5">{flair.cost} pts</Badge>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">(Imagine sending these fun icons in chat! Feature simulated.)</p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSingles.map(user => (
              <Card key={user.id} className="flex flex-col transition-all hover:shadow-xl hover:scale-[1.02]">
                <CardHeader className="items-center text-center p-4">
                  <Avatar className="w-20 h-20 mb-2 border-2 border-muted-foreground shadow-md">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.aiHint}/>
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <div className="mt-1 text-center">
                    <Image src={user.romanticMonsterImageUrl} alt={user.romanticMonsterName} width={100} height={100} className="mx-auto rounded-lg border-2 border-pink-400 object-cover shadow" data-ai-hint={user.romanticMonsterAiHint}/>
                    <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">as "{user.romanticMonsterName}"</p>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1">{user.onlineStatus}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow px-4 py-2 space-y-2">
                  <p className="text-sm text-foreground/80 italic text-center h-16 overflow-hidden">"{user.bio}"</p>
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-muted-foreground">Interests:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.interests.map(interest => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 mt-auto flex-col gap-2">
                  <Button className="w-full" onClick={() => handleSendMessage(user.name)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Send Initial DM
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/fiber-singles/chat/${user.id}`}>
                        <Sparkles className="mr-2 h-4 w-4"/> Chat with {user.romanticMonsterName}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-lg">Community Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>Please remember to always:</p>
            <ul className="list-disc list-inside">
                <li>Be respectful and kind in all interactions.</li>
                <li>Protect your personal information.</li>
                <li>Report any inappropriate behavior.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
