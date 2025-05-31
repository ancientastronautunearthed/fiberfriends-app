
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Target, Award, ListChecks, ShieldCheck, Gem, Star, Info, Sparkles, Skull, HeartPulse, HelpCircle, Loader2 } from "lucide-react";
import { Label } from '@/components/ui/label';
import { gradeProductEffectAction } from './actions';
import type { ProductEffectGradingOutput } from '@/ai/flows/product-effect-grading-flow';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";


interface ProductEntryClient extends ProductEffectGradingOutput {
  id: string;
  clientNotes?: string; 
  loggedAt: string;
  isGraded: boolean;
}

const POINTS_PER_PRODUCT = 10;

const TIERS = {
  NONE: { name: "Contributor", points: 0, icon: null, benefits: "Keep contributing to unlock rewards!" },
  BRONZE: { name: "Bronze Tier", points: 250, icon: Gem, benefits: "You've unlocked a 10% site-wide discount (including subscriptions)!" },
  SILVER: { name: "Silver Tier", points: 500, icon: Star, benefits: "10% site-wide discount + eligible for e-book rewards!" },
  GOLD: { name: "Gold Tier", points: 1000, icon: Award, benefits: "10% site-wide discount + FREE Premium Month!" },
};

const MONSTER_IMAGE_KEY = 'morgellonMonsterImageUrl';
const MONSTER_NAME_KEY = 'morgellonMonsterName';
const MONSTER_HEALTH_KEY = 'morgellonMonsterHealth';
const MONSTER_GENERATED_KEY = 'morgellonMonsterGenerated';
const MONSTER_TOMB_KEY = 'morgellonMonsterTomb';
const WORKING_PRODUCTS_KEY = 'workingProducts';
const NOT_WORKING_PRODUCTS_KEY = 'notWorkingProducts';
const USER_POINTS_KEY = 'userPoints';
const MONSTER_LAST_RECOVERY_DATE_KEY = 'monsterLastRecoveryDate';


const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

interface TombEntry {
  name: string;
  imageUrl: string;
  diedAt: string;
}


