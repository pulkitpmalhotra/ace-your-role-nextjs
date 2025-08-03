// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 15 * 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
            request.headers.get('x-real-ip') || 
            request.ip || 
            'anonymous';

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Different rate limits for different endpoints
  let maxRequests = 100; // Default
  
  if (pathname.startsWith('/api/ai-chat')) {
    maxRequests = 30; // More restrictive for AI endpoints
  } else if (pathname.startsWith('/api/auth')) {
    maxRequests = 10; // Very restrictive for auth
  } else if (pathname.startsWith('/api/sessions')) {
    maxRequests = 50; // Moderate for sessions
  }

  // Check rate limit
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const userData = rateLimitMap.get(ip);
    
    if (now > userData.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      if (userData.count >= maxRequests) {
        console.log(`🚨 Rate limit exceeded for IP: ${ip} on ${pathname}`);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too many requests', 
            message: 'Please wait before making more requests',
            retryAfter: Math.ceil((userData.resetTime - now) / 1000)
          }), 
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((userData.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': Math.max(0, maxRequests - userData.count).toString(),
              'X-RateLimit-Reset': new Date(userData.resetTime).toISOString()
            }
          }
        );
      }
      userData.count += 1;
    }
  }

  // Add security headers to response
  const response = NextResponse.next();
  
  // Add rate limit headers
  const userData = rateLimitMap.get(ip);
  if (userData) {
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - userData.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(userData.resetTime).toISOString());
  }

  // Block suspicious patterns
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'wget', 'curl'
  ];
  
  // Allow known good bots but block suspicious ones
  const isKnownBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot/i.test(userAgent);
  const isSuspicious = suspiciousPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  ) && !isKnownBot;

  if (isSuspicious && pathname.startsWith('/api/')) {
    console.log(`🚨 Blocked suspicious request from: ${userAgent} (IP: ${ip})`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Log security events for monitoring
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/sessions')) {
    console.log(`🔐 Security-sensitive request: ${request.method} ${pathname} from ${ip}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
