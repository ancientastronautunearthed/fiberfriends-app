
'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingPlaceholderProps {
  message?: string;
  className?: string;
}

export default function LoadingPlaceholder({ message = "Loading...", className }: LoadingPlaceholderProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] w-full ${className}`}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {message && <p className="mt-3 text-muted-foreground">{message}</p>}
    </div>
  );
}
