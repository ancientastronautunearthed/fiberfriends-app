
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const beliefBadges = [
  { id: "1", title: "Yes, I've Tried Changing My Detergent", imageUrl: "https://placehold.co/200x200.png", imageAiHint: "badge award", description: "For when you've heard it a million times." },
  { id: "2", title: "Expert in Rare Symptoms", imageUrl: "https://placehold.co/200x200.png", imageAiHint: "medal honor", description: "Because you know more than most doctors." },
  { id: "3", title: "Survived Another 'It's Just Stress'", imageUrl: "https://placehold.co/200x200.png", imageAiHint: "trophy success", description: "A badge of honor for your resilience." },
];

const translationGuide = [
  { id: "1", dismissiveRemark: "It's probably just stress.", translation: "I don't know what's wrong, and I'm not curious enough to find out." },
  { id: "2", dismissiveRemark: "Have you tried yoga?", translation: "I think a leotard will solve your complex medical condition." },
  { id: "3", dismissiveRemark: "There's nothing showing on the tests.", translation: "My current tools are limited, and so is my imagination." },
  { id: "4", dismissiveRemark: "It's all in your head.", translation: "I am uncomfortable with uncertainty and your unexplained suffering." },
];

const bingoItems = [
  "It's just stress", "Have you tried yoga?", "It's psychosomatic", "Maybe you're depressed",
  "Change your diet", "It's just dry skin", "Get more sleep", "Probably an allergy",
  "We all get tired", "It's just lint", "Are you anxious?", "Could be a virus",
  "Drink more water", "Exercise more", "Take a vacation", "It's not that bad",
  "Just ignore it", "Try positive thinking", "You look fine to me", "Read less online",
  "Maybe it's anxiety", "Have you seen a therapist?", "Tests are normal", "It's just in your head", "Avoid gluten"
];


export default function HumorHubPage() {
  return (
    <div className="space-y-8">
      <section id="belief-badges">
        <h2 className="text-2xl font-headline font-semibold mb-4 text-foreground">Belief Badges</h2>
        <CardDescription className="mb-4">Shareable badges to express your journey with a touch of humor.</CardDescription>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {beliefBadges.map(badge => (
            <Card key={badge.id} className="text-center">
              <CardHeader>
                <CardTitle className="text-md">{badge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Image src={badge.imageUrl} alt={badge.title} width={150} height={150} className="mx-auto rounded-lg border object-cover" data-ai-hint={badge.imageAiHint}/>
                <p className="text-xs text-muted-foreground mt-2">{badge.description}</p>
              </CardContent>
              <CardFooter className="flex justify-center gap-2">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1"/> Download</Button>
                <Button variant="outline" size="sm"><Share2 className="h-4 w-4 mr-1"/> Share</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section id="translation-guide">
        <h2 className="text-2xl font-headline font-semibold mb-4 text-foreground">The Unofficial Translation Guide</h2>
        <CardDescription className="mb-4">Humorous interpretations of common dismissive remarks.</CardDescription>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {translationGuide.map(item => (
              <div key={item.id} className="p-3 border rounded-md bg-card/50">
                <p className="font-semibold text-primary">" {item.dismissiveRemark} "</p>
                <p className="text-sm text-muted-foreground pl-4 mt-1">➜ <span className="italic">{item.translation}</span></p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="invisible-illness-bingo">
        <h2 className="text-2xl font-headline font-semibold mb-4 text-foreground">Invisible Illness Bingo</h2>
        <CardDescription className="mb-4">A playful board of common unhelpful suggestions and comments. How many have you heard?</CardDescription>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg bg-muted/20">
              {bingoItems.slice(0,25).map((item, index) => (
                <div key={index} className={`aspect-square flex items-center justify-center p-2 text-center border rounded-md text-xs ${(index === 12) ? 'bg-primary text-primary-foreground font-bold' : 'bg-card hover:bg-accent/20'}`}>
                  {index === 12 ? 'FREE SPACE (You Are Validated Here!)' : item}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Button><Download className="h-4 w-4 mr-1"/> Download Bingo Card</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
