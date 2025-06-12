import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/layout/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/context/auth-context';
import { ClientEffects } from '@/components/ui/client-effects';

export const viewport = {
  themeColor: '#0066FF',
};

export const metadata: Metadata = {
  title: 'Fiber Friends',
  description: 'Community Support & Validation Platform for Morgellons',
  // themeColor moved to viewport export
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'Fiber Friends',
    description: 'Community Support & Validation Platform for Morgellons',
    type: 'website',
  },
};

// Animated background components (Server-side rendered, CSS-only animations)
function FiberParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating fiber particles */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-px h-[300px] bg-gradient-to-b from-transparent via-primary to-transparent animate-float left-[10%] animation-delay-2000" />
        <div className="absolute w-px h-[200px] bg-gradient-to-b from-transparent via-primary to-transparent animate-float left-[30%] animation-delay-4000" />
        <div className="absolute w-px h-[400px] bg-gradient-to-b from-transparent via-accent to-transparent animate-float left-[50%] rotate-45" />
        <div className="absolute w-px h-[250px] bg-gradient-to-b from-transparent via-primary to-transparent animate-float left-[70%] animation-delay-2000 -rotate-12" />
        <div className="absolute w-px h-[350px] bg-gradient-to-b from-transparent via-accent to-transparent animate-float left-[90%] animation-delay-4000 rotate-45" />
        <div className="absolute w-px h-[280px] bg-gradient-to-b from-transparent via-primary to-transparent animate-float left-[20%] rotate-12" />
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" 
             style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow" 
             style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-20 animate-gradient-shift" />
    </div>
  );
}

// Grid background pattern
function GridPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-grid opacity-[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
    </div>
  );
}

// Noise texture overlay
function NoiseTexture() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay bg-noise" />
  );
}

// Animated border gradient
function AnimatedBorder() {
  return (
    <>
      {/* Top border */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-shimmer" />
      {/* Bottom border */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50 animate-shimmer" 
           style={{ animationDelay: '1.5s' }} />
    </>
  );
}

// Main layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {/* Background layers */}
        <GridPattern />
        <FiberParticles />
        <NoiseTexture />
        <AnimatedBorder />
        
        {/* Main app structure */}
        <div className="relative z-10 min-h-screen">
          <AuthProvider>
            <SidebarProvider>
              <div className="page-transition">
                <AppShell>{children}</AppShell>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </div>
        
        {/* Enhanced toaster with glass effect */}
        <Toaster />
        
        {/* Client-side effects and animations */}
        <ClientEffects />
      </body>
    </html>
  );
}