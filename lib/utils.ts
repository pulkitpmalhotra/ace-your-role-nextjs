// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function getScoreColor(score: number): string {
  if (score >= 4.5) return 'text-green-600';
  if (score >= 3.5) return 'text-yellow-600';
  if (score >= 2.5) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Needs Work';
  return 'Focus Area';
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'sales': '💼',
    'leadership': '👥', 
    'healthcare': '🏥',
    'support': '🎧',
    'legal': '⚖️'
  };
  return emojiMap[category] || '🎯';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function parseDetailedFeedback(feedbackString: string): any {
  try {
    return JSON.parse(feedbackString);
  } catch (error) {
    console.error('Failed to parse detailed feedback:', error);
    return null;
  }
}

export function createBasicFeedback(exchanges: number, duration: number, scenarioTitle: string) {
  let performance = '';
  
  if (exchanges === 0) {
    performance = "Great start!";
  } else if (exchanges < 3) {
    performance = "Good effort!";
  } else if (exchanges < 6) {
    performance = "Well done!";
  } else {
    performance = "Excellent session!";
  }

  return {
    performance,
    exchanges,
    duration,
    scenario: scenarioTitle
  };
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return Response.json(
      { success: false, error: error.message, code: error.code },
      { status: error.status }
    );
  }
  
  return Response.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

export function logPerformance(operation: string, startTime: number) {
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - startTime;
    console.log(`🚀 ${operation}: ${duration}ms`);
  }
}
