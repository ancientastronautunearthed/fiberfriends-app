
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateMockLeaderboardData, type MockUser } from '@/lib/mock-leaderboard-data';
import { Crown, Award, Star, Trophy } from 'lucide-react';
import Image from 'next/image';

const TOP_N_USERS = 100;
const TOTAL_MOCK_USERS = 638;

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<MockUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating data fetching
    const data = generateMockLeaderboardData(TOTAL_MOCK_USERS);
    setLeaderboardData(data.slice(0, TOP_N_USERS));
    setIsLoading(false);
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Star className="h-5 w-5 text-orange-400" />;
    return <span className="text-sm font-medium">{rank}</span>;
  };

  const getRowClass = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 hover:bg-yellow-500/20";
    if (rank === 2) return "bg-slate-500/10 hover:bg-slate-500/20";
    if (rank === 3) return "bg-orange-500/10 hover:bg-orange-500/20";
    return "";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Trophy className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Community Champions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="font-headline text-3xl">Community Champions</CardTitle>
          <CardDescription>
            Top {TOP_N_USERS} contributors based on points earned from logging food, exercise, products, and other activities.
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
                <TableRow key={user.id} className={getRowClass(index + 1)}>
                  <TableCell className="text-center font-medium w-[80px]">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.monsterImageUrl} alt={user.monsterName} data-ai-hint={user.monsterAiHint} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{user.username}</p>
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
                <li>Engaging in the Doctor Forum and sharing stories (future).</li>
                <li>Answering your monster's riddles.</li>
                <li>And more as new features are added!</li>
            </ul>
            <p className="pt-2">The more you engage and contribute, the higher you'll climb the ranks!</p>
        </CardContent>
      </Card>
    </div>
  );
}
