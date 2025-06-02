
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Renamed to avoid conflict
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image'; 
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
  HeartHandshake, BookText, BrainCircuit, Users, Stethoscope, MessageSquareQuote, LogOut, 
  ListChecks, PiggyBank, Info, Wand2, UserCircle, Apple, Skull, Heart, Dumbbell, Trophy, 
  LayoutDashboard, Pill, Wind, Lightbulb, ShieldCheck as AffirmationIcon,
  Activity, HeartPulse as HeartPulseIcon, Share2, ShieldQuestion, ChevronDown, Smile,
  HandHeart, LogInIcon, UserPlus as UserPlusIcon, AlertTriangle, ShoppingCart,
  Package, GlassWater, Droplets, ToyBrick, BookOpen, UtensilsCross
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';


interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType; 
  pageTitle: string;
  children?: NavItem[];
  isParent?: boolean;
  authRequired?: boolean; 
  noAuthOnly?: boolean; 
  isSubItem?: boolean; // For visual distinction if needed, not used in current accordion
}

const navItemsConfig: NavItem[] = [
  { href: '/landing', label: 'About Fiber Friends', icon: LayoutDashboard, pageTitle: 'Welcome to Fiber Friends' },
  {
    label: 'My Journey',
    icon: Activity,
    pageTitle: 'My Journey',
    isParent: true,
    authRequired: true,
    children: [
      { href: '/symptom-journal', label: 'Symptom Journal', icon: BookText, pageTitle: 'Symptom Journal' },
      { href: '/pattern-recognition', label: 'Pattern Recognition', icon: BrainCircuit, pageTitle: 'Pattern Recognition' },
      { href: '/food-log', label: 'Food Log', icon: Apple, pageTitle: 'Daily Food Log' },
      { href: '/nutrition-tracker', label: 'Nutrition Tracker', icon: UtensilsCross, pageTitle: 'Nutrition Tracker & Coach' },
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
    authRequired: true,
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
      { href: '/humor-hub', label: 'Humor Hub', icon: Smile, pageTitle: 'Humor Hub' },
    ]
  },
  {
    label: 'Curated Wellness Aids', 
    icon: ShoppingCart,
    pageTitle: 'Curated Wellness Aids',
    isParent: true,
    authRequired: false,
    children: [
      { href: '/curated-wellness-aids#ai-product-suggester', label: 'AI Product Suggester', icon: BrainCircuit, pageTitle: 'AI Product Suggester' },
      { href: '/curated-wellness-aids#supplements', label: 'Supplements', icon: Package, pageTitle: 'Supplements Category' },
      { href: '/curated-wellness-aids#food-items', label: 'Food Items', icon: Apple, pageTitle: 'Food Items Category' },
      { href: '/curated-wellness-aids#beverages', label: 'Beverages', icon: GlassWater, pageTitle: 'Beverages Category' },
      { href: '/curated-wellness-aids#topicals', label: 'Topicals', icon: Droplets, pageTitle: 'Topicals Category' },
      { href: '/curated-wellness-aids#wellness-tools', label: 'Wellness Tools', icon: ToyBrick, pageTitle: 'Wellness Tools Category' },
      { href: '/curated-wellness-aids#books', label: 'Books', icon: BookOpen, pageTitle: 'Books Category' },
    ]
  },
  {
    label: 'Resources',
    icon: BookText, 
    pageTitle: 'Resources',
    isParent: true,
    authRequired: false,
    children: [
      { href: '/provider-directory', label: 'Provider Directory', icon: Stethoscope, pageTitle: 'Provider Directory', authRequired: false },
    ]
  },
  {
    label: 'Connections',
    icon: Share2,
    pageTitle: 'Connections',
    isParent: true,
    authRequired: true,
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
    authRequired: true,
    children: [
      { href: '/my-profile', label: 'Profile & Stats', icon: UserCircle, pageTitle: 'My Profile' },
      { href: '/create-monster', label: 'New/Re-Conjure', icon: Wand2, pageTitle: 'Create Your Monster' },
      { href: '/monster-tomb', label: 'Monster Tomb', icon: Skull, pageTitle: 'Tomb of Monsters' },
    ]
  },
  { href: '/login', label: 'Login', icon: LogInIcon, pageTitle: 'Login', noAuthOnly: true },
  { href: '/register', label: 'Register', icon: UserPlusIcon, pageTitle: 'Register', noAuthOnly: true },
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
    // Check current item
    if (item.href) {
      const baseItemPath = item.href.split('#')[0];
      if (baseItemPath === '/' && currentPath === '/') return item;
      if (baseItemPath === '/landing' && currentPath === '/landing') return item;
      // For other paths, check if the current path starts with the baseItemPath.
      // This handles sub-routes like /fiber-singles/chat/[id] matching /fiber-singles.
      // And it also handles hash links matching the base path.
      if (baseItemPath !== '/' && baseItemPath !== '/landing' && currentPath.startsWith(baseItemPath)) {
        // Ensure it's a full match or a sub-route, not just a partial prefix.
        // e.g. /foo should match /foo and /foo/bar, but not /foobar
        // Also consider if item.href itself contains a hash, the title should still come from the base.
        if (currentPath.length === baseItemPath.length || currentPath[baseItemPath.length] === '/' || currentPath[baseItemPath.length] === '#') {
          // If item.href has a hash, use the main item's pageTitle.
          const mainNavItem = navItemsConfig.flatMap(nav => nav.children || [nav]).find(nav => nav.href && nav.href.split('#')[0] === baseItemPath);
          return mainNavItem || item;
        }
      }
    }
    // Check children recursively
    if (item.children) {
      const childPage = findCurrentPage(item.children, currentPath);
      if (childPage) return childPage;
    }
  }
  // Fallback for parent if only hash differs or if direct children define page titles differently
  for (const item of items) {
      if (item.isParent && item.children) {
          for (const child of item.children) {
            if (child.href) {
                const childBase = child.href.split('#')[0];
                if (currentPath.startsWith(childBase)) {
                    // If the child's href contains a hash, it's an anchor link.
                    // The page title should come from the parent menu item or the specific child if it's meant to be a distinct page.
                    // In this case, the parent 'Curated Wellness Aids' itself is a page.
                    if (child.href.includes('#')) {
                        // If we are on /curated-wellness-aids#something, the title is "Curated Wellness Aids"
                        if (currentPath.startsWith('/curated-wellness-aids')) {
                            return navItemsConfig.find(nav => nav.label === 'Curated Wellness Aids' && nav.isParent);
                        }
                    }
                    // If child.href is a base path, and it *is* the parent's main page, return parent.
                    if (childBase === item.href?.split('#')[0]) return item; // Or child if child defines its own page title.
                    // If child has its own distinct pageTitle for a base path
                    if (currentPath.startsWith(childBase) && child.pageTitle !== item.pageTitle) return child;
                }
            }
          }
      }
  }
  return undefined;
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, configError } = useAuth(); 
  const { toast } = useToast();
  
  const { state: sidebarState, isMobile } = useSidebar(); 
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);
  
  const currentPage = findCurrentPage(navItemsConfig, pathname);


  const handleLogout = async () => {
    if (!firebaseAuthInstance) {
        toast({ title: "Logout Error", description: "Firebase not configured, cannot logout.", variant: "destructive"});
        return;
    }
    try {
      await signOut(firebaseAuthInstance);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const filteredNavItems = React.useMemo(() => {
    return navItemsConfig.filter(item => {
      if (item.authRequired && !user) return false;
      if (item.noAuthOnly && user) return false;
      return true;
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            if (child.authRequired && !user) return false;
            if (child.noAuthOnly && user) return false;
            return true;
          })
        };
      }
      return item;
    }).filter(item => !(item.isParent && item.children && item.children.length === 0));
  }, [user]);


  useEffect(() => {
    let activeParentLabel: string | undefined = undefined;
    for (const item of filteredNavItems) {
      if (item.isParent && item.children) {
        for (const child of item.children) {
          if (child.href && (pathname === child.href.split('#')[0] || (child.href !== '/' && pathname.startsWith(child.href.split('#')[0])))) {
            activeParentLabel = item.label;
            break;
          }
        }
      }
      if (activeParentLabel) break;
    }
    setOpenAccordionItem(activeParentLabel);
  }, [pathname, filteredNavItems]);


  return (
    <>
      {configError && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-sm text-center shadow-lg z-[9999] flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span><strong>Configuration Error:</strong> {configError}. Authentication and Firebase features are disabled. Please check your <code>.env</code> file and restart the server.</span>
        </div>
      )}
      <div className={cn("flex min-h-screen bg-background", configError ? "pt-12" : "")}>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <Link href="/landing" className="flex items-center gap-2 group">
              <Image
                src="https://placehold.co/32x32.png" 
                alt="Fiber Friends Logo"
                width={32}
                height={32}
                className="transition-transform group-hover:scale-110"
                data-ai-hint="company logo"
              />
              <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Fiber Friends</h1>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 overflow-y-auto">
            <Accordion type="single" collapsible value={openAccordionItem} onValueChange={setOpenAccordionItem} className="w-full space-y-0.5 px-2 group-data-[collapsible=icon]:px-0">
              {filteredNavItems.map((item) => (
                item.isParent && item.children && item.children.length > 0 ? (
                  <AccordionItem value={item.label} key={item.label} className="border-none group/accordion-item">
                     <SidebarMenuItem className="p-0 m-0 w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AccordionTrigger
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none transition-colors",
                              "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:size-8",
                              (openAccordionItem === item.label || item.children.some(child => child.href && (pathname === child.href.split('#')[0] || (child.href !== '/' && pathname.startsWith(child.href.split('#')[0]))))) && "bg-sidebar-accent text-sidebar-accent-foreground"
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
                          child.href && ( 
                            <SidebarMenuItem key={child.href} className="p-0">
                              <Link href={child.href} legacyBehavior passHref>
                                <SidebarMenuButton
                                  isActive={(pathname === child.href || (child.href !== '/' && child.href !== '/landing' && pathname.startsWith(child.href)))}
                                  tooltip={{ children: child.label, side: 'right' }}
                                  className="w-full justify-start text-xs h-[1.875rem] pl-1.5 py-1" 
                                  variant="ghost"
                                >
                                  <child.icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                  <span>{child.label}</span>
                                </SidebarMenuButton>
                              </Link>
                            </SidebarMenuItem>
                          )
                        ))}
                      </SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  item.href && ( 
                    <SidebarMenuItem key={item.href} className="px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <Link href={item.href} legacyBehavior passHref>
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
                )
              ))}
            </Accordion>
          </SidebarContent>

          { user && !configError && (
            <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
              </Button>
            </SidebarFooter>
           )}
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
      {!configError && <InfoBar />}
    </>
  );
}
