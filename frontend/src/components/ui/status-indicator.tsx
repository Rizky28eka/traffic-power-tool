// src/components/ui/status-indicator.tsx
import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { twMerge } from 'tailwind-merge';

interface StatusIndicatorProps {
  serviceName: string;
  status: 'connected' | 'disconnected' | string;
  className?: string;
}

export function StatusIndicator({ serviceName, status, className }: StatusIndicatorProps) {
  const isConnected = status === 'connected';
  const isHealthy = status === 'healthy';

  const baseClasses = 'flex items-center justify-between p-3 rounded-lg';
  const containerClasses = isConnected || isHealthy
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  const Icon = isConnected || isHealthy ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={twMerge(baseClasses, containerClasses, className)}>
      <span className="font-medium">{serviceName}</span>
      <div className="flex items-center space-x-2">
        <Icon className="h-6 w-6" />
        <span className="capitalize">{status}</span>
      </div>
    </div>
  );
}
