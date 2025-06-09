'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, ShoppingCart, Lightbulb, AlertCircle, 
  Utensils, ArrowLeft, Printer, Download, ChefHat,
  Sun, Moon, Coffee, Apple, Clock, DollarSign
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from "next/image";

const AI_DIETICIAN_KEY = 'aiDietician';
const AI_DIET_PLAN_KEY = 'aiDietPlan';

interface AIDietician {
  name: string;
  imageUrl: string;
  personality: string;
  specialization: string;
  catchphrase: string;
  communicationStyle: string;
}

interface DietPlan {
  planName: string;
  duration: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  weeklySchedule: {
    [key: string]: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snack: string;
    };
  };
  shoppingList: string[];
  tips: string[];
  restrictions: string[];
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export default function DietPlanPage() {
  const router = useRouter();
  const [dietician, setDietician] = useState<AIDietician | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState('monday');

  useEffect(() => {
    const storedDietician = localStorage.getItem(AI_DIETICIAN_KEY);
    const storedDietPlan = localStorage.getItem(AI_DIET_PLAN_KEY);
    
    if (storedDietician) {
      setDietician(JSON.parse(storedDietician));
    }
    
    if (storedDietPlan) {
      setDietPlan(JSON.parse(storedDietPlan));
    } else if (storedDietician) {
      // If they have a dietician but no plan, redirect to create one
      router.push('/food-log/create-dietician');
    } else {
      // If they have neither, redirect to create dietician
      router.push('/food-log/create-dietician');
    }
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!dietPlan) return;
    
    const planText = `
${dietPlan.planName}
Duration: ${dietPlan.duration}
Created by: ${dietician?.name || 'Your AI Dietician'}

WEEKLY MEAL SCHEDULE
${daysOfWeek.map(day => `
${dayLabels[day].toUpperCase()}
Breakfast: ${dietPlan.weeklySchedule[day].breakfast}
Lunch: ${dietPlan.weeklySchedule[day].lunch}
Dinner: ${dietPlan.weeklySchedule[day].dinner}
Snack: ${dietPlan.weeklySchedule[day].snack}
`).join('\n')}

SHOPPING LIST
${dietPlan.shoppingList.join('\n')}

TIPS FOR SUCCESS
${dietPlan.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

FOODS TO AVOID
${dietPlan.restrictions.join('\n')}
`;

    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dietPlan.planName.replace(/\s+/g, '_')}_meal_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!dietPlan || !dietician) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your diet plan...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/food-log" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Image 
              src={dietician.imageUrl} 
              alt={dietician.name} 
              width={80} 
              height={80} 
              className="rounded-full border-2 border-primary"
            />
            <div>
              <CardTitle className="font-headline text-2xl">{dietPlan.planName}</CardTitle>
              <CardDescription>
                Created by {dietician.name} • {dietPlan.duration}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="meals">
            <Utensils className="h-4 w-4 mr-2" />
            All Meals
          </TabsTrigger>
          <TabsTrigger value="shopping">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shopping
          </TabsTrigger>
          <TabsTrigger value="tips">
            <Lightbulb className="h-4 w-4 mr-2" />
            Tips
          </TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="schedule">
          <div className="grid lg:grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map(day => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className="w-full"
              >
                {dayLabels[day]}
              </Button>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {dayLabels[selectedDay]}
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Day Schedule
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      Breakfast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{dietPlan.weeklySchedule[selectedDay].breakfast}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sun className="h-5 w-5 text-orange-500" />
                      Lunch
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{dietPlan.weeklySchedule[selectedDay].lunch}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Moon className="h-5 w-5 text-blue-500" />
                      Dinner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{dietPlan.weeklySchedule[selectedDay].dinner}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coffee className="h-5 w-5 text-purple-500" />
                      Snack
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{dietPlan.weeklySchedule[selectedDay].snack}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <Alert>
                <ChefHat className="h-4 w-4" />
                <AlertDescription>
                  Click on any meal in the Food Log to get the full recipe with Instacart-friendly ingredients!
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* All Meals Tab */}
        <TabsContent value="meals">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  Breakfast Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dietPlan.meals.breakfast.map((meal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Apple className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{meal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  Lunch Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dietPlan.meals.lunch.map((meal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Apple className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{meal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  Dinner Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dietPlan.meals.dinner.map((meal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Apple className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{meal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-purple-500" />
                  Snack Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dietPlan.meals.snacks.map((snack, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Apple className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{snack}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shopping List Tab */}
        <TabsContent value="shopping">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Shopping List</CardTitle>
              <CardDescription>
                All ingredients needed for your meal plan. These items are Instacart-friendly!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {dietPlan.shoppingList.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-accent/20">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Coming soon: Direct Instacart integration to add all items to your cart with one click!
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tips for Success from {dietician.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dietPlan.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Foods to Avoid or Minimize
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {dietPlan.restrictions.map((restriction, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-destructive rounded-full" />
                      <span className="text-sm">{restriction}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Actions */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/food-log">
                <Utensils className="mr-2 h-4 w-4" />
                Log Today's Meals
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/food-log/create-dietician">
                <ChefHat className="mr-2 h-4 w-4" />
                Update Diet Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}