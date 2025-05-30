"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Paperclip, BarChartHorizontalBig } from "lucide-react";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart } from '@/components/ui/chart';
import { Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Image from 'next/image';

interface SymptomEntry {
  id: string;
  date: Date;
  symptoms: string;
  notes: string;
  photoDataUri?: string;
  photoAiHint?: string;
}

const initialEntries: SymptomEntry[] = [
  { id: '1', date: new Date(2024, 6, 15), symptoms: 'Itching, fatigue', notes: 'Skin felt particularly sensitive after shower.', photoDataUri: 'https://placehold.co/300x200.png', photoAiHint: 'skin rash' },
  { id: '2', date: new Date(2024, 6, 16), symptoms: 'Crawling sensation, brain fog', notes: 'Difficult to concentrate at work.' },
];

const chartData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: { label: "Symptom A", color: "hsl(var(--chart-1))" },
  mobile: { label: "Symptom B", color: "hsl(var(--chart-2))" },
};


export default function SymptomJournalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [entries, setEntries] = useState<SymptomEntry[]>(initialEntries);

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
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
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
            <CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="h-6 w-6 text-primary"/>Symptom Trends (Placeholder)</CardTitle>
            <CardDescription>Visualize your symptom patterns over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="font-headline">My Journal Entries</CardTitle>
          <CardDescription>Review your past symptom logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
          {entries.length === 0 && <p className="text-muted-foreground">No entries yet. Add your first one!</p>}
          {entries.map(entry => (
            <Card key={entry.id} className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">{format(entry.date, "PPP")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
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
