
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
import { HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, Atom, LogOut, ListChecks, PiggyBank, Info, Wand2, UserCircle, Apple, Skull, Heart, Dumbbell, Trophy, LayoutDashboard, Pill, Wind, Brain as BrainIcon, Lightbulb, ShieldCheck as AffirmationIcon } from 'lucide-react';

const navItems = [
  { href: '/landing', label: 'About Fiber Friends', icon: LayoutDashboard, pageTitle: 'Welcome to Fiber Friends' },
  { href: '/', label: 'Belief Circle', icon: HeartHandshake, pageTitle: 'Belief Circle' },
  { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
  { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
  { href: '/thought-challenger', label: 'Thought Challenger', icon: BrainIcon, pageTitle: 'Thought Challenger (CBT)' },
  { href: '/knowledge-nugget-quiz', label: 'Knowledge Quiz', icon: Lightbulb, pageTitle: 'Knowledge Nugget Quiz' },
  { href: '/affirmation-amplifier', label: 'Affirmation Amplifier', icon: AffirmationIcon, pageTitle: 'Affirmation Amplifier' },
  { href: '/product-tracker', label: 'Product Tracker', icon: ListChecks, pageTitle: 'Product Tracker' },
  { href: '/prescription-tracker', label: 'Prescription Tracker', icon: Pill, pageTitle: 'Prescription Tracker' },
  { href: '/food-log', label: 'Food Log', icon: Apple, pageTitle: 'Daily Food Log' },
  { href: '/exercise-log', label: 'Exercise Log', icon: Dumbbell, pageTitle: 'Exercise Log Tracker' },
  { href: '/mindful-moment', label: 'Mindful Moment', icon: Wind, pageTitle: 'Mindful Moment' },
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
  "Thought Tip: Challenging negative thoughts can shift your perspective. Try the Thought Challenger!",
  "Quiz Tip: Boost your knowledge (and weaken your monster!) with the Knowledge Nugget Quiz.",
  "Affirmation Tip: Amplify positive thoughts with the Affirmation Amplifier. It's a small act with big impact.",
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
