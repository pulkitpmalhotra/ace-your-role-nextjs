// utils/validation.ts
/**
 * Input sanitization and validation utilities for security
 */

// Basic HTML sanitization (removes dangerous characters)
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .trim()
    .slice(0, 1000); // Limit length
}

// Email validation
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
}

// Session input validation
export function validateSessionInput(input: any): { isValid: boolean; error?: string } {
  if (!input || typeof input !== 'object') {
    return { isValid: false, error: 'Invalid input format' };
  }

  // Validate message content
  if (input.message) {
    if (typeof input.message !== 'string') {
      return { isValid: false, error: 'Message must be a string' };
    }
    if (input.message.length > 1000) {
      return { isValid: false, error: 'Message too long' };
    }
    if (input.message.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
  }

  // Validate scenario ID
  if (input.scenario_id) {
    if (typeof input.scenario_id !== 'string') {
      return { isValid: false, error: 'Scenario ID must be a string' };
    }
    if (!/^[a-zA-Z0-9\-_]+$/.test(input.scenario_id)) {
      return { isValid: false, error: 'Invalid scenario ID format' };
    }
  }

  // Validate user email
  if (input.user_email) {
    if (!validateEmail(input.user_email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
  }

  return { isValid: true };
}

// Validate conversation array
export function validateConversation(conversation: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(conversation)) {
    return { isValid: false, error: 'Conversation must be an array' };
  }

  if (conversation.length > 100) {
    return { isValid: false, error: 'Conversation too long' };
  }

  for (let i = 0; i < conversation.length; i++) {
    const message = conversation[i];
    
    if (!message || typeof message !== 'object') {
      return { isValid: false, error: `Invalid message at index ${i}` };
    }

    if (!message.speaker || !['user', 'ai'].includes(message.speaker)) {
      return { isValid: false, error: `Invalid speaker at index ${i}` };
    }

    if (!message.message || typeof message.message !== 'string') {
      return { isValid: false, error: `Invalid message content at index ${i}` };
    }

    if (message.message.length > 1000) {
      return { isValid: false, error: `Message too long at index ${i}` };
    }

    if (!message.timestamp || typeof message.timestamp !== 'number') {
      return { isValid: false, error: `Invalid timestamp at index ${i}` };
    }
  }

  return { isValid: true };
}

// Rate limiting check
export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): { allowed: boolean; resetTime?: number } {
  // This is a simple in-memory rate limiter
  // In production, you'd use Redis or a database
  
  if (typeof window !== 'undefined') {
    // Client-side rate limiting (basic)
    const key = `rate_limit_${identifier}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      const data = {
        count: 1,
        resetTime: Date.now() + windowMs
      };
      localStorage.setItem(key, JSON.stringify(data));
      return { allowed: true };
    }

    const data = JSON.parse(stored);
    
    if (Date.now() > data.resetTime) {
      const newData = {
        count: 1,
        resetTime: Date.now() + windowMs
      };
      localStorage.setItem(key, JSON.stringify(newData));
      return { allowed: true };
    }

    if (data.count >= maxRequests) {
      return { allowed: false, resetTime: data.resetTime };
    }

    data.count += 1;
    localStorage.setItem(key, JSON.stringify(data));
    return { allowed: true };
  }

  return { allowed: true }; // Allow on server-side (handled by middleware)
}

// Validate UUID format
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Sanitize object recursively
export function sanitizeObject(obj: any, maxDepth: number = 5): any {
  if (maxDepth <= 0) return null;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1)).slice(0, 100);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(obj).slice(0, 50); // Limit object keys
    
    for (const key of keys) {
      const sanitizedKey = sanitizeInput(key);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(obj[key], maxDepth - 1);
      }
    }
    
    return sanitized;
  }
  
  return null;
}

// Password strength validation (for future use)
export function validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password should contain lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password should contain uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Password should contain numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Password should contain special characters');

  return {
    isValid: score >= 3,
    score,
    feedback
  };
}

// Validate file upload (for future use)
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  return { isValid: true };
}

// Escape HTML to prevent XSS
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Validate JSON Web Token format (basic check)
export function validateJWTFormat(token: string): boolean {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  return jwtRegex.test(token);
}
