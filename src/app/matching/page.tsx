import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Send, UserPlus, MessageSquare } from "lucide-react";
import Image from "next/image";

const mockUsers = [
  {
    id: "1",
    name: "Alex Rivera",
    avatarUrl: "https://placehold.co/60x60.png",
    aiHint: "person nature",
    sharedSymptoms: ["Skin lesions", "Fatigue", "Brain fog"],
    copingStrategies: ["Mindfulness", "Topical creams"],
    lastActive: "Online",
  },
  {
    id: "2",
    name: "Jamie Lee",
    avatarUrl: "https://placehold.co/60x60.png",
    aiHint: "artist studio",
    sharedSymptoms: ["Crawling sensations", "Joint pain"],
    copingStrategies: ["Herbal supplements", "Light exercise"],
    lastActive: "Active 2 hours ago",
  },
  {
    id: "3",
    name: "Sam K.",
    avatarUrl: "https://placehold.co/60x60.png",
    aiHint: "student library",
    sharedSymptoms: ["Itching", "Sleep disturbances"],
    copingStrategies: ["Antihistamines", "Meditation"],
    lastActive: "Online",
  },
];

export default function MatchingPage() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Find Friends with Similar Experiences</CardTitle>
            <CardDescription>Connect with others who understand what you're going through. Based on shared symptoms and challenges.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search by symptom, treatment, or challenge..." className="mb-4" />
            <div className="space-y-4">
              {mockUsers.map(user => (
                <Card key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 hover:shadow-md transition-shadow">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.aiHint} />
                    <AvatarFallback>{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <div className="text-xs text-muted-foreground mb-1">{user.lastActive}</div>
                    <div className="my-1">
                      <span className="text-xs font-medium">Shared Symptoms: </span>
                      {user.sharedSymptoms.map(symptom => <Badge key={symptom} variant="secondary" className="mr-1 mb-1">{symptom}</Badge>)}
                    </div>
                     <div className="my-1">
                      <span className="text-xs font-medium">Coping With: </span>
                       {user.copingStrategies.map(strategy => <Badge key={strategy} variant="outline" className="mr-1 mb-1">{strategy}</Badge>)}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 mt-2 sm:mt-0 shrink-0">
                    <Button size="sm" variant="outline"><UserPlus className="mr-1 h-4 w-4" /> Connect</Button>
                    <Button size="sm"><MessageSquare className="mr-1 h-4 w-4" /> Message</Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="h-fit sticky top-20"> {/* Sticky chat panel */}
          <CardHeader>
            <CardTitle className="font-headline">Chat with Alex Rivera</CardTitle>
            <CardDescription>Direct message or small group chat.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col">
            <div className="flex-grow space-y-3 overflow-y-auto p-2 border rounded-md mb-3 bg-muted/30">
              {/* Placeholder messages */}
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground p-2 rounded-lg max-w-[70%]">
                  Hi Alex, saw we share similar issues with fatigue. Any tips?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg max-w-[70%]">
                  Hey! Yeah, fatigue is a big one. I find short breaks and B12 supplements help a bit.
                </div>
              </div>
               <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground p-2 rounded-lg max-w-[70%]">
                  Thanks, I'll look into B12. Appreciate it!
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type your message..." />
              <Button size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
