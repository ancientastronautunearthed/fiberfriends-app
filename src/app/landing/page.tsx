
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles, Users, BrainCircuit, Heart, ShieldCheck, Zap, Atom } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: Atom,
    title: "Your Personal Morgellon Monster",
    description: "Visualize your journey with a unique, AI-generated 'Inner Monster'. Its health dynamically reflects your logged foods, exercises, and product usage, offering a gamified approach to understanding your body's responses.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "fantasy monster abstract",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Pattern Recognition",
    description: "Leverage cutting-edge AI to analyze your symptom journals, identify potential triggers (including weather correlations), and discover personal or community-wide patterns. Gain insights you might have missed.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "ai network data",
  },
  {
    icon: Heart,
    title: "Fiber Singles: Connect Authentically",
    description: "Meet others who understand. Create your 'Romantic Monster' persona and engage in a unique dating experience where AI helps assess message quality and monster essences 'sync' based on mutual desire.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "connected hearts abstract",
  },
  {
    icon: Users,
    title: "Supportive Community Spaces",
    description: "Share your story in the Belief Circle, find camaraderie in the Doctor Forum, validate experiences with Humor Hub elements, and find validated providers in our user-driven directory.",
    image: "https://placehold.co/600x400.png",
    imageAiHint: "community support group",
  },
];

