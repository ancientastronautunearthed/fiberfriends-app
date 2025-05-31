
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Target, Award, ListChecks, ShieldCheck, Gem, Star } from "lucide-react";
import { Label } from '@/components/ui/label';

interface ProductEntry {
  id: string;
  name: string;
  notes?: string;
}

const POINTS_PER_PRODUCT = 10;

const TIERS = {
  NONE: { name: "Contributor", points: 0, icon: null, benefits: "Keep contributing to unlock rewards!" },
  BRONZE: { name: "Bronze Tier", points: 250, icon: Gem, benefits: "You've unlocked a 10% site-wide discount (including subscriptions)!" },
  SILVER: { name: "Silver Tier", points: 500, icon: Star, benefits: "10% site-wide discount + eligible for e-book rewards!" },
  GOLD: { name: "Gold Tier", points: 1000, icon: Award, benefits: "10% site-wide discount + FREE Premium Month!" },
};


export default function ProductTrackerPage() {
  const [workingProducts, setWorkingProducts] = useState<ProductEntry[]>([]);
  const [notWorkingProducts, setNotWorkingProducts] = useState<ProductEntry[]>([]);
  
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentProductNotes, setCurrentProductNotes] = useState('');
  
  const [pastProductName, setPastProductName] = useState('');
  const [pastProductNotes, setPastProductNotes] = useState('');
  
  const [userPoints, setUserPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState(TIERS.NONE);

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
    }
  }, []);

  // Update tier whenever userPoints change
  useEffect(() => {
    if (userPoints >= TIERS.GOLD.points) {
      setCurrentTier(TIERS.GOLD);
    } else if (userPoints >= TIERS.SILVER.points) {
      setCurrentTier(TIERS.SILVER);
    } else if (userPoints >= TIERS.BRONZE.points) {
      setCurrentTier(TIERS.BRONZE);
    } else {
      setCurrentTier(TIERS.NONE);
    }
  }, [userPoints]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('workingProducts', JSON.stringify(workingProducts));
  }, [workingProducts]);

  useEffect(() => {
    localStorage.setItem('notWorkingProducts', JSON.stringify(notWorkingProducts));
  }, [notWorkingProducts]);

  useEffect(() => {
    localStorage.setItem('userPoints', String(userPoints));
  }, [userPoints]);

  const addPoints = () => {
    // Allow points accumulation even if Gold tier is reached, for future potential tiers/leaderboards
    setUserPoints(prevPoints => prevPoints + POINTS_PER_PRODUCT);
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

  const nextTierPoints = () => {
    if (currentTier.points < TIERS.BRONZE.points) return TIERS.BRONZE.points;
    if (currentTier.points < TIERS.SILVER.points) return TIERS.SILVER.points;
    if (currentTier.points < TIERS.GOLD.points) return TIERS.GOLD.points;
    return TIERS.GOLD.points; // Max tier for now
  };
  
  const progressToNextTier = () => {
    if (currentTier === TIERS.GOLD) return 100; // Already at max tier
    const pointsForNext = nextTierPoints();
    const pointsForCurrent = currentTier.points;
    const neededForNext = pointsForNext - pointsForCurrent;
    const earnedTowardsNext = userPoints - pointsForCurrent;
    return Math.max(0, Math.min((earnedTowardsNext / neededForNext) * 100, 100));
  };


  return (
    <div className="space-y-8">
      <Card className="border-primary/50 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            {currentTier.icon ? <currentTier.icon className="h-7 w-7 text-primary" /> : <Target className="h-6 w-6 text-primary"/>}
            Your Contribution Score & Tier
          </CardTitle>
          <CardDescription>
            Log products and make other community contributions to earn points and unlock rewards. 
            Higher tiers grant benefits like site-wide discounts!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-accent/20 rounded-lg border border-accent">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
              <p className="text-lg font-semibold text-accent-foreground">Current Tier: <span className="text-primary">{currentTier.name}</span></p>
              {currentTier.icon && <currentTier.icon className="h-8 w-8 text-primary hidden sm:block" />}
            </div>
            <p className="text-sm text-accent-foreground/80 mb-3">{currentTier.benefits}</p>
            {currentTier.points >= TIERS.BRONZE.points && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <ShieldCheck className="h-5 w-5"/>
                    <span>10% Site-Wide Discount Active!</span>
                </div>
            )}
          </div>

          <div className="space-y-1">
             <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium text-foreground">Total Points: <span className="font-bold text-primary text-lg">{userPoints}</span></p>
                {currentTier !== TIERS.GOLD && <p className="text-xs text-muted-foreground">Next Tier: {nextTierPoints()} Points</p>}
            </div>
            <Progress value={progressToNextTier()} aria-label={`${progressToNextTier()}% towards next tier`} className="h-3"/>
            {currentTier !== TIERS.GOLD ? 
                <p className="text-xs text-muted-foreground">Progress towards {TIERS.BRONZE.points > currentTier.points ? TIERS.BRONZE.name : TIERS.SILVER.points > currentTier.points ? TIERS.SILVER.name : TIERS.GOLD.name}.</p>
                : <p className="text-xs text-green-500">You've reached the highest tier! Congratulations!</p>
            }
          </div>
          <p className="text-xs text-muted-foreground pt-2">Each product logged (working or not) earns {POINTS_PER_PRODUCT} points. Other contributions (forum posts, journal entries) also count towards your score when logged here.</p>
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

    