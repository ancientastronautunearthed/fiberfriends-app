'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorDashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Doctor Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Welcome to your dashboard. Content for doctors will go here.</p>
          {/* Future dashboard content can be added here */}
        </CardContent>
      </Card>
    </div>
  );
}