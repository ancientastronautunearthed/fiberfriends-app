"use client";

import React from 'react';
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
import { HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, Smile, HeartPulse, LogOut } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Belief Circle', icon: HeartHandshake, pageTitle: 'Belief Circle' },
  { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
  { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
  { href: '/matching', label: 'Find Friends', icon: Users, pageTitle: 'Find Friends' },
  { href: '/provider-directory', label: 'Provider Directory', icon: Stethoscope, pageTitle: 'Provider Directory' },
  { href: '/doctor-forum', label: 'Doctor Forum', icon: MessageSquareQuote, pageTitle: 'Doctor Forum' },
  { href: '/humor-hub', label: 'Humor Hub', icon: Smile, pageTitle: 'Humor Hub' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPage = navItems.find(item => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 group">
              <HeartPulse className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">Fiber Friends</h1>
            </Link>
            {/* Desktop trigger can be part of header if needed, handled by collapsible=icon here */}
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
            <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
            <h1 className="text-lg font-semibold font-headline text-foreground">
              {currentPage?.pageTitle || 'Fiber Friends'}
            </h1>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
