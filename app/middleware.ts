// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  const userData = rateLimitMap.get(ip);
  
  if (now > userData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }

  if (userData.count >= maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  userData.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
};
