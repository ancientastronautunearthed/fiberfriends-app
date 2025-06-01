
'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, Sparkles, Heart, MessageCircle, ArrowLeft, VenetianMask, ClipboardList, Puzzle } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { analyzeMessageQualityAction, generateMonsterBanterAction } from '../../actions';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

const ROMANTIC_MONSTER_IMAGE_KEY = 'romanticMonsterImageUrl';
const ROMANTIC_MONSTER_NAME_KEY = 'romanticMonsterName';

interface MockOpponent {
  id: string;
  name: string; 
  romanticMonsterName: string;
  romanticMonsterImageUrl: string;
  romanticMonsterAiHint: string;
}

const mockOpponentsDatabase: Record<string, MockOpponent> = {
  s1: { id: "s1", name: "Casey L.", romanticMonsterName: "Velvet Whisperwind", romanticMonsterImageUrl: "https://placehold.co/128x128.png", romanticMonsterAiHint: "gentle fantasy creature" },
  s2: { id: "s2", name: "Jordan M.", romanticMonsterName: "Starlight Dreamer", romanticMonsterImageUrl: "https://placehold.co/128x128.png", romanticMonsterAiHint: "dreamlike ethereal being" },
};

interface ChatMessage {
    id: string;
    sender: 'user' | 'opponent' | 'system' | 'game_statements';
    text: string;
    timestamp: Date;
    statements?: string[]; // For game_statements type
}

interface MonsterBanterMessage {
    id: string;
    text: string;
    timestamp: Date;
}

interface MessageQualityLogEntry {
    id: string;
    messageText: string;
    score: number;
    reasoning?: string;
    timestamp: Date;
}

type ConversationTone = "positive" | "neutral" | "negative" | "flirty" | "awkward";

// Examples for "Two Truths & a Monster Whimsy"
const truthExamples = [
  "My favorite season is autumn.",
  "I'm a surprisingly good cook.",
  "I've traveled to more than 5 countries.",
  "I enjoy stargazing on clear nights.",
  "I prefer tea over coffee.",
  "My hidden talent is juggling."
];

const monsterWhimsyExamples = [
  "My monster's laughter sounds like wind chimes.",
  "My monster collects lost buttons and calls them 'tiny shields'.",
  "My monster can only sleep if it's cuddling a glowing mushroom.",
  "My monster hums ancient lullabies that make plants grow faster.",
  "My monster's favorite snack is moonbeams.",
  "My monster gets shy around butterflies."
];

function getRandomExamples(arr: string[], count: number): string[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}


