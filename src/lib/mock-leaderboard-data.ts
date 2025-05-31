
'use client';

// This utility is designed to run client-side for demo purposes.
// In a real app, this data would come from a backend.

export interface MockUser {
  id: string;
  username: string;
  points: number;
  monsterName: string;
  monsterImageUrl: string;
  monsterAiHint: string;
}

const coolAdjectives = ["Shadow", "Mystic", "Cosmic", "Quantum", "Rogue", "Silent", "Crimson", "Azure", "Golden", "Iron"];
const coolNouns = ["Striker", "Voyager", "Guardian", "Phantom", "Seeker", "Scribe", "Knight", "Dragon", "Wolf", "Sphinx"];
const monsterPrefixes = ["Gloom", "Spark", "Void", "Star", "Stone", "Iron", "Night", "Sun", "Crystal", "Dream"];
const monsterSuffixes = ["fang", "claw", "wing", "maw", "shell", "shard", "ling", "fiend", "sprite", "ghoul"];
const monsterImagePlaceholders = [
  { url: "https://placehold.co/40x40.png?text=M1", hint: "monster face" },
  { url: "https://placehold.co/40x40.png?text=M2", hint: "creature silhouette" },
  { url: "https://placehold.co/40x40.png?text=M3", hint: "glowing eyes" },
  { url: "https://placehold.co/40x40.png?text=M4", hint: "fantasy beast" },
  { url: "https://placehold.co/40x40.png?text=M5", hint: "dark entity" },
];

function generateRandomName(prefixes: string[], suffixes: string[]): string {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${suffix}${Math.floor(Math.random() * 900) + 100}`;
}

/**
 * Generates mock leaderboard data.
 * Simulates point distribution over ~6 months of activity.
 * Average points for "moderate" activity:
 * (e.g., 2 logs/day * 10 pts/log * 180 days = 3600 pts)
 * (e.g., 3 logs/day * 10 pts/log * 180 days = 5400 pts)
 * (e.g., 5 logs/day * 10 pts/log * 180 days = 9000 pts)
 */
export function generateMockLeaderboardData(count: number): MockUser[] {
  const users: MockUser[] = [];
  for (let i = 0; i < count; i++) {
    let points = 0;
    const activityLevel = Math.random();

    if (activityLevel < 0.02) { // Top 2% - Very High Activity (could be >15,000 for 6 months)
      points = Math.floor(Math.random() * 15000) + 15001; // 15,001 - 30,000
    } else if (activityLevel < 0.10) { // Next 8% - High Activity
      points = Math.floor(Math.random() * 7000) + 8001;    // 8,001 - 15,000
    } else if (activityLevel < 0.40) { // Next 30% - Medium-High Activity
      points = Math.floor(Math.random() * 5000) + 3001;    // 3,001 - 8,000
    } else if (activityLevel < 0.75) { // Next 35% - Medium-Low Activity
      points = Math.floor(Math.random() * 2500) + 501;     // 501 - 3,000
    } else { // Bottom 25% - Low Activity
      points = Math.floor(Math.random() * 490) + 10;       // 10 - 500
    }
    
    const placeholder = monsterImagePlaceholders[i % monsterImagePlaceholders.length];

    users.push({
      id: `user-${i + 1}`,
      username: generateRandomName(coolAdjectives, coolNouns),
      points: points,
      monsterName: generateRandomName(monsterPrefixes, monsterSuffixes),
      monsterImageUrl: placeholder.url,
      monsterAiHint: placeholder.hint,
    });
  }
  return users.sort((a, b) => b.points - a.points); // Ensure sorted for top N
}
