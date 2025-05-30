
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip, BarChartHorizontalBig } from "lucide-react";
import { format } from "date-fns";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import Image from 'next/image';

interface SymptomEntry {
  id: string;
  date: Date;
  symptoms: string;
  notes: string;
  photoDataUri?: string;
  photoAiHint?: string;
}

interface ProcessedChartData {
  name: string;
  count: number;
}

const initialEntries: SymptomEntry[] = [
  { id: '1', date: new Date(2024, 6, 15), symptoms: 'Itching, fatigue', notes: 'Skin felt particularly sensitive after shower.', photoDataUri: 'https://placehold.co/300x200.png', photoAiHint: 'skin rash' },
  { id: '2', date: new Date(2024, 6, 16), symptoms: 'Crawling sensation, brain fog, Itching', notes: 'Difficult to concentrate at work.' },
];

const staticChartConfig = {
  count: {
    label: "Occurrences",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function SymptomJournalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [entries, setEntries] = useState<SymptomEntry[]>(initialEntries);
  const [processedChartData, setProcessedChartData] = useState<ProcessedChartData[]>([]);
  const [dynamicChartConfig, setDynamicChartConfig] = useState<ChartConfig>(staticChartConfig);


  useEffect(() => {
    const symptomCounts: { [key: string]: number } = entries.reduce((acc, entry) => {
      const individualSymptoms = entry.symptoms.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
      individualSymptoms.forEach(symptom => {
        if (symptom) { // Ensure symptom string is not empty
          acc[symptom] = (acc[symptom] || 0) + 1;
        }
      });
      return acc;
    }, {} as { [key: string]: number });

    const newChartData = Object.entries(symptomCounts)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a,b) => b.count - a.count); // Sort by count descending

    setProcessedChartData(newChartData);

    const newDynamicConfig: ChartConfig = { ...staticChartConfig };
     newChartData.forEach((item, index) => {
        newDynamicConfig[item.name] = {
            label: item.name,
            color: `hsl(var(--chart-${(index % 5) + 1}))`
        };
    });
    // We primarily use staticChartConfig for the ChartContainer, 
    // but dynamicChartConfig could be used if tooltip/legend needed per-symptom colors directly from config.
    // For now, Cell handles bar colors.
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !symptoms) {
      alert("Date and symptoms are required.");
      return;
    }
    const newEntry: SymptomEntry = {
      id: String(Date.now()),
      date,
      symptoms,
      notes,
      photoDataUri: photoPreview || undefined,
      photoAiHint: photo ? 'medical symptom' : undefined,
    };
    setEntries(prevEntries => [newEntry, ...prevEntries]);
    // Reset form
    setDate(new Date());
    setSymptoms('');
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
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
                <Input id="symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g., Itching, fatigue, skin lesions" />
              </div>
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
            <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="h-6 w-6 text-primary"/>Symptom Trends</CardTitle>
            <CardDescription>Visualize your symptom patterns over time. Shows frequency of logged symptoms.</CardDescription>
          </CardHeader>
          <CardContent>
            {processedChartData.length > 0 ? (
              <ChartContainer config={staticChartConfig} className="min-h-[250px] w-full">
                <BarChart accessibilityLayer data={processedChartData} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={false}
                    className="text-xs"
                    width={80} 
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
        <CardContent className="space-y-4 flex-grow overflow-y-auto">
          {entries.length === 0 && <p className="text-muted-foreground">No entries yet. Add your first one!</p>}
          {entries.map(entry => (
            <Card key={entry.id} className="bg-card/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-md">{format(entry.date, "PPP")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 pb-4">
                <p><strong>Symptoms:</strong> {entry.symptoms}</p>
                {entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}
                {entry.photoDataUri && (
                  <div className="mt-2">
                     <Image src={entry.photoDataUri} alt="Symptom" width={100} height={100} className="rounded-md border object-cover" data-ai-hint={entry.photoAiHint || "medical condition"} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

