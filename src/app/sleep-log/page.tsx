'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, Sparkles, Skull, BedDouble, PlusCircle, Trash2, Clock } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, differenceInMinutes, parse, parseISO } from "date-fns";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const POINTS_PER_SLEEP_LOG = 5;
const MONSTER_DEATH_THRESHOLD = -50;
const MAX_MONSTER_HEALTH = 200;
const INITIAL_HEALTH_MIN = 80;
const INITIAL_HEALTH_MAX = 100;
const MIN_RECOVERY = 10;
const MAX_RECOVERY = 20;

interface SleepLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timeToBed: string; // HH:mm
  timeWokeUp: string; // HH:mm
  sleepDurationMinutes?: number;
  sleepQuality: number; // 1-5
  notes?: string;
  loggedAt: Timestamp;
}

interface MonsterData {
  id: string;
  name: string;
  imageUrl: string;
  health: number;
  lastRecoveryDate?: string;
  generated: boolean;
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Sleep Sanctuary...</p>
    </div>
  );
}

export default function SleepLogPage() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMonsterActuallyGenerated, setIsMonsterActuallyGenerated] = useState(false);
  const [monster, setMonster] = useState<MonsterData | null>(null);
  const [sleepLogEntries, setSleepLogEntries] = useState<SleepLogEntry[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeToBed, setTimeToBed] = useState('');
  const [timeWokeUp, setTimeWokeUp] = useState('');
  const [sleepQuality, setSleepQuality] = useState<string>('3');
  const [sleepNotes, setSleepNotes] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const performNightlyRecovery = useCallback(async () => {
    if (!user?.uid || !monster || !db) return;
    
    const lastRecoveryDate = monster.lastRecoveryDate;
    const todayDateStr = new Date().toDateString();
    
    if (lastRecoveryDate !== todayDateStr && monster.health > MONSTER_DEATH_THRESHOLD) {
      const recoveryAmount = Math.floor(Math.random() * (MAX_RECOVERY - MIN_RECOVERY + 1)) + MIN_RECOVERY;
      const newHealth = Math.min(monster.health + recoveryAmount, MAX_MONSTER_HEALTH);

      try {
        const monsterRef = doc(db, 'monsters', monster.id);
        await updateDoc(monsterRef, {
          health: newHealth,
          lastRecoveryDate: todayDateStr
        });

        setMonster(prev => prev ? { ...prev, health: newHealth, lastRecoveryDate: todayDateStr } : null);

        toast({
          title: `${monster.name} Yawns`,
          description: `During the night, I felt a surge of ${recoveryAmount} health. Now at ${newHealth.toFixed(1)}%.`,
          duration: 7000
        });
      } catch (error) {
        console.error('Error performing nightly recovery:', error);
      }
    }
  }, [user, monster, toast]);

  const fetchMonsterData = useCallback(async () => {
    if (!user?.uid || !db) return;

    try {
      const monstersQuery = query(
        collection(db, 'monsters'),
        where('userId', '==', user.uid),
        where('generated', '==', true)
      );
      
      const monsterSnapshot = await getDocs(monstersQuery);
      
      if (!monsterSnapshot.empty) {
        const monsterDoc = monsterSnapshot.docs[0];
        const monsterData = monsterDoc.data() as Omit<MonsterData, 'id'>;
        
        const monster: MonsterData = {
          id: monsterDoc.id,
          ...monsterData
        };
        
        setMonster(monster);
        setIsMonsterActuallyGenerated(true);

        // Initialize health if not set
        if (monster.health === undefined || monster.health === null) {
          const initialHealth = Math.floor(Math.random() * (INITIAL_HEALTH_MAX - INITIAL_HEALTH_MIN + 1)) + INITIAL_HEALTH_MIN;
          const monsterRef = doc(db, 'monsters', monster.id);
          await updateDoc(monsterRef, { health: initialHealth });
          setMonster(prev => prev ? { ...prev, health: initialHealth } : null);
        }
      } else {
        setIsMonsterActuallyGenerated(false);
      }
    } catch (error) {
      console.error('Error fetching monster data:', error);
      setIsMonsterActuallyGenerated(false);
    }
  }, [user]);

  const fetchSleepLogEntries = useCallback(async () => {
    if (!user?.uid || !db) return;

    try {
      const sleepLogsQuery = query(
        collection(db, 'sleepLogs'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(50)
      );
      
      const sleepLogsSnapshot = await getDocs(sleepLogsQuery);
      const entries: SleepLogEntry[] = [];
      
      sleepLogsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          date: data.date,
          timeToBed: data.timeToBed,
          timeWokeUp: data.timeWokeUp,
          sleepDurationMinutes: data.sleepDurationMinutes,
          sleepQuality: data.sleepQuality,
          notes: data.notes,
          loggedAt: data.loggedAt
        });
      });
      
      setSleepLogEntries(entries);
    } catch (error) {
      console.error('Error fetching sleep log entries:', error);
    }
  }, [user]);

  useEffect(() => {
    setIsClientReady(true);
    if (user?.uid) {
      fetchMonsterData();
      fetchSleepLogEntries();
    }
  }, [user, fetchMonsterData, fetchSleepLogEntries]);

  useEffect(() => {
    if (isMonsterActuallyGenerated && monster) {
      performNightlyRecovery();
    }
  }, [isMonsterActuallyGenerated, monster, performNightlyRecovery]);

  const checkMonsterDeath = useCallback(async (currentHealth: number, cause: string) => {
    if (currentHealth <= MONSTER_DEATH_THRESHOLD && monster && user?.uid && db) {
      try {
        // Add to tomb
        await addDoc(collection(db, 'tomb'), {
          userId: user.uid,
          name: monster.name,
          imageUrl: monster.imageUrl,
          cause,
          diedAt: serverTimestamp()
        });

        // Delete current monster
        const monsterRef = doc(db, 'monsters', monster.id);
        await deleteDoc(monsterRef);

        setMonster(null);
        setIsMonsterActuallyGenerated(false);

        toast({
          title: `${monster.name} Fades Away...`,
          description: `Overcome by ${cause}, its dark energy wanes. Current health: ${currentHealth.toFixed(1)}%.`,
          variant: "destructive",
          duration: Number.MAX_SAFE_INTEGER
        });

        router.push('/create-monster');
        return true;
      } catch (error) {
        console.error('Error handling monster death:', error);
      }
    }
    return false;
  }, [monster, user, router, toast]);

  const addPoints = async (points: number) => {
    if (!user?.uid || !db) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: increment(points)
      });
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const calculateSleepDuration = (bedTimeStr: string, wokeUpTimeStr: string, sleepDate: Date): number | undefined => {
    if (!bedTimeStr || !wokeUpTimeStr) return undefined;

    try {
      const bedDateTime = parse(bedTimeStr, "HH:mm", sleepDate);
      let wokeUpDateTime = parse(wokeUpTimeStr, "HH:mm", sleepDate);

      if (wokeUpDateTime < bedDateTime) {
        wokeUpDateTime = new Date(wokeUpDateTime.setDate(wokeUpDateTime.getDate() + 1));
      }
      
      const durationMins = differenceInMinutes(wokeUpDateTime, bedDateTime);
      return durationMins > 0 ? durationMins : undefined;
    } catch (e) {
      console.error("Error parsing sleep times:", e);
      return undefined;
    }
  };
  
  const handleLogSleep = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDate || !timeToBed || !timeWokeUp || !sleepQuality) {
      setError("Please fill in all required sleep details.");
      return;
    }
    if (!isMonsterActuallyGenerated || !user?.uid || !db) {
      setError("Please create your monster first to log sleep.");
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const durationMinutes = calculateSleepDuration(timeToBed, timeWokeUp, selectedDate);

      const newEntry = {
        userId: user.uid,
        date: format(selectedDate, "yyyy-MM-dd"),
        timeToBed,
        timeWokeUp,
        sleepDurationMinutes: durationMinutes,
        sleepQuality: parseInt(sleepQuality, 10),
        notes: sleepNotes.trim() || undefined,
        loggedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'sleepLogs'), newEntry);
      await addPoints(POINTS_PER_SLEEP_LOG);

      toast({
        title: "Sleep Logged!",
        description: `Your sleep for ${format(selectedDate, "PPP")} has been recorded. You earned ${POINTS_PER_SLEEP_LOG} points.`,
      });

      // Reset form
      setSelectedDate(new Date());
      setTimeToBed('');
      setTimeWokeUp('');
      setSleepQuality('3');
      setSleepNotes('');

      // Refresh entries
      fetchSleepLogEntries();
    } catch (error) {
      console.error('Error logging sleep:', error);
      setError('Failed to log sleep entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!db) return;

    try {
      const entryRef = doc(db, 'sleepLogs', id);
      await deleteDoc(entryRef);
      
      setSleepLogEntries(prev => prev.filter(entry => entry.id !== id));
      toast({ title: "Sleep Entry Removed", variant: "default" });
    } catch (error) {
      console.error('Error deleting sleep entry:', error);
      toast({ title: "Failed to delete entry", variant: "destructive" });
    }
  };
  
  const getHealthBarValue = () => {
    if (!monster) return 0;
    const range = MAX_MONSTER_HEALTH - MONSTER_DEATH_THRESHOLD;
    const currentValInRange = monster.health - MONSTER_DEATH_THRESHOLD;
    return Math.max(0, Math.min((currentValInRange / range) * 100, 100));
  };

  const formatDuration = (minutes?: number) => {
    if (minutes === undefined || minutes < 0) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const sleepQualityMap: {[key: number]: {label: string, color: string}} = {
    1: { label: 'Very Poor', color: 'text-red-500' },
    2: { label: 'Poor', color: 'text-orange-500' },
    3: { label: 'Neutral', color: 'text-yellow-500' },
    4: { label: 'Good', color: 'text-lime-500' },
    5: { label: 'Excellent', color: 'text-green-500' },
  };

  if (!isClientReady) {
    return <LoadingPlaceholder />;
  }

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Info className="h-6 w-6 text-primary"/>
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Please log in to track your sleep.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isMonsterActuallyGenerated) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info />Monster Required</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground mb-4">Your Nemesis must be summoned before you can log your slumber.</p>
          <Button asChild className="w-full"><Link href="/create-monster"><Sparkles className="mr-2 h-4 w-4"/>Summon Your Nemesis</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {monster && (
          <Card>
            <CardHeader className="items-center text-center">
              <Link href="/my-profile">
                <Image src={monster.imageUrl} alt={monster.name} width={100} height={100} className="rounded-full border-2 border-primary shadow-md mx-auto cursor-pointer hover:opacity-80 transition-opacity" data-ai-hint="generated monster"/>
              </Link>
              <CardTitle className="font-headline text-xl pt-2">{monster.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Label htmlFor="monster-health-sleep" className="text-sm font-medium block mb-1">Nemesis Health: {monster.health.toFixed(1)}%</Label>
              <Progress id="monster-health-sleep" value={getHealthBarValue()} className="w-full h-2.5" />
              <p className="text-xs text-muted-foreground mt-1">Consistent sleep might just tire it out... or not.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BedDouble className="h-6 w-6 text-primary"/>Log Your Slumber</CardTitle>
            <CardDescription>Track your sleep patterns. Good rest is key in your ongoing battle!</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogSleep}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sleep-date-picker">Date of Sleep</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="sleep-date-picker"
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time-to-bed">Time Went to Bed</Label>
                  <Input id="time-to-bed" type="time" value={timeToBed} onChange={(e) => setTimeToBed(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="time-woke-up">Time Woke Up</Label>
                  <Input id="time-woke-up" type="time" value={timeWokeUp} onChange={(e) => setTimeWokeUp(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="sleep-quality">Sleep Quality</Label>
                <Select value={sleepQuality} onValueChange={setSleepQuality} required>
                  <SelectTrigger id="sleep-quality">
                    <SelectValue placeholder="Rate your sleep quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(q => (
                      <SelectItem key={q} value={String(q)}>{q} - {sleepQualityMap[q]?.label || `Quality ${q}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sleep-notes">Notes (Dreams, Interruptions, etc.)</Label>
                <Textarea id="sleep-notes" value={sleepNotes} onChange={(e) => setSleepNotes(e.target.value)} placeholder="e.g., Woke up once, dreamt of flying carpets..." />
              </div>
              {error && <Alert variant="destructive"><AlertTitle>Input Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isLoading ? 'Logging...' : 'Log Sleep Entry'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Sleep Logs</CardTitle>
            <CardDescription>Your last 50 sleep entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {sleepLogEntries.length === 0 && <p className="text-sm text-muted-foreground">No sleep logged yet. Rest is a weapon!</p>}
            {sleepLogEntries.map(entry => (
              <Card key={entry.id} className="p-3 bg-card/60">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{format(new Date(entry.date + 'T00:00:00'), "PPP")}</h4>
                    <p className="text-xs text-muted-foreground">
                      Bed: {entry.timeToBed} | Woke: {entry.timeWokeUp}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.sleepDurationMinutes !== undefined && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDuration(entry.sleepDurationMinutes)}
                        </Badge>
                      )}
                      <Badge className={cn("text-white", sleepQualityMap[entry.sleepQuality]?.color.replace('text-', 'bg-').replace('-500', '-600'))}>
                        Quality: {sleepQualityMap[entry.sleepQuality]?.label || entry.sleepQuality}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)} aria-label="Delete sleep entry" className="h-6 w-6 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {entry.notes && <p className="text-sm text-foreground/80 mt-1.5 pt-1.5 border-t border-dashed">{entry.notes}</p>}
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}