
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Activity, BarChart3, ClipboardList, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const DOCTOR_LOGGED_IN_KEY = 'fiberFriendsDoctorLoggedIn';

// Mock data structure for analytics (placeholders)
const mockAnalyticsSummary = {
  totalPatientsInSystem: 1258, // Example number
  averageSymptomSeverity: 3.5, // Example on a 1-5 scale
  mostCommonSymptom: 'Itching',
  trendingSymptom: 'Fatigue (increase last 30 days)',
};

const mockSymptomData = [
  { name: 'Itching', count: 890 },
  { name: 'Fatigue', count: 750 },
  { name: 'Brain Fog', count: 620 },
  { name: 'Skin Lesions', count: 550 },
  { name: 'Crawling Sensation', count: 480 },
  { name: 'Joint Pain', count: 400 },
];

const mockTreatmentEfficacy = [
    { treatment: 'Dietary Changes (Low Histamine)', reportedImprovementRate: 0.65, sampleSize: 150 },
    { treatment: 'Topical Steroids', reportedImprovementRate: 0.40, sampleSize: 220 },
    { treatment: 'Mindfulness Practice', reportedImprovementRate: 0.55, sampleSize: 180 },
    { treatment: 'Supplement X (Anonymized)', reportedImprovementRate: 0.72, sampleSize: 90 },
];

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem(DOCTOR_LOGGED_IN_KEY) === 'true';
    if (!isLoggedIn) {
      router.replace('/doctor/login');
      toast({
        title: 'Access Denied',
        description: 'Please log in to access the Doctor Dashboard.',
        variant: 'destructive',
      });
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem(DOCTOR_LOGGED_IN_KEY);
    toast({ title: 'Logged Out', description: 'You have been logged out of the Doctor Portal.' });
    router.push('/doctor/login');
  };

  // Basic chart component placeholder
  const PlaceholderChart = ({ title, data }: { title: string, data?: any[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-60 flex items-center justify-center bg-muted/30 rounded-md">
        {data && data.length > 0 ? (
             <p className="text-sm text-muted-foreground">(Chart visualization for {data.length} data points would go here)</p>
        ) : (
            <p className="text-sm text-muted-foreground">(Chart visualization would go here - No specific data prop passed)</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <div className="flex items-center gap-2">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-headline font-bold text-foreground">Doctor Analytics Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Anonymized insights from the Fiber Friends community.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
             <Button variant="link" asChild className="text-xs p-0 h-auto mt-2 sm:mt-0 sm:ml-2">
                <Link href="/">Return to Patient Portal</Link>
            </Button>
        </div>
      </header>

      <Card className="mb-6 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><ShieldAlert className="text-destructive h-5 w-5" /> Important Notice</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-foreground/90">
                All data presented here is **anonymized and aggregated** for research and trend analysis purposes only. It is sourced from voluntary user inputs on the Fiber Friends platform.
                This information is **not a substitute for direct patient consultation, individual medical records, or clinical judgment.**
                Interpret with caution and in conjunction with peer-reviewed medical literature.
            </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-md flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Active Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{mockAnalyticsSummary.totalPatientsInSystem.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-md flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/>Avg. Symptom Severity</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{mockAnalyticsSummary.averageSymptomSeverity}/5</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-md flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary"/>Most Common Symptom</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold">{mockAnalyticsSummary.mostCommonSymptom}</p></CardContent>
        </Card>
         <Card>
          <CardHeader><CardTitle className="text-md flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary"/>Trending Symptom</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{mockAnalyticsSummary.trendingSymptom}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlaceholderChart title="Symptom Frequency Overview" data={mockSymptomData} />
        <PlaceholderChart title="Treatment Efficacy Insights (Self-Reported)" data={mockTreatmentEfficacy} />
        {/* Add more placeholder chart/data sections as needed */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg">Detailed Data Views (Conceptual)</CardTitle>
                <CardDescription>Future sections could include anonymized journal excerpts (with consent), demographic breakdowns, product usage trends, etc.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Anonymized symptom co-occurrence patterns.</li>
                    <li>Geographic distribution of reported symptoms (if location data shared).</li>
                    <li>Impact of lifestyle factors (e.g., exercise, diet type) on symptom severity – requires more data collection.</li>
                </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
