
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  useSidebar, 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, Atom, LogOut, 
  ListChecks, PiggyBank, Info, Wand2, UserCircle, Apple, Skull, Heart, Dumbbell, Trophy, 
  LayoutDashboard, Pill, Wind, Lightbulb, ShieldCheck as AffirmationIcon, // Renamed for clarity
  Activity, HeartPulse as HeartPulseIcon, Share2, ShieldQuestion, ChevronDown, Smile,
  HandHeart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType; 
  pageTitle: string;
  children?: NavItem[];
  isParent?: boolean;
}

const navItems: NavItem[] = [
  { href: '/landing', label: 'About Fiber Friends', icon: LayoutDashboard, pageTitle: 'Welcome to Fiber Friends' },
  {
    label: 'My Journey',
    icon: Activity,
    pageTitle: 'My Journey',
    isParent: true,
    children: [
      { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
      { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
      { href: '/food-log', label: 'Food Log', icon: Apple, pageTitle: 'Daily Food Log' },
      { href: '/exercise-log', label: 'Exercise Log', icon: Dumbbell, pageTitle: 'Exercise Log Tracker' },
      { href: '/product-tracker', label: 'Product Tracker', icon: ListChecks, pageTitle: 'Product Tracker' },
      { href: '/prescription-tracker', label: 'Prescription Tracker', icon: Pill, pageTitle: 'Prescription Tracker' },
    ]
  },
  {
    label: 'Mind & Wellness',
    icon: HeartPulseIcon,
    pageTitle: 'Mind & Wellness',
    isParent: true,
    children: [
      { href: '/knowledge-nugget-quiz', label: 'Knowledge Quiz', icon: Lightbulb, pageTitle: 'Knowledge Nugget Quiz' },
      { href: '/affirmation-amplifier', label: 'Affirmation Amplifier', icon: AffirmationIcon, pageTitle: 'Affirmation Amplifier' },
      { href: '/mindful-moment', label: 'Mindful Moment', icon: Wind, pageTitle: 'Mindful Moment' },
      { href: '/kindness-challenge', label: 'Kindness Connection', icon: HandHeart, pageTitle: 'Kindness Connection Challenge' },
    ]
  },
  {
    label: 'Community Hub',
    icon: Users,
    pageTitle: 'Community Hub',
    isParent: true,
    children: [
      { href: '/', label: 'Belief Circle', icon: HeartHandshake, pageTitle: 'Belief Circle' },
      { href: '/doctor-forum', label: 'Doctor Forum', icon: MessageSquareQuote, pageTitle: 'Doctor Forum' },
      { href: '/provider-directory', label: 'Provider Directory', icon: Stethoscope, pageTitle: 'Provider Directory' },
      { href: '/humor-hub', label: 'Humor Hub', icon: Smile, pageTitle: 'Humor Hub' },
    ]
  },
  {
    label: 'Connections',
    icon: Share2,
    pageTitle: 'Connections',
    isParent: true,
    children: [
      { href: '/matching', label: 'Find Friends', icon: Users, pageTitle: 'Find Friends' },
      { href: '/fiber-singles', label: 'Fiber Singles', icon: Heart, pageTitle: 'Fiber Singles Connect' },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, pageTitle: 'Community Champions' },
    ]
  },
  {
    label: 'My Monster',
    icon: ShieldQuestion,
    pageTitle: 'My Monster',
    isParent: true,
    children: [
      { href: '/my-profile', label: 'Profile & Stats', icon: UserCircle, pageTitle: 'My Profile' },
      { href: '/create-monster', label: 'New/Re-Conjure', icon: Wand2, pageTitle: 'Create Your Monster' },
      { href: '/monster-tomb', label: 'Monster Tomb', icon: Skull, pageTitle: 'Tomb of Monsters' },
    ]
  },
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
  "Quiz Tip: Boost your knowledge (and weaken your monster!) with the Knowledge Nugget Quiz.",
  "Affirmation Tip: Amplify positive thoughts with the Affirmation Amplifier. It's a small act with big impact.",
  "Kindness Tip: Completing a small act of kindness in the 'Kindness Connection' can brighten your day and someone else's!",
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

const findCurrentPage = (items: NavItem[], currentPath: string): NavItem | undefined => {
  for (const item of items) {
    if (item.href) {
      if (item.href === '/' && currentPath === '/') return item;
      if (item.href === '/landing' && currentPath === '/landing') return item;
      if (item.href !== '/' && item.href !== '/landing' && currentPath.startsWith(item.href)) {
        if (currentPath.length === item.href.length || currentPath[item.href.length] === '/') {
            return item;
        }
      }
    }
    if (item.children) {
      const childPage = findCurrentPage(item.children, currentPath);
      if (childPage) return childPage;
    }
  }
  return undefined;
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = findCurrentPage(navItems, pathname);
  const { state: sidebarState, isMobile } = useSidebar(); 

  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

  useEffect(() => {
    let activeParentLabel: string | undefined = undefined;
    for (const item of navItems) {
      if (item.isParent && item.children) {
        for (const child of item.children) {
          if (child.href && (pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href)))) {
            activeParentLabel = item.label;
            break;
          }
        }
      }
      if (activeParentLabel) break;
    }
    setOpenAccordionItem(activeParentLabel);
  }, [pathname]);


  return (
    <>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <Link href="/landing" className="flex items-center gap-2 group">
              <Atom className="h-8 w-8 text-sidebar-primary transition-transform group-hover:scale-110" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Fiber Friends</h1>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 overflow-y-auto">
            <Accordion type="single" collapsible value={openAccordionItem} onValueChange={setOpenAccordionItem} className="w-full space-y-0.5 px-2 group-data-[collapsible=icon]:px-0">
              {navItems.map((item) => (
                item.isParent && item.children ? (
                  <AccordionItem value={item.label} key={item.label} className="border-none group/accordion-item">
                     <SidebarMenuItem className="p-0 m-0 w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AccordionTrigger
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none transition-colors",
                              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:size-8",
                              (openAccordionItem === item.label || item.children.some(child => child.href && (pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href))))) && "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className="h-5 w-5 shrink-0" />
                              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180" />
                          </AccordionTrigger>
                        </TooltipTrigger>
                        {sidebarState === "collapsed" && !isMobile && (
                          <TooltipContent side="right" align="center">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                    <AccordionContent className="pt-0 pb-0 pl-1 group-data-[collapsible=icon]:hidden">
                      <SidebarMenu className="py-1 space-y-0.5 border-l-2 border-sidebar-border/30 ml-[calc(0.625rem+4px)] pl-3">
                        {item.children.map((child) => (
                          <SidebarMenuItem key={child.href || child.label} className="p-0">
                            <Link href={child.href!} legacyBehavior passHref>
                              <SidebarMenuButton
                                isActive={(child.href && (pathname === child.href || (child.href !== '/' && child.href !== '/landing' && pathname.startsWith(child.href!)))) || false}
                                tooltip={{ children: child.label, side: 'right' }}
                                className="w-full justify-start text-xs h-[1.875rem] pl-1.5 py-1" 
                                variant="ghost"
                              >
                                <child.icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                <span>{child.label}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <SidebarMenuItem key={item.href || item.label} className="px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <Link href={item.href!} legacyBehavior passHref>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== '/' && item.href !== '/landing' && pathname.startsWith(item.href!))}
                        tooltip={{ children: item.label, side: 'right' }}
                        className="w-full justify-start text-sm px-2"
                      >
                        <item.icon className="h-5 w-5 mr-2 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )
              ))}
            </Accordion>
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
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold font-headline text-foreground">
              {currentPage?.pageTitle || 'Fiber Friends'}
            </h1>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-12">
            {children}
          </main>
        </SidebarInset>
      </div>
      <InfoBar />
    </>
  );
}
