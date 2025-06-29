'use client';

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Spinner } from '../components/ui/spinner';
import { StatusIndicator } from '../components/ui/status-indicator';

export default function Home() {
  const { status, isLoading, error, refetch } = useHealthCheck();

  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Spinner className="h-8 w-8 mb-2" />
          <p>Checking System Health...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600">
          <p><strong>Error:</strong> Could not connect to the backend.</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (status) {
      return (
        <div className="space-y-4 w-full">
          <StatusIndicator serviceName="Overall Status" status={status.status} />
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h3 className="text-lg font-medium text-gray-600">Service Details:</h3>
            <StatusIndicator serviceName="Redis" status={status.services.redis} />
            <StatusIndicator serviceName="PostgreSQL" status={status.services.postgres} />
          </div>
          <p className="text-xs text-gray-400 text-center pt-2">
            Last checked: {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">
            Traffic Power Tool
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Professional Website Traffic Simulation Platform
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 min-h-[250px] flex flex-col justify-center items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              System Health
            </h2>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              aria-label="Refresh status"
            >
              <ArrowPathIcon className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="w-full">
            {renderStatus()}
          </div>
        </div>
      </div>
    </main>
  );
}
