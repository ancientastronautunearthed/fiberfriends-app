
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, UserCheck, Microscope, Search, Download, Brain, Bone, Leaf, Fish, CookingPot, Pill } from "lucide-react";
import Image from "next/image";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data interfaces
interface MockPatientData {
  id: string;
  name: string;
  email: string;
  monsterName: string;
  monsterImageUrl: string;
  monsterHealth: number;
  lastSymptomLogDate: string;
  commonSymptoms: string[];
  recentFoodEntries: { name: string; grade: 'good' | 'bad' | 'neutral' }[];
  recentExerciseEntries: { name: string; duration: number }[];
  trackedProducts: { name: string; benefitScore: number }[];
  trackedPrescriptions: { name: string; benefitScore: number }[];
}

const mockPatients: MockPatientData[] = [
  {
    id: 'patient123',
    name: 'Jane Doe (Mock)',
    email: 'jane.doe.mock@example.com',
    monsterName: 'Shadow Miasma',
    monsterImageUrl: 'https://placehold.co/80x80.png',
    monsterHealth: 65,
    lastSymptomLogDate: '2024-07-28',
    commonSymptoms: ['Fatigue', 'Brain Fog', 'Itching'],
    recentFoodEntries: [
      { name: 'Spinach Salad', grade: 'good' },
      { name: 'Dark Chocolate (70%)', grade: 'neutral' },
      { name: 'Pizza Slice', grade: 'bad' },
    ],
    recentExerciseEntries: [
      { name: 'Brisk Walk', duration: 30 },
      { name: 'Yoga', duration: 45 },
    ],
    trackedProducts: [
      { name: 'Vitamin D3 Supplement', benefitScore: 4 },
      { name: 'Magnesium Cream', benefitScore: 3 },
    ],
    trackedPrescriptions: [
        { name: 'Amoxicillin (Completed)', benefitScore: 10},
    ]
  }
];