export default function SimulatedChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const mockUserId = typeof params.mockUserId === 'string' ? params.mockUserId : null;
  
  const [userRomanticMonsterName, setUserRomanticMonsterName] = useState<string | null>(null);
  const [userRomanticMonsterImageUrl, setUserRomanticMonsterImageUrl] = useState<string | null>(null);
  const [mockOpponent, setMockOpponent] = useState<MockOpponent | null>(null);
  
  const [userDesire, setUserDesire] = useState(0);
  const [opponentDesire, setOpponentDesire] = useState(0);
  const [monstersSynced, setMonstersSynced] = useState(false);
  
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [monsterChatLog, setMonsterChatLog] = useState<MonsterBanterMessage[]>([]);
  const [messageQualityLog, setMessageQualityLog] = useState<MessageQualityLogEntry[]>([]);
  
  const [isProcessing, startProcessingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const humanChatLogRef = useRef<HTMLDivElement>(null);
  const monsterChatLogRef = useRef<HTMLDivElement>(null);

  // State for "Two Truths & a Monster Whimsy" Modal
  const [isWhimsyModalOpen, setIsWhimsyModalOpen] = useState(false);
  const [truth1, setTruth1] = useState('');
  const [truth2, setTruth2] = useState('');
  const [monsterWhimsy, setMonsterWhimsy] = useState('');
  const [customTruth1, setCustomTruth1] = useState('');
  const [customTruth2, setCustomTruth2] = useState('');
  const [customMonsterWhimsy, setCustomMonsterWhimsy] = useState('');

  const [truth1Options, setTruth1Options] = useState<string[]>([]);
  const [truth2Options, setTruth2Options] = useState<string[]>([]);
  const [monsterWhimsyOptions, setMonsterWhimsyOptions] = useState<string[]>([]);


  useEffect(() => {
    setUserRomanticMonsterName(localStorage.getItem(ROMANTIC_MONSTER_NAME_KEY));
    setUserRomanticMonsterImageUrl(localStorage.getItem(ROMANTIC_MONSTER_IMAGE_KEY));

    if (mockUserId && mockOpponentsDatabase[mockUserId]) {
      const currentOpponent = mockOpponentsDatabase[mockUserId];
      setMockOpponent(currentOpponent);
      
      const userDesireKey = `desire_userFor_${mockUserId}`;
      const opponentDesireKey = `desire_${mockUserId}_forUser`;
      const syncedKey = `monstersSynced_${mockUserId}`;
      const qualityLogKey = `messageQualityLog_${mockUserId}`;
      const existingChatLogKey = `chatLog_${mockUserId}`;
      const existingMonsterChatLogKey = `monsterChatLog_${mockUserId}`;


      setUserDesire(parseInt(localStorage.getItem(userDesireKey) || '50', 10));
      setOpponentDesire(parseInt(localStorage.getItem(opponentDesireKey) || '50', 10));
      setMonstersSynced(localStorage.getItem(syncedKey) === 'true');
      
      const storedQualityLog = localStorage.getItem(qualityLogKey);
      if (storedQualityLog) setMessageQualityLog(JSON.parse(storedQualityLog).map((l: MessageQualityLogEntry) => ({...l, timestamp: new Date(l.timestamp)})));
      
      const storedChatLog = localStorage.getItem(existingChatLogKey);
      if (storedChatLog) setChatLog(JSON.parse(storedChatLog).map((m: ChatMessage) => ({...m, timestamp: new Date(m.timestamp)})));

      const storedMonsterLog = localStorage.getItem(existingMonsterChatLogKey);
      if (storedMonsterLog) setMonsterChatLog(JSON.parse(storedMonsterLog).map((m: MonsterBanterMessage) => ({...m, timestamp: new Date(m.timestamp)})));


    } else {
      router.push('/fiber-singles');
    }
  }, [mockUserId, router]);

  useEffect(() => {
    if (humanChatLogRef.current) {
      humanChatLogRef.current.scrollTop = humanChatLogRef.current.scrollHeight;
    }
    if (mockUserId && chatLog.length > 0) {
        localStorage.setItem(`chatLog_${mockUserId}`, JSON.stringify(chatLog));
    }
  }, [chatLog, mockUserId]);

  useEffect(() => {
    if (monsterChatLogRef.current) {
        monsterChatLogRef.current.scrollTop = monsterChatLogRef.current.scrollHeight;
    }
    if (mockUserId && monsterChatLog.length > 0) {
        localStorage.setItem(`monsterChatLog_${mockUserId}`, JSON.stringify(monsterChatLog));
    }
  }, [monsterChatLog, mockUserId]);

  useEffect(() => {
    if (mockUserId && messageQualityLog.length > 0) {
        localStorage.setItem(`messageQualityLog_${mockUserId}`, JSON.stringify(messageQualityLog));
    }
  }, [messageQualityLog, mockUserId]);


  const handleSendMessage = async () => {
    if (!message.trim() || !mockUserId || !mockOpponent || !userRomanticMonsterName) return;
    setError(null);

    const userMessageText = message;
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userMessageText, timestamp: new Date() };
    setChatLog(prev => [...prev, userMessage]);
    setMessage('');
    
    startProcessingTransition(async () => {
      try {
        const qualityResult = await analyzeMessageQualityAction({ messageText: userMessageText });
        const score = qualityResult.score;

        const newQualityLogEntry: MessageQualityLogEntry = {
            id: Date.now().toString(),
            messageText: userMessageText,
            score: score,
            reasoning: qualityResult.reasoning,
            timestamp: new Date(),
        };
        setMessageQualityLog(prev => [newQualityLogEntry, ...prev].slice(0, 50));

        let newOpponentDesire = Math.min(100, Math.max(0, opponentDesire + score)); 
        setOpponentDesire(newOpponentDesire);
        localStorage.setItem(`desire_${mockUserId}_forUser`, String(newOpponentDesire));

        const cannedReplies = [
            "That's interesting!", "Tell me more.", "I see.", "Fascinating!", "What are your thoughts on that?",
            `My ${mockOpponent.romanticMonsterName} seems to like what your ${userRomanticMonsterName} is saying!`,
            "How does that relate to your 5 words?", "Intriguing perspective.", "I'm enjoying this chat.",
            "My monster is definitely perking up!", "Oh, really?", "I hadn't thought of it that way."
        ];
        const opponentMessageText = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
        const opponentMessage: ChatMessage = {id: (Date.now() + 1).toString(), sender: 'opponent', text: opponentMessageText, timestamp: new Date()};
        
        setTimeout(() => {
            setChatLog(prev => [...prev, opponentMessage]);
        }, 1000 + Math.random() * 1000);

        let currentTone: ConversationTone = "neutral";
        if (score > 7) currentTone = "flirty";
        else if (score > 3) currentTone = "positive";
        else if (score <= 0) currentTone = "awkward";
        else if (score < -2) currentTone = "negative";

        const banterInput = {
          userMessageText: userMessageText,
          userMonsterName: userRomanticMonsterName,
          opponentMonsterName: mockOpponent.romanticMonsterName,
          currentConversationTone: currentTone,
          previousBanter: monsterChatLog.slice(-2).map(b => ({ banterText: b.text })), 
        };
        const banterResult = await generateMonsterBanterAction(banterInput);
        const newMonsterBanter: MonsterBanterMessage = { id: (Date.now() + 2).toString(), text: banterResult.banter, timestamp: new Date()};
        
        setTimeout(() => {
             setMonsterChatLog(prev => [...prev, newMonsterBanter]);
        }, 500 + Math.random() * 500);

        if (userDesire >= 100 && newOpponentDesire >= 100 && !monstersSynced) {
          setMonstersSynced(true);
          localStorage.setItem(`monstersSynced_${mockUserId}`, 'true');
          toast({
            title: "💖 Monsters Synced! 💖",
            description: `${userRomanticMonsterName} and ${mockOpponent.romanticMonsterName} have reached peak desire! Their connection is undeniable!`,
            variant: "default",
            duration: 10000,
          });
        }
        
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to process message.";
        setError(errorMessage);
        toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const handleOpenWhimsyGameModal = () => {
    setTruth1Options(getRandomExamples(truthExamples, 3));
    setTruth2Options(getRandomExamples(truthExamples.filter(ex => !truth1Options.includes(ex)), 3));
    setMonsterWhimsyOptions(getRandomExamples(monsterWhimsyExamples, 3));
    setTruth1(''); setCustomTruth1('');
    setTruth2(''); setCustomTruth2('');
    setMonsterWhimsy(''); setCustomMonsterWhimsy('');
    setIsWhimsyModalOpen(true);
  };

  const handleSubmitWhimsyStatements = () => {
    const finalTruth1 = customTruth1.trim() || truth1;
    const finalTruth2 = customTruth2.trim() || truth2;
    const finalMonsterWhimsy = customMonsterWhimsy.trim() || monsterWhimsy;

    if (!finalTruth1 || !finalTruth2 || !finalMonsterWhimsy) {
      toast({ title: "Missing Statements", description: "Please provide or select all three statements.", variant: "destructive" });
      return;
    }

    if (finalTruth1 === finalTruth2 || finalTruth1 === finalMonsterWhimsy || finalTruth2 === finalMonsterWhimsy) {
        toast({ title: "Duplicate Statements", description: "Please ensure all three statements are unique.", variant: "destructive"});
        return;
    }

    const statements = [finalTruth1, finalTruth2, finalMonsterWhimsy];
    // Shuffle the statements so the whimsy isn't always last
    const shuffledStatements = [...statements].sort(() => Math.random() - 0.5);

    const gameMessage: ChatMessage = {
      id: `game_statements-${Date.now()}`,
      sender: 'game_statements', // Or 'user' if preferred, styled distinctly
      text: `${userRomanticMonsterName || 'I'} present my 'Two Truths & a Monster Whimsy'! One of these is about my monster, the other two are true about me. Can you guess the Monster Whimsy, ${mockOpponent?.name}?`,
      statements: shuffledStatements,
      timestamp: new Date(),
    };
    setChatLog(prev => [...prev, gameMessage]);
    setIsWhimsyModalOpen(false);
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
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/fiber-singles')} className="mr-2">
                <ArrowLeft />
            </Button>
            <Image src={mockOpponent.romanticMonsterImageUrl} alt={mockOpponent.romanticMonsterName} width={40} height={40} className="rounded-lg border-2 border-pink-400 object-cover" data-ai-hint={mockOpponent.romanticMonsterAiHint}/>
            <div>
                <CardTitle className="font-headline text-xl">Chatting with {mockOpponent.name}</CardTitle>
                <CardDescription>As your romantic monster: <span className="font-semibold text-pink-600 dark:text-pink-400">{userRomanticMonsterName}</span></CardDescription>
            </div>
          </div>
           <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ClipboardList className="mr-2 h-4 w-4" /> View Message Quality Log
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Message Quality Log</DialogTitle>
                <DialogDescription>
                  Review of AI feedback on your sent messages.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-96">
                {messageQualityLog.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-10">No messages sent yet or log is empty.</p>
                ) : (
                  <div className="space-y-3 p-1">
                    {messageQualityLog.map(entry => (
                      <Card key={entry.id} className="p-3">
                        <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                        <p className="text-sm font-medium mt-1">Your message: <span className="italic">"{entry.messageText}"</span></p>
                        <p className={`text-sm mt-1 ${entry.score > 0 ? 'text-green-600' : entry.score < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          AI Score: {entry.score}
                        </p>
                        {entry.reasoning && <p className="text-xs text-muted-foreground mt-0.5">Reasoning: {entry.reasoning}</p>}
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Image src={userRomanticMonsterImageUrl} alt={userRomanticMonsterName} width={128} height={128} className="rounded-lg border-2 border-pink-500 shadow-lg object-cover" data-ai-hint="user romantic monster"/>
            <CardTitle className="text-lg mt-2">{userRomanticMonsterName}</CardTitle>
            <CardDescription>Your Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="user-desire">{userRomanticMonsterName}'s Desire for {mockOpponent.romanticMonsterName}: {userDesire}%</Label>
            <Progress id="user-desire" value={userDesire} className="h-3 bg-pink-200 [&>div]:bg-pink-500" />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Image src={mockOpponent.romanticMonsterImageUrl} alt={mockOpponent.romanticMonsterName} width={128} height={128} className="rounded-lg border-2 border-purple-500 shadow-lg object-cover" data-ai-hint={mockOpponent.romanticMonsterAiHint}/>
            <CardTitle className="text-lg mt-2">{mockOpponent.romanticMonsterName}</CardTitle>
            <CardDescription>{mockOpponent.name}'s Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="opponent-desire">{mockOpponent.romanticMonsterName}'s Desire for {userRomanticMonsterName}: {opponentDesire}%</Label>
            <Progress id="opponent-desire" value={opponentDesire} className="h-3 bg-purple-200 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>
        
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5"/>Simulated Chat Log with {mockOpponent.name}</CardTitle>
            </CardHeader>
            <CardContent ref={humanChatLogRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-3 bg-background">
            {chatLog.length === 0 && <p className="text-muted-foreground text-sm text-center py-10">Start the conversation!</p>}
            {chatLog.map((msg) => (
                <div key={msg.id} className={cn("flex", 
                    msg.sender === 'user' ? 'justify-end' : msg.sender === 'opponent' ? 'justify-start' : 'justify-center'
                )}>
                    {msg.sender === 'system' ? (
                        <div className="my-2 p-2 text-xs text-center text-muted-foreground bg-accent/50 rounded-md shadow-sm w-full max-w-md whitespace-pre-wrap">
                            {msg.text}
                        </div>
                    ) : msg.sender === 'game_statements' && msg.statements ? (
                        <Card className="my-2 p-3 bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 w-full max-w-md shadow-md">
                           <CardDescription className="text-xs text-purple-700 dark:text-purple-300 mb-2">{msg.text}</CardDescription>
                            <ul className="list-disc list-inside pl-2 space-y-1">
                                {msg.statements.map((stmt, idx) => (
                                    <li key={idx} className="text-sm text-purple-800 dark:text-purple-200 italic">"{stmt}"</li>
                                ))}
                            </ul>
                        </Card>
                    ) : (
                        <div className={cn("max-w-[70%] p-2 rounded-lg text-sm shadow-md",
                            msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                        )}>
                            <p>{msg.text}</p>
                            <p className={cn("text-xs mt-1", 
                                msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left'
                            )}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    )}
                </div>
            ))}
            </CardContent>
            <CardFooter className="pt-4 flex-col gap-2">
                <div className="flex w-full gap-2 items-center">
                    <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your charming message..."
                    disabled={isProcessing || monstersSynced}
                    className="flex-grow"
                    rows={1}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isProcessing && !monstersSynced) handleSendMessage();
                        }
                    }}
                    />
                    <Button onClick={handleSendMessage} disabled={isProcessing || !message.trim() || monstersSynced} className="shrink-0">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Send</span>
                    </Button>
                </div>
                <Button onClick={handleOpenWhimsyGameModal} variant="outline" size="sm" className="w-full mt-2" disabled={isProcessing || monstersSynced}>
                    <Puzzle className="mr-2 h-4 w-4"/> Play 'Two Truths &amp; a Monster Whimsy'
                </Button>
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

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><VenetianMask className="h-5 w-5 text-purple-500"/>Monster Musings...</CardTitle>
                <CardDescription className="text-xs">The unseen chatter between {userRomanticMonsterName} &amp; {mockOpponent.romanticMonsterName}</CardDescription>
            </CardHeader>
            <CardContent ref={monsterChatLogRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-3 bg-purple-50 dark:bg-purple-900/20">
                {monsterChatLog.length === 0 && <p className="text-muted-foreground text-sm text-center py-10">The monsters are quiet... for now.</p>}
                {monsterChatLog.map((banter) => (
                    <div key={banter.id} className="p-2 rounded-lg text-sm bg-purple-100 dark:bg-purple-800/30 border border-purple-200 dark:border-purple-700 shadow-sm">
                        <p className="italic text-purple-700 dark:text-purple-300">{banter.text}</p>
                        <p className="text-xs text-purple-500 dark:text-purple-400/70 text-right mt-1">
                            {banter.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

      {/* "Two Truths & a Monster Whimsy" Modal */}
      <Dialog open={isWhimsyModalOpen} onOpenChange={setIsWhimsyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Puzzle className="text-primary"/>Two Truths &amp; a Monster Whimsy</DialogTitle>
            <DialogDescription>
              Prepare your three statements. Your opponent will try to guess which one is about your Romantic Monster!
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-6 pr-3">
                {/* Truth 1 */}
                <div className="space-y-2">
                    <Label className="font-semibold">Truth 1 (About You)</Label>
                    <RadioGroup onValueChange={setTruth1} value={truth1}>
                    {truth1Options.map((opt, i) => (
                        <div key={`t1-${i}`} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`t1-opt-${i}`} />
                        <Label htmlFor={`t1-opt-${i}`} className="font-normal text-sm">{opt}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                    <Input 
                    value={customTruth1} 
                    onChange={(e) => { setCustomTruth1(e.target.value); if (e.target.value) setTruth1(''); }} 
                    placeholder="Or write your own truth..." 
                    className="mt-2 text-sm"
                    />
                </div>

                {/* Truth 2 */}
                <div className="space-y-2">
                    <Label className="font-semibold">Truth 2 (About You)</Label>
                    <RadioGroup onValueChange={setTruth2} value={truth2}>
                    {truth2Options.map((opt, i) => (
                        <div key={`t2-${i}`} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`t2-opt-${i}`} />
                        <Label htmlFor={`t2-opt-${i}`} className="font-normal text-sm">{opt}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                    <Input 
                    value={customTruth2} 
                    onChange={(e) => { setCustomTruth2(e.target.value); if (e.target.value) setTruth2(''); }} 
                    placeholder="Or write another truth..." 
                    className="mt-2 text-sm"
                    />
                </div>

                {/* Monster Whimsy */}
                <div className="space-y-2">
                    <Label className="font-semibold">Monster Whimsy (About Your Romantic Monster)</Label>
                    <RadioGroup onValueChange={setMonsterWhimsy} value={monsterWhimsy}>
                    {monsterWhimsyOptions.map((opt, i) => (
                        <div key={`w-${i}`} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`w-opt-${i}`} />
                        <Label htmlFor={`w-opt-${i}`} className="font-normal text-sm">{opt}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                    <Input 
                    value={customMonsterWhimsy} 
                    onChange={(e) => { setCustomMonsterWhimsy(e.target.value); if (e.target.value) setMonsterWhimsy(''); }} 
                    placeholder="Or write your own monster whimsy..." 
                    className="mt-2 text-sm"
                    />
                </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitWhimsyStatements}>Share Statements in Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

