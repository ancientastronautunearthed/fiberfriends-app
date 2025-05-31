
"use client";

import { toast } from '@/hooks/use-toast';
import { Award, Zap, TrendingUp, type LucideIcon } from 'lucide-react';
import React from 'react'; // Ensure React is imported

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
  let toastTitleText = "Community Achievement!"; // Using a different variable name for clarity
  let IconComponent: LucideIcon = Award;

  if (pointsAwarded) {
    message = `${randomUsername} +${pointsAwarded} points! For ${achievementDescription}.`;
    IconComponent = Zap;
  } else {
    message = `${randomUsername} achieved: ${achievementDescription}!`;
    IconComponent = TrendingUp;
  }

  toast({
    title: React.createElement(
      "div",
      { className: "flex items-center gap-2" },
      React.createElement(IconComponent, { className: "h-5 w-5 text-primary" }),
      React.createElement("span", null, toastTitleText)
    ),
    description: message,
    duration: 6000,
  });
}
