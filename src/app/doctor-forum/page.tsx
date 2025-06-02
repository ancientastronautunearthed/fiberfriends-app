
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquareText, Award, PlusCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';

const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const TRUSTED_DOCTOR_NAME = "Dr. Anya Sharma, MD"; // Define trusted doctor name

interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  avatarAiHint: string;
  time: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  comments: number;
  isTrustedDoctorPost?: boolean; // Optional flag
}

const initialForumPosts: ForumPost[] = [
  {
    id: "doc-post-1",
    author: TRUSTED_DOCTOR_NAME,
    avatar: "https://placehold.co/40x40.png",
    avatarAiHint: "professional doctor",
    time: "2 days ago",
    title: "Understanding Symptom Fluctuation in Morgellons",
    content: "Hello Fiber Friends community. I wanted to share some thoughts on why symptoms in Morgellons can vary so much from day to day or week to week. Many factors, including environmental triggers, stress levels, and individual immune responses, can play a role. Consistent journaling can be very helpful in identifying personal patterns. Remember, your experience is valid, and we are working towards better understanding. - Dr. Sharma",
    tags: ["Medical Insight", "Symptom Management", "Research"],
    upvotes: 210,
    comments: 45,
    isTrustedDoctorPost: true,
  },
  {
    id: "1",
    author: "Patient Advocate",
    avatar: "https://placehold.co/40x40.png?text=PA",
    avatarAiHint: "person microphone",
    time: "1 day ago",
    title: "My doc said it was just 'lint from my clothes'...",
    content: "After months of suffering, showing clear photos of fibers, the dermatologist literally shrugged and said, 'Looks like lint.' I was speechless. How do you even respond to that level of dismissal?",
    tags: ["Dismissal", "Dermatologist", "Frustration"],
    upvotes: 125,
    comments: 23,
  },
  {
    id: "2",
    author: "Fiber Fighter",
    avatar: "https://placehold.co/40x40.png?text=FF",
    avatarAiHint: "activist rally",
    time: "3 days ago",
    title: "Prescribed anti-depressants for skin lesions!",
    content: "Went in for painful skin lesions and crawling sensations. Came out with a prescription for an SSRI and a referral to a psychiatrist. Apparently, it's all in my head. The usual story, right?",
    tags: ["Misdiagnosis", "Psychological", "Anger"],
    upvotes: 98,
    comments: 15,
  },
  {
    id: "3",
    author: "TruthSeeker22",
    avatar: "https://placehold.co/40x40.png?text=TS",
    avatarAiHint: "detective magnifying glass",
    time: "5 days ago",
    title: "Doctor told me it was 'stress induced delusions'",
    content: "Showed my doctor photos, samples, everything. He wouldn't even look at them properly and just kept repeating that it's stress. I left feeling completely unheard.",
    tags: ["Gaslighting", "Unheard", "Stress"],
    upvotes: 150,
    comments: 33,
  },
  {
    id: "4",
    author: "HopefulOne",
    avatar: "https://placehold.co/40x40.png?text=HO",
    avatarAiHint: "person looking up",
    time: "1 week ago",
    title: "Finally found a doctor who listened!",
    content: "It took years, but I found an integrative MD who acknowledged my symptoms and is willing to explore options. Don't give up hope, everyone!",
    tags: ["Validation", "Hope", "IntegrativeMD"],
    upvotes: 250,
    comments: 45,
  },
  {
    id: "5",
    author: "SarcasticSurvivor",
    avatar: "https://placehold.co/40x40.png?text=SS",
    avatarAiHint: "comedian stage",
    time: "1 week ago",
    title: "Doc asked if I owned a cat. I don't.",
    content: "Apparently, the mysterious fibers are from a non-existent cat. Genius! What's the weirdest thing a doctor has told you?",
    tags: ["Funny", "Bizarre", "Pets"],
    upvotes: 180,
    comments: 50,
  },
];

