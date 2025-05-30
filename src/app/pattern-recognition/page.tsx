
"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit, UploadCloud, MapPin, LocateFixed } from "lucide-react";
import type { SymptomPatternAnalysisInput, SymptomPatternAnalysisOutput, SymptomEntry } from "@/ai/flows/symptom-pattern-analysis";
import { analyzeSymptomPatternsAction } from './actions';
import Image from 'next/image';

export default function PatternRecognitionPage() {
  const [userSymptomEntries, setUserSymptomEntries] = useState<SymptomEntry[]>([
    { date: new Date().toISOString().split('T')[0], symptoms: [], notes: '', photoDataUri: undefined },
  ]);
  const [includeCommunityData, setIncludeCommunityData] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SymptomPatternAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const handleAddEntry = () => {
    setUserSymptomEntries([
      ...userSymptomEntries,
      { date: new Date().toISOString().split('T')[0], symptoms: [], notes: '', photoDataUri: undefined },
    ]);
  };

  const handleEntryChange = (index: number, field: keyof SymptomEntry, value: string | string[] | undefined) => {
    const updatedEntries = [...userSymptomEntries];
    if (field === 'symptoms' && typeof value === 'string') {
      updatedEntries[index][field] = value.split(',').map(s => s.trim()).filter(s => s);
    } else {
      (updatedEntries[index] as any)[field] = value;
    }
    setUserSymptomEntries(updatedEntries);
  };

  const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleEntryChange(index, 'photoDataUri', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4).toString());
          setLongitude(position.coords.longitude.toFixed(4).toString());
          setError(null); 
        },
        (geoError) => {
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              setError("Location access denied. Please enable location services or enter coordinates manually.");
              break;
            case geoError.POSITION_UNAVAILABLE:
              setError("Location information is unavailable. Please enter coordinates manually.");
              break;
            case geoError.TIMEOUT:
              setError("The request to get user location timed out. Please try again or enter coordinates manually.");
              break;
            default:
              setError("An unknown error occurred while fetching location. Please enter coordinates manually.");
              break;
          }
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Please enter coordinates manually.");
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setAnalysisResult(null);

    let userLocationInput: { latitude: number; longitude: number } | undefined = undefined;
    if (latitude && longitude) {
        const latNum = parseFloat(latitude);
        const lonNum = parseFloat(longitude);
        if (!isNaN(latNum) && !isNaN(lonNum)) {
            userLocationInput = { latitude: latNum, longitude: lonNum };
        } else {
            setError("Invalid latitude or longitude. Please enter valid numbers or leave them blank.");
            return;
        }
    }

    const inputData: SymptomPatternAnalysisInput = {
      userSymptomEntries: userSymptomEntries.filter(entry => entry.symptoms.length > 0 || (entry.notes && entry.notes.trim() !== '') || entry.photoDataUri),
      includeCommunityData,
      userLocation: userLocationInput,
    };

    if (inputData.userSymptomEntries.length === 0) {
      setError("Please add at least one symptom entry with symptoms, notes, or a photo.");
      return;
    }

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
          <CardTitle className="font-headline flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary"/>AI-Powered Pattern Recognition</CardTitle>
          <CardDescription>
            Analyze your symptom journal entries to identify potential patterns, triggers, or correlations. 
            Optionally, include anonymized community data or your location for weather-based insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="p-4 space-y-3 bg-card/30 border border-dashed">
            <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-md flex items-center gap-2"><MapPin className="h-5 w-5 text-muted-foreground"/>Your Location (Optional)</h3>
                 <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation} className="ml-auto">
                    <LocateFixed className="mr-1 h-4 w-4" />
                    Detect
                </Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g., 34.0522" />
                </div>
                <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g., -118.2437" />
                </div>
             </div>
             <p className="text-xs text-muted-foreground">Click "Detect" or manually enter your coordinates. This allows the AI to consider local weather patterns (temperature, humidity) for analysis.</p>
          </Card>

          {userSymptomEntries.map((entry, index) => (
            <Card key={index} className="p-4 space-y-3 bg-card/50">
              <h3 className="font-semibold text-md">Symptom Entry {index + 1}</h3>
              <div>
                <Label htmlFor={`date-${index}`}>Date</Label>
                <Input id={`date-${index}`} type="date" value={entry.date} onChange={(e) => handleEntryChange(index, 'date', e.target.value)} />
              </div>
              <div>
                <Label htmlFor={`symptoms-${index}`}>Symptoms (comma-separated)</Label>
                <Input id={`symptoms-${index}`} value={entry.symptoms.join(', ')} onChange={(e) => handleEntryChange(index, 'symptoms', e.target.value)} placeholder="e.g., Itching, fatigue" />
              </div>
              <div>
                <Label htmlFor={`notes-${index}`}>Notes</Label>
                <Textarea id={`notes-${index}`} value={entry.notes || ''} onChange={(e) => handleEntryChange(index, 'notes', e.target.value)} placeholder="Describe sensations, activities, food, etc." />
              </div>
              <div>
                <Label htmlFor={`photo-${index}`} className="flex items-center gap-1">
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                  Photo (optional)
                </Label>
                <Input id={`photo-${index}`} type="file" accept="image/*" onChange={(e) => handleFileChange(index, e)} className="mt-1"/>
                {entry.photoDataUri && <Image src={entry.photoDataUri} alt={`Preview ${index}`} width={100} height={100} className="mt-2 rounded border object-cover" data-ai-hint="medical symptom" />}
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={handleAddEntry} size="sm">Add Another Entry</Button>
          
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="includeCommunityData" checked={includeCommunityData} onCheckedChange={(checked) => setIncludeCommunityData(checked as boolean)} />
            <Label htmlFor="includeCommunityData" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Include anonymized community data in analysis (optional)
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full md:w-auto">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Analyze Symptoms
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
            <CardTitle className="font-headline">Analysis Results</CardTitle>
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
                  {analysisResult.patternAnalysis.identifiedPatterns.map((pattern, i) => <li key={i}>{pattern}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No distinct patterns identified.</p>}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Potential Triggers</h3>
              {analysisResult.patternAnalysis.potentialTriggers.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analysisResult.patternAnalysis.potentialTriggers.map((trigger, i) => <li key={i}>{trigger}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No specific triggers identified.</p>}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Correlations</h3>
              {analysisResult.patternAnalysis.correlations.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {analysisResult.patternAnalysis.correlations.map((correlation, i) => <li key={i}>{correlation}</li>)}
              </ul>
              ) : <p className="text-sm text-muted-foreground">No significant correlations found.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
