
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Target, Award, ListChecks } from "lucide-react";
import { Label } from '@/components/ui/label';

interface ProductEntry {
  id: string;
  name: string;
  notes?: string;
}

const POINTS_PER_PRODUCT = 10;
const PREMIUM_GOAL = 500;

export default function ProductTrackerPage() {
  const [workingProducts, setWorkingProducts] = useState<ProductEntry[]>([]);
  const [notWorkingProducts, setNotWorkingProducts] = useState<ProductEntry[]>([]);
  
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentProductNotes, setCurrentProductNotes] = useState('');
  
  const [pastProductName, setPastProductName] = useState('');
  const [pastProductNotes, setPastProductNotes] = useState('');
  
  const [userPoints, setUserPoints] = useState(0);
  const [goalReached, setGoalReached] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedWorkingProducts = localStorage.getItem('workingProducts');
    if (savedWorkingProducts) {
      setWorkingProducts(JSON.parse(savedWorkingProducts));
    }
    const savedNotWorkingProducts = localStorage.getItem('notWorkingProducts');
    if (savedNotWorkingProducts) {
      setNotWorkingProducts(JSON.parse(savedNotWorkingProducts));
    }
    const savedUserPoints = localStorage.getItem('userPoints');
    if (savedUserPoints) {
      const points = parseInt(savedUserPoints, 10);
      setUserPoints(points);
      if (points >= PREMIUM_GOAL) {
        setGoalReached(true);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('workingProducts', JSON.stringify(workingProducts));
  }, [workingProducts]);

  useEffect(() => {
    localStorage.setItem('notWorkingProducts', JSON.stringify(notWorkingProducts));
  }, [notWorkingProducts]);

  useEffect(() => {
    localStorage.setItem('userPoints', String(userPoints));
    if (userPoints >= PREMIUM_GOAL && !goalReached) {
      setGoalReached(true);
      // Potentially show a toast or modal here for reaching the goal
    }
  }, [userPoints, goalReached]);

  const addPoints = () => {
    if (!goalReached) {
      setUserPoints(prevPoints => prevPoints + POINTS_PER_PRODUCT);
    }
  };

  const handleAddWorkingProduct = () => {
    if (!currentProductName.trim()) return;
    const newProduct: ProductEntry = {
      id: Date.now().toString(),
      name: currentProductName.trim(),
      notes: currentProductNotes.trim(),
    };
    setWorkingProducts(prev => [newProduct, ...prev]);
    addPoints();
    setCurrentProductName('');
    setCurrentProductNotes('');
  };

  const handleRemoveWorkingProduct = (id: string) => {
    setWorkingProducts(prev => prev.filter(p => p.id !== id));
    // Note: Points are not deducted on removal to prevent gaming the system.
  };

  const handleAddNotWorkingProduct = () => {
    if (!pastProductName.trim()) return;
    const newProduct: ProductEntry = {
      id: Date.now().toString(),
      name: pastProductName.trim(),
      notes: pastProductNotes.trim(),
    };
    setNotWorkingProducts(prev => [newProduct, ...prev]);
    addPoints();
    setPastProductName('');
    setPastProductNotes('');
  };

  const handleRemoveNotWorkingProduct = (id: string) => {
    setNotWorkingProducts(prev => prev.filter(p => p.id !== id));
  };

  const progressPercentage = Math.min((userPoints / PREMIUM_GOAL) * 100, 100);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Target className="h-6 w-6 text-primary"/>Your Contribution Score</CardTitle>
          <CardDescription>Log products you've tried to earn points. Reach {PREMIUM_GOAL} points for a reward!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-foreground">Points: <span className="font-bold text-primary">{userPoints}</span> / {PREMIUM_GOAL}</p>
            {goalReached && <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"><Award className="h-4 w-4"/>Reward Unlocked!</Badge>}
          </div>
          <Progress value={progressPercentage} aria-label={`${progressPercentage}% towards premium reward`} />
          <p className="text-xs text-muted-foreground">Each product logged (working or not) earns {POINTS_PER_PRODUCT} points.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Currently Using & Working</CardTitle>
            <CardDescription>List products that are currently helping you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="current-product-name">Product Name</Label>
                <Input 
                  id="current-product-name"
                  value={currentProductName} 
                  onChange={(e) => setCurrentProductName(e.target.value)} 
                  placeholder="e.g., Specific Vitamin C Serum" 
                />
              </div>
              <div>
                <Label htmlFor="current-product-notes">Notes (Brand, Dosage, etc.)</Label>
                <Textarea 
                  id="current-product-notes"
                  value={currentProductNotes} 
                  onChange={(e) => setCurrentProductNotes(e.target.value)} 
                  placeholder="e.g., Brand X, 500mg daily" 
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <Button onClick={handleAddWorkingProduct} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Working Product
            </Button>
            <div className="space-y-3 pt-4 max-h-96 overflow-y-auto">
              {workingProducts.length === 0 && <p className="text-sm text-muted-foreground">No working products logged yet.</p>}
              {workingProducts.map(product => (
                <Card key={product.id} className="p-3 bg-card/60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      {product.notes && <p className="text-xs text-muted-foreground mt-1">{product.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveWorkingProduct(product.id)} aria-label="Remove product">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tried & Did Not Work</CardTitle>
            <CardDescription>List products that didn't provide the desired results for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="past-product-name">Product Name</Label>
                <Input 
                  id="past-product-name"
                  value={pastProductName} 
                  onChange={(e) => setPastProductName(e.target.value)} 
                  placeholder="e.g., Common Pain Reliever" 
                />
              </div>
              <div>
                <Label htmlFor="past-product-notes">Notes (Reason, Side Effects, etc.)</Label>
                <Textarea 
                  id="past-product-notes"
                  value={pastProductNotes} 
                  onChange={(e) => setPastProductNotes(e.target.value)} 
                  placeholder="e.g., Caused mild nausea" 
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <Button onClick={handleAddNotWorkingProduct} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Past Product
            </Button>
            <div className="space-y-3 pt-4 max-h-96 overflow-y-auto">
              {notWorkingProducts.length === 0 && <p className="text-sm text-muted-foreground">No past products logged yet.</p>}
              {notWorkingProducts.map(product => (
                <Card key={product.id} className="p-3 bg-card/60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground">{product.name}</h4>
                      {product.notes && <p className="text-xs text-muted-foreground mt-1">{product.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveNotWorkingProduct(product.id)} aria-label="Remove product">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