export default function DrMiddelveenPortalPage() {
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<MockPatientData | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSearchTerm.trim()) return;
    setIsLoadingPatient(true);
    // Simulate API call
    setTimeout(() => {
      const foundPatient = mockPatients.find(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase().trim()) || p.email.toLowerCase().includes(patientSearchTerm.toLowerCase().trim()));
      setSelectedPatient(foundPatient || null);
      setIsLoadingPatient(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-3">
            <Image src="https://placehold.co/60x60.png" alt="Dr. Middelveen" width={60} height={60} className="rounded-full border-2 border-primary" data-ai-hint="doctor professional woman"/>
            Dr. Marianne J. Middelveen - Research & Consultation Portal
          </CardTitle>
          <CardDescription>
            Access to anonymized aggregated research data and consented patient profiles for consultation.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
                <Microscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Important Note</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
                    This portal is a prototype. All data displayed is illustrative. In a production system, robust security, anonymization, and patient consent mechanisms would be implemented, adhering to all relevant data privacy regulations (e.g., HIPAA).
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><BarChart3 className="text-primary"/>Aggregated Anonymous Research Data</CardTitle>
          <CardDescription>Overview of trends and patterns from all anonymized user data. (Data below is illustrative)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Brain className="h-4 w-4"/>Symptom Frequency</h3>
              <p className="text-sm text-muted-foreground">Placeholder for symptom frequency chart. (e.g., Itching: 75%, Fatigue: 60%)</p>
              <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="bar chart mockup">Mock Chart Area</div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><CookingPot className="h-4 w-4"/>Common Food Correlations</h3>
              <p className="text-sm text-muted-foreground">Placeholder for food correlation insights. (e.g., High sugar intake correlated with increased fatigue for 30% of users)</p>
              <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="scatter plot mockup">Mock Insights Area</div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Leaf className="h-4 w-4"/>Product Effectiveness Overview</h3>
              <p className="text-sm text-muted-foreground">Placeholder for product effectiveness summary. (e.g., "Vitamin D" reported beneficial by 55% of users tracking it)</p>
               <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="data table mockup">Mock Table/Summary Area</div>
            </Card>
             <Card className="p-4">
              <h3 className="font-semibold mb-2 text-md flex items-center gap-1.5"><Pill className="h-4 w-4"/>Prescription Usage Patterns</h3>
              <p className="text-sm text-muted-foreground">Placeholder for prescription trends. (e.g., 20% of users logging Amoxicillin reported significant improvement)</p>
               <div className="h-40 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs mt-2" data-ai-hint="pie chart mockup">Mock Chart Area</div>
            </Card>
          </div>
          <div className="pt-2 text-right">
            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/>Download Anonymized Dataset (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><UserCheck className="text-primary"/>Patient Profile Access (Requires Consent)</CardTitle>
          <CardDescription>Search for and view detailed profiles of patients who have consented to share their data for consultation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchPatient} className="flex items-center gap-2 mb-6">
            <Input
              type="search"
              placeholder="Search by patient name or ID..."
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoadingPatient || !patientSearchTerm.trim()}>
              {isLoadingPatient ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
              Search
            </Button>
          </form>

          {isLoadingPatient && (
            <div className="text-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Searching for patient...</p>
            </div>
          )}

          {!isLoadingPatient && patientSearchTerm && !selectedPatient && (
            <Alert variant="default">
              <AlertTitle>No Patient Found</AlertTitle>
              <AlertDescription>No patient matching "{patientSearchTerm}" found or consent not granted. Please ensure the patient has shared their profile with you.</AlertDescription>
            </Alert>
          )}
          
          {selectedPatient && !isLoadingPatient && (
            <Card className="bg-card/50 p-4">
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                 <Image src={selectedPatient.monsterImageUrl} alt={selectedPatient.monsterName} width={64} height={64} className="rounded-lg border" data-ai-hint="fantasy monster"/>
                 <div>
                    <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                    <CardDescription>{selectedPatient.email}</CardDescription>
                 </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-4">
                  <h4 className="font-semibold text-md">Monster Details:</h4>
                  <p className="text-sm">Name: <Badge variant="secondary">{selectedPatient.monsterName}</Badge></p>
                  <p className="text-sm">Current Health: <Badge variant={selectedPatient.monsterHealth < 50 ? "destructive" : "default"}>{selectedPatient.monsterHealth}%</Badge></p>
                  
                  <h4 className="font-semibold text-md mt-3">Symptom Overview:</h4>
                  <p className="text-sm">Last Logged: {selectedPatient.lastSymptomLogDate}</p>
                  <p className="text-sm">Commonly Reported: {selectedPatient.commonSymptoms.join(', ') || 'N/A'}</p>
                  {/* Placeholder for detailed symptom log link */}
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Symptom Journal (Mock)</Button>

                  <h4 className="font-semibold text-md mt-3">Dietary Log Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.recentFoodEntries.map((food, i) => (
                      <li key={`food-${i}`}>{food.name} - <Badge variant={food.grade === 'good' ? 'default' : food.grade === 'bad' ? 'destructive' : 'secondary'}>{food.grade}</Badge></li>
                    ))}
                  </ul>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Food Log (Mock)</Button>

                  <h4 className="font-semibold text-md mt-3">Exercise Log Summary:</h4>
                   <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.recentExerciseEntries.map((ex, i) => (
                      <li key={`ex-${i}`}>{ex.name} - {ex.duration} mins</li>
                    ))}
                  </ul>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Exercise Log (Mock)</Button>
                  
                  <h4 className="font-semibold text-md mt-3">Tracked Products Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.trackedProducts.map((prod, i) => (
                      <li key={`prod-${i}`}>{prod.name} (Benefit: {prod.benefitScore}/5)</li>
                    ))}
                  </ul>
                   <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Product Tracker (Mock)</Button>
                  
                  <h4 className="font-semibold text-md mt-3">Tracked Prescriptions Summary:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm">
                    {selectedPatient.trackedPrescriptions.map((rx, i) => (
                      <li key={`rx-${i}`}>{rx.name} (Benefit: {rx.benefitScore}/15)</li>
                    ))}
                  </ul>
                   <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>View Full Prescription Tracker (Mock)</Button>
                </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>Close Patient View</Button>
              </CardFooter>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
