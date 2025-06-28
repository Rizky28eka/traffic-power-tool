'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ChartBarIcon, 
  CogIcon, 
  PlayIcon, 
  ClockIcon,
  UserGroupIcon,
  DocumentChartBarIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Configuration', href: '/configuration', icon: CogIcon },
  { name: 'Monitor', href: '/monitor', icon: PlayIcon },
  { name: 'Analytics', href: '/analytics', icon: DocumentChartBarIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
  { name: 'Personas', href: '/personas', icon: UserGroupIcon },
];

const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-secondary-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">Traffic Power Tool</h1>
                <p className="text-xs text-secondary-600">Enterprise Traffic Simulation</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-secondary-600">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-secondary-200">
        <div className="px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;