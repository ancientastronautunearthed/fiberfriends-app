
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Dumbbell, Settings2, Sparkles, ClipboardList, ExternalLink } from "lucide-react";
import type { WorkoutPlanInput, WorkoutPlanOutput } from '@/ai/flows/workout-plan-generation-flow';
import { generateWorkoutPlanAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const EQUIPMENT_OPTIONS = [
  "Bodyweight (No Equipment)", "Dumbbells", "Barbell", "Kettlebells", "Resistance Bands", 
  "Pull-up Bar", "Bench", "Stability Ball", "Jump Rope", "Yoga Mat", 
  "Stationary Bike", "Treadmill", "Elliptical", "Rowing Machine"
];

const DAYS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7"];
const TIME_OPTIONS = ["15", "30", "45", "60", "75", "90"];

const FITNESS_GOALS_OPTIONS = [
  "Weight Loss", "Muscle Gain (Hypertrophy)", "Strength Gain", 
  "Improve Endurance", "Improve Flexibility", "General Fitness/Wellness", 
  "Stress Relief", "Improve Cardiovascular Health"
];

export default function WorkoutPlanCreatorPage() {
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState<string>('3');
  const [timePerWorkout, setTimePerWorkout] = useState<string>('45');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGeneratingTransition] = useTransition();
  const { toast } = useToast();

  const handleEquipmentChange = (item: string, checked: boolean) => {
    setSelectedEquipment(prev =>
      checked ? [...prev, item] : prev.filter(eq => eq !== item)
    );
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    setSelectedGoals(prev =>
      checked ? [...prev, goal] : prev.filter(g => g !== goal)
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setGeneratedPlan(null);

    if (selectedEquipment.length === 0 && !customEquipment.trim()) {
      setError("Please select at least one piece of equipment or specify custom equipment.");
      return;
    }
    if (selectedGoals.length === 0) {
      setError("Please select at least one fitness goal.");
      return;
    }

    const inputData: WorkoutPlanInput = {
      equipmentAvailable: selectedEquipment,
      customEquipment: customEquipment.trim() || undefined,
      daysPerWeek: parseInt(daysPerWeek, 10),
      timePerWorkoutMinutes: parseInt(timePerWorkout, 10),
      fitnessGoals: selectedGoals,
    };

    startGeneratingTransition(async () => {
      try {
        const result = await generateWorkoutPlanAction(inputData);
        setGeneratedPlan(result);
        toast({
          title: "Workout Plan Generated!",
          description: "Your personalized workout plan is ready below.",
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
        toast({
          title: "Generation Failed",
          description: e instanceof Error ? e.message : "Could not generate workout plan.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-primary" />
            AI Workout Plan Creator
          </CardTitle>
          <CardDescription>
            Tell us about your resources and goals, and our AI Fitness Trainer will craft a personalized workout plan for you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            
            <div className="space-y-3 p-4 border rounded-md bg-card/50">
              <h3 className="font-semibold text-md">1. Your Equipment</h3>
              <Label>Available Equipment (select all that apply):</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                {EQUIPMENT_OPTIONS.map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equip-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      checked={selectedEquipment.includes(item)}
                      onCheckedChange={(checked) => handleEquipmentChange(item, !!checked)}
                    />
                    <Label htmlFor={`equip-${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-normal">{item}</Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="custom-equipment">Other Equipment (comma-separated):</Label>
                <Input
                  id="custom-equipment"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="e.g., Sandbag, TRX straps"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-card/50">
              <h3 className="font-semibold text-md">2. Your Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="days-per-week">Workout Days Per Week:</Label>
                  <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                    <SelectTrigger id="days-per-week"><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS_OPTIONS.map(day => <SelectItem key={day} value={day}>{day} day(s)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time-per-workout">Time Per Workout Session:</Label>
                  <Select value={timePerWorkout} onValueChange={setTimePerWorkout}>
                    <SelectTrigger id="time-per-workout"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_OPTIONS.map(time => <SelectItem key={time} value={time}>{time} minutes</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-card/50">
              <h3 className="font-semibold text-md">3. Your Fitness Goals</h3>
              <Label>Select your primary goals (choose 1-3):</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                {FITNESS_GOALS_OPTIONS.map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal.toLowerCase().replace(/\s+/g, '-')}`}
                      checked={selectedGoals.includes(goal)}
                      onCheckedChange={(checked) => handleGoalChange(goal, !!checked)}
                      disabled={selectedGoals.length >= 3 && !selectedGoals.includes(goal)}
                    />
                    <Label htmlFor={`goal-${goal.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-normal">{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isGenerating ? "Crafting Your Plan..." : "Generate My Workout Plan"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isGenerating && (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="mt-3 text-muted-foreground">The AI Fitness Trainer is designing your plan... this may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {generatedPlan && (
        <Card className="mt-6 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary"/> {generatedPlan.planTitle}
            </CardTitle>
            <CardDescription className="whitespace-pre-line">{generatedPlan.planOverview}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">General Warm-up:</h3>
              <p className="text-sm text-muted-foreground">{generatedPlan.warmUpSuggestion}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">Weekly Schedule:</h3>
              <div className="space-y-4">
                {generatedPlan.weeklySchedule.map((day, dayIndex) => (
                  <Card key={dayIndex} className="p-4 bg-card/50">
                    <CardTitle className="text-md mb-2">{day.day} {day.focus && <span className="text-sm text-primary font-medium">- {day.focus}</span>}</CardTitle>
                    {day.exercises && day.exercises.length > 0 ? (
                      <ul className="space-y-2">
                        {day.exercises.map((exercise, exIndex) => (
                          <li key={exIndex} className="text-sm border-b border-dashed pb-1 last:border-b-0">
                            <span className="font-semibold text-foreground">{exercise.name}:</span>
                            {exercise.sets && ` ${exercise.sets} sets`}
                            {exercise.reps && ` of ${exercise.reps}`}
                            {exercise.rest && `, ${exercise.rest} rest.`}
                            {exercise.notes && <span className="block text-xs text-muted-foreground italic ml-2">- {exercise.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : day.activeRecoverySuggestion ? (
                         <p className="text-sm text-muted-foreground">{day.activeRecoverySuggestion}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Rest Day.</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-1">General Cool-down:</h3>
              <p className="text-sm text-muted-foreground">{generatedPlan.coolDownSuggestion}</p>
            </div>
            <Separator />
            <Alert variant="default" className="bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700">
                <Dumbbell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-700 dark:text-amber-300">Important Disclaimer</AlertTitle>
                <AlertDescription className="text-amber-600 dark:text-amber-400 text-xs">{generatedPlan.disclaimer}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.print()}>
                <ExternalLink className="mr-2 h-4 w-4"/> Print or Save as PDF
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
