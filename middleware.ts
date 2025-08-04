// middleware.ts - Compatible Security Middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple rate limiting storage
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitMap: { [key: string]: RateLimitData } = {};

export function middleware(request: NextRequest) {
  // Skip middleware for static files and Next.js internals
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Get client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';

  // Clean up old rate limit entries periodically
  cleanupOldEntries();

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = applyRateLimit(ip, pathname);
    
    if (!rateLimitResult.allowed) {
      console.log(`🚨 Rate limit exceeded for ${ip} on ${pathname}`);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Please slow down your requests'
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          }
        }
      );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  }

  // Block suspicious requests
  const userAgent = request.headers.get('user-agent') || '';
  if (pathname.startsWith('/api/') && isSuspiciousRequest(userAgent)) {
    console.log(`🚨 Blocked suspicious request from ${ip}: ${userAgent}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Add basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Log security-sensitive requests
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/sessions')) {
    console.log(`🔐 Security request: ${request.method} ${pathname} from ${ip}`);
  }

  return response;
}

function applyRateLimit(ip: string, pathname: string): { 
  allowed: boolean; 
  limit: number; 
  remaining: number; 
} {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Different limits for different endpoints
  let maxRequests = 100; // Default
  
  if (pathname.startsWith('/api/ai-chat')) {
    maxRequests = 30;
  } else if (pathname.startsWith('/api/auth')) {
    maxRequests = 10;
  } else if (pathname.startsWith('/api/sessions')) {
    maxRequests = 50;
  } else if (pathname.startsWith('/api/analyze-conversation')) {
    maxRequests = 20;
  }

  const key = `${ip}-${getApiCategory(pathname)}`;
  
  if (!rateLimitMap[key]) {
    rateLimitMap[key] = { count: 1, resetTime: now + windowMs };
    return { 
      allowed: true, 
      limit: maxRequests, 
      remaining: maxRequests - 1 
    };
  }

  const userData = rateLimitMap[key];
  
  if (now > userData.resetTime) {
    rateLimitMap[key] = { count: 1, resetTime: now + windowMs };
    return { 
      allowed: true, 
      limit: maxRequests, 
      remaining: maxRequests - 1 
    };
  }

  if (userData.count >= maxRequests) {
    return { 
      allowed: false, 
      limit: maxRequests,
      remaining: 0
    };
  }

  userData.count += 1;
  return { 
    allowed: true, 
    limit: maxRequests, 
    remaining: maxRequests - userData.count 
  };
}

function getApiCategory(pathname: string): string {
  const parts = pathname.split('/');
  return parts[2] || 'unknown'; // Get API category like 'auth', 'sessions', etc.
}

function isSuspiciousRequest(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  
  // Block obvious attack tools
  const maliciousPatterns = [
    'sqlmap',
    'nmap',
    'nikto',
    'gobuster',
    'dirb',
    'wfuzz',
    'burpsuite',
    'havij',
    'acunetix'
  ];
  
  // Allow legitimate bots
  const legitimateBots = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot'
  ];

  const isMalicious = maliciousPatterns.some(pattern => ua.includes(pattern));
  const isLegitimate = legitimateBots.some(pattern => ua.includes(pattern));
  
  return isMalicious && !isLegitimate;
}

function cleanupOldEntries(): void {
  const now = Date.now();
  const keys = Object.keys(rateLimitMap);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const data = rateLimitMap[key];
    if (data && now > data.resetTime) {
      delete rateLimitMap[key];
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
