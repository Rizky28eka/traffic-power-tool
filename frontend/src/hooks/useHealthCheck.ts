// src/hooks/useHealthCheck.ts
import { useState, useEffect, useCallback } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    redis: string;
    postgres: string;
  };
}

interface UseHealthCheckResult {
  status: HealthStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHealthCheck(): UseHealthCheckResult {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthStatus = await response.json();
      setStatus(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { status, isLoading, error, refetch: fetchHealth };
}
