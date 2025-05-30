import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquareText, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const forumPosts = [
  {
    id: "1",
    author: "Patient Advocate",
    avatar: "https://placehold.co/40x40.png",
    aiHint: "person microphone",
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
    avatar: "https://placehold.co/40x40.png",
    aiHint: "activist rally",
    time: "3 days ago",
    title: "Prescribed anti-depressants for skin lesions!",
    content: "Went in for painful skin lesions and crawling sensations. Came out with a prescription for an SSRI and a referral to a psychiatrist. Apparently, it's all in my head. The usual story, right?",
    tags: ["Misdiagnosis", "Psychological", "Anger"],
    upvotes: 98,
    comments: 15,
  },
];

const weeklyHighlight = {
  title: "Most Creative Misdiagnosis of the Week",
  author: "Anonymous User",
  misdiagnosis: "'Alien Spores reacting to your laundry detergent'",
  awardGiven: true,
};

export default function DoctorForumPage() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Share Your Doctor Story</CardTitle>
            <CardDescription>A safe space to share dismissive or bizarre comments from medical professionals. Transform frustration into camaraderie.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Title of your story..." className="mb-2" />
            <Textarea placeholder="Share your experience... (keep it respectful and avoid identifying information)" className="min-h-[120px]" />
            <Textarea placeholder="Tags (comma-separated, e.g., Dismissal, Funny, Helpful Tip)" />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button>Submit to Forum</Button>
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-headline font-semibold text-foreground">Recent Forum Posts</h2>
          {forumPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar>
                    <AvatarImage src={post.avatar} alt={post.author} data-ai-hint={post.aiHint} />
                    <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">{post.content}</p>
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
