'use client';

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useSimulation } from '../hooks/useSimulation';
import { Spinner } from '../components/ui/spinner';
import { StatusIndicator } from '../components/ui/status-indicator';
import { Button } from '../components/ui/button';
import { SimulationForm } from '../components/SimulationForm';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const { status: healthStatus, isLoading: isHealthLoading, error: healthError, refetch: refetchHealth } = useHealthCheck();
  const { simulation, startSimulation, stopSimulation, isLoading: isSimulationLoading, error: simulationError } = useSimulation();

  const renderHealthStatus = () => {
    if (isHealthLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Spinner className="h-8 w-8 mb-2" />
          <p>Checking System Health...</p>
        </div>
      );
    }

    if (healthError) {
      return (
        <div className="text-center text-red-600">
          <p><strong>Error:</strong> Could not connect to the backend.</p>
          <p className="text-sm">{healthError}</p>
        </div>
      );
    }

    if (healthStatus) {
      return (
        <div className="space-y-4 w-full">
          <StatusIndicator serviceName="Overall Status" status={healthStatus.status} />
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h3 className="text-lg font-medium text-gray-600">Service Details:</h3>
            <StatusIndicator serviceName="Redis" status={healthStatus.services.redis} />
            <StatusIndicator serviceName="MySQL" status={healthStatus.services.mysql} />
          </div>
          <p className="text-xs text-gray-400 text-center pt-2">
            Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderSimulationStatus = () => {
    if (simulation.status === 'idle') {
      return (
        <p className="text-gray-500 text-center">No simulation running.</p>
      );
    }

    return (
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Simulation Status:</h3>
        <StatusIndicator serviceName={`ID: ${simulation.id}`} status={simulation.status} />
        {simulation.started_at && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Started At: {new Date(simulation.started_at).toLocaleString()}
          </p>
        )}
        {simulation.finished_at && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Finished At: {new Date(simulation.finished_at).toLocaleString()}
          </p>
        )}
        {simulation.error_message && (
          <div className="text-red-600 text-sm">
            <p>Error: {simulation.error_message}</p>
          </div>
        )}
        {simulation.stats && (
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <h4 className="text-md font-medium text-gray-600 dark:text-gray-300">Statistics:</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sessions Completed: {simulation.stats.sessions_completed || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sessions Failed: {simulation.stats.sessions_failed || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests: {simulation.stats.total_requests || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Response Time: {simulation.stats.average_response_time?.toFixed(2) || 0} ms</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 space-y-8">
      <Toaster position="bottom-right" />
      <div className="w-full max-w-lg mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">
          Traffic Power Tool
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Professional Website Traffic Simulation Platform
        </p>
      </div>

      <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 flex flex-col justify-center items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            System Health
          </h2>
          <Button
            onClick={refetchHealth}
            disabled={isHealthLoading}
            variant="outline"
            size="icon"
            aria-label="Refresh status"
          >
            <ArrowPathIcon className={`h-6 w-6 ${isHealthLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="w-full">
          {renderHealthStatus()}
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto">
        <SimulationForm
          onStart={startSimulation}
          onStop={stopSimulation}
          isSimulationLoading={isSimulationLoading}
          simulationStatus={simulation.status}
        />
      </div>

      {simulation.id && (
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Current Simulation
          </h2>
          {renderSimulationStatus()}
        </div>
      )}
    </main>
  );
}