const weeklyHighlight = {
  title: "Most Creative Misdiagnosis of the Week",
  author: "Anonymous User",
  misdiagnosis: "'Alien Spores reacting to your laundry detergent'",
  awardGiven: true,
};

export default function DoctorForumPage() {
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(initialForumPosts);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [userMonsterName, setUserMonsterName] = useState<string | null>(null);
  const [userMonsterImageUrl, setUserMonsterImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setUserMonsterName(localStorage.getItem(MONSTER_NAME_KEY));
    setUserMonsterImageUrl(localStorage.getItem(MONSTER_IMAGE_KEY));
  }, []);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and content for your post.",
        variant: "destructive",
      });
      return;
    }

    const tagsArray = newPostTags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const newPost: ForumPost = {
      id: String(Date.now()),
      author: userMonsterName || "Community Member",
      avatar: userMonsterImageUrl || "https://placehold.co/40x40.png?text=CM",
      avatarAiHint: userMonsterImageUrl ? "user monster" : "community member",
      time: "Just now",
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      tags: tagsArray,
      upvotes: 0,
      comments: 0,
    };

    setForumPosts(prevPosts => [newPost, ...prevPosts]);
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostTags('');
    toast({
      title: "Post Submitted!",
      description: "Your story has been added to the Intel on Obstructions forum (locally for this session).",
    });
  };


  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary"/>Share Your Doctor Story</CardTitle>
            <CardDescription>A safe space to share dismissive or bizarre comments from medical professionals. Transform frustration into camaraderie.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePostSubmit}>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input 
                  id="post-title" 
                  placeholder="A catchy title for your story..." 
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="post-content">Your Experience</Label>
                <Textarea 
                  id="post-content"
                  placeholder="Share your experience... (keep it respectful and avoid identifying information)" 
                  className="min-h-[120px]"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="post-tags">Tags (comma-separated)</Label>
                <Input 
                  id="post-tags"
                  placeholder="e.g., Dismissal, Funny, Helpful Tip" 
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit">Submit to Forum</Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-semibold text-foreground">Recent Forum Posts</h2>
          {forumPosts.map((post) => (
            <Card key={post.id} className={post.isTrustedDoctorPost ? 'border-2 border-primary bg-primary/5' : ''}>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar>
                    <AvatarImage src={post.avatar} alt={post.author} data-ai-hint={post.avatarAiHint} />
                    <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold flex items-center"> {/* Changed from p to div */}
                      {post.author}
                      {post.isTrustedDoctorPost && (
                        <Badge variant="default" className="ml-2 text-xs">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Trusted Advisor
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                <div>
                  {post.tags.map(tag => <Badge key={tag} variant="secondary" className="mr-1 mb-1">{tag}</Badge>)}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between text-muted-foreground border-t pt-4 mt-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4" /> {post.upvotes} Upvotes
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                  <MessageSquareText className="h-4 w-4" /> {post.comments} Comments
                </Button>
                <Button variant="link" size="sm">Join Discussion</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
        <Card className="bg-accent/30 border-accent">
            <CardHeader>
                <CardTitle className="font-headline text-accent-foreground flex items-center gap-2"><Award className="h-6 w-6 text-amber-500"/>Weekly Highlight</CardTitle>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold text-accent-foreground/90">{weeklyHighlight.title}</h3>
                <p className="text-lg italic text-accent-foreground/80 my-2">"{weeklyHighlight.misdiagnosis}"</p>
                <p className="text-xs text-accent-foreground/70">- Submitted by {weeklyHighlight.author}</p>
                {weeklyHighlight.awardGiven && <Badge className="mt-2 bg-amber-500 hover:bg-amber-600 text-white">Awarded!</Badge>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-md">Forum Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>This forum is for support and humor. Please:</p>
                <ul className="list-disc list-inside">
                    <li>Be respectful of others.</li>
                    <li>Avoid sharing personal identifying information (yours or doctors').</li>
                    <li>Focus on experiences, not medical advice.</li>
                    <li>Keep discussions constructive.</li>
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
