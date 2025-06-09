'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, Sparkles, Heart, MessageCircle, ArrowLeft, VenetianMask, ClipboardList } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { analyzeMessageQualityAction, generateMonsterBanterAction } from '../../actions';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OpponentUser {
  id: string;
  displayName: string;
  romanticMonsterName: string;
  romanticMonsterImageUrl: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  messageQualityScore?: number;
}

interface MonsterBanterMessage {
  id: string;
  text: string;
  timestamp: Timestamp;
  conversationTone: string;
}

interface MessageQualityLogEntry {
  id: string;
  messageText: string;
  score: number;
  reasoning?: string;
  timestamp: Timestamp;
}

interface ChatRoom {
  id: string;
  participants: string[];
  userDesireForOpponent: number;
  opponentDesireForUser: number;
  monstersSynced: boolean;
  createdAt: Timestamp;
  lastActivity: Timestamp;
}

type ConversationTone = "positive" | "neutral" | "negative" | "flirty" | "awkward";

export default function FiberSinglesChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const opponentUserId = typeof params.mockUserId === 'string' ? params.mockUserId : null;
  
  const [userRomanticMonster, setUserRomanticMonster] = useState<{ name: string; imageUrl: string } | null>(null);
  const [opponent, setOpponent] = useState<OpponentUser | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [monsterChatLog, setMonsterChatLog] = useState<MonsterBanterMessage[]>([]);
  const [messageQualityLog, setMessageQualityLog] = useState<MessageQualityLogEntry[]>([]);
  
  const [isProcessing, startProcessingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const humanChatLogRef = useRef<HTMLDivElement>(null);
  const monsterChatLogRef = useRef<HTMLDivElement>(null);

  // Fetch user's romantic monster
  useEffect(() => {
    const fetchUserRomanticMonster = async () => {
      if (!user?.uid || !db) return;

      try {
        const romanticMonstersQuery = query(
          collection(db!, 'romanticMonsters'),
          where('userId', '==', user.uid),
          limit(1)
        );
        
        const snapshot = await getDocs(romanticMonstersQuery);
        if (!snapshot.empty) {
          const monsterData = snapshot.docs[0].data();
          setUserRomanticMonster({
            name: monsterData.name,
            imageUrl: monsterData.imageUrl
          });
        }
      } catch (error) {
        console.error('Error fetching user romantic monster:', error);
      }
    };

    fetchUserRomanticMonster();
  }, [user]);

  // Fetch opponent data
  useEffect(() => {
    const fetchOpponent = async () => {
      if (!opponentUserId || !db) return;

      try {
        // Get opponent user data
        const opponentDoc = await getDoc(doc(db!, 'users', opponentUserId));
        if (!opponentDoc.exists()) {
          setError('Opponent not found');
          return;
        }

        const opponentData = opponentDoc.data();

        // Get opponent's romantic monster
        const romanticMonstersQuery = query(
          collection(db!, 'romanticMonsters'),
          where('userId', '==', opponentUserId),
          limit(1)
        );
        
        const monsterSnapshot = await getDocs(romanticMonstersQuery);
        let romanticMonsterData = null;
        
        if (!monsterSnapshot.empty) {
          romanticMonsterData = monsterSnapshot.docs[0].data();
        }

        if (!romanticMonsterData) {
          setError('Opponent has no romantic monster');
          return;
        }

        setOpponent({
          id: opponentUserId,
          displayName: opponentData.displayName || opponentData.email?.split('@')[0] || 'Anonymous',
          romanticMonsterName: romanticMonsterData.name,
          romanticMonsterImageUrl: romanticMonsterData.imageUrl
        });
      } catch (error) {
        console.error('Error fetching opponent:', error);
        setError('Failed to load chat partner');
      }
    };

    fetchOpponent();
  }, [opponentUserId]);

  // Initialize or fetch chat room
  useEffect(() => {
    const initializeChatRoom = async () => {
      if (!user?.uid || !opponentUserId || !db) return;

      try {
        const participants = [user.uid, opponentUserId].sort();
        
        // Check if chat room already exists
        const chatRoomQuery = query(
          collection(db!, 'chatRooms'),
          where('participants', '==', participants)
        );
        
        const chatRoomSnapshot = await getDocs(chatRoomQuery);
        
        if (!chatRoomSnapshot.empty) {
          // Use existing chat room
          const roomData = chatRoomSnapshot.docs[0].data() as Omit<ChatRoom, 'id'>;
          setChatRoom({
            id: chatRoomSnapshot.docs[0].id,
            ...roomData
          });
        } else {
          // Create new chat room
          const newChatRoom = {
            participants,
            userDesireForOpponent: 50,
            opponentDesireForUser: 50,
            monstersSynced: false,
            createdAt: serverTimestamp(),
            lastActivity: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db!, 'chatRooms'), newChatRoom);
          setChatRoom({
            id: docRef.id,
            ...newChatRoom,
            createdAt: Timestamp.now(),
            lastActivity: Timestamp.now()
          });
        }
      } catch (error) {
        console.error('Error initializing chat room:', error);
        setError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChatRoom();
  }, [user, opponentUserId]);

  // Real-time listeners for chat messages
  useEffect(() => {
    if (!chatRoom?.id || !db) return;

    const messagesQuery = query(
      collection(db!, 'chatMessages'),
      where('chatRoomId', '==', chatRoom.id),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.docs.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage);
      });
      setChatLog(messages);
    });

    return () => unsubscribe();
  }, [chatRoom]);

  // Real-time listeners for monster banter
  useEffect(() => {
    if (!chatRoom?.id || !db) return;

    const banterQuery = query(
      collection(db!, 'monsterBanter'),
      where('chatRoomId', '==', chatRoom.id),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(banterQuery, (snapshot) => {
      const banter: MonsterBanterMessage[] = [];
      snapshot.docs.forEach(doc => {
        banter.push({
          id: doc.id,
          ...doc.data()
        } as MonsterBanterMessage);
      });
      setMonsterChatLog(banter);
    });

    return () => unsubscribe();
  }, [chatRoom]);

  // Fetch message quality log
  useEffect(() => {
    const fetchMessageQualityLog = async () => {
      if (!user?.uid || !chatRoom?.id || !db) return;

      try {
        const qualityLogQuery = query(
          collection(db!, 'messageQualityLogs'),
          where('userId', '==', user.uid),
          where('chatRoomId', '==', chatRoom.id),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(qualityLogQuery);
        const logs: MessageQualityLogEntry[] = [];
        
        snapshot.docs.forEach(doc => {
          logs.push({
            id: doc.id,
            ...doc.data()
          } as MessageQualityLogEntry);
        });

        setMessageQualityLog(logs);
      } catch (error) {
        console.error('Error fetching message quality log:', error);
      }
    };

    fetchMessageQualityLog();
  }, [user, chatRoom]);

  // Auto-scroll chat logs
  useEffect(() => {
    if (humanChatLogRef.current) {
      humanChatLogRef.current.scrollTop = humanChatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  useEffect(() => {
    if (monsterChatLogRef.current) {
      monsterChatLogRef.current.scrollTop = monsterChatLogRef.current.scrollHeight;
    }
  }, [monsterChatLog]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.uid || !chatRoom || !opponent || !userRomanticMonster || !db) return;
    
    setError(null);
    const userMessageText = message;
    setMessage('');
    
    startProcessingTransition(async () => {
      try {
        // Add message to Firestore
        await addDoc(collection(db!, 'chatMessages'), {
          chatRoomId: chatRoom.id,
          senderId: user.uid,
          text: userMessageText,
          timestamp: serverTimestamp()
        });

        // Analyze message quality
        const qualityResult = await analyzeMessageQualityAction({ messageText: userMessageText });

        // Log message quality
        await addDoc(collection(db!, 'messageQualityLogs'), {
          userId: user.uid,
          chatRoomId: chatRoom.id,
          messageText: userMessageText,
          score: qualityResult.score,
          reasoning: qualityResult.reasoning,
          timestamp: serverTimestamp()
        });

        // Update opponent's desire based on message quality
        const currentOpponentDesire = chatRoom.opponentDesireForUser;
        const newOpponentDesire = Math.min(100, Math.max(0, currentOpponentDesire + qualityResult.score));

        // Determine conversation tone
        let currentTone: ConversationTone = "neutral";
        if (qualityResult.score > 7) currentTone = "flirty";
        else if (qualityResult.score > 3) currentTone = "positive";
        else if (qualityResult.score <= 0) currentTone = "awkward";
        else if (qualityResult.score < -2) currentTone = "negative";

        // Generate monster banter
        const banterInput = {
          userMessageText: userMessageText,
          userMonsterName: userRomanticMonster.name,
          opponentMonsterName: opponent.romanticMonsterName,
          currentConversationTone: currentTone,
          previousBanter: monsterChatLog.slice(-2).map(b => ({ banterText: b.text })),
        };

        const banterResult = await generateMonsterBanterAction(banterInput);

        // Add monster banter to Firestore
        await addDoc(collection(db!, 'monsterBanter'), {
          chatRoomId: chatRoom.id,
          text: banterResult.banter,
          conversationTone: currentTone,
          timestamp: serverTimestamp()
        });

        // Update chat room with new desire levels
        const newMonstersSynced = chatRoom.userDesireForOpponent >= 100 && newOpponentDesire >= 100;
        
        await updateDoc(doc(db!, 'chatRooms', chatRoom.id), {
          opponentDesireForUser: newOpponentDesire,
          monstersSynced: newMonstersSynced,
          lastActivity: serverTimestamp()
        });

        // Update local state
        setChatRoom(prev => prev ? {
          ...prev,
          opponentDesireForUser: newOpponentDesire,
          monstersSynced: newMonstersSynced
        } : null);

        // Show sync notification
        if (newMonstersSynced && !chatRoom.monstersSynced) {
          toast({
            title: "💖 Monsters Synced! 💖",
            description: `${userRomanticMonster.name} and ${opponent.romanticMonsterName} have reached peak desire! Their connection is undeniable!`,
            variant: "default",
            duration: 10000,
          });
        }

        // Simulate opponent response (in a real app, this would come from the other user)
        setTimeout(async () => {
          const responses = [
            "That's interesting!", "Tell me more.", "I see.", "Fascinating!", 
            "What are your thoughts on that?", "How does that relate to your journey?",
            "Intriguing perspective.", "I'm enjoying this chat.", "Oh, really?",
            "I hadn't thought of it that way."
          ];
          
          const opponentResponse = responses[Math.floor(Math.random() * responses.length)];
          
          await addDoc(collection(db!, 'chatMessages'), {
            chatRoomId: chatRoom.id,
            senderId: opponent.id,
            text: opponentResponse,
            timestamp: serverTimestamp()
          });
        }, 1000 + Math.random() * 2000);
        
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to process message.";
        setError(errorMessage);
        toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Please log in to access Fiber Singles chat.</p>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  if (error || !opponent || !userRomanticMonster || !chatRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive mb-4">{error || 'Failed to load chat'}</p>
        <Button variant="outline" asChild>
          <Link href="/fiber-singles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fiber Singles
          </Link>
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
            <Image 
              src={opponent.romanticMonsterImageUrl} 
              alt={opponent.romanticMonsterName} 
              width={40} 
              height={40} 
              className="rounded-lg border-2 border-pink-400 object-cover" 
              data-ai-hint="opponent romantic monster"
            />
            <div>
              <CardTitle className="font-headline text-xl">Chatting with {opponent.displayName}</CardTitle>
              <CardDescription>
                As your romantic monster: <span className="font-semibold text-pink-600 dark:text-pink-400">{userRomanticMonster.name}</span>
              </CardDescription>
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
                  <p className="text-muted-foreground text-sm text-center py-10">No messages sent yet.</p>
                ) : (
                  <div className="space-y-3 p-1">
                    {messageQualityLog.map(entry => (
                      <Card key={entry.id} className="p-3">
                        <p className="text-xs text-muted-foreground">{entry.timestamp.toDate().toLocaleString()}</p>
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
            <Image 
              src={userRomanticMonster.imageUrl} 
              alt={userRomanticMonster.name} 
              width={128} 
              height={128} 
              className="rounded-lg border-2 border-pink-500 shadow-lg object-cover" 
              data-ai-hint="user romantic monster"
            />
            <CardTitle className="text-lg mt-2">{userRomanticMonster.name}</CardTitle>
            <CardDescription>Your Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="user-desire">{userRomanticMonster.name}'s Desire for {opponent.romanticMonsterName}: {chatRoom.userDesireForOpponent}%</Label>
            <Progress id="user-desire" value={chatRoom.userDesireForOpponent} className="h-3 bg-pink-200 [&>div]:bg-pink-500" />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Image 
              src={opponent.romanticMonsterImageUrl} 
              alt={opponent.romanticMonsterName} 
              width={128} 
              height={128} 
              className="rounded-lg border-2 border-purple-500 shadow-lg object-cover" 
              data-ai-hint="opponent romantic monster"
            />
            <CardTitle className="text-lg mt-2">{opponent.romanticMonsterName}</CardTitle>
            <CardDescription>{opponent.displayName}'s Persona</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Label htmlFor="opponent-desire">{opponent.romanticMonsterName}'s Desire for {userRomanticMonster.name}: {chatRoom.opponentDesireForUser}%</Label>
            <Progress id="opponent-desire" value={chatRoom.opponentDesireForUser} className="h-3 bg-purple-200 [&>div]:bg-purple-500" />
          </CardContent>
        </Card>
        
        {chatRoom.monstersSynced ? (
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
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5"/>Chat with {opponent.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent ref={humanChatLogRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-3 bg-background">
            {chatLog.length === 0 && <p className="text-muted-foreground text-sm text-center py-10">Start the conversation!</p>}
            {chatLog.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.senderId === user.uid ? 'justify-end' : 'justify-start')}>
                <div className={cn("max-w-[70%] p-2 rounded-lg text-sm shadow-md",
                  msg.senderId === user.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1", 
                    msg.senderId === user.uid ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left'
                  )}>
                    {msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="pt-4 flex-col gap-2">
            <div className="flex w-full gap-2 items-center">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your charming message..."
                disabled={isProcessing || chatRoom.monstersSynced}
                className="flex-grow"
                rows={1}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isProcessing && !chatRoom.monstersSynced) handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={isProcessing || !message.trim() || chatRoom.monstersSynced} className="shrink-0">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Send</span>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <VenetianMask className="h-5 w-5 text-purple-500"/>Monster Musings...
            </CardTitle>
            <CardDescription className="text-xs">The unseen chatter between {userRomanticMonster.name} &amp; {opponent.romanticMonsterName}</CardDescription>
          </CardHeader>
          <CardContent ref={monsterChatLogRef} className="h-64 overflow-y-auto border rounded-md p-3 space-y-3 bg-purple-50 dark:bg-purple-900/20">
            {monsterChatLog.length === 0 && <p className="text-muted-foreground text-sm text-center py-10">The monsters are quiet... for now.</p>}
            {monsterChatLog.map((banter) => (
              <div key={banter.id} className="p-2 rounded-lg text-sm bg-purple-100 dark:bg-purple-800/30 border border-purple-200 dark:border-purple-700 shadow-sm">
                <p className="italic text-purple-700 dark:text-purple-300">{banter.text}</p>
                <p className="text-xs text-purple-500 dark:text-purple-400/70 text-right mt-1">
                  {banter.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}