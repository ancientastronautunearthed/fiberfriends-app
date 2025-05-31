

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
import { HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, Smile, HeartPulse, LogOut, ListChecks, PiggyBank, Info, Wand2, UserCircle, Apple } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Belief Circle', icon: HeartHandshake, pageTitle: 'Belief Circle' },
  { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
  { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
  { href: '/product-tracker', label: 'Product Tracker', icon: ListChecks, pageTitle: 'Product Tracker' },
  { href: '/food-log', label: 'Food Log', icon: Apple, pageTitle: 'Daily Food Log' },
  { href: '/matching', label: 'Find Friends', icon: Users, pageTitle: 'Find Friends' },
  { href: '/provider-directory', label: 'Provider Directory', icon: Stethoscope, pageTitle: 'Provider Directory' },
  { href: '/doctor-forum', label: 'Doctor Forum', icon: MessageSquareQuote, pageTitle: 'Doctor Forum' },
  { href: '/humor-hub', label: 'Humor Hub', icon: Smile, pageTitle: 'Humor Hub' },
  { href: '/create-monster', label: 'Create Monster', icon: Wand2, pageTitle: 'Create Your Monster' },
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
    return pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/');
  });


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 group">
              <HeartPulse className="h-8 w-8 text-sidebar-primary transition-transform group-hover:scale-110" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Fiber Friends</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu className="p-2 space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
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
