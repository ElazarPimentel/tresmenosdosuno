/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  eslint: {
    // Advertencias de ESLint tratadas como errores en producción
    ignoreDuringBuilds: false,
    // Directorios a analizar
    dirs: ['src']
  }
};

module.exports = nextConfig; 