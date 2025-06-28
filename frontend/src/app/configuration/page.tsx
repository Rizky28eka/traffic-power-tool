'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  CogIcon, 
  PlayIcon, 
  GlobeAltIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { TrafficConfig, Persona } from '@/types';
import { useSimulationStore } from '@/store/simulation';
import { validateUrl } from '@/lib/utils';
import apiClient from '@/lib/api';

const configSchema = z.object({
  target_url: z.string().url('Please enter a valid URL'),
  total_sessions: z.number().min(1, 'Must be at least 1').max(10000, 'Maximum 10,000 sessions'),
  max_concurrent: z.number().min(1, 'Must be at least 1').max(100, 'Maximum 100 concurrent sessions'),
  returning_visitor_rate: z.number().min(0, 'Must be 0 or higher').max(100, 'Must be 100 or lower'),
  navigation_timeout: z.number().min(5000, 'Minimum 5 seconds').max(300000, 'Maximum 5 minutes'),
  mode_type: z.enum(['Bot', 'Human']),
  network_type: z.enum(['Default', '3G', '4G', 'WiFi', 'Offline']),
});

type ConfigFormData = z.infer<typeof configSchema>;

const Configuration: React.FC = () => {
  const { setCurrentSimulation, setConfiguring } = useSimulationStore();
  const [step, setStep] = useState(1);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [countryDistribution, setCountryDistribution] = useState<Record<string, number>>({});
  const [deviceDistribution, setDeviceDistribution] = useState({
    Desktop: 60,
    Mobile: 30,
    Tablet: 10,
  });
  const [ageDistribution, setAgeDistribution] = useState({
    '18-24': 20,
    '25-34': 30,
    '35-44': 25,
    '45-54': 15,
    '55+': 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      target_url: '',
      total_sessions: 100,
      max_concurrent: 10,
      returning_visitor_rate: 30,
      navigation_timeout: 60000,
      mode_type: 'Bot',
      network_type: 'Default',
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    setConfiguring(true);
    return () => setConfiguring(false);
  }, [setConfiguring]);

  const steps = [
    {
      id: 1,
      title: 'Basic Configuration',
      description: 'Set up target URL and session parameters',
      icon: CogIcon,
    },
    {
      id: 2,
      title: 'Demographics',
      description: 'Configure countries, devices, and age groups',
      icon: GlobeAltIcon,
    },
    {
      id: 3,
      title: 'Personas',
      description: 'Select and customize user behavior personas',
      icon: UserGroupIcon,
    },
    {
      id: 4,
      title: 'Review & Launch',
      description: 'Review configuration and start simulation',
      icon: PlayIcon,
    },
  ];

  const popularCountries = [
    { name: 'United States', code: 'US', weight: 25 },
    { name: 'Indonesia', code: 'ID', weight: 15 },
    { name: 'India', code: 'IN', weight: 12 },
    { name: 'China', code: 'CN', weight: 10 },
    { name: 'Brazil', code: 'BR', weight: 8 },
    { name: 'United Kingdom', code: 'GB', weight: 7 },
    { name: 'Germany', code: 'DE', weight: 6 },
    { name: 'Japan', code: 'JP', weight: 6 },
    { name: 'France', code: 'FR', weight: 5 },
    { name: 'Canada', code: 'CA', weight: 5 },
  ];

  const defaultPersonas = [
    { name: 'Methodical Customer', description: 'Form-filling, price-conscious behavior' },
    { name: 'Deep Researcher', description: 'Content consumption and downloads' },
    { name: 'Performance Analyst', description: 'Web vitals collection focused' },
    { name: 'Quick Browser', description: 'Fast navigation, minimal interaction' },
    { name: 'Job Seeker', description: 'Career-focused, application forms' },
    { name: 'Content Consumer', description: 'Article reading, media consumption' },
    { name: 'Product Explorer', description: 'E-commerce behavior patterns' },
    { name: 'Social Media Marketer', description: 'Sharing and engagement focused' },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data: ConfigFormData) => {
    setIsSubmitting(true);
    
    try {
      const config: TrafficConfig = {
        ...data,
        headless: true,
        max_retries_per_session: 2,
        personas: selectedPersonas,
        gender_distribution: { Male: 50, Female: 50 },
        device_distribution: deviceDistribution,
        country_distribution: countryDistribution,
        age_distribution: ageDistribution,
        referrer_sources: [
          'https://www.google.com/',
          'https://www.bing.com/',
          'https://duckduckgo.com/',
        ],
        session_duration_range: [120, 600],
        bounce_rate_target: 0.3,
        user_agent_strategy: 'random',
        enable_random_personas: true,
        random_persona_count: 5,
        enable_geolocation_simulation: true,
        enable_language_detection: true,
      };

      // Validate configuration
      const validation = await apiClient.validateConfig(config);
      if (!validation.success) {
        throw new Error(validation.error || 'Configuration validation failed');
      }

      // Start simulation
      const response = await apiClient.startSimulation(config);
      if (!response.success) {
        throw new Error(response.error || 'Failed to start simulation');
      }

      setCurrentSimulation({
        id: response.data?.simulation_id || null,
        config,
        status: 'running',
        startedAt: new Date(),
      });

      toast.success('Simulation started successfully!');
      
      // Redirect to monitor page
      window.location.href = '/monitor';
    } catch (error) {
      console.error('Failed to start simulation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start simulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <Controller
              name="target_url"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Target URL"
                  placeholder="https://example.com"
                  error={errors.target_url?.message}
                  helperText="The website URL you want to simulate traffic for"
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="total_sessions"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Total Sessions"
                    value={value?.toString() || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    error={errors.total_sessions?.message}
                    helperText="Number of user sessions to simulate"
                  />
                )}
              />

              <Controller
                name="max_concurrent"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Concurrent Sessions"
                    value={value?.toString() || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    error={errors.max_concurrent?.message}
                    helperText="Maximum simultaneous sessions"
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="returning_visitor_rate"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Returning Visitor Rate (%)"
                    value={value?.toString() || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    error={errors.returning_visitor_rate?.message}
                    helperText="Percentage of returning visitors"
                  />
                )}
              />

              <Controller
                name="navigation_timeout"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Navigation Timeout (ms)"
                    value={value?.toString() || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    error={errors.navigation_timeout?.message}
                    helperText="Page load timeout in milliseconds"
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="mode_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Simulation Mode"
                    options={[
                      { value: 'Bot', label: 'Bot Mode (Fast)' },
                      { value: 'Human', label: 'Human Mode (Realistic)' },
                    ]}
                    helperText="Bot mode is faster, Human mode is more realistic"
                  />
                )}
              />

              <Controller
                name="network_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Network Type"
                    options={[
                      { value: 'Default', label: 'Default' },
                      { value: '3G', label: '3G (Slow)' },
                      { value: '4G', label: '4G (Fast)' },
                      { value: 'WiFi', label: 'WiFi' },
                      { value: 'Offline', label: 'Offline' },
                    ]}
                    helperText="Simulate different network conditions"
                  />
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Country Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Country Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularCountries.map((country) => (
                  <div key={country.code} className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{country.code === 'US' ? '🇺🇸' : country.code === 'ID' ? '🇮🇩' : '🌍'}</span>
                      <span className="font-medium text-secondary-900">{country.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={countryDistribution[country.name] || country.weight}
                        onChange={(e) => setCountryDistribution(prev => ({
                          ...prev,
                          [country.name]: parseInt(e.target.value) || 0
                        }))}
                        className="w-16 px-2 py-1 text-sm border border-secondary-300 rounded"
                      />
                      <span className="text-sm text-secondary-600">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Device Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(deviceDistribution).map(([device, percentage]) => (
                  <div key={device} className="p-4 border border-secondary-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-secondary-900">{device}</span>
                      <Badge variant="secondary">{percentage}%</Badge>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => setDeviceDistribution(prev => ({
                        ...prev,
                        [device]: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Age Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Age Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(ageDistribution).map(([ageGroup, percentage]) => (
                  <div key={ageGroup} className="p-4 border border-secondary-200 rounded-lg text-center">
                    <div className="font-medium text-secondary-900 mb-2">{ageGroup}</div>
                    <div className="text-2xl font-bold text-primary-600 mb-2">{percentage}%</div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={percentage}
                      onChange={(e) => setAgeDistribution(prev => ({
                        ...prev,
                        [ageGroup]: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Select Personas</h3>
              <Badge variant="primary">{selectedPersonas.length} selected</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultPersonas.map((persona) => {
                const isSelected = selectedPersonas.some(p => p.name === persona.name);
                return (
                  <div
                    key={persona.name}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPersonas(prev => prev.filter(p => p.name !== persona.name));
                      } else {
                        // Add basic persona structure - in real app, this would come from API
                        const newPersona: Persona = {
                          name: persona.name,
                          goal_keywords: {},
                          generic_keywords: {},
                          navigation_depth: [3, 6],
                          avg_time_per_page: [20, 60],
                          gender: 'Neutral',
                          age_range: [18, 65],
                          can_fill_forms: false,
                          scroll_probability: 0.85,
                          form_interaction_probability: 0.25,
                        };
                        setSelectedPersonas(prev => [...prev, newPersona]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900 mb-1">{persona.name}</h4>
                        <p className="text-sm text-secondary-600">{persona.description}</p>
                      </div>
                      {isSelected && (
                        <CheckIcon className="w-5 h-5 text-primary-600 ml-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPersonas.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-600">Select at least one persona to continue</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900">Configuration Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Target URL:</span>
                      <span className="font-medium">{watchedValues.target_url}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Total Sessions:</span>
                      <span className="font-medium">{watchedValues.total_sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Concurrent:</span>
                      <span className="font-medium">{watchedValues.max_concurrent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Mode:</span>
                      <span className="font-medium">{watchedValues.mode_type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Countries:</span>
                      <span className="font-medium">{Object.keys(countryDistribution).length || popularCountries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Devices:</span>
                      <span className="font-medium">Desktop, Mobile, Tablet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Age Groups:</span>
                      <span className="font-medium">5 ranges</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Personas:</span>
                      <span className="font-medium">{selectedPersonas.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card variant="elevated" className="bg-primary-50 border-primary-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ClockIcon className="w-5 h-5 text-primary-600" />
                  <h4 className="font-medium text-primary-900">Estimated Duration</h4>
                </div>
                <p className="text-primary-700 mb-2">
                  Based on your configuration, this simulation will take approximately{' '}
                  <span className="font-semibold">
                    {Math.ceil((watchedValues.total_sessions || 0) / (watchedValues.max_concurrent || 1))} minutes
                  </span>{' '}
                  to complete.
                </p>
                <p className="text-sm text-primary-600">
                  You can monitor progress in real-time on the monitoring dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Configure Traffic Simulation
        </h1>
        <p className="text-lg text-secondary-600">
          Set up your traffic simulation parameters and launch your test
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((stepItem, index) => (
          <div key={stepItem.id} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepItem.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-200 text-secondary-600'
                }`}
              >
                {step > stepItem.id ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <stepItem.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  step >= stepItem.id ? 'text-primary-600' : 'text-secondary-600'
                }`}>
                  {stepItem.title}
                </p>
                <p className="text-xs text-secondary-500">{stepItem.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${
                step > stepItem.id ? 'bg-primary-600' : 'bg-secondary-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(steps[step - 1].icon, { className: 'w-5 h-5' })}
              <span>{steps[step - 1].title}</span>
            </CardTitle>
            <CardDescription>{steps[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
        >
          Previous
        </Button>

        <div className="flex space-x-3">
          {step < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={step === 3 && selectedPersonas.length === 0}
              icon={<ArrowRightIcon className="w-4 h-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={selectedPersonas.length === 0}
              icon={<PlayIcon className="w-4 h-4" />}
            >
              Start Simulation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuration;