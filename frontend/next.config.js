/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // In a Docker environment, the frontend and backend are on the same network.
    // The backend service is named 'backend' in docker-compose.yml.
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      }
    ];
  },
};

module.exports = nextConfig;
