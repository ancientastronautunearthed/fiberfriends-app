
'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, Sparkles, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { analyzeMessageQualityAction } from '../actions';
import Link from 'next/link';

const ROMANTIC_MONSTER_IMAGE_KEY = 'romanticMonsterImageUrl';
const ROMANTIC_MONSTER_NAME_KEY = 'romanticMonsterName';

// Mock opponent data structure
interface MockOpponent {
  id: string;
  name: string; // Human name
  romanticMonsterName: string;
  romanticMonsterImageUrl: string;
  romanticMonsterAiHint: string;
}

const mockOpponentsDatabase: Record<string, MockOpponent> = {
  s1: { id: "s1", name: "Casey L.", romanticMonsterName: "Velvet Whisperwind", romanticMonsterImageUrl: "https://placehold.co/128x128.png", romanticMonsterAiHint: "gentle fantasy creature" },
  s2: { id: "s2", name: "Jordan M.", romanticMonsterName: "Starlight Dreamer", romanticMonsterImageUrl: "https://placehold.co/128x128.png", romanticMonsterAiHint: "dreamlike ethereal being" },
  // Add more mock opponents if needed
};

interface ChatMessage {
    sender: 'user' | 'opponent';
    text: string;
    timestamp: Date;
}

export default function SimulatedChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const mockUserId = typeof params.mockUserId === 'string' ? params.mockUserId : null;
  
  const [userRomanticMonsterName, setUserRomanticMonsterName] = useState<string | null>(null);
  const [userRomanticMonsterImageUrl, setUserRomanticMonsterImageUrl] = useState<string | null>(null);
  const [mockOpponent, setMockOpponent] = useState<MockOpponent | null>(null);
  
  const [userDesire, setUserDesire] = useState(0); // User's monster's desire for opponent
  const [opponentDesire, setOpponentDesire] = useState(0); // Opponent's monster's desire for user
  const [monstersSynced, setMonstersSynced] = useState(false);
  
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserRomanticMonsterName(localStorage.getItem(ROMANTIC_MONSTER_NAME_KEY));
    setUserRomanticMonsterImageUrl(localStorage.getItem(ROMANTIC_MONSTER_IMAGE_KEY));

    if (mockUserId && mockOpponentsDatabase[mockUserId]) {
      setMockOpponent(mockOpponentsDatabase[mockUserId]);
      const userDesireKey = `desire_userFor_${mockUserId}`;
      const opponentDesireKey = `desire_${mockUserId}_forUser`;
      const syncedKey = `monstersSynced_${mockUserId}`;

      setUserDesire(parseInt(localStorage.getItem(userDesireKey) || '0', 10));
      setOpponentDesire(parseInt(localStorage.getItem(opponentDesireKey) || '0', 10));
      setMonstersSynced(localStorage.getItem(syncedKey) === 'true');
    } else {
      // Handle invalid mockUserId, maybe redirect or show error
      router.push('/fiber-singles');
    }
  }, [mockUserId, router]);

  useEffect(() => {
    // Scroll to bottom of chat log
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);


  const handleSendMessage = async () => {
    if (!message.trim() || !mockUserId || !mockOpponent) return;
    setError(null);

    const userMessage: ChatMessage = { sender: 'user', text: message, timestamp: new Date() };
    setChatLog(prev => [...prev, userMessage]);
    
    startAnalyzingTransition(async () => {
      try {
        const qualityResult = await analyzeMessageQualityAction({ messageText: message });
        const score = qualityResult.score;

        let newUserDesire = Math.min(100, Math.max(0, userDesire + score));
        let newOpponentDesire = Math.min(100, Math.max(0, opponentDesire + score)); // Simulate mutual positive impact

        setUserDesire(newUserDesire);
        setOpponentDesire(newOpponentDesire);
        localStorage.setItem(`desire_userFor_${mockUserId}`, String(newUserDesire));
        localStorage.setItem(`desire_${mockUserId}_forUser`, String(newOpponentDesire));

        const cannedReplies = [
            "That's interesting!", "Tell me more.", "I see.", "Fascinating!", "What are your thoughts on that?",
            `My ${mockOpponent.romanticMonsterName} seems to like what your ${userRomanticMonsterName || 'monster'} is saying!`,
            "How does that relate to your 5 words?", "Intriguing perspective.", "I'm enjoying this chat.",
            "My monster is definitely perking up!",
        ];
        const opponentMessageText = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
        const opponentMessage: ChatMessage = { sender: 'opponent', text: opponentMessageText, timestamp: new Date()};
        setChatLog(prev => [...prev, opponentMessage]);

        if (newUserDesire >= 100 && newOpponentDesire >= 100 && !monstersSynced) {
          setMonstersSynced(true);
          localStorage.setItem(`monstersSynced_${mockUserId}`, 'true');
          toast({
            title: "💖 Monsters Synced! 💖",
            description: `${userRomanticMonsterName || 'Your monster'} and ${mockOpponent.romanticMonsterName} have reached peak desire! Their connection is undeniable!`,
            variant: "default",
            duration: 10000,
          });
        }
        
        toast({
          title: "Message Quality Score",
          description: `Your message received a score of ${score}. ${qualityResult.reasoning || ''} (Desire levels updated!)`,
          variant: score > 0 ? "default" : "destructive",
          duration: 6000,
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to analyze message.";
        setError(errorMessage);
        toast({ title: "Message Analysis Error", description: errorMessage, variant: "destructive" });
      }
    });
    setMessage('');
  };

  if (!userRomanticMonsterName || !userRomanticMonsterImageUrl || !mockOpponent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading chat with {mockOpponent?.name || 'your match'}...</p>
        <p className="text-sm text-muted-foreground mt-2">Ensure you've created your Romantic Monster persona.</p>
         <Button variant="outline" asChild className="mt-4">
            <Link href="/fiber-singles"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Fiber Singles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/fiber-singles')} className="mr-2">
                <ArrowLeft />
            </Button>
            <Image src={mockOpponent.romanticMonsterImageUrl} alt={mockOpponent.romanticMonsterName} width={40} height={40} className="rounded-full border-2 border-pink-400" data-ai-hint={mockOpponent.romanticMonsterAiHint}/>
            <div>
                <CardTitle className="font-headline text-xl">Chatting with {mockOpponent.name}</CardTitle>
                <CardDescription>As your romantic monster: {userRomanticMonsterName}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {/* User's Monster Card */}
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Image src={userRomanticMonsterImageUrl} alt={userRomanticMonsterName} width={100} height={100} className="rounded-full border-2 border-pink-500 shadow-lg object-cover" data-ai-hint="user romantic monster"/>
            <CardTitle className="text-lg mt-2">{userRomanticMonsterName}</CardTitle>
            <CardDescription>Your Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="user-desire">Desire for {mockOpponent.romanticMonsterName}: {userDesire}%</Label>
            <Progress id="user-desire" value={userDesire} className="h-3 bg-pink-200 [&>div]:bg-pink-500" />
          </CardContent>
        </Card>

        {/* Opponent's Monster Card */}
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Image src={mockOpponent.romanticMonsterImageUrl} alt={mockOpponent.romanticMonsterName} width={100} height={100} className="rounded-full border-2 border-purple-500 shadow-lg object-cover" data-ai-hint={mockOpponent.romanticMonsterAiHint}/>
            <CardTitle className="text-lg mt-2">{mockOpponent.romanticMonsterName}</CardTitle>
            <CardDescription>{mockOpponent.name}'s Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="opponent-desire">Desire for {userRomanticMonsterName}: {opponentDesire}%</Label>
            <Progress id="opponent-desire" value={opponentDesire} className="h-3 bg-purple-200 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>
        
        {/* Synced Card */}
        {(userDesire >= 100 && opponentDesire >= 100) || monstersSynced ? (
             <Card className="md:col-span-1 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 text-white flex flex-col items-center justify-center p-4 text-center">
                <Heart className="h-12 w-12 mb-2 animate-pulse" />
                <CardTitle className="text-xl font-bold">Monsters Synced!</CardTitle>
                <CardDescription className="text-pink-100">Your connection is palpable!</CardDescription>
            </Card>
        ) : (
            <Card className="md:col-span-1 flex flex-col items-center justify-center p-4 text-center bg-muted/50">
                <Sparkles className="h-10 w-10 text-muted-foreground mb-2"/>
                <CardTitle className="text-md text-muted-foreground">Reach 100% Desire</CardTitle>
                <CardDescription className="text-xs">For both monsters to sync!</CardDescription>
            </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5"/>Simulated Chat Log</CardTitle>
        </CardHeader>
        <CardContent ref={chatLogRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-3 bg-background">
          {chatLog.length === 0 && <p className="text-muted-foreground text-sm text-center py-10">Start the conversation!</p>}
          {chatLog.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-2 rounded-lg text-sm ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="pt-4">
          <div className="flex w-full gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your charming message..."
              disabled={isAnalyzing || monstersSynced}
              className="flex-grow"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isAnalyzing && !monstersSynced) handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={isAnalyzing || !message.trim() || monstersSynced}>
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
        </CardFooter>
        {error && (
            <CardContent>
                <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
