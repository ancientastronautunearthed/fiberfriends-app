
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip, BarChartHorizontalBig, PlusCircle, X, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const SYMPTOM_JOURNAL_ENTRIES_KEY = 'fiberFriendsSymptomJournalEntries';

interface SymptomEntry {
  id: string;
  date: string; // Store as YYYY-MM-DD string
  symptoms: string[];
  notes: string;
  photoDataUri?: string;
  photoAiHint?: string;
}

interface ProcessedChartData {
  name: string;
  count: number;
}

const commonSymptomsList = [
  "Itching", "Fatigue", "Brain Fog", "Crawling Sensation",
  "Skin Lesions", "Joint Pain", "Sleep Disturbance", "Headache",
  "Anxiety", "Muscle Aches"
];

const staticChartConfig = {
  count: {
    label: "Occurrences",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function SymptomJournalPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [processedChartData, setProcessedChartData] = useState<ProcessedChartData[]>([]);
  const [dynamicChartConfig, setDynamicChartConfig] = useState<ChartConfig>(staticChartConfig);


  useEffect(() => {
    const storedEntriesRaw = localStorage.getItem(SYMPTOM_JOURNAL_ENTRIES_KEY);
    if (storedEntriesRaw) {
      try {
        const parsedEntries = JSON.parse(storedEntriesRaw) as SymptomEntry[];
        // Dates are already strings, no need to parse to Date objects for internal state
        setEntries(parsedEntries);
      } catch (error) {
        console.error("Error parsing symptom journal entries from localStorage:", error);
        setEntries([]);
      }
    }
  }, []);

  useEffect(() => {
    if (entries.length > 0 || localStorage.getItem(SYMPTOM_JOURNAL_ENTRIES_KEY)) { // Save even if entries becomes empty to clear storage
        localStorage.setItem(SYMPTOM_JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
    }

    const symptomCounts: { [key: string]: number } = entries.reduce((acc, entry) => {
      entry.symptoms.forEach(symptom => {
        const s = symptom.trim().toLowerCase();
        if (s) {
          acc[s] = (acc[s] || 0) + 1;
        }
      });
      return acc;
    }, {} as { [key: string]: number });

    const newChartData = Object.entries(symptomCounts)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count);

    setProcessedChartData(newChartData);

    const newDynamicConfig: ChartConfig = { ...staticChartConfig };
    newChartData.forEach((item, index) => {
      newDynamicConfig[item.name] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`
      };
    });
    setDynamicChartConfig(newDynamicConfig);

  }, [entries]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhoto(null);
      setPhotoPreview(null);
    }
  };

  const handleCommonSymptomChange = (symptom: string, checked: boolean) => {
    setCurrentSymptoms(prev =>
      checked ? [...prev, symptom] : prev.filter(s => s !== symptom)
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !currentSymptoms.includes(customSymptom.trim())) {
      setCurrentSymptoms(prev => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleRemoveSymptom = (symptomToRemove: string) => {
    setCurrentSymptoms(prev => prev.filter(s => s !== symptomToRemove));
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || currentSymptoms.length === 0) {
      alert("Date and at least one symptom are required.");
      return;
    }
    const newEntry: SymptomEntry = {
      id: String(Date.now()),
      date: format(selectedDate, "yyyy-MM-dd"), // Store as YYYY-MM-DD string
      symptoms: currentSymptoms,
      notes,
      photoDataUri: photoPreview || undefined,
      photoAiHint: photo ? 'medical symptom' : undefined,
    };
    setEntries(prevEntries => [newEntry, ...prevEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    setSelectedDate(new Date());
    setCurrentSymptoms([]);
    setCustomSymptom('');
    setNotes('');
    setPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Log New Symptom Entry</CardTitle>
            <CardDescription>Track your symptoms, notes, and add photos if helpful.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date-picker">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-picker"
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Common Symptoms</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {commonSymptomsList.map(symptom => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={`symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={currentSymptoms.includes(symptom)}
                        onCheckedChange={(checked) => handleCommonSymptomChange(symptom, !!checked)}
                      />
                      <Label htmlFor={`symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`} className="font-normal text-sm">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="custom-symptom">Custom Symptom</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-symptom"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="e.g., Tingling in hands"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddCustomSymptom} aria-label="Add custom symptom">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {currentSymptoms.length > 0 && (
                <div>
                  <Label className="text-sm">Selected Symptoms:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentSymptoms.map(symptom => (
                      <Badge key={symptom} variant="secondary" className="flex items-center gap-1">
                        {symptom}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0.5 hover:bg-destructive/20"
                          onClick={() => handleRemoveSymptom(symptom)}
                          aria-label={`Remove ${symptom}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations, triggers, or context..." />
              </div>
              <div>
                <Label htmlFor="photo">Attach Photo (optional)</Label>
                <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} />
                {photoPreview && (
                  <div className="mt-2">
                    <Image src={photoPreview} alt="Symptom photo preview" width={150} height={150} className="rounded-md object-cover border" data-ai-hint="medical symptom" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Add Entry</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="h-6 w-6 text-primary" />Symptom Trends</CardTitle>
            <CardDescription>Visualize your symptom patterns over time. Shows frequency of logged symptoms.</CardDescription>
          </CardHeader>
          <CardContent>
            {processedChartData.length > 0 ? (
              <ChartContainer config={dynamicChartConfig} className="min-h-[250px] w-full">
                <BarChart accessibilityLayer data={processedChartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={false}
                    className="text-xs"
                    width={100}
                    interval={0}
                  />
                  <XAxis dataKey="count" type="number" hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="name" />} />
                  <Bar dataKey="count" layout="vertical" radius={5}>
                    {processedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No symptom data to display in chart. Add some entries first!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-1 h-fit max-h-[calc(100vh-10rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">My Journal Entries</CardTitle>
          <CardDescription>Review your past symptom logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <ScrollArea className="h-[calc(100vh-16rem)] pr-3"> {/* Adjust height as needed */}
            {entries.length === 0 && <p className="text-muted-foreground">No entries yet. Add your first one!</p>}
            {entries.map(entry => (
              <Card key={entry.id} className="bg-card/50 mb-4">
                <CardHeader className="pb-2 pt-4 flex flex-row justify-between items-start">
                  <CardTitle className="text-md">{format(parseISO(entry.date), "PPP")}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)} aria-label="Delete entry" className="h-7 w-7">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="text-sm space-y-1 pb-4">
                  <div>
                    <strong>Symptoms:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.symptoms.map(symptom => <Badge key={symptom} variant="secondary">{symptom}</Badge>)}
                    </div>
                  </div>
                  {entry.notes && <p className="mt-1"><strong>Notes:</strong> {entry.notes}</p>}
                  {entry.photoDataUri && (
                    <div className="mt-2">
                      <Image src={entry.photoDataUri} alt="Symptom" width={100} height={100} className="rounded-md border object-cover" data-ai-hint={entry.photoDataUri.startsWith('https://placehold.co/') ? entry.photoAiHint : 'medical condition'} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
