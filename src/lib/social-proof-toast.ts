
"use client";

import { toast } from '@/hooks/use-toast';
import { Award, Zap, TrendingUp } from 'lucide-react';

const mockUsernames = [
  "StarlightSeeker", 
  "FiberFighterX", 
  "ResilientSoul", 
  "QuantumHealer", 
  "SymptomSlayer77", 
  "BioHackerZen", 
  "ChronoWarrior",
  "WellnessGuru23",
  "DataDrivenUser",
  "InsightfulOne"
];

// Function to randomly decide if a toast should be shown for non-milestone events
function shouldShowRandomSocialProof(): boolean {
  return Math.random() < 0.15; // 15% chance
}

/**
 * Shows a social proof toast notification.
 * @param achievementDescription - Describes the achievement, e.g., "sharing product insights", "7-day exercise streak".
 * @param pointsAwarded - Optional. If provided, includes points in the message.
 * @param isMilestone - Optional. If true, the toast is more likely to show.
 */
export function showSocialProofToast(
  achievementDescription: string,
  pointsAwarded?: number,
  isMilestone: boolean = false
) {
  if (!isMilestone && !shouldShowRandomSocialProof()) {
    return;
  }

  const randomUsername = mockUsernames[Math.floor(Math.random() * mockUsernames.length)];
  let message: string;
  let title = "Community Achievement!";
  let icon = Award;

  if (pointsAwarded) {
    message = `${randomUsername} +${pointsAwarded} points! For ${achievementDescription}.`;
    icon = Zap; // Using Zap for points
  } else {
    message = `${randomUsername} achieved: ${achievementDescription}!`;
    icon = TrendingUp; // Using TrendingUp for general achievements/streaks
  }

  toast({
    title: (
      <div className="flex items-center gap-2">
        <icon className="h-5 w-5 text-primary" />
        <span>{title}</span>
      </div>
    ),
    description: message,
    duration: 6000, // Show for 6 seconds
  });
}
