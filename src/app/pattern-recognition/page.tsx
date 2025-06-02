
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit, MapPin, LocateFixed, Gem, Info, ListChecks, MessageSquare } from "lucide-react";
import type { SymptomPatternAnalysisInput, SymptomPatternAnalysisOutput } from "@/ai/flows/symptom-pattern-analysis"; // Action still needs its own type
import { analyzeSymptomPatternsAction } from './actions';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';


// Interface for entries loaded from Symptom Journal localStorage
interface JournalSymptomEntry {
  id: string;
  date: string; // YYYY-MM-DD string
  symptoms: string[];
  notes: string;
  photoDataUri?: string;
  photoAiHint?: string; // Journal might have this, AI flow doesn't need it
}

const SYMPTOM_JOURNAL_ENTRIES_KEY = 'fiberFriendsSymptomJournalEntries';
const LANDING_PAGE_PRICING_ANCHOR = '/landing#pricing';


export default function PatternRecognitionPage() {
  const [loadedJournalEntries, setLoadedJournalEntries] = useState<JournalSymptomEntry[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [includeCommunityData, setIncludeCommunityData] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomPatternAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);

  useEffect(() => {
    const storedEntriesRaw = localStorage.getItem(SYMPTOM_JOURNAL_ENTRIES_KEY);
    if (storedEntriesRaw) {
      try {
        const parsedEntries = JSON.parse(storedEntriesRaw) as JournalSymptomEntry[];
        setLoadedJournalEntries(parsedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error("Error parsing symptom journal entries:", e);
        setLoadedJournalEntries([]);
      }
    }
  }, []);

  const handleEntrySelectionChange = (entryId: string, checked: boolean) => {
    setSelectedEntryIds(prev =>
      checked ? [...prev, entryId] : prev.filter(id => id !== entryId)
    );
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4).toString());
          setLongitude(position.coords.longitude.toFixed(4).toString());
          setError(null);
          // Assuming premium feature for location
          setShowPremiumPrompt(true);
        },
        (geoError) => {
          setError(geoError.message || "Error fetching location.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleCommunityDataCheck = (checked: boolean) => {
    setIncludeCommunityData(checked);
    if (checked) {
        setShowPremiumPrompt(true);
    } else if (!latitude && !longitude) { // Only hide prompt if location is also not set
        setShowPremiumPrompt(false);
    }
  }

  const handleSubmit = async () => {
    setError(null);
    setAnalysisResult(null);

    const selectedEntriesForAnalysis = loadedJournalEntries
      .filter(entry => selectedEntryIds.includes(entry.id))
      .map(entry => ({ // Ensure only fields expected by AI flow are sent
        date: entry.date,
        symptoms: entry.symptoms,
        notes: entry.notes,
        photoDataUri: entry.photoDataUri,
      }));

    if (selectedEntriesForAnalysis.length === 0) {
      setError("Please select at least one symptom entry for analysis.");
      return;
    }
    
    let userLocationInput: { latitude: number; longitude: number } | undefined = undefined;
    let useLocationForAnalysis = false;
    if (latitude && longitude) {
        const latNum = parseFloat(latitude);
        const lonNum = parseFloat(longitude);
        if (!isNaN(latNum) && !isNaN(lonNum)) {
            userLocationInput = { latitude: latNum, longitude: lonNum };
            useLocationForAnalysis = true; // Indicate that location is provided
        } else {
            setError("Invalid latitude or longitude. Please enter valid numbers or clear them if not using location.");
            return;
        }
    }


    if (showPremiumPrompt && (includeCommunityData || useLocationForAnalysis)) {
        // User is trying to use a premium feature they were prompted for
        // The prompt should ideally stop them or this submit function can re-check.
        // For now, the prompt is informational, and we allow submission.
        // In a real app, a backend would gate this.
    }


    const inputData: SymptomPatternAnalysisInput = {
      userSymptomEntries: selectedEntriesForAnalysis,
      includeCommunityData: includeCommunityData, // Use the state directly
      userLocation: userLocationInput,
    };

    startTransition(async () => {
      try {
        const result = await analyzeSymptomPatternsAction(inputData);
        setAnalysisResult(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred during analysis.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary" />AI-Powered Pattern Recognition</CardTitle>
          <CardDescription>
            Select entries from your Symptom Journal for AI analysis. Optionally, add your location for weather correlation insights or include anonymized community data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="p-4 space-y-3 bg-card/30 border border-dashed">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="font-semibold text-md flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />Your Location (Optional
                <Gem className="h-3.5 w-3.5 text-amber-500 inline-block ml-1" />)
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation} className="w-full sm:w-auto">
                <LocateFixed className="mr-1 h-4 w-4" /> Detect My Location
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="text" value={latitude} onChange={(e) => { setLatitude(e.target.value); if (e.target.value || longitude) setShowPremiumPrompt(true); else if (!includeCommunityData) setShowPremiumPrompt(false);}} placeholder="e.g., 34.0522" />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="text" value={longitude} onChange={(e) => { setLongitude(e.target.value); if (e.target.value || latitude) setShowPremiumPrompt(true); else if (!includeCommunityData) setShowPremiumPrompt(false); }} placeholder="e.g., -118.2437" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Enabling location allows AI to check for weather correlations (Premium Insight).</p>
          </Card>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="includeCommunityData" checked={includeCommunityData} onCheckedChange={(checked) => handleCommunityDataCheck(checked as boolean)} />
            <Label htmlFor="includeCommunityData" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
              Include anonymized community data in analysis (Optional
              <Gem className="h-3.5 w-3.5 text-amber-500 inline-block" />)
            </Label>
          </div>
          
          {showPremiumPrompt && (
            <Alert variant="default" className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 mt-2">
              <Gem className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-700 dark:text-amber-300">Premium Insights</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-400 text-xs">
                Using location for weather correlation or including community data provides deeper insights and is a Premium feature.
                The analysis will proceed with the data you've enabled. <Link href={LANDING_PAGE_PRICING_ANCHOR} className="underline font-semibold">Upgrade for full benefits.</Link>
              </AlertDescription>
            </Alert>
          )}


          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary"/>Select Symptom Journal Entries for Analysis
            </h3>
            {loadedJournalEntries.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p className="mb-2">No symptom journal entries found.</p>
                <Button variant="outline" asChild>
                  <Link href="/symptom-journal">Go to Symptom Journal to add entries</Link>
                </Button>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] border rounded-md p-3">
                <div className="space-y-3">
                  {loadedJournalEntries.map((entry) => (
                    <Card key={entry.id} className="p-3 flex items-start gap-3 bg-card/80 hover:shadow-md transition-shadow">
                      <Checkbox
                        id={`entry-select-${entry.id}`}
                        checked={selectedEntryIds.includes(entry.id)}
                        onCheckedChange={(checked) => handleEntrySelectionChange(entry.id, !!checked)}
                        className="mt-1 shrink-0"
                      />
                      <div className="flex-grow">
                        <Label htmlFor={`entry-select-${entry.id}`} className="font-semibold text-sm cursor-pointer">
                          {format(parseISO(entry.date), "PPP")}
                        </Label>
                        <div className="text-xs text-muted-foreground mt-0.5 mb-1 space-x-1">
                          {entry.symptoms.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-xxs">{s}</Badge>)}
                          {entry.symptoms.length > 3 && <Badge variant="outline" className="text-xxs">+{entry.symptoms.length - 3} more</Badge>}
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground truncate">Notes: {entry.notes}</p>}
                        {entry.photoDataUri && (
                          <Image src={entry.photoDataUri} alt={`Symptom photo for ${entry.date}`} width={40} height={40} className="mt-1 rounded border object-cover" data-ai-hint={entry.photoAiHint || "medical symptom"}/>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending || loadedJournalEntries.length === 0 || selectedEntryIds.length === 0} className="w-full md:w-auto">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Analyze Selected Entries ({selectedEntryIds.length})
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary"/>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Summary</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysisResult.patternAnalysis.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Identified Patterns</h3>
              {analysisResult.patternAnalysis.identifiedPatterns.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analysisResult.patternAnalysis.identifiedPatterns.map((pattern, i) => <li key={`pattern-${i}`}>{pattern}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No distinct patterns identified from the selected entries.</p>}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Potential Triggers</h3>
              {analysisResult.patternAnalysis.potentialTriggers.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analysisResult.patternAnalysis.potentialTriggers.map((trigger, i) => <li key={`trigger-${i}`}>{trigger}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No specific triggers identified from the selected entries.</p>}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Correlations</h3>
              {analysisResult.patternAnalysis.correlations.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analysisResult.patternAnalysis.correlations.map((correlation, i) => <li key={`correlation-${i}`}>{correlation}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No significant correlations found in the selected entries.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
