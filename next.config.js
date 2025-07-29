// /next.config.js
module.exports = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile pictures
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Code splitting for better performance
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common components chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };
    }
    return config;
  },
  
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  }
};
