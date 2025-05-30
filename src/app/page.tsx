import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";

const stories = [
  {
    id: "1",
    author: "Elara Vance",
    avatar: "https://placehold.co/40x40.png",
    aiHint: "woman smiling",
    time: "2 hours ago",
    content: "Just needed a space to share... today was tough. The itching, the fatigue, and the feeling of being misunderstood by another doctor. It's exhausting. Grateful for this community where I know I'm not alone. Sending love to everyone fighting this.",
    imageUrl: "https://placehold.co/600x400.png",
    imageAiHint: "abstract light",
    likes: 15,
    comments: 3,
  },
  {
    id: "2",
    author: "Marcus Thorne",
    avatar: "https://placehold.co/40x40.png",
    aiHint: "man portrait",
    time: "5 hours ago",
    content: "Found a new coping mechanism that seems to help with the crawling sensations: cold compresses and mindfulness. It doesn't make it go away, but it makes it more bearable. Has anyone else tried something similar? Your experience is real, and so is your strength.",
    likes: 22,
    comments: 8,
  },
];

export default function BeliefCirclePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Share Your Story</CardTitle>
          <CardDescription>This is a safe space. Your experience is real and valid.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="What's on your mind today?" className="min-h-[100px]" />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>Post to Belief Circle</Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-semibold text-foreground">Community Stories</h2>
        {stories.map((story) => (
          <Card key={story.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={story.avatar} alt={story.author} data-ai-hint={story.aiHint} />
                  <AvatarFallback>{story.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-semibold">{story.author}</CardTitle>
                  <CardDescription className="text-xs">{story.time}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed">{story.content}</p>
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
