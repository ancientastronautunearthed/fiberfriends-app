
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, LogIn, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// Simulate storing a "doctor logged in" state for prototype
const DOCTOR_LOGGED_IN_KEY = 'fiberFriendsDoctorLoggedIn';

export default function DoctorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
        setError("Please enter both email and password.");
        return;
    }

    startTransition(async () => {
      // Simulate login - in a real app, this would call an auth service
      // For demo, any non-empty credentials "work"
      if (email && password) {
        localStorage.setItem(DOCTOR_LOGGED_IN_KEY, 'true');
        toast({
          title: 'Doctor Login Successful (Simulated)',
          description: 'Redirecting to Doctor Dashboard...',
        });
        router.push('/doctor/dashboard');
      } else {
        setError('Simulated login failed. Please enter credentials.');
        toast({
          title: 'Login Failed (Simulated)',
          description: 'Please check your credentials.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Stethoscope className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="text-2xl font-headline">Doctor & Researcher Portal</CardTitle>
          <CardDescription>Access anonymized patient analytics and insights.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isPending ? 'Logging in...' : 'Login to Doctor Portal'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Interested in joining?{' '}
              <Link href="/landing#pricing" className="underline text-primary hover:text-primary/80">
                Learn about institutional access
              </Link>
            </p>
             <Link href="/" className="text-xs text-muted-foreground hover:underline">
                Return to Patient Portal
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
