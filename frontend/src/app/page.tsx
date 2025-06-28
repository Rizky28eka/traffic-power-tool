'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    fetch('/health')
      .then(res => res.json())
      .then(data => setStatus(data.status || 'Unknown'))
      .catch(() => setStatus('Error'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Traffic Power Tool
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Professional Website Traffic Simulation Platform
        </p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-700">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}