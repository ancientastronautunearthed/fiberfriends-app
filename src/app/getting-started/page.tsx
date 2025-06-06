
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from 'next/link';
import { ArrowRight, CheckCircle, Wand2, BookOpen, BrainCircuit, Users, Trophy, Rocket, ShieldQuestion, Eye } from 'lucide-react';

const gettingStartedSteps = [
  {
    step: 1,
    icon: CheckCircle,
    title: "Welcome & Registration Complete!",
    description: "You've successfully created your Fiber Friends account. Welcome to the community!",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "welcome community celebration",
    links: [],
  },
  {
    step: 2,
    icon: Wand2,
    title: "Summon Your Nemesis (Profile Avatar)",
    description: "Your Nemesis is a unique, AI-generated monster that represents your personal health journey. Its name and appearance will become your profile identity. This is a one-time creative step.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "monster creation ui",
    links: [{ href: "/create-monster", text: "Summon Your Nemesis Now" }],
  },
  {
    step: 3,
    icon: ShieldQuestion,
    title: "Understand Your Nemesis's Health",
    description: "Your Nemesis's health dynamically changes based on your logged activities. Healthy food and exercise weaken it, while less optimal choices might strengthen it. Track its status on pages like the Meal Log or Exercise Log.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "health bar monster status",
    links: [
        { href: "/food-log", text: "Go to Meal Log" },
        { href: "/my-profile", text: "View My Profile & Nemesis" }
    ],
  },
  {
    step: 4,
    icon: BookOpen,
    title: "Your First Daily Wellness Log",
    description: "The 'Daily Wellness Log' on the main page is your daily checklist for various activities like logging meals, exercise, symptoms, and engaging in challenges. Completing these tasks helps you and impacts your Nemesis!",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "checklist daily tasks",
    links: [{ href: "/", text: "View Daily Wellness Log (Home)" }],
  },
  {
    step: 5,
    icon: Users,
    title: "Explore the Community Hub",
    description: "Connect with others! Share your story in the Community Feed, find camaraderie in the Medical Experiences Forum, and discover validated providers.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "community people connecting",
    links: [
        { href: "/", text: "Go to Community Feed" },
        { href: "/doctor-forum", text: "Visit Medical Experiences Forum" }
    ],
  },
  {
    step: 6,
    icon: BrainCircuit,
    title: "Discover Insights & Resources",
    description: "Use AI-powered tools like Symptom Pattern Analysis and the AI Product Suggester. Browse curated wellness aids and learn more about your journey.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "ai brain data",
    links: [
        { href: "/pattern-recognition", text: "Analyze Symptom Patterns" },
        { href: "/curated-wellness-aids", text: "Browse Wellness Resources" }
    ],
  },
  {
    step: 7,
    icon: Trophy,
    title: "Ready for More? Check the Full User Guide!",
    description: "This was a quick start. For a comprehensive overview of all features, challenges, and how to make the most of Fiber Friends, please visit our full User Guide.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "open book guide",
    links: [{ href: "/tutorial", text: "Read Full User Guide" }],
  },
];

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-xl">
        <CardHeader className="text-center">
          <Rocket className="h-12 w-12 mx-auto text-primary mb-3" />
          <CardTitle className="font-headline text-4xl text-primary">Getting Started with Fiber Friends</CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your quick guide to setting up your account and beginning your wellness journey.
          </CardDescription>
        </CardHeader>
      </Card>

      {gettingStartedSteps.map((step) => (
        <Card key={step.step} className="overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-8 w-8 text-sm font-bold">
                {step.step}
              </div>
              <step.icon className="h-7 w-7 text-primary" />
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-grow">
                <p className="text-foreground/90 leading-relaxed mb-4">{step.description}</p>
                {step.links.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {step.links.map((link, linkIdx) => (
                      <Button key={linkIdx} variant={linkIdx === 0 && step.links.length > 1 ? "default" : "outline"} asChild>
                        <Link href={link.href}><ArrowRight className="mr-2 h-4 w-4" />{link.text}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {step.image && (
                <div className="md:w-1/3 lg:w-1/4 shrink-0 w-full">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={600}
                    height={400}
                    className="rounded-lg border object-cover aspect-video"
                    data-ai-hint={step.imageAiHint}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="text-center">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Journey Begins Now!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">
                You're all set to explore Fiber Friends. Remember, this community is here to support you.
            </p>
            <Button size="lg" asChild>
                <Link href="/"><Eye className="mr-2 h-4 w-4"/>Explore the App</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
