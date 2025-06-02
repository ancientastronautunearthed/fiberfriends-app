
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
  {
    id: "4",
    author: "David Miller",
    avatar: "https://placehold.co/40x40.png?text=DM",
    avatarAiHint: "man outdoors",
    time: "2 days ago",
    content: "The brain fog has been intense this week. Sometimes I feel like I'm wading through mud. Any tips for managing it when you have to be productive?",
    likes: 75,
    comments: 25,
  },
  {
    id: "5",
    author: "Sophia Chen",
    avatar: "https://placehold.co/40x40.png?text=SC",
    avatarAiHint: "woman writing",
    time: "3 days ago",
    content: "Documenting everything in my symptom journal has been surprisingly helpful. It helps me see patterns I wouldn't have noticed otherwise. Highly recommend if you're not already doing it.",
    imageUrl: "https://placehold.co/600x400.png?text=Journal",
    imageAiHint: "open notebook",
    likes: 110,
    comments: 18,
  },
  {
    id: "6",
    author: "Leo Maxwell",
    avatar: "https://placehold.co/40x40.png?text=LM",
    avatarAiHint: "person nature",
    time: "4 days ago",
    content: "Just want to remind everyone: your pain is valid, your experiences are real. Don't let anyone make you doubt yourself. We are in this together.",
    likes: 305,
    comments: 45,
  },
  {
    id: "7",
    author: "Isabelle Moreau",
    avatar: "https://placehold.co/40x40.png?text=IM",
    avatarAiHint: "artist painting",
    time: "5 days ago",
    content: "Spent some time today doing art, which always helps me process difficult emotions. What are your non-medical ways of coping?",
    imageUrl: "https://placehold.co/600x400.png?text=Art",
    imageAiHint: "colorful abstract art",
    likes: 82,
    comments: 11,
  },
   {
    id: "8",
    author: "Ken Adams",
    avatar: "https://placehold.co/40x40.png?text=KA",
    avatarAiHint: "person smiling",
    time: "6 days ago",
    content: "Remembering to celebrate the small wins. Today, I managed a short walk without feeling completely drained. It's not much, but it's something.",
    likes: 190,
    comments: 22,
  },
  {
    id: "9",
    author: "Olivia Baker",
    avatar: "https://placehold.co/40x40.png?text=OB",
    avatarAiHint: "woman meditating",
    time: "1 week ago",
    content: "Dealing with another skin flare-up. It's so frustrating when you think you're making progress and then it comes back. Trying to stay positive.",
    imageUrl: "https://placehold.co/600x400.png?text=Resilience",
    imageAiHint: "stormy sky clearing",
    likes: 103,
    comments: 17,
  },
  {
    id: "10",
    author: "Chris Walker",
    avatar: "https://placehold.co/40x40.png?text=CW",
    avatarAiHint: "man reading",
    time: "1 week ago",
    content: "The lack of understanding from some medical professionals is disheartening. But finding communities like this one gives me hope. Thank you all for being here.",
    likes: 250,
    comments: 30,
  }
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
                  <AvatarImage src={story.avatar} alt={story.author} data-ai-hint={story.avatarAiHint} />
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
