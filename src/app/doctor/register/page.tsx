'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function DoctorRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // State variables for doctor-specific fields
  const [fullName, setFullName] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [licensedStates, setLicensedStates] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicWebsite, setClinicWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [approachToMorgellons, setApproachToMorgellons] = useState('');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null); // Add error state
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Basic password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({
        title: 'Registration Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      // Doctor registration logic will go here
      console.log('Simulating doctor registration with:', { email, password });
      // Simulate a successful registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Replace with actual doctor registration logic (e.g., API call)
      // If registration fails, set the error state:
      // setError("Registration failed for some reason.");
      // toast({ title: 'Registration Failed', description: '...', variant: 'destructive' });
      // return;

      toast({
        title: 'Registration Successful',
        description: 'Your doctor account has been created.',
      });
      router.push('/doctor/login'); // Redirect to a doctor login page
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Doctor Registration</CardTitle>
          <CardDescription>Create a new account to join the Fiber Friends Doctor Directory.</CardDescription>
        </CardHeader>
        {/* Form content will be added here */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                placeholder="•••••••• (min. 6 characters)"
                required
                disabled={isPending}
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
                minLength={6}
              />
            </div>

            {/* Doctor Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Doctor Information</h3>

              <div className="space-y-1">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="medical-license">Medical License Number(s)</Label>
                <Input
                  id="medical-license"
                  type="text"
                  value={medicalLicense}
                  onChange={(e) => setMedicalLicense(e.target.value)}
                  placeholder="Enter license number(s), comma-separated if multiple"
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="licensed-states">States Licensed to Practice</Label>
                <Textarea
                  id="licensed-states"
                  value={licensedStates}
                  onChange={(e) => setLicensedStates(e.target.value)}
                  placeholder="List states where you are licensed, one per line or comma-separated."
                  disabled={isPending}
                  required
                />
              </div>

               <div className="space-y-1">
                <Label htmlFor="specialties">Medical Specialties</Label>
                <Textarea
                  id="specialties"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="e.g., Dermatology, Infectious Disease, Neurology. Mention experience with Morgellons Disease."
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="years-experience">Years of Experience</Label>
                <Input
                  id="years-experience"
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  disabled={isPending}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="clinic-name">Clinic/Practice Name</Label>
                <Input
                  id="clinic-name"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="clinic-address">Clinic Address</Label>
                <Textarea
                  id="clinic-address"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

               <div className="space-y-1">
                <Label htmlFor="clinic-phone">Clinic Phone Number</Label>
                <Input
                  id="clinic-phone"
                  type="tel"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="e.g., (123) 456-7890"
                  disabled={isPending}
                  required
                />
              </div>

               <div className="space-y-1">
                <Label htmlFor="clinic-website\">Clinic Website (Optional)</Label>
                <Input
                  id="clinic-website"
                  type="url"
                  value={clinicWebsite}
                  onChange={(e) => setClinicWebsite(e.target.value)}
                  placeholder="e.g., https://www.yourclinic.com"
                  disabled={isPending}
                />
              </div>

               <div className="space-y-1">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself, your experience, and your passion for helping patients."
                  disabled={isPending}
                  required
                />
              </div>

               <div className="space-y-1">
                <Label htmlFor="approach-to-morgellons">Approach to Morgellons Treatment</Label>
                <Textarea
                  id="approach-to-morgellons"
                  value={approachToMorgellons}
                  onChange={(e) => setApproachToMorgellons(e.target.value)}
                  placeholder="Describe your understanding of Morgellons Disease and your approach to diagnosis and treatment."
                  disabled={isPending}
                />
              </div>

            </div>
            {/* End Doctor Information Section */}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isPending ? 'Registering...' : 'Register as Doctor'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have a doctor account?{' '}
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/doctor/login">Login here</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
