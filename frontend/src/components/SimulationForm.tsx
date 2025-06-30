// src/components/SimulationForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'react-hot-toast';

interface SimulationFormProps {
  onStart: (config: any) => void;
  onStop: () => void;
  isSimulationLoading: boolean;
  simulationStatus: 'idle' | 'starting' | 'running' | 'stopping' | 'completed' | 'failed';
}

const formSchema = z.object({
  target_url: z.string().url({ message: "Invalid URL format." }),
  total_sessions: z.number().min(1).max(10000),
  max_concurrent: z.number().min(1).max(100),
  headless: z.boolean().optional(),
  returning_visitor_rate: z.number().min(0).max(100).optional(),
  navigation_timeout: z.number().min(1000).max(300000).optional(),
  max_retries_per_session: z.number().min(0).max(5).optional(),
  mode_type: z.string().optional(),
  network_type: z.string().optional(),
  personas: z.string().optional(), // Stored as JSON string
  device_distribution: z.string().optional(), // Stored as JSON string
  country_distribution: z.string().optional(), // Stored as JSON string
  age_distribution: z.string().optional(), // Stored as JSON string
});

type FormData = z.infer<typeof formSchema>;

export function SimulationForm({
  onStart,
  onStop,
  isSimulationLoading,
  simulationStatus,
}: SimulationFormProps) {
  const [defaultConfig, setDefaultConfig] = useState<any | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total_sessions: 100,
      max_concurrent: 10,
      headless: true,
      returning_visitor_rate: 30,
      navigation_timeout: 60000,
      max_retries_per_session: 2,
      mode_type: 'Bot',
      network_type: 'Default',
      personas: JSON.stringify(["Default User"]), // Default empty array
      device_distribution: JSON.stringify({"Desktop": 60, "Mobile": 30, "Tablet": 10}),
      country_distribution: JSON.stringify({"United States": 25, "Indonesia": 15, "India": 12, "China": 10, "Brazil": 8}),
      age_distribution: JSON.stringify({"18-24": 20, "25-34": 30, "35-44": 25, "45-54": 15, "55+": 10}),
    },
  });

  const watchAllFields = watch();

  useEffect(() => {
    const fetchDefaultConfig = async () => {
      setIsLoadingConfig(true);
      setConfigError(null);
      try {
        const response = await fetch('/api/config/default');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setDefaultConfig(data.data);
          // Set form values from fetched default config
          Object.keys(data.data).forEach(key => {
            if (key in watchAllFields) {
              const value = data.data[key];
              if (typeof value === 'object' && value !== null) {
                setValue(key as keyof FormData, JSON.stringify(value) as any);
              } else {
                setValue(key as keyof FormData, value);
              }
            }
          });
        } else {
          setConfigError(data.error || 'Failed to fetch default configuration.');
          toast.error(data.error || 'Failed to fetch default configuration.');
        }
      } catch (e: any) {
        setConfigError(e.message);
        toast.error(`Error fetching default config: ${e.message}`);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchDefaultConfig();
  }, [setValue, watchAllFields]);

  const onSubmit = (data: FormData) => {
    try {
      const parsedData = {
        ...data,
        personas: data.personas ? JSON.parse(data.personas) : [],
        device_distribution: data.device_distribution ? JSON.parse(data.device_distribution) : {},
        country_distribution: data.country_distribution ? JSON.parse(data.country_distribution) : {},
        age_distribution: data.age_distribution ? JSON.parse(data.age_distribution) : {},
      };
      onStart(parsedData);
    } catch (e: any) {
      toast.error(`Error parsing JSON: ${e.message}`);
    }
  };

  const isRunning = simulationStatus === 'running' || simulationStatus === 'starting';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 w-full">
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
        Traffic Simulation Configuration
      </h2>
      {isLoadingConfig ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading default configuration...</p>
        </div>
      ) : configError ? (
        <div className="text-red-600 text-center h-40 flex items-center justify-center">
          <p>{configError}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="target_url">Target URL</Label>
            <Input
              id="target_url"
              type="url"
              placeholder="e.g., https://example.com"
              {...register('target_url')}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.target_url && (
              <p className="text-red-500 text-sm mt-1">{errors.target_url.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="total_sessions">Total Sessions: {watch('total_sessions')}</Label>
            <Slider
              id="total_sessions"
              min={1}
              max={10000}
              step={1}
              value={[watch('total_sessions') || 0]}
              onValueChange={(val) => setValue('total_sessions', val[0])}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.total_sessions && (
              <p className="text-red-500 text-sm mt-1">{errors.total_sessions.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="max_concurrent">Max Concurrent Sessions: {watch('max_concurrent')}</Label>
            <Slider
              id="max_concurrent"
              min={1}
              max={100}
              step={1}
              value={[watch('max_concurrent') || 0]}
              onValueChange={(val) => setValue('max_concurrent', val[0])}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.max_concurrent && (
              <p className="text-red-500 text-sm mt-1">{errors.max_concurrent.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="headless"
              checked={watch('headless')}
              onCheckedChange={(checked) => setValue('headless', checked)}
              disabled={isRunning || isSimulationLoading}
            />
            <Label htmlFor="headless">Run Headless (no browser UI)</Label>
          </div>

          <div>
            <Label htmlFor="returning_visitor_rate">Returning Visitor Rate (%): {watch('returning_visitor_rate')}</Label>
            <Slider
              id="returning_visitor_rate"
              min={0}
              max={100}
              step={1}
              value={[watch('returning_visitor_rate') || 0]}
              onValueChange={(val) => setValue('returning_visitor_rate', val[0])}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.returning_visitor_rate && (
              <p className="text-red-500 text-sm mt-1">{errors.returning_visitor_rate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="navigation_timeout">Navigation Timeout (ms): {watch('navigation_timeout')}</Label>
            <Slider
              id="navigation_timeout"
              min={1000}
              max={300000}
              step={1000}
              value={[watch('navigation_timeout') || 0]}
              onValueChange={(val) => setValue('navigation_timeout', val[0])}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.navigation_timeout && (
              <p className="text-red-500 text-sm mt-1">{errors.navigation_timeout.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="max_retries_per_session">Max Retries Per Session: {watch('max_retries_per_session')}</Label>
            <Slider
              id="max_retries_per_session"
              min={0}
              max={5}
              step={1}
              value={[watch('max_retries_per_session') || 0]}
              onValueChange={(val) => setValue('max_retries_per_session', val[0])}
              disabled={isRunning || isSimulationLoading}
            />
            {errors.max_retries_per_session && (
              <p className="text-red-500 text-sm mt-1">{errors.max_retries_per_session.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mode_type">Mode Type</Label>
            <Select
              onValueChange={(value) => setValue('mode_type', value)}
              value={watch('mode_type')}
              disabled={isRunning || isSimulationLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bot">Bot</SelectItem>
                <SelectItem value="Human">Human</SelectItem>
              </SelectContent>
            </Select>
            {errors.mode_type && (
              <p className="text-red-500 text-sm mt-1">{errors.mode_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="network_type">Network Type</Label>
            <Select
              onValueChange={(value) => setValue('network_type', value)}
              value={watch('network_type')}
              disabled={isRunning || isSimulationLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="3G">3G</SelectItem>
                <SelectItem value="4G">4G</SelectItem>
              </SelectContent>
            </Select>
            {errors.network_type && (
              <p className="text-red-500 text-sm mt-1">{errors.network_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="personas">Personas (JSON Array)</Label>
            <Textarea
              id="personas"
              placeholder='e.g., ["Persona A", "Persona B"]'
              {...register('personas')}
              disabled={isRunning || isSimulationLoading}
              rows={3}
            />
            {errors.personas && (
              <p className="text-red-500 text-sm mt-1">{errors.personas.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="device_distribution">Device Distribution (JSON Object)</Label>
            <Textarea
              id="device_distribution"
              placeholder='e.g., {"Desktop": 70, "Mobile": 30}'
              {...register('device_distribution')}
              disabled={isRunning || isSimulationLoading}
              rows={3}
            />
            {errors.device_distribution && (
              <p className="text-red-500 text-sm mt-1">{errors.device_distribution.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country_distribution">Country Distribution (JSON Object)</Label>
            <Textarea
              id="country_distribution"
              placeholder='e.g., {"US": 50, "ID": 20}'
              {...register('country_distribution')}
              disabled={isRunning || isSimulationLoading}
              rows={3}
            />
            {errors.country_distribution && (
              <p className="text-red-500 text-sm mt-1">{errors.country_distribution.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="age_distribution">Age Distribution (JSON Object)</Label>
            <Textarea
              id="age_distribution"
              placeholder='e.g., {"18-24": 30, "25-34": 40}'
              {...register('age_distribution')}
              disabled={isRunning || isSimulationLoading}
              rows={3}
            />
            {errors.age_distribution && (
              <p className="text-red-500 text-sm mt-1">{errors.age_distribution.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            {isRunning ? (
              <Button
                type="button"
                onClick={onStop}
                disabled={simulationStatus === 'stopping' || isSimulationLoading}
                variant="destructive"
              >
                {isSimulationLoading && simulationStatus === 'stopping' ? 'Stopping...' : 'Stop Simulation'}
              </Button>
            ) : (
              <Button type="submit" disabled={isSimulationLoading || isLoadingConfig}>
                {isSimulationLoading ? 'Starting...' : 'Start Simulation'}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
