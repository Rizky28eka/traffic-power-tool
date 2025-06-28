'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CogIcon, 
  PlayIcon, 
  ClockIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  UsersIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useSimulationStore } from '@/store/simulation';
import { formatNumber } from '@/lib/utils';

const quickActions = [
  {
    title: 'Start New Simulation',
    description: 'Configure and launch a new traffic simulation',
    href: '/configuration',
    icon: PlayIcon,
    color: 'bg-primary-500',
    badge: 'Quick Start',
  },
  {
    title: 'View Analytics',
    description: 'Analyze results from previous simulations',
    href: '/analytics',
    icon: DocumentChartBarIcon,
    color: 'bg-success-500',
    badge: 'Insights',
  },
  {
    title: 'Manage Personas',
    description: 'Create and edit user behavior personas',
    href: '/personas',
    icon: UserGroupIcon,
    color: 'bg-warning-500',
    badge: 'Customize',
  },
  {
    title: 'View History',
    description: 'Browse past simulation runs and results',
    href: '/history',
    icon: ClockIcon,
    color: 'bg-secondary-500',
    badge: 'Archive',
  },
];

const features = [
  {
    title: 'Global Traffic Simulation',
    description: '200+ countries with realistic distribution weights and geolocation-aware fingerprinting',
    icon: GlobeAltIcon,
    stats: '200+ Countries',
  },
  {
    title: 'Multi-Device Support',
    description: 'Desktop, mobile, and tablet simulation with authentic device fingerprints',
    icon: DevicePhoneMobileIcon,
    stats: '50+ Devices',
  },
  {
    title: 'Intelligent Personas',
    description: '20+ pre-built personas with goal-oriented behavior and custom creation tools',
    icon: UsersIcon,
    stats: '20+ Personas',
  },
  {
    title: 'Real-time Analytics',
    description: 'Live dashboard with web vitals collection and comprehensive metrics',
    icon: ChartBarIcon,
    stats: 'Live Monitoring',
  },
];

const Dashboard: React.FC = () => {
  const { currentSimulation, stats } = useSimulationStore();
  const [systemStats, setSystemStats] = useState({
    totalSimulations: 1247,
    totalSessions: 45623,
    averageSuccessRate: 94.2,
    activeUsers: 12,
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions + Math.floor(Math.random() * 5),
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">
          Welcome to Traffic Power Tool
        </h1>
        <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
          Enterprise-grade website traffic simulation with advanced international demographics, 
          behavioral personas, and comprehensive analytics.
        </p>
      </motion.div>

      {/* Current Simulation Status */}
      {currentSimulation.status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="elevated" className="border-l-4 border-l-primary-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <PlayIcon className="w-5 h-5 text-primary-600" />
                    <span>Current Simulation</span>
                  </CardTitle>
                  <CardDescription>
                    {currentSimulation.status === 'running' ? 'Simulation in progress' : `Simulation ${currentSimulation.status}`}
                  </CardDescription>
                </div>
                <Badge 
                  variant={currentSimulation.status === 'running' ? 'primary' : 'secondary'}
                  className="capitalize"
                >
                  {currentSimulation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-900">{stats.completed}</div>
                  <div className="text-sm text-secondary-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{stats.successful}</div>
                  <div className="text-sm text-secondary-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-error-600">{stats.failed}</div>
                  <div className="text-sm text-secondary-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.success_rate ? `${stats.success_rate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-sm text-secondary-600">Success Rate</div>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Link href="/monitor">
                  <Button size="sm" icon={<ArrowRightIcon className="w-4 h-4" />} iconPosition="right">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Simulations',
            value: formatNumber(systemStats.totalSimulations),
            change: '+12%',
            positive: true,
            icon: ChartBarIcon,
          },
          {
            title: 'Total Sessions',
            value: formatNumber(systemStats.totalSessions),
            change: '+8%',
            positive: true,
            icon: ComputerDesktopIcon,
          },
          {
            title: 'Success Rate',
            value: `${systemStats.averageSuccessRate}%`,
            change: '+2.1%',
            positive: true,
            icon: DocumentChartBarIcon,
          },
          {
            title: 'Active Users',
            value: systemStats.activeUsers.toString(),
            change: 'Live',
            positive: true,
            icon: UsersIcon,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    index === 0 ? 'bg-primary-100' :
                    index === 1 ? 'bg-success-100' :
                    index === 2 ? 'bg-warning-100' : 'bg-secondary-100'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${
                      index === 0 ? 'text-primary-600' :
                      index === 1 ? 'text-success-600' :
                      index === 2 ? 'text-warning-600' : 'text-secondary-600'
                    }`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.positive ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-secondary-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="h-full hover:shadow-medium transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" size="sm">
                        {action.badge}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-secondary-600 text-sm">
                      {action.description}
                    </p>
                    <div className="mt-4 flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700 transition-colors">
                      Get Started
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="elevated" className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <feature.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {feature.title}
                        </h3>
                        <Badge variant="primary" size="sm">
                          {feature.stats}
                        </Badge>
                      </div>
                      <p className="text-secondary-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card variant="elevated" className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">
              Ready to Start Your First Simulation?
            </h2>
            <p className="text-primary-700 mb-6 max-w-2xl mx-auto">
              Configure your traffic simulation with our intuitive interface. Choose from 200+ countries, 
              20+ personas, and multiple device types to create realistic user behavior patterns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/configuration">
                <Button size="lg" icon={<CogIcon className="w-5 h-5" />}>
                  Configure Simulation
                </Button>
              </Link>
              <Link href="/personas">
                <Button variant="outline" size="lg" icon={<UserGroupIcon className="w-5 h-5" />}>
                  Explore Personas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;