
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import Link from 'next/link';
import { ArrowRight, Wand2, BookOpen, ShieldCheck, BrainCircuit, Users, Trophy, Info } from 'lucide-react';

const tutorialSections = [
  {
    title: "Welcome to Your Battleground!",
    icon: Info,
    content: "Fiber Friends transforms your health journey into an epic battle! You'll summon a personal 'Nemesis' monster representing your health struggles. Every healthy choice weakens it, while less optimal choices might give it strength. This guide will walk you through your arsenal.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "fantasy battlefield dawn",
    links: [],
  },
  {
    title: "Step 1: Summon Your Nemesis",
    icon: Wand2,
    content: "Your first quest is to summon your Nemesis. Describe it in 5 words, and our AI will conjure its image and name. This unique creature's health will dynamically reflect your progress, choices, and challenges. Its power is tied to yours!",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "monster creation ui",
    links: [{ href: "/create-monster", text: "Summon Your Nemesis" }],
  },
  {
    title: "Step 2: Your Daily Battle Log",
    icon: BookOpen,
    content: "Track your daily activities and see their direct impact on your Nemesis:",
    subSections: [
      {
        title: "Monster-Killing Meals (Food Log)",
        text: "Log any food. AI assesses its impact – healthy foods deal critical hits to your Nemesis, while junk food might heal it. Choose your nutritional weapons wisely!",
        link: { href: "/food-log", text: "Go to Food Log" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "healthy food attack monster",
      },
      {
        title: "Combat Training (Exercise Log)",
        text: "Every workout is a battle session. Log your exercises, and AI calculates the damage dealt to your Nemesis based on intensity and duration.",
        link: { href: "/exercise-log", text: "Go to Exercise Log" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "exercise fitness warrior",
      },
      {
        title: "Gear & Artifacts (Product Tracker)",
        text: "Track supplements, creams, or other wellness aids. Effective 'gear' can provide crucial advantages in your battle.",
        link: { href: "/product-tracker", text: "Go to Product Tracker" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "magic items supplements",
      },
      {
        title: "Battle Potions (Prescription Tracker)",
        text: "Log medications. Beneficial 'potions' can weaken your Nemesis or bolster your defenses.",
        link: { href: "/prescription-tracker", text: "Go to Prescription Tracker" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "potion bottles medicine",
      },
      {
        title: "Battle Condition Log (Symptom Journal)",
        text: "Record your daily condition, symptoms, and observations. This log is vital for understanding your Nemesis's patterns.",
        link: { href: "/symptom-journal", text: "Go to Symptom Journal" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "journal writing entries",
      },
    ],
    links: [],
  },
  {
    title: "Step 3: Sharpen Your Skills - Battle Challenges",
    icon: ShieldCheck,
    content: "Engage in daily challenges to gain points, earn rewards, and deal extra damage to your Nemesis. Each victory strengthens your resolve!",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "challenge complete badge",
    links: [
      { href: "/knowledge-nugget-quiz", text: "Test Your Wits Quiz" },
      { href: "/affirmation-amplifier", text: "Empowering Mantras" },
      { href: "/mindful-moment", text: "Mindful Combat Training" },
      { href: "/kindness-challenge", text: "Warrior's Code Quests" },
    ],
  },
  {
    title: "Step 4: Know Your Enemy - Intelligence & Strategy",
    icon: BrainCircuit,
    content: "Turn data into power. Use AI-driven insights to outsmart your Nemesis:",
    subSections: [
      {
        title: "Enemy Intel Reports (Pattern Recognition)",
        text: "Submit your 'Battle Condition Logs' for AI analysis. Discover patterns, potential triggers, and strategic insights to exploit your Nemesis's weaknesses. Weather correlation and community data can offer even deeper intel (Premium).",
        link: { href: "/pattern-recognition", text: "Analyze Patterns" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "data analytics charts",
      },
      {
        title: "Victory Meal Plans & Armory",
        text: "Get AI-generated 'Monster-Killing Meal' suggestions in your Food Log. Browse the 'Armory & Supplies' for curated wellness aids that can act as powerful weapons or defenses.",
        link: { href: "/food-log", text: "Get Meal Ideas" },
        link2: { href: "/curated-wellness-aids", text: "Browse Armory" },
        image: "https://placehold.co/300x200.png",
        imageAiHint: "strategy board game",
      },
    ],
    links: [],
  },
  {
    title: "Step 5: The Warrior Stronghold & Network",
    icon: Users,
    content: "You are not alone in this battle! Connect with fellow warriors, share your tales, find support, and learn from others' experiences.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "community group connection",
    links: [
      { href: "/", text: "Comrades' Campfire (Belief Circle)" },
      { href: "/doctor-forum", text: "Intel on Obstructions (Forum)" },
      { href: "/leaderboard", text: "Hall of Slayers (Leaderboard)" },
      { href: "/fiber-singles", text: "Warrior Connections Portal" },
      { href: "/provider-directory", text: "Allied Healers Directory" },
    ],
  },
  {
    title: "Step 6: Tracking Your Victories",
    icon: Trophy,
    content: "Monitor your Nemesis's health on various pages. View your overall progress and warrior rank on your Profile. Should your Nemesis fall, its memory will be honored in the Tomb of Vanquished Foes.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "trophy collection display",
    links: [
      { href: "/my-profile", text: "View My Warrior Profile" },
      { href: "/monster-tomb", text: "Visit the Tomb" },
    ],
  },
  {
    title: "Your Quest Awaits!",
    icon: ArrowRight,
    content: "This is your fight, but you have an arsenal of tools and a community of warriors by your side. Embrace the challenge, track your progress, and may you conquer your Nemesis! If you need to support our cause, visit the 'Reinforce the Ranks' page.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "warrior looking at horizon",
    links: [{ href: "/support-us", text: "Support Fiber Friends" }],
  },
];

export default function TutorialPage() {
  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-4xl text-primary">Fiber Friends: Your Battle Manual</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              A step-by-step guide to mastering your tools and vanquishing your inner Nemesis.
            </CardDescription>
          </CardHeader>
        </Card>

        {tutorialSections.map((section, index) => (
          <Card key={index} className="overflow-hidden shadow-lg transition-all hover:shadow-primary/20">
            {section.image && (
              <div className="relative h-48 w-full">
                <Image
                  src={section.image}
                  alt={section.title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={section.imageAiHint}
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <section.icon className="h-7 w-7 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/90 leading-relaxed">{section.content}</p>
              {section.subSections && (
                <div className="space-y-6 pl-4 border-l-2 border-primary/30 ml-2">
                  {section.subSections.map((sub, subIdx) => (
                    <div key={subIdx} className="pt-2">
                      <h4 className="font-semibold text-lg text-primary/90 mb-1">{sub.title}</h4>
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {sub.image && (
                           <div className="md:w-1/3 shrink-0">
                             <Image src={sub.image} alt={sub.title} width={300} height={200} className="rounded-md border object-cover" data-ai-hint={sub.imageAiHint} />
                           </div>
                        )}
                        <div className="flex-grow">
                          <p className="text-sm text-foreground/80 leading-relaxed mb-2">{sub.text}</p>
                          {sub.link && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={sub.link.href}><ArrowRight className="mr-2 h-4 w-4" />{sub.link.text}</Link>
                            </Button>
                          )}
                           {sub.link2 && (
                            <Button variant="outline" size="sm" asChild className="ml-2">
                              <Link href={sub.link2.href}><ArrowRight className="mr-2 h-4 w-4" />{sub.link2.text}</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {section.links.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-3">
                  {section.links.map((link, linkIdx) => (
                    <Button key={linkIdx} variant="default" asChild>
                      <Link href={link.href}><ArrowRight className="mr-2 h-4 w-4" />{link.text}</Link>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
         <Card className="text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Ready to Begin?</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    The best way to learn is by doing. Dive in and explore the features!
                </p>
                <Button size="lg" asChild>
                    <Link href="/">Go to Comrades' Campfire</Link>
                </Button>
            </CardContent>
         </Card>
      </div>
    </ScrollArea>
  );
}
