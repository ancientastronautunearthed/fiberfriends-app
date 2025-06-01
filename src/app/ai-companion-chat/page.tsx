
'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, Bot, AlertTriangle, UserCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { aiCompanionChatAction } from './actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl'; // For user avatar

export default function AiCompanionChatPage() {
  const { toast } = useToast();
  const [userMessage, setUserMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  // Placeholder for premium check - in a real app, this would involve auth state
  const isPremiumSubscriber = true; // Assume true for prototype

  useEffect(() => {
    // Load user avatar (monster image)
    const storedMonsterImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    if (storedMonsterImage) {
      setUserAvatarUrl(storedMonsterImage);
    }
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;
    setError(null);

    const newUserMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userMessage, timestamp: new Date() };
    setChatLog(prev => [...prev, newUserMessage]);
    const currentMessage = userMessage;
    setUserMessage('');

    startProcessingTransition(async () => {
      try {
        const aiResult = await aiCompanionChatAction({ userMessage: currentMessage });
        const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiResult.aiResponse, timestamp: new Date() };
        setChatLog(prev => [...prev, aiMessage]);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to get AI response.";
        setError(errorMessage);
        toast({ title: "AI Companion Error", description: errorMessage, variant: "destructive" });
        // Optionally add the error message back to the input or as a system message in chat
        // setUserMessage(currentMessage); // or add a system error message to chatLog
      }
    });
  };

  if (!isPremiumSubscriber) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Bot />AI Companion Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-accent/20 border-accent text-accent-foreground">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Premium Feature</AlertTitle>
            <AlertDescription>
              The AI Companion Chat is available for premium subscribers. Please upgrade to access this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
            {/* Add a link to your subscription/upgrade page if available */}
            {/* <Button asChild><Link href="/subscribe">Upgrade to Premium</Link></Button> */}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="font-headline flex items-center gap-2"><Bot />AI Supportive Companion</CardTitle>
          <CardDescription className="text-xs">
            This AI is for supportive listening. It is NOT a therapist and cannot provide medical advice or crisis support.
            If you need medical help or are in crisis, please contact a healthcare professional or emergency services.
          </CardDescription>
        </CardHeader>

        <ScrollArea className="flex-grow p-4" ref={chatLogRef}>
          <div className="space-y-4">
            {chatLog.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    {userAvatarUrl ? <AvatarImage src={userAvatarUrl} alt="User" data-ai-hint="profile monster" /> : null}
                    <AvatarFallback><UserCircle size={18}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isProcessing && chatLog.length > 0 && chatLog[chatLog.length-1].sender === 'user' && (
                <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8"><AvatarFallback><Bot size={18}/></AvatarFallback></Avatar>
                    <div className="max-w-[70%] p-3 rounded-lg shadow-sm text-sm bg-muted text-muted-foreground rounded-bl-none">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        {error && (
            <div className="p-4 border-t">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}

        <CardFooter className="p-4 border-t">
          <div className="flex w-full gap-2 items-center">
            <Textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Share what's on your mind..."
              disabled={isProcessing}
              className="min-h-[40px] max-h-[120px] resize-none flex-grow"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isProcessing) handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={isProcessing || !userMessage.trim()}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
