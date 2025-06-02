
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, ShieldCheck } from "lucide-react"; // Added ShieldCheck
import { Badge } from "@/components/ui/badge"; // Import Badge
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';

const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const TRUSTED_DOCTOR_NAME = "Dr. Anya Sharma, MD"; // Consistent name

interface Story {
  id: string;
  author: string;
  avatar: string;
  avatarAiHint: string;
  time: string;
  content: string;
  imageUrl?: string;
  imageAiHint?: string;
  likes: number;
  comments: number;
  isTrustedDoctorPost?: boolean;
}

const initialStories: Story[] = [
   {
    id: "doc-story-1",
    author: TRUSTED_DOCTOR_NAME,
    avatar: "https://placehold.co/40x40.png", // Use a specific avatar if desired
    avatarAiHint: "professional doctor",
    time: "3 hours ago",
    content: "Hello everyone, Dr. Sharma here. I want to emphasize the importance of self-compassion on this journey. It's okay to have difficult days. Acknowledge your feelings without judgment. Small acts of self-care can make a difference. We're here to support each other.",
    imageUrl: "https://placehold.co/600x400.png?text=Compassion",
    imageAiHint: "calm peaceful scene",
    likes: 180,
    comments: 25,
    isTrustedDoctorPost: true,
  },
  {
    id: "1",
    author: "Elara Vance",
    avatar: "https://placehold.co/40x40.png?text=EV",
    avatarAiHint: "woman smiling",
    time: "2 hours ago",
    content: "Just needed a space to share... today was tough. The itching, the fatigue, and the feeling of being misunderstood by another doctor. It's exhausting. Grateful for this community where I know I'm not alone. Sending love to everyone fighting this.",
    imageUrl: "https://placehold.co/600x400.png?text=Support",
    imageAiHint: "abstract light",
    likes: 152,
    comments: 31,
  },
  {
    id: "2",
    author: "Marcus Thorne",
    avatar: "https://placehold.co/40x40.png?text=MT",
    avatarAiHint: "man portrait",
    time: "5 hours ago",
    content: "Found a new coping mechanism that seems to help with the crawling sensations: cold compresses and mindfulness. It doesn't make it go away, but it makes it more bearable. Has anyone else tried something similar? Your experience is real, and so is your strength.",
    likes: 221,
    comments: 83,
  },
  // ... (keep other existing stories)
  {
    id: "3",
    author: "Aisha Khan",
    avatar: "https://placehold.co/40x40.png?text=AK",
    avatarAiHint: "person thinking",
    time: "1 day ago",
    content: "Feeling hopeful today. Had a good conversation with a friend who actually listened without judgment. It's amazing how much that can lift your spirits. Small victories!",
    imageUrl: "https://placehold.co/600x400.png?text=Hope",
    imageAiHint: "sunrise landscape",
    likes: 98,
    comments: 12,
  },
];

export default function BeliefCirclePage() {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [newStoryContent, setNewStoryContent] = useState('');
  const [userMonsterName, setUserMonsterName] = useState<string | null>(null);
  const [userMonsterImageUrl, setUserMonsterImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setUserMonsterName(localStorage.getItem(MONSTER_NAME_KEY));
    setUserMonsterImageUrl(localStorage.getItem(MONSTER_IMAGE_KEY));
  }, []);

  const handlePostStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryContent.trim()) {
      toast({
        title: "Empty Post",
        description: "Please write something to share.",
        variant: "destructive",
      });
      return;
    }

    const newStory: Story = {
      id: String(Date.now()),
      author: userMonsterName || "Community Member",
      avatar: userMonsterImageUrl || "https://placehold.co/40x40.png?text=CM",
      avatarAiHint: userMonsterImageUrl ? "user monster" : "community member",
      time: "Just now",
      content: newStoryContent.trim(),
      likes: 0,
      comments: 0,
    };

    setStories(prevStories => [newStory, ...prevStories]);
    setNewStoryContent('');
    toast({
      title: "Story Shared!",
      description: "Your thoughts have been added to the Comrades' Campfire (locally for this session).",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Share Your Story</CardTitle>
          <CardDescription>This is a safe space. Your experience is real and valid.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePostStory}>
          <CardContent>
            <Textarea 
              placeholder="What's on your mind today?" 
              className="min-h-[100px]"
              value={newStoryContent}
              onChange={(e) => setNewStoryContent(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Post to Comrades' Campfire</Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-semibold text-foreground">Community Stories</h2>
        {stories.map((story) => (
          <Card key={story.id} className={story.isTrustedDoctorPost ? 'border-2 border-primary bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={story.avatar} alt={story.author} data-ai-hint={story.avatarAiHint} />
                  <AvatarFallback>{story.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center">
                    {story.author}
                    {story.isTrustedDoctorPost && (
                      <Badge variant="default" className="ml-2 text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Trusted Advisor
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{story.time}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{story.content}</p>
              {story.imageUrl && (
                <Image
                  src={story.imageUrl}
                  alt="User uploaded content"
                  width={600}
                  height={400}
                  className="rounded-lg border object-cover"
                  data-ai-hint={story.imageAiHint}
                />
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between text-muted-foreground border-t pt-4 mt-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" /> {story.likes} Likes
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> {story.comments} Comments
              </Button>
              <Button variant="link" size="sm">Read More</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
