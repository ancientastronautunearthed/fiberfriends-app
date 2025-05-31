
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserSearch, ShieldQuestion } from "lucide-react";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';

const mockSingles = [
  {
    id: "s1",
    name: "Casey L.",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person smiling",
    bio: "Loves hiking, reading, and quiet evenings. Looking for someone understanding and kind.",
    interests: ["Nature", "Books", "Mindfulness", "Art"],
    onlineStatus: "Online",
  },
  {
    id: "s2",
    name: "Jordan M.",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "artist painting",
    bio: "Creative soul, passionate about music and sustainable living. Values deep conversations.",
    interests: ["Music", "Sustainability", "Cooking", "Yoga"],
    onlineStatus: "Active 3 hours ago",
  },
  {
    id: "s3",
    name: "Riley P.",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person cafe",
    bio: "Tech enthusiast and coffee lover. Enjoys exploring new cafes and discussing documentaries.",
    interests: ["Technology", "Coffee", "Documentaries", "Travel"],
    onlineStatus: "Online",
  },
   {
    id: "s4",
    name: "Alex B.",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person outdoors",
    bio: "Adventurous spirit, enjoys board games and volunteering. Seeks a partner with a good sense of humor.",
    interests: ["Board Games", "Volunteering", "Comedy", "Animals"],
    onlineStatus: "Active 1 day ago",
  },
];

export default function FiberSinglesPage() {
  const { toast } = useToast();

  const handleSendMessage = (userName: string) => {
    toast({
      title: "Simulated Message",
      description: `Sending a message to ${userName} would cost 50 points or be free with Premium. (This is a simulated feature for the prototype.)`,
      variant: "default",
      duration: 7000,
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <UserSearch className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Fiber Singles Connect</CardTitle>
          <CardDescription className="max-w-xl mx-auto">
            Connect with other members of the Fiber Friends community. Users on this page have opted-in to be visible in the singles section. 
            (This feature is a prototype using mock profiles.)
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-4 bg-accent/20 border border-accent rounded-md text-accent-foreground mb-6">
              <div className="flex items-start gap-3">
                 <ShieldQuestion className="h-6 w-6 text-amber-500 mt-1 shrink-0"/> 
                 <div>
                    <h3 className="text-md font-semibold">Messaging & Points (Simulated)</h3>
                    <p className="text-sm text-accent-foreground/80">
                        In a full version, sending a Direct Message (DM) might cost 50 profile points, or be unlimited with a Premium Membership. For this prototype, clicking "Send Message" will show a notification.
                    </p>
                 </div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSingles.map(user => (
              <Card key={user.id} className="flex flex-col transition-all hover:shadow-xl hover:scale-[1.02]">
                <CardHeader className="items-center text-center p-4">
                  <Avatar className="w-24 h-24 mb-3 border-2 border-primary shadow-md">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.aiHint}/>
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{user.onlineStatus}</CardDescription>
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
                <CardFooter className="p-4 mt-auto">
                  <Button className="w-full" onClick={() => handleSendMessage(user.name)}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Send Message
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
                <li>Understand this is for connection, not a substitute for medical advice.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
