
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // New state variables for additional fields
  const [firstName, setFirstName] = useState('');
  const [approximateHeight, setApproximateHeight] = useState('');
  const [approximateWeight, setApproximateWeight] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [hairColor, setHairColor] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [annualHouseholdIncome, setAnnualHouseholdIncome] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(''); // Placeholder for date picker
  const [approximateAge, setApproximateAge] = useState('');
  // New state variables for Morgellons symptoms and history
  const [symptomsStartDate, setSymptomsStartDate] = useState(''); // Placeholder for date picker
  const [diagnosisStatus, setDiagnosisStatus] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptomDescription, setCustomSymptomDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({
        title: 'Registration Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    // This check is still good to have for the initial state
    if (!auth) {
      setError("Firebase Auth is not initialized.");
      toast({
        title: 'Registration Error',
        description: 'Firebase authentication is not available.',
        variant: 'destructive',
      });
      return;
    }
    startTransition(async () => {
      try {
        // Add this check inside startTransition
        if (!auth) {
           setError("Firebase Auth is not initialized.");
           toast({
             title: 'Registration Error',
             description: 'Firebase authentication is not available.',
             variant: 'destructive',
           });
           return; // Exit if auth is null
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Registration Successful',
          description: 'Welcome to Fiber Friends! You can now log in.',
        });
        router.push('/login'); // Redirect to login page after registration
      } catch (e: any) {
        setError(e.message || 'Failed to register. Please try again.');
        toast({
          title: 'Registration Failed',
          description: e.message || 'An error occurred during registration.',
          variant: 'destructive',
        });
      }
    });
  };

  return (

    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join Fiber Friends</CardTitle>
          <CardDescription>Create your account to start your journey.</CardDescription>
        </CardHeader>
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

            {/* User Profile Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">User Profile</h3>
              
              <div className="space-y-1">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="approximate-height">Approximate Height</Label>
                <Input
                  id="approximate-height"
                  type="text"
                  value={approximateHeight}
                  onChange={(e) => setApproximateHeight(e.target.value)}
                  placeholder="e.g., 5'6\"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="approximate-weight">Approximate Weight</Label>
                <Input
                  id="approximate-weight"
                  type="text"
                  value={approximateWeight}
                  onChange={(e) => setApproximateWeight(e.target.value)}
                  placeholder="e.g., 150 lbs or 68 kg"
                  disabled={isPending}
                />
              </div>
              
              <div className="space-y-1">
                <Label>Gender</Label>
                <div className="flex flex-wrap gap-4">
                  {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id={`gender-${option}`} 
                        name="gender" 
                        value={option} 
                        checked={gender === option} 
                        onChange={() => setGender(option)} 
                        disabled={isPending}
                        className="form-radio text-primary"
                      />
                      <Label htmlFor={`gender-${option}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="hair-color">Hair Color</Label>
                <Input
                  id="hair-color"
                  type="text"
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1">
                <Label>Annual Household Income</Label>
                <div className="flex flex-col gap-2">
                   {['Under $25,000', '$25,000 - $49,999', '$50,000 - $74,999', '$75,000 - $99,999', '$100,000+'].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id={`income-${option.replace(/[^a-zA-Z0-9]/g, '-')}`} // Sanitize ID for special characters
                        name="annualHouseholdIncome" 
                        value={option} 
                        checked={annualHouseholdIncome === option} 
                        onChange={() => setAnnualHouseholdIncome(option)} 
                        disabled={isPending}
                        className="form-radio text-primary"
                      />
                      <Label htmlFor={`income-${option.replace(/[^a-zA-Z0-9]/g, '-')}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date-of-birth">Date of Birth</Label>
                <Input
                  id="date-of-birth"
                  type="date" // Using type="date" as a placeholder for a date picker
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isPending}
                />
                 <p className="text-xs text-muted-foreground mt-1">Providing your DOB allows you to earn bonus points and other potential rewards on your birthday!</p>
              </div>

               <div className="space-y-1">
                <Label htmlFor="approximate-age">Approximate Age (Alternatively)</Label>
                <Input
                  id="approximate-age"
                  type="text"
                  value={approximateAge}
                  onChange={(e) => setApproximateAge(e.target.value)}
                  placeholder="e.g., 45"
                  disabled={isPending}
                />
                 <p className="text-xs text-muted-foreground mt-1">If you prefer not to share your full DOB, you can provide an approximate age.</p>
              </div>
            </div>
            {/* End User Profile Section */}

            {/* Morgellons Symptoms and History Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Morgellons Symptoms and History</h3>

              <div className="space-y-1">
                <Label htmlFor="symptoms-start-date">When did you first notice Morgellons-like symptoms?</Label>
                <Input
                  id="symptoms-start-date"
                  type="date" // Using type="date" as a placeholder for a date picker
                  value={symptomsStartDate}
                  onChange={(e) => setSymptomsStartDate(e.target.value)}
                  disabled={isPending}
                />
                 <p className="text-xs text-muted-foreground mt-1">Select a date or provide an approximate time.</p>
              </div>
              </div> 
              <div className="space-y-1">
                <Label>Have you been officially diagnosed with Morgellons, or do you self-diagnose?</Label>
                <div className="flex flex-col gap-2">
                   {['Officially Diagnosed', 'Self-Diagnosed', 'Seeking Diagnosis'].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`diagnosis-${option.replace(/[^a-zA-Z0-9]/g, '-')}`}
                        name="diagnosisStatus"
                        value={option}
                        checked={diagnosisStatus === option}
                        onChange={() => setDiagnosisStatus(option)}
                        disabled={isPending}
                        className="form-radio text-primary"
                      />
                      <Label htmlFor={`diagnosis-${option.replace(/[^a-zA-Z0-9]/g, '-')}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

               <div className="space-y-1">
                <Label>Please describe your current symptoms. Check all that apply, and use the text box for more details.</Label>
                <div className="flex flex-col gap-2">
                   {['Skin lesions with unusual fibers', 'Crawling sensations', 'Brain fog / Cognitive impairment', 'Poor quality of life', 'Depression', 'Anxiety', 'Other'].map(symptom => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`symptom-${symptom.replace(/[^a-zA-Z0-9]/g, '-')}`}
                        name="symptoms"
                        value={symptom}
                        checked={symptoms.includes(symptom)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSymptoms([...symptoms, symptom]);
                          } else {
                            setSymptoms(symptoms.filter(s => s !== symptom));
                          }
                        }}
                        disabled={isPending}
                        className="form-checkbox text-primary rounded"
                      />
                      <Label htmlFor={`symptom-${symptom.replace(/[^a-zA-Z0-9]/g, '-')}`}>{symptom}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text box for custom symptom description - Add this if needed */}
               <div className="space-y-1">
                <Label htmlFor="custom-symptom">Other Symptoms (Please Describe)</Label>
                <Input
                  id="custom-symptom"
                  type="text"
                  value={customSymptomDescription}
                  onChange={(e) => setCustomSymptomDescription(e.target.value)}
                  placeholder="Describe other symptoms here..."
                  disabled={isPending}
                />

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            </div> {/* Closing div for space-y-1 */}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {isPending ? 'Registering...' : 'Register'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/login">Login here</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
 {/* Closing form tag was here, moved inside Card */}

      </Card>
    </div>
  );
}
