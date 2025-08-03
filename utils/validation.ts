// utils/validation.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateSessionInput(input: any): boolean {
  if (typeof input !== 'object') return false;
  if (input.message && typeof input.message === 'string') {
    return input.message.length <= 1000; // Reasonable limit
  }
  return true;
}
