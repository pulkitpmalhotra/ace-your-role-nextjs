/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com",
              "connect-src 'self' https://generativelanguage.googleapis.com https://speech.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: [
              'microphone=(self)',
              'camera=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'speaker=(self)',
              'autoplay=(self)',
              'fullscreen=(self)'
            ].join(', ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://ace-your-role-nextjs.vercel.app' 
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-user-email'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      },
      {
        source: '/session/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: [
              'microphone=(self)',
              'speaker=(self)',
              'autoplay=(self)',
              'camera=()',
              'geolocation=()',
              'payment=()',
              'usb=()'
            ].join(', ')
          },
          {
            key: 'Feature-Policy',
            value: [
              'microphone \'self\'',
              'speaker \'self\'',
              'autoplay \'self\''
            ].join('; ')
          }
        ]
      }
    ]
  },
  
  // Enhanced webpack configuration for voice features
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add support for audio worklets and web workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/'
        }
      }
    });

    // Add support for audio files
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/'
        }
      }
    });

    // Optimize for speech recognition
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      };
    }

    return config;
  },

  // Enhanced experimental features for better performance
  experimental: {
    scrollRestoration: true,
    legacyBrowsers: false,
    browsersListForSwc: true,
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enhanced environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_VOICE_FEATURES_ENABLED: 'true'
  },

  // Performance optimizations
  swcMinify: true,
  
  // Static generation optimizations
  trailingSlash: false,
  
  // Enhanced redirects for voice sessions
  async redirects() {
    return [
      {
        source: '/session',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/voice',
        destination: '/dashboard',
        permanent: false,
      }
    ];
  },

  // Enhanced rewrites for API optimization
  async rewrites() {
    return [
      {
        source: '/api/voice/:path*',
        destination: '/api/:path*',
      }
    ];
  }
}

module.exports = nextConfig