export default function ProductTrackerPage() {
  const [workingProducts, setWorkingProducts] = useState<ProductEntryClient[]>([]);
  const [notWorkingProducts, setNotWorkingProducts] = useState<ProductEntryClient[]>([]);
  
  const [currentProductName, setCurrentProductName] = useState('');
  const [currentProductNotes, setCurrentProductNotes] = useState('');
  
  const [pastProductName, setPastProductName] = useState('');
  const [pastProductNotes, setPastProductNotes] = useState('');
  
  const [userPoints, setUserPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState(TIERS.NONE);

  const [isGradingProduct, startGradingProductTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [monsterImageUrl, setMonsterImageUrl] = useState<string | null>(null);
  const [monsterName, setMonsterName] = useState<string | null>(null);
  const [monsterHealth, setMonsterHealth] = useState<number | null>(null);
  const [showDamageEffect, setShowDamageEffect] = useState(false);

  const performNightlyRecovery = useCallback(() => {
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);
    if (monsterGenerated !== 'true') return;

    const storedName = localStorage.getItem(MONSTER_NAME_KEY);
    const storedHealthStr = localStorage.getItem(MONSTER_HEALTH_KEY);
    if (!storedHealthStr || !storedName) return;
    
    let currentHealthVal = parseFloat(storedHealthStr);
    if (isNaN(currentHealthVal) || currentHealthVal <= MONSTER_DEATH_THRESHOLD) return;

    const lastRecoveryDate = localStorage.getItem(MONSTER_LAST_RECOVERY_DATE_KEY);
    const todayDateStr = new Date().toDateString();

    if (lastRecoveryDate !== todayDateStr) {
      const recoveryAmount = Math.floor(Math.random() * (MAX_RECOVERY - MIN_RECOVERY + 1)) + MIN_RECOVERY;
      const newHealth = Math.min(currentHealthVal + recoveryAmount, MAX_MONSTER_HEALTH);
      
      setMonsterHealth(newHealth); 
      localStorage.setItem(MONSTER_HEALTH_KEY, String(newHealth));
      localStorage.setItem(MONSTER_LAST_RECOVERY_DATE_KEY, todayDateStr);
      
      toast({
        title: `${storedName} Stirs...`,
        description: `Heh. While you slept, I regained ${recoveryAmount} health. I'm now at ${newHealth.toFixed(1)}%.`,
        variant: "default",
        duration: 7000,
      });
    }
  }, [toast]);

  useEffect(() => {
    const storedMonsterImage = localStorage.getItem(MONSTER_IMAGE_KEY);
    const storedMonsterName = localStorage.getItem(MONSTER_NAME_KEY);
    const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY);

    if (monsterGenerated === 'true' && storedMonsterImage && storedMonsterName) {
      setMonsterImageUrl(storedMonsterImage);
      setMonsterName(storedMonsterName);
      const storedHealth = localStorage.getItem(MONSTER_HEALTH_KEY);
      if (storedHealth) {
        setMonsterHealth(parseFloat(storedHealth));
      } else {
        const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
        setMonsterHealth(initialHealth);
        localStorage.setItem(MONSTER_HEALTH_KEY, String(initialHealth));
      }
       performNightlyRecovery();
    }

    const savedWorkingProducts = localStorage.getItem(WORKING_PRODUCTS_KEY);
    if (savedWorkingProducts) setWorkingProducts(JSON.parse(savedWorkingProducts));
    
    const savedNotWorkingProducts = localStorage.getItem(NOT_WORKING_PRODUCTS_KEY);
    if (savedNotWorkingProducts) setNotWorkingProducts(JSON.parse(savedNotWorkingProducts));
    
    const savedUserPoints = localStorage.getItem(USER_POINTS_KEY);
    if (savedUserPoints) setUserPoints(parseInt(savedUserPoints, 10));

  }, [performNightlyRecovery]);

  useEffect(() => {
    if (monsterHealth !== null && localStorage.getItem(MONSTER_GENERATED_KEY) === 'true' && monsterName) {
      localStorage.setItem(MONSTER_HEALTH_KEY, String(monsterHealth));
      checkMonsterDeath(monsterHealth, "its own frail constitution"); // Default cause
    }
  }, [monsterHealth, monsterName]);

  useEffect(() => { localStorage.setItem(WORKING_PRODUCTS_KEY, JSON.stringify(workingProducts)); }, [workingProducts]);
  useEffect(() => { localStorage.setItem(NOT_WORKING_PRODUCTS_KEY, JSON.stringify(notWorkingProducts)); }, [notWorkingProducts]);
  useEffect(() => { localStorage.setItem(USER_POINTS_KEY, String(userPoints)); }, [userPoints]);

  useEffect(() => {
    if (userPoints >= TIERS.GOLD.points) setCurrentTier(TIERS.GOLD);
    else if (userPoints >= TIERS.SILVER.points) setCurrentTier(TIERS.SILVER);
    else if (userPoints >= TIERS.BRONZE.points) setCurrentTier(TIERS.BRONZE);
    else setCurrentTier(TIERS.NONE);
  }, [userPoints]);


  const addPoints = () => setUserPoints(prevPoints => prevPoints + POINTS_PER_PRODUCT);

  const handleAddWorkingProduct = () => {
    if (!currentProductName.trim() || !monsterName) return;
    const tempId = Date.now().toString();
    const newProductPending: ProductEntryClient = {
      id: tempId,
      productName: currentProductName.trim(),
      clientNotes: currentProductNotes.trim(),
      loggedAt: new Date().toISOString(),
      benefitScore: 0, 
      reasoning: "Awaiting assessment...",
      isGraded: false,
    };
    setWorkingProducts(prev => [newProductPending, ...prev]);
    
    startGradingProductTransition(async () => {
      try {
        const aiResult = await gradeProductEffectAction({ 
          productName: newProductPending.productName, 
          notes: newProductPending.clientNotes 
        });
        setWorkingProducts(prev => prev.map(p => p.id === tempId ? {
          ...p,
          benefitScore: aiResult.benefitScore,
          reasoning: aiResult.reasoning,
          productName: aiResult.productName, 
          isGraded: true,
        } : p));
        addPoints();
        toast({
          title: `AI Analysis: ${aiResult.productName}`,
          description: `It has a ${aiResult.benefitScore}/5 benefit. ${monsterName} scoffs: 'As if I'd let that weaken me! ${aiResult.reasoning.substring(0,70)}...'`,
          duration: Number.MAX_SAFE_INTEGER
        });
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "AI grading failed.";
        setWorkingProducts(prev => prev.filter(p => p.id !== tempId)); 
        toast({ 
            title: "Grading Error", 
            description: `${monsterName} cackles: 'The AI couldn't handle assessing ${newProductPending.productName}! Pathetic! Error: ${errorMsg}'`, 
            variant: "destructive", 
            duration: Number.MAX_SAFE_INTEGER 
        });
      }
    });
    setCurrentProductName('');
    setCurrentProductNotes('');
  };

  const handleRemoveWorkingProduct = (id: string) => {
    setWorkingProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddNotWorkingProduct = () => {
    if (!pastProductName.trim()) return;
    const newProduct: ProductEntryClient = {
      id: Date.now().toString(),
      productName: pastProductName.trim(),
      clientNotes: pastProductNotes.trim(),
      loggedAt: new Date().toISOString(),
      benefitScore: 0, 
      reasoning: 'User marked as "Did not work or had adverse effects".', 
      isGraded: true, 
    };
    setNotWorkingProducts(prev => [newProduct, ...prev]);
    addPoints();
    setPastProductName('');
    setPastProductNotes('');
  };

  const handleRemoveNotWorkingProduct = (id: string) => {
    setNotWorkingProducts(prev => prev.filter(p => p.id !== id));
  };

  const checkMonsterDeath = (currentHealth: number, cause: string) => {
    if (currentHealth <= MONSTER_DEATH_THRESHOLD && monsterName && monsterImageUrl) {
       const tomb: TombEntry[] = JSON.parse(localStorage.getItem(MONSTER_TOMB_KEY) || '[]');
       tomb.unshift({ name: monsterName, imageUrl: monsterImageUrl, diedAt: new Date().toISOString() });
       localStorage.setItem(MONSTER_TOMB_KEY, JSON.stringify(tomb.slice(0, 50)));
       localStorage.removeItem(MONSTER_IMAGE_KEY);
       localStorage.removeItem(MONSTER_NAME_KEY);
       localStorage.removeItem(MONSTER_HEALTH_KEY);
       localStorage.removeItem(MONSTER_GENERATED_KEY);
       setMonsterImageUrl(null); setMonsterName(null); setMonsterHealth(null);
       toast({
         title: `${monsterName} Has Perished!`,
         description: `Its reign of internal terror ends, falling to ${currentHealth.toFixed(1)}% health due to ${cause}. A new shadow will soon take its place... Create it now!`,
         variant: "destructive", duration: Number.MAX_SAFE_INTEGER
       });
       router.push('/create-monster');
       return true;
     }
     return false;
   };

  const handleUseProduct = (product: ProductEntryClient) => {
    if (!monsterGenerated || monsterHealth === null || !product.isGraded || !monsterName) return;
    
    const healthBefore = monsterHealth;
    let newHealth = healthBefore - product.benefitScore; 
    newHealth = Math.min(MAX_MONSTER_HEALTH, newHealth);

    setMonsterHealth(newHealth);
    setShowDamageEffect(true);
    setTimeout(() => setShowDamageEffect(false), 700);

    if (!checkMonsterDeath(newHealth, product.productName)) {
      toast({
        title: `${monsterName} screeches!`,
        description: `That wretched ${product.productName}! My health plummets to ${newHealth.toFixed(1)}% (-${product.benefitScore.toFixed(1)}%)! Its supposed benefit is just a curse.`,
        variant: "default", // Or warning
        duration: Number.MAX_SAFE_INTEGER,
      });
    }
  };
  
  const monsterGenerated = localStorage.getItem(MONSTER_GENERATED_KEY) === 'true';

  const nextTierPoints = () => {
    if (currentTier.points < TIERS.BRONZE.points) return TIERS.BRONZE.points;
    if (currentTier.points < TIERS.SILVER.points) return TIERS.SILVER.points;
    if (currentTier.points < TIERS.GOLD.points) return TIERS.GOLD.points;
    return TIERS.GOLD.points; 
  };
  
  const progressToNextTier = () => {
    if (currentTier === TIERS.GOLD) return 100;
    const pointsForNext = nextTierPoints();
    const pointsForCurrent = currentTier.points;
    const neededForNext = pointsForNext - pointsForCurrent;
    const earnedTowardsNext = userPoints - pointsForCurrent;
    return Math.max(0, Math.min((earnedTowardsNext / neededForNext) * 100, 100));
  };
  
  const getHealthBarValue = () => {
      if (monsterHealth === null) return 0;
      const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
      const currentValInRange = monsterHealth - MONSTER_DEATH_THRESHOLD;
      return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  }

  return (
    <TooltipProvider>
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
          <p className="text-xs text-muted-foreground pt-2">Each product logged (working or not) earns {POINTS_PER_PRODUCT} points.</p>
        </CardContent>
      </Card>

      {monsterGenerated && monsterName && monsterImageUrl && monsterHealth !== null && (
        <Card className={cn("lg:col-span-1", showDamageEffect && 'animate-damage-flash')}>
          <CardHeader className="items-center text-center">
            <Link href="/my-profile">
                <Image src={monsterImageUrl} alt={monsterName} width={100} height={100} className="rounded-full border-2 border-primary shadow-md mx-auto cursor-pointer hover:opacity-80 transition-opacity" data-ai-hint="generated monster"/>
            </Link>
            <CardTitle className="font-headline text-xl pt-2">{monsterName}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Label htmlFor="monster-health-progress" className="text-sm font-medium block mb-1">
              Monster Health: {monsterHealth.toFixed(1)}%
            </Label>
            <Progress id="monster-health-progress" value={getHealthBarValue()} className="w-full h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">Dies at {MONSTER_DEATH_THRESHOLD}%, Max: {MAX_MONSTER_HEALTH}%</p>
          </CardContent>
        </Card>
      )}
      {!monsterGenerated && (
         <Card className="p-4 bg-muted/50 text-center">
            <Info className="mx-auto h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-md mb-1">No Active Monster</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">Create a monster to use products and see their health impact.</p>
            <Button asChild size="sm">
                <Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Create Monster</Link>
            </Button>
        </Card>
      )}


      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Currently Using & Working</CardTitle>
            <CardDescription>List products that help. AI will grade their benefit (1-5 score). Using a product reduces monster health by its score.</CardDescription>
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
                  disabled={isGradingProduct}
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
                  disabled={isGradingProduct}
                />
              </div>
            </div>
            <Button onClick={handleAddWorkingProduct} className="w-full sm:w-auto" disabled={isGradingProduct || !currentProductName.trim()}>
              {isGradingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isGradingProduct ? `Asking ${monsterName || 'the AI'} about ${currentProductName}...` : 'Add & Grade Working Product'}
            </Button>
            <div className="space-y-3 pt-4 max-h-96 overflow-y-auto">
              {workingProducts.length === 0 && <p className="text-sm text-muted-foreground">No working products logged yet.</p>}
              {workingProducts.map(product => (
                <Card key={product.id} className="p-3 bg-card/60">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{product.productName}</h4>
                      {product.clientNotes && <p className="text-xs text-muted-foreground mt-0.5">{product.clientNotes}</p>}
                       <div className="text-xs mt-1">
                        {product.isGraded ? (
                            <div className="flex items-center gap-1">
                                <Badge variant="default">Benefit: {product.benefitScore}/5</Badge>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground"/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        <p className="text-xs font-medium">{monsterName || 'AI'} Reasoning:</p>
                                        <p className="text-xs">{product.reasoning}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <Badge variant="outline" className="animate-pulse">Grading by AI...</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveWorkingProduct(product.id)} aria-label="Remove product" className="h-7 w-7">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        {monsterGenerated && product.isGraded && (
                            <Button size="sm" variant="outline" onClick={() => handleUseProduct(product)} className="text-xs h-7 px-2" disabled={monsterHealth === null || monsterHealth <= MONSTER_DEATH_THRESHOLD}>
                                <HeartPulse className="mr-1 h-3 w-3"/> Use
                            </Button>
                        )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tried & Did Not Work</CardTitle>
            <CardDescription>List products that didn't help or had adverse effects.</CardDescription>
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
            <Button onClick={handleAddNotWorkingProduct} className="w-full sm:w-auto" disabled={!pastProductName.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Past Product
            </Button>
            <div className="space-y-3 pt-4 max-h-96 overflow-y-auto">
              {notWorkingProducts.length === 0 && <p className="text-sm text-muted-foreground">No past products logged yet.</p>}
              {notWorkingProducts.map(product => (
                <Card key={product.id} className="p-3 bg-card/60">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground">{product.productName}</h4>
                      {product.clientNotes && <p className="text-xs text-muted-foreground mt-1">{product.clientNotes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveNotWorkingProduct(product.id)} aria-label="Remove product" className="h-7 w-7">
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
    </TooltipProvider>
  );
}

