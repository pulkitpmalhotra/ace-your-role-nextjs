// app/lib/api.ts - Complete API utilities with security headers
export function getSecureHeaders() {
  const userEmail = localStorage.getItem('userEmail');
  const authProvider = localStorage.getItem('authProvider');
  
  if (!userEmail || authProvider !== 'google') {
    throw new Error('Authentication required');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-user-email': userEmail  // This will be used by RLS policies
  };
}

// Basic headers for public endpoints
export function getBasicHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

// Secure API functions
export async function fetchUserSessions(userEmail: string) {
  const url = `/api/sessions?user_email=${encodeURIComponent(userEmail)}`;
  const response = await fetch(url, {
    headers: getSecureHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  
  return response.json();
}

export async function createSession(scenarioId: string, userEmail: string) {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: getSecureHeaders(),
    body: JSON.stringify({
      scenario_id: scenarioId,
      user_email: userEmail
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }
  
  return response.json();
}

export async function updateSession(sessionId: string, updateData: any) {
  const response = await fetch('/api/sessions', {
    method: 'PUT',
    headers: getSecureHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      ...updateData
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchUserProgress(userEmail: string) {
  const url = `/api/progress?user_email=${encodeURIComponent(userEmail)}`;
  const response = await fetch(url, {
    headers: getSecureHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch progress: ${response.status}`);
  }
  
  return response.json();
}

// Public API functions (no auth headers needed)
export async function fetchScenarios() {
  const response = await fetch('/api/scenarios', {
    headers: getBasicHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch scenarios: ${response.status}`);
  }
  
  return response.json();
}

// Error handling utility
export function isAuthError(error: Error): boolean {
  return error.message.includes('Authentication required') || 
         error.message.includes('401') ||
         error.message.includes('403');
}