const pricingPlans = [
  {
    title: "Symbiont Support",
    priceMonthly: "$9.99",
    priceAnnual: null,
    billingCycle: "/month",
    description: "Essential tools for understanding and community connection.",
    features: [
      "Personal Morgellon Monster & Health Tracking",
      "Symptom Journal & Basic AI Analysis",
      "Belief Circle & Doctor Forum Access",
      "Limited Fiber Singles Interactions",
      "Standard Provider Directory Access",
    ],
    cta: "Choose Symbiont",
    bestValue: false,
  },
  {
    title: "Apex Ally Annual",
    priceMonthly: null,
    priceAnnual: "$79",
    billingCycle: "/year",
    description: "Unlock the full power of Fiber Friends with premium features and savings.",
    features: [
      "All Symbiont Support features, PLUS:",
      "Advanced AI Pattern Recognition (inc. weather & community data)",
      "Full Fiber Singles Access & AI Message Assist",
      "Enhanced Monster Customization Options",
      "Priority Support & Early Access to New Features",
      "Exclusive 'Apex Ally' Profile Badge",
    ],
    cta: "Choose Apex Ally",
    bestValue: true,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
            <Image src="https://placehold.co/1920x1080.png" alt="Abstract background" layout="fill" objectFit="cover" data-ai-hint="abstract tech background" />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <Sparkles className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
            Navigate Morgellons with <span className="text-primary">Insight & Connection</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Fiber Friends empowers you with AI-driven tools, a unique 'Inner Monster' system, and a supportive community to understand your journey and connect with others who truly get it.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/api/auth/login">Join the Community</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-card/10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
            Transform Your Understanding with <span className="text-primary">Unique Features</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {features.map((feature, index) => (
              <Card key={feature.title} className="overflow-hidden shadow-xl hover:shadow-primary/20 transition-shadow duration-300 bg-card">
                <div className="relative h-56 w-full">
                    <Image src={feature.image} alt={feature.title} layout="fill" objectFit="cover" data-ai-hint={feature.imageAiHint}/>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline flex items-center gap-2">
                    <feature.icon className="h-7 w-7 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">
            Find Your Fiber Friends Plan
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the plan that best suits your journey. Every subscription directly supports our community and research efforts.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.title} className={`flex flex-col shadow-lg ${plan.bestValue ? 'border-2 border-primary ring-2 ring-primary/50' : 'border-border'}`}>
                {plan.bestValue && (
                  <div className="py-1 px-4 bg-primary text-primary-foreground text-sm font-semibold text-center rounded-t-md">
                    Best Value
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-headline text-primary">{plan.title}</CardTitle>
                  <div className="text-4xl font-bold mt-2">
                    {plan.priceAnnual ? plan.priceAnnual : plan.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground">{plan.billingCycle}</span>
                  </div>
                  {plan.priceAnnual && plan.priceMonthly && (
                    <p className="text-xs text-muted-foreground">or {plan.priceMonthly}/month</p>
                  )}
                   <CardDescription className="mt-1 h-10">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardContent className="mt-auto">
                  <Button className={`w-full ${plan.bestValue ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`} asChild>
                    <Link href="/api/auth/login">
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30">
        <div className="container mx-auto px-6 text-center">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
            Ready to Embrace Understanding?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join Fiber Friends today. Start your journey towards clarity, connection, and community support. You are not alone.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6" asChild>
            <Link href="/api/auth/login">Sign Up & Begin</Link>
          </Button>
        </div>
      </section>

      {/* Footer (Simplified for landing page) */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Fiber Friends. All Rights Reserved.</p>
          <p className="mt-1">Dedicated to support, validation, and research for the Morgellons community.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
CDATA]</content>
  </change>
  <change>
    <file>/src/components/layout/app-shell.tsx</file>
    <content><![CDATA[
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, Atom, LogOut, ListChecks, PiggyBank, Info, Wand2, UserCircle, Apple, Skull, Heart, Dumbbell, Trophy, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/landing', label: 'About Fiber Friends', icon: LayoutDashboard, pageTitle: 'Welcome to Fiber Friends' },
  { href: '/', label: 'Belief Circle', icon: HeartHandshake, pageTitle: 'Belief Circle' },
  { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
  { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
  { href: '/product-tracker', label: 'Product Tracker', icon: ListChecks, pageTitle: 'Product Tracker' },
  { href: '/food-log', label: 'Food Log', icon: Apple, pageTitle: 'Daily Food Log' },
  { href: '/exercise-log', label: 'Exercise Log', icon: Dumbbell, pageTitle: 'Exercise Log Tracker' },
  { href: '/matching', label: 'Find Friends', icon: Users, pageTitle: 'Find Friends (Community)' },
  { href: '/fiber-singles', label: 'Fiber Singles', icon: Heart, pageTitle: 'Fiber Singles Connect' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, pageTitle: 'Community Champions' },
  { href: '/provider-directory', label: 'Provider Directory', icon: Stethoscope, pageTitle: 'Provider Directory' },
  { href: '/doctor-forum', label: 'Doctor Forum', icon: MessageSquareQuote, pageTitle: 'Doctor Forum' },
  { href: '/create-monster', label: 'Create Monster', icon: Wand2, pageTitle: 'Create Your Monster' },
  { href: '/monster-tomb', label: 'Monster Tomb', icon: Skull, pageTitle: 'Tomb of Monsters' },
  { href: '/my-profile', label: 'My Profile', icon: UserCircle, pageTitle: 'My Profile' },
  { href: '/support-us', label: 'Support Us', icon: PiggyBank, pageTitle: 'Support Us' },
];

const infoTips = [
  "Tip: Staying hydrated can sometimes help with skin-related symptoms.",
  "Fact: Morgellons is a complex condition that researchers are still working to understand.",
  "Reminder: You are not alone in this journey. This community is here for you.",
  "Tip: Gentle skincare routines may be beneficial. Avoid harsh scrubbing.",
  "Fact: Sharing your experiences can help others feel less isolated.",
  "Vibe: Embrace the mystery, find your strength within the enigma.",
  "Coolness: Even in darkness, there's a unique light. Find yours.",
  "Food Tip: Whole, unprocessed foods are generally a good foundation for health.",
  "Monster Wisdom: Understanding your inner monster can be a source of power.",
  "Connection Tip: Reaching out can make a big difference. Consider messaging someone today.",
  "Self-care: Remember to prioritize your well-being, both physically and mentally.",
  "Exercise Tip: Even gentle movement like stretching or a short walk can be beneficial.",
];

function InfoBar() {
  const [currentTip, setCurrentTip] = useState(infoTips[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTip(prevTip => {
        const currentIndex = infoTips.indexOf(prevTip);
        const nextIndex = (currentIndex + 1) % infoTips.length;
        return infoTips[nextIndex];
      });
    }, 7000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-accent text-accent-foreground p-2 text-xs text-center shadow-md z-20 flex items-center justify-center gap-2">
      <Info className="h-4 w-4 shrink-0" />
      <span>{currentTip}</span>
    </div>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = navItems.find(item => {
    if (item.href === '/') return pathname === '/';
    // Ensure deeper paths still match their parent nav item for title
    // Special handling for landing page to not conflict with root if it becomes root.
    if (item.href === '/landing') return pathname === '/landing';
    return pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/');
  });


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <Link href="/landing" className="flex items-center gap-2 group">
              <Atom className="h-8 w-8 text-sidebar-primary transition-transform group-hover:scale-110" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Fiber Friends</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu className="p-2 space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/' && item.href !== '/landing' && pathname.startsWith(item.href))}
                      tooltip={{ children: item.label, side: 'right' }}
                      className="w-full justify-start text-sm"
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
            <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-6">
            <SidebarTrigger className="md:hidden" /> {}
            <h1 className="text-lg font-semibold font-headline text-foreground">
              {currentPage?.pageTitle || 'Fiber Friends'}
            </h1>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-12"> {}
            {children}
          </main>
        </SidebarInset>
      </div>
      <InfoBar />
    </SidebarProvider>
  );
}
