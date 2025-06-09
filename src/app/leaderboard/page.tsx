'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Star, Trophy, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TOP_N_USERS = 100;

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  monsterName: string;
  monsterImageUrl: string;
  isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!db) {
        throw new Error('Firestore is not initialized');
      }

      // Fetch users ordered by points (descending)
      const usersQuery = query(
        collection(db, 'users'),
        where('points', '>', 0), // Only include users with points
        orderBy('points', 'desc'),
        limit(TOP_N_USERS)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const leaderboardUsers: LeaderboardUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Get the user's current monster data
        const monsterQuery = query(
          collection(db, 'monsters'),
          where('userId', '==', userDoc.id),
          where('generated', '==', true)
        );
        
        const monsterSnapshot = await getDocs(monsterQuery);
        let monsterData = null;
        
        if (!monsterSnapshot.empty) {
          monsterData = monsterSnapshot.docs[0].data();
        }

        // Only include users who have created a monster and have points
        if (monsterData && userData.points > 0) {
          leaderboardUsers.push({
            id: userDoc.id,
            username: userData.displayName || userData.email?.split('@')[0] || 'Anonymous User',
            points: userData.points || 0,
            monsterName: monsterData.name || 'Unnamed Monster',
            monsterImageUrl: monsterData.imageUrl || 'https://placehold.co/40x40.png?text=M',
            isCurrentUser: user?.uid === userDoc.id
          });
        }
      }

      setLeaderboardData(leaderboardUsers);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Star className="h-5 w-5 text-orange-400" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };

  const getRowClass = (rank: number, isCurrentUser?: boolean) => {
    let baseClass = "";
    if (rank === 1) baseClass = "bg-yellow-500/10 hover:bg-yellow-500/20";
    else if (rank === 2) baseClass = "bg-slate-500/10 hover:bg-slate-500/20";
    else if (rank === 3) baseClass = "bg-orange-500/10 hover:bg-orange-500/20";
    
    if (isCurrentUser) {
      baseClass += " ring-2 ring-primary ring-inset";
    }
    
    return baseClass;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Trophy className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Community Champions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={fetchLeaderboardData}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle className="font-headline text-2xl">Community Champions</CardTitle>
          <CardDescription>
            No champions yet! Be the first to earn points by logging activities.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Community Champions</CardTitle>
          <CardDescription>
            Top {leaderboardData.length} contributors based on points earned from logging food, exercise, products, and other activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Monster</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((user, index) => (
                <TableRow key={user.id} className={getRowClass(index + 1, user.isCurrentUser)}>
                  <TableCell className="text-center font-medium w-[80px]">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.monsterImageUrl} alt={user.monsterName} data-ai-hint="user monster" />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={`font-semibold text-foreground ${user.isCurrentUser ? 'text-primary' : ''}`}>
                          {user.username} {user.isCurrentUser && <span className="text-xs">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">{user.monsterName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{user.monsterName}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">{user.points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">How Points Are Earned</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1 text-muted-foreground">
          <p>Points are awarded for various contributions to the Fiber Friends community, such as:</p>
          <ul className="list-disc list-inside pl-4">
            <li>Logging food items and getting them graded by your monster.</li>
            <li>Logging exercises and their impact.</li>
            <li>Tracking products (working or not working) and their effects.</li>
            <li>Completing sleep logs and wellness activities.</li>
            <li>Answering your monster's riddles correctly.</li>
            <li>And more as new features are added!</li>
          </ul>
          <p className="pt-2">The more you engage and contribute, the higher you'll climb the ranks!</p>
        </CardContent>
      </Card>
    </div>
  );
